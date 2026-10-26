/**
 * CAPTURE — Browser Run (Workers binding + @cloudflare/puppeteer).
 * The PNG goes to R2 inside the step; the step returns the key and sha, never the bytes,
 * because a Workflow step result is persisted and capped at 1 MiB.
 */
import puppeteer from "@cloudflare/puppeteer";
import { Fatal, Refusal } from "./errors";

export interface Capture {
  key: string;
  sha: string;
  bytes: number;
}

const ALLOWED_HOSTS = ["investinglive.com", "www.investinglive.com"];

export async function capturePage(
  env: Env, url: string, key: string, selector: string, knownBad: string[],
): Promise<Capture> {
  const u = new URL(url);
  if (u.protocol !== "https:" || !ALLOWED_HOSTS.includes(u.hostname))
    throw new Fatal("W2_URL_REJECTED", { url });

  let png: Uint8Array;
  const browser = await puppeteer.launch(env.BROWSER).catch((e: unknown) => {
    throw new Refusal("BROWSER_UNAVAILABLE", "confirm the BROWSER binding and the Browser Run quota", {
      cause: String(e),
    });
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 2 });
    const res = await page.goto(url, { waitUntil: "networkidle0", timeout: 45_000 });
    if (!res || !res.ok()) throw new Fatal("W2_CAPTURE_HTTP", { status: res ? res.status() : 0 });
    const el = await page.waitForSelector(selector, { timeout: 20_000 });
    if (!el) throw new Fatal("W2_CAPTURE_SELECTOR", { selector });
    png = (await el.screenshot({ type: "png" })) as Uint8Array;
  } finally {
    await browser.close();
  }

  if (png.byteLength === 0) throw new Fatal("W2_CAPTURE_EMPTY", { url });
  if (png.byteLength > 4 * 1024 * 1024) throw new Fatal("W2_CAPTURE_TOO_LARGE", { bytes: png.byteLength });
  const copy = new Uint8Array(png.byteLength);
  copy.set(png);
  const digest = await crypto.subtle.digest("SHA-256", copy.buffer);
  const sha = [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, "0")).join("");
  if (knownBad.includes(sha)) throw new Fatal("W2_CAPTURE_KNOWN_BAD", { sha });

  await env.R2.put(key, copy);
  return { key, sha, bytes: png.byteLength };
}

export async function readCapture(env: Env, cap: Capture): Promise<Uint8Array> {
  const obj = await env.R2.get(cap.key);
  if (!obj) throw new Fatal("W2_CAPTURE_MISSING", { key: cap.key });
  const bytes = new Uint8Array(await obj.arrayBuffer());
  const digest = await crypto.subtle.digest("SHA-256", bytes.buffer);
  const sha = [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, "0")).join("");
  if (sha !== cap.sha) throw new Fatal("W2_CAPTURE_STALE", { want: cap.sha, got: sha });
  return bytes;
}
