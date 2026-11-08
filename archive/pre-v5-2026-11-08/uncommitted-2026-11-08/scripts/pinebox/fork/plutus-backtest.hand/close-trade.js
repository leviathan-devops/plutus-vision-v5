#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * plutus-backtest.hand/close-trade.js
 * ───────────────────────────────────────────────────────────────────────────
 * CLI TRADE CLOSER — PATCHes an existing trade to CLOSED status.
 *
 * Usage:
 *   node close-trade.js --uid trade-001 --exit-price 1.0910 --status TP_HIT
 *
 * Fetches the trade by UID to get entry_price, sl_price, tp_price, direction,
 * and position_size_lots. Computes pnl_pips, pnl_usd, r_multiple, and result
 * (WIN/LOSS/BREAKEVEN) based on direction and exit price vs entry/SL/TP.
 *
 * Status mapping:
 *   TP_HIT      → result=WIN,    status=CLOSED
 *   SL_HIT      → result=LOSS,   status=CLOSED
 *   BE          → result=BREAKEVEN, status=CLOSED
 *   MANUAL      → result computed from prices
 *
 * Returns the updated trade on success. Retries 3 times with 2s backoff.
 *
 * Exit codes: 0 = success, 1 = error
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ─── CONFIGURATION ──────────────────────────────────────────────────────────
const DASHBOARD_BASE = 'http://localhost:9430';
const TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;
const BACKOFF_MS = 2000;

const TOKEN_PATH = path.join(os.homedir(), '.plutus-dashboard', 'config', 'dashboard-token.json');

// ─── PIP SIZES ──────────────────────────────────────────────────────────────
const PIP_SIZES = {
  EURUSD: 0.0001, GBPUSD: 0.0001, AUDUSD: 0.0001, NZDUSD: 0.0001,
  USDCAD: 0.0001, USDCHF: 0.0001,
  USDJPY: 0.01,
  XAUUSD: 0.1,
  DXY: 0.01,
};

// Standard pip value per standard lot (1.0) in USD for USD-quoted pairs
const PIP_VALUE_USD_PER_LOT = 10;

// ─── HELPERS ────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

function loadToken() {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      const cfg = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
      return cfg.token || null;
    }
  } catch (e) {
    // Fall through to default dev token
  }
  return 'rw_dev_plutus_backtest';
}

function parseBaseUrl(baseUrl) {
  const m = String(baseUrl).match(/^(https?):\/\/([^:/]+)(?::(\d+))?/);
  if (!m) return { hostname: 'localhost', port: 9430, isHttps: false };
  return {
    isHttps: m[1] === 'https',
    hostname: m[2],
    port: m[3] ? parseInt(m[3], 10) : (m[1] === 'https' ? 443 : 80),
  };
}

function getPipSize(pair) {
  return PIP_SIZES[pair] || 0.0001;
}

/**
 * Computes the trade result based on direction, exit price, and SL/TP levels.
 * @param {string} direction - LONG | SHORT | BUY | SELL
 * @param {number} entryPrice
 * @param {number} exitPrice
 * @param {number} slPrice
 * @param {number} tpPrice
 * @returns {{result:string, pnlPips:number, pnlUsd:number, rMultiple:number, rrrActual:number}}
 */
function computeTradeResult(direction, entryPrice, exitPrice, slPrice, tpPrice, lotSize) {
  const isLong = direction === 'LONG' || direction === 'BUY';

  // PnL in pips
  let pnlPips;
  if (isLong) {
    pnlPips = (exitPrice - entryPrice) / getPipSize('EURUSD'); // pip size placeholder, corrected below
  } else {
    pnlPips = (entryPrice - exitPrice) / getPipSize('EURUSD');
  }

  // Determine result
  let result;
  const tolerance = getPipSize('EURUSD') / 2; // half pip tolerance for breakeven check

  if (isLong) {
    if (exitPrice >= tpPrice - tolerance) result = 'WIN';
    else if (exitPrice <= slPrice + tolerance) result = 'LOSS';
    else if (Math.abs(exitPrice - entryPrice) < tolerance) result = 'BREAKEVEN';
    else result = exitPrice > entryPrice ? 'WIN' : 'LOSS';
  } else {
    if (exitPrice <= tpPrice + tolerance) result = 'WIN';
    else if (exitPrice >= slPrice - tolerance) result = 'LOSS';
    else if (Math.abs(exitPrice - entryPrice) < tolerance) result = 'BREAKEVEN';
    else result = exitPrice < entryPrice ? 'WIN' : 'LOSS';
  }

  // Round pnlPips to nearest integer
  pnlPips = Math.round(pnlPips);

  // Compute R-multiple
  const slDistance = Math.abs(entryPrice - slPrice);
  const riskPips = slDistance > 0 ? Math.round(slDistance / getPipSize('EURUSD')) : 0;
  const rMultiple = riskPips > 0 ? Math.round((pnlPips / riskPips) * 100) / 100 : 0;

  // Compute pnl_usd
  const pnlUsd = Math.round(pnlPips * (lotSize || 0.10) * PIP_VALUE_USD_PER_LOT * 100) / 100;

  // RRR actual = pnl_pips / risk_pips (same as r_multiple)
  const rrrActual = rMultiple;

  return { result: result, pnlPips: pnlPips, pnlUsd: pnlUsd, rMultiple: rMultiple, rrrActual: rrrActual };
}

// ─── ARGUMENT PARSER ────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = 'true';
      }
    }
  }
  return args;
}

function printUsage() {
  console.error('');
  console.error('Usage: node close-trade.js [OPTIONS]');
  console.error('');
  console.error('Required:');
  console.error('  --uid UID           Trade UID to close');
  console.error('  --exit-price PRICE  Exit price');
  console.error('  --status STATUS     TP_HIT | SL_HIT | BE | MANUAL');
  console.error('');
  console.error('Optional:');
  console.error('  --reasoning TEXT    Exit reasoning');
  console.error('  --screenshot PATH   Exit screenshot path');
  console.error('');
}

// ─── HTTP REQUEST ───────────────────────────────────────────────────────────

function doRequest(method, fullPath, bodyObj, token) {
  return new Promise(function(resolve) {
    const parsed = parseBaseUrl(DASHBOARD_BASE);
    const payload = bodyObj ? JSON.stringify(bodyObj) : null;
    const headers = { 'Accept': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const transport = parsed.isHttps ? https : http;
    const opts = {
      method: method,
      hostname: parsed.hostname,
      port: parsed.port,
      path: fullPath,
      headers: headers,
      timeout: TIMEOUT_MS,
    };

    const req = transport.request(opts, function(res) {
      let data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() {
        const status = res.statusCode;
        try {
          const parsedData = data ? JSON.parse(data) : null;
          if (status >= 400) {
            const retryable = status >= 500 || status === 429;
            let msg = 'HTTP ' + status;
            if (parsedData && parsedData.error) msg += ': ' + parsedData.error;
            resolve({ ok: false, status: status, error: msg, retryable: retryable });
          } else {
            resolve({ ok: true, status: status, data: parsedData });
          }
        } catch (e) {
          if (status >= 400) {
            resolve({ ok: false, status: status, error: 'HTTP ' + status + ': ' + data, retryable: status >= 500 });
          } else {
            resolve({ ok: true, status: status, data: data });
          }
        }
      });
    });

    req.on('timeout', function() { req.destroy(new Error('Request timeout after ' + TIMEOUT_MS + 'ms')); });
    req.on('error', function(err) { resolve({ ok: false, error: err.message, retryable: true }); });
    if (payload) req.write(payload);
    req.end();
  });
}

async function doRequestWithRetry(method, fullPath, bodyObj, token) {
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await doRequest(method, fullPath, bodyObj, token);
    if (res.ok) return { success: true, data: res.data };
    lastError = res.error;
    if (!res.retryable) {
      console.error('ERROR: Non-retryable failure: ' + res.error);
      return { success: false, error: res.error };
    }
    if (attempt < MAX_RETRIES) {
      console.error('WARN: Attempt ' + attempt + ' failed (' + res.error + '), retrying in ' + (BACKOFF_MS / 1000) + 's...');
      await sleep(BACKOFF_MS);
    }
  }
  return { success: false, error: lastError };
}

// ─── STATUS MAPPING ─────────────────────────────────────────────────────────

/**
 * Maps CLI --status to API result + status.
 * @param {string} cliStatus - TP_HIT | SL_HIT | BE | MANUAL
 * @returns {{result:string|null, status:string}}
 */
function mapStatus(cliStatus) {
  switch (cliStatus.toUpperCase()) {
    case 'TP_HIT':
    case 'TP':
      return { result: 'WIN', status: 'CLOSED' };
    case 'SL_HIT':
    case 'SL':
      return { result: 'LOSS', status: 'CLOSED' };
    case 'BE':
    case 'BREAKEVEN':
    case 'BE_PRICE':
      return { result: 'BREAKEVEN', status: 'CLOSED' };
    case 'MANUAL':
    case 'MANUAL_CLOSE':
      return { result: null, status: 'CLOSED' }; // result computed from prices
    default:
      console.error('WARN: Unknown status "' + cliStatus + '", defaulting to MANUAL');
      return { result: null, status: 'CLOSED' };
  }
}

// ─── MAIN ───────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);

  const uid = args.uid;
  if (!uid) {
    console.error('ERROR: Missing required argument --uid');
    printUsage();
    process.exit(1);
  }

  const exitPriceStr = args['exit-price'];
  if (!exitPriceStr) {
    console.error('ERROR: Missing required argument --exit-price');
    printUsage();
    process.exit(1);
  }
  const exitPrice = parseFloat(exitPriceStr);
  if (isNaN(exitPrice)) {
    console.error('ERROR: --exit-price must be numeric');
    process.exit(1);
  }

  const cliStatus = args.status || 'MANUAL';
  const statusMap = mapStatus(cliStatus);

  const token = loadToken();

  // ── 1. Fetch the existing trade to get entry/sl/tp/direction ─────────
  console.log('Fetching trade ' + uid + '...');
  const fetchResult = await doRequestWithRetry('GET', '/api/v1/trades/' + encodeURIComponent(uid), null, token);

  if (!fetchResult.success) {
    console.error('FAILED: Could not fetch trade ' + uid);
    console.error('Error: ' + fetchResult.error);
    process.exit(1);
  }

  const trade = (fetchResult.data && fetchResult.data.data) || fetchResult.data;
  if (!trade) {
    console.error('FAILED: Trade not found: ' + uid);
    process.exit(1);
  }

  const entryPrice = trade.entry_price;
  const slPrice = trade.sl_price;
  const tpPrice = trade.tp_price;
  const direction = trade.direction;
  const lotSize = trade.position_size_lots || 0.10;
  const pair = trade.pair || 'EURUSD';

  console.log('  Pair: ' + pair + ' | Direction: ' + direction);
  console.log('  Entry: ' + entryPrice + ' | SL: ' + slPrice + ' | TP: ' + tpPrice);
  console.log('  Exit: ' + exitPrice + ' | Status: ' + cliStatus);
  console.log('');

  // ── 2. Compute result if not explicitly set ──────────────────────────
  let computed = computeTradeResult(direction, entryPrice, exitPrice, slPrice, tpPrice, lotSize);

  // Override result if the CLI status explicitly specifies it
  if (statusMap.result) {
    computed.result = statusMap.result;
  }

  console.log('Computed result: ' + computed.result);
  console.log('  PnL: ' + computed.pnlPips + ' pips ($' + computed.pnlUsd + ')');
  console.log('  R-Multiple: ' + computed.rMultiple + 'R');
  console.log('');

  // ── 3. PATCH the trade ───────────────────────────────────────────────
  const patchBody = {
    status: 'CLOSED',
    exit_price: exitPrice,
    exit_timestamp: new Date().toISOString(),
    result: computed.result,
    pnl_pips: computed.pnlPips,
    pnl_usd: computed.pnlUsd,
    r_multiple: computed.rMultiple,
    rrr_actual: computed.rrrActual,
  };

  if (args.reasoning) {
    patchBody.exit_reasoning = args.reasoning;
  }
  if (args.screenshot) {
    patchBody.exit_screenshot_path = args.screenshot;
  }

  const patchResult = await doRequestWithRetry('PATCH', '/api/v1/trades/' + encodeURIComponent(uid), patchBody, token);

  if (!patchResult.success) {
    console.error('FAILED: Could not close trade ' + uid);
    console.error('Error: ' + patchResult.error);
    process.exit(1);
  }

  console.log('SUCCESS: Trade closed');
  console.log('  uid: ' + uid);
  console.log('  result: ' + computed.result);
  console.log('  pnl_pips: ' + computed.pnlPips);
  console.log('  pnl_usd: ' + computed.pnlUsd);
  console.log('  r_multiple: ' + computed.rMultiple);
}

main().catch(function(err) {
  console.error('FATAL: ' + err.message);
  process.exit(1);
});
