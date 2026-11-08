#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * plutus-backtest.hand/log-trade.js
 * ───────────────────────────────────────────────────────────────────────────
 * CLI TRADE LOGGER — POSTs a new trade to the Plutus Dashboard API.
 *
 * Usage:
 *   node log-trade.js \
 *     --pair EURUSD --direction LONG --entry 1.0850 --sl 1.0820 --tp 1.0910 \
 *     --setup BS --confidence 85 --session NY --reasoning "BoM zone test" \
 *     --zone-type BoM --agent-id plutus-1 --agent-version v5.3.4
 *
 * Reads the auth token from ~/.plutus-dashboard/config/dashboard-token.json
 * POSTs to http://localhost:9430/api/v1/trades with all required TTE fields.
 * Computes derived fields (sl_pips, tp_pips, rrr_planned, confidence_tier, etc.)
 * automatically from the provided CLI arguments.
 *
 * Returns the trade_uid on success. Retries 3 times with 2s backoff on failure.
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
const crypto = require('crypto');

// ─── CONFIGURATION ──────────────────────────────────────────────────────────
const DASHBOARD_BASE = 'http://localhost:9430';
const TRADES_ENDPOINT = '/api/v1/trades';
const TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;
const BACKOFF_MS = 2000;

const TOKEN_PATH = path.join(os.homedir(), '.plutus-dashboard', 'config', 'dashboard-token.json');

// ─── PAIR-SPECIFIC PIP SIZES ────────────────────────────────────────────────
const PIP_SIZES = {
  EURUSD: 0.0001, GBPUSD: 0.0001, AUDUSD: 0.0001, NZDUSD: 0.0001,
  USDCAD: 0.0001, USDCHF: 0.0001,
  USDJPY: 0.01,
  XAUUSD: 0.1,
  DXY: 0.01,
};

// ─── SETUP CATEGORY MAP ─────────────────────────────────────────────────────
const SETUP_CATEGORY_MAP = {
  BS: 'Breakout_Search',
  HS: 'HTF_Swing',
  SS: 'Swing_Scalp',
  RC: 'Reinforcement',
  TR: 'Transition',
};

// ─── HELPERS ────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

function generateTradeUid() {
  return 'bt-' + crypto.randomBytes(8).toString('hex') + '-' + Date.now().toString(36);
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

function computePips(entry, target, pair) {
  const pipSize = getPipSize(pair);
  return Math.round(Math.abs(entry - target) / pipSize);
}

function computeRrrPlanned(slPips, tpPips) {
  if (slPips === 0) return 0;
  return Math.round((tpPips / slPips) * 100) / 100;
}

function deriveConfidenceTier(score) {
  if (score >= 90) return 'God-Tier';
  if (score >= 75) return 'High';
  if (score >= 50) return 'Standard';
  return 'Supplementary';
}

function deriveSetupCategory(setupType) {
  // Direct map first
  if (SETUP_CATEGORY_MAP[setupType]) return SETUP_CATEGORY_MAP[setupType];
  // Try to match by keyword
  const upper = setupType.toUpperCase();
  if (upper.includes('BREAKOUT') || upper === 'BS') return 'Breakout_Search';
  if (upper.includes('HTF') || upper.includes('SWING') && upper.includes('HTF')) return 'HTF_Swing';
  if (upper.includes('SCALP') || upper === 'SS') return 'Swing_Scalp';
  if (upper.includes('REINFORCE') || upper === 'RC') return 'Reinforcement';
  if (upper.includes('TRANSITION') || upper === 'TR') return 'Transition';
  // Default
  return 'Breakout_Search';
}

function getDayOfWeek() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
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

function requireArg(args, key) {
  if (args[key] === undefined) {
    console.error('ERROR: Missing required argument --' + key);
    printUsage();
    process.exit(1);
  }
  return args[key];
}

function printUsage() {
  console.error('');
  console.error('Usage: node log-trade.js [OPTIONS]');
  console.error('');
  console.error('Required:');
  console.error('  --pair PAIR           Trading pair (EURUSD, GBPUSD, etc.)');
  console.error('  --direction DIR       LONG | SHORT | BUY | SELL');
  console.error('  --entry PRICE         Entry price (e.g. 1.0850)');
  console.error('  --sl PRICE            Stop loss price');
  console.error('  --tp PRICE            Take profit price');
  console.error('  --setup TYPE          Setup type (BS, SS, HS, RC, TR, or custom)');
  console.error('  --confidence N        Confidence score 0-100');
  console.error('  --session SESS        Trading session (NY, London, Asian, etc.)');
  console.error('');
  console.error('Optional (with defaults):');
  console.error('  --agent-id ID         Agent ID (default: plutus-backtest)');
  console.error('  --agent-version VER   Agent version (default: v1.0.0)');
  console.error('  --reasoning TEXT      Entry reasoning');
  console.error('  --zone-type TYPE      Entry zone type (BoM, MoM, PPZ, DOL, FLZ, RCZ)');
  console.error('  --lot-size N          Position size in lots (default: 0.10)');
  console.error('  --risk-percent N      Risk percentage (default: 0.50)');
  console.error('  --macro-page PAGE     Dashboard macro page (default: backtest)');
  console.error('  --entry-timestamp TS  Entry timestamp ISO (default: now)');
  console.error('  --day-of-week DAY     Day of week (default: today)');
  console.error('  --uid UID             Custom trade UID (default: auto-generated)');
  console.error('');
}

// ─── HTTP REQUEST ───────────────────────────────────────────────────────────

function doPost(method, fullPath, bodyObj, token) {
  return new Promise(function(resolve) {
    const parsed = parseBaseUrl(DASHBOARD_BASE);
    const payload = JSON.stringify(bodyObj);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'Accept': 'application/json',
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;

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
    req.write(payload);
    req.end();
  });
}

async function doPostWithRetry(method, fullPath, bodyObj, token) {
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await doPost(method, fullPath, bodyObj, token);
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

// ─── MAIN ───────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);

  // Validate required args
  const pair = requireArg(args, 'pair');
  const direction = requireArg(args, 'direction');
  const entryPrice = parseFloat(requireArg(args, 'entry'));
  const slPrice = parseFloat(requireArg(args, 'sl'));
  const tpPrice = parseFloat(requireArg(args, 'tp'));
  const setupType = requireArg(args, 'setup');
  const confidence = parseInt(requireArg(args, 'confidence'), 10);
  const session = requireArg(args, 'session');

  // Validate numeric ranges
  if (isNaN(entryPrice) || isNaN(slPrice) || isNaN(tpPrice)) {
    console.error('ERROR: --entry, --sl, --tp must be numeric');
    process.exit(1);
  }
  if (isNaN(confidence) || confidence < 0 || confidence > 100) {
    console.error('ERROR: --confidence must be a number 0-100');
    process.exit(1);
  }

  // Validate direction
  const validDirs = ['LONG', 'SHORT', 'BUY', 'SELL'];
  const dirUpper = direction.toUpperCase();
  if (!validDirs.includes(dirUpper)) {
    console.error('ERROR: --direction must be one of: ' + validDirs.join(', '));
    process.exit(1);
  }

  // Validate pair
  const validPairs = Object.keys(PIP_SIZES);
  const pairUpper = pair.toUpperCase();
  if (!validPairs.includes(pairUpper)) {
    console.error('ERROR: --pair must be one of: ' + validPairs.join(', '));
    process.exit(1);
  }

  // Derive computed fields
  const slPips = computePips(entryPrice, slPrice, pairUpper);
  const tpPips = computePips(entryPrice, tpPrice, pairUpper);
  const rrrPlanned = computeRrrPlanned(slPips, tpPips);
  const confidenceTier = deriveConfidenceTier(confidence);
  const setupCategory = deriveSetupCategory(setupType);
  const lotSize = args['lot-size'] ? parseFloat(args['lot-size']) : 0.10;
  const riskPercent = args['risk-percent'] ? parseFloat(args['risk-percent']) : 0.50;

  // Build the full trade payload
  const trade = {
    trade_uid: args.uid || generateTradeUid(),
    macro_page: args['macro-page'] || 'backtest',
    agent_id: args['agent-id'] || 'plutus-backtest',
    agent_version: args['agent-version'] || 'v1.0.0',
    pair: pairUpper,
    entry_timestamp: args['entry-timestamp'] || new Date().toISOString(),
    session: session,
    day_of_week: args['day-of-week'] || getDayOfWeek(),
    direction: dirUpper,
    setup_category: setupCategory,
    setup_type: setupType,
    entry_price: entryPrice,
    sl_price: slPrice,
    tp_price: tpPrice,
    sl_pips: slPips,
    tp_pips: tpPips,
    rrr_planned: rrrPlanned,
    position_size_lots: lotSize,
    risk_percent: riskPercent,
    confidence_score: confidence,
    confidence_tier: confidenceTier,
    status: 'OPEN',
    entry_reasoning: args.reasoning || null,
  };

  // Optional zone fields
  if (args['zone-type']) {
    trade.entry_zone_type = args['zone-type'];
  }

  console.log('Logging trade to dashboard...');
  console.log('  UID: ' + trade.trade_uid);
  console.log('  Pair: ' + trade.pair + ' ' + trade.direction);
  console.log('  Entry: ' + entryPrice + ' | SL: ' + slPrice + ' (' + slPips + 'p) | TP: ' + tpPrice + ' (' + tpPips + 'p)');
  console.log('  RRR: ' + rrrPlanned + ' | Confidence: ' + confidence + '% (' + confidenceTier + ')');
  console.log('  Setup: ' + setupType + ' (' + setupCategory + ') | Session: ' + session);
  console.log('');

  const token = loadToken();
  const result = await doPostWithRetry('POST', TRADES_ENDPOINT, trade, token);

  if (!result.success) {
    console.error('FAILED: Could not log trade after ' + MAX_RETRIES + ' attempts');
    console.error('Error: ' + result.error);
    process.exit(1);
  }

  const tradeUid = (result.data && result.data.data && result.data.data.trade_uid)
    || (result.data && result.data.trade_uid)
    || trade.trade_uid;
  const merkleHash = (result.data && result.data.data && result.data.data.merkle_hash)
    || (result.data && result.data.merkle_hash)
    || 'N/A';

  console.log('SUCCESS: Trade logged');
  console.log('  trade_uid: ' + tradeUid);
  console.log('  merkle_hash: ' + merkleHash);
}

main().catch(function(err) {
  console.error('FATAL: ' + err.message);
  process.exit(1);
});
