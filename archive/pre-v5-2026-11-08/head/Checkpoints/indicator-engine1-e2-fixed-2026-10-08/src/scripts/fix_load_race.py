import pathlib

p = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/scripts/pv-load.mjs")
t = p.read_text()

old = """const expr = `(async () => {
  for (let i = 0; i < 60 && !window.PlutusPineShell; i++) await new Promise(r => setTimeout(r, 500));"""
new = """const expr = `(async () => {
  // Wait for the kernel AND for the document to stop navigating. A relaunch destroys the
  // execution context mid-evaluate ("Execution context was destroyed") — found 2026-10-01.
  for (let i = 0; i < 120; i++) {
    if (document.readyState === "complete" && window.PlutusPineShell) break;
    await new Promise(r => setTimeout(r, 500));
  }
  for (let i = 0; i < 120 && !window.PlutusPineShell; i++) await new Promise(r => setTimeout(r, 500));"""
assert t.count(old) == 1, f"anchor count {t.count(old)}"
t = t.replace(old, new)

old2 = """const res = await call("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
ws.close();"""
new2 = """// Retry once on a destroyed execution context (the page navigated under us).
let res = null;
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    res = await call("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
    if (!res.result?.exceptionDetails) break;
  } catch (e) { res = { result: { exceptionDetails: String(e) } }; }
  await Bun.sleep(2000);
}
ws.close();"""
assert t.count(old2) == 1, f"call anchor count {t.count(old2)}"
t = t.replace(old2, new2)

p.write_text(t)
print("pv-load waits for readyState=complete + kernel, and retries a destroyed context")