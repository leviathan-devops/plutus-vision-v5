import pathlib

B = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/pine-ide/charts/workbench.bundle.js")
t = B.read_text()

# The wrapper class has `this.ctrl` (the store); it has NO `byId`. The first patch used
# `this.byId.get(id)` inside the wrapper → TypeError. Use the controller's accessor.
old = """  removeMany(ids) {
    // [plutus-vision] same locked guard as remove(): never delete indicator output.
    this.ctrl.removeMany(ids.filter((id) => !this.byId.get(id)?.locked));
    return this;
  }"""
new = """  removeMany(ids) {
    // [plutus-vision] same locked guard as remove(): never delete indicator output.
    // NOTE: this is the WRAPPER class — it reaches the store through `this.ctrl`, which has
    // `get()`. Using `this.byId` here throws (found 2026-10-01: the first patch landed here).
    this.ctrl.removeMany(ids.filter((id) => !this.ctrl.get(id)?.locked));
    return this;
  }"""
assert t.count(old) == 1, f"anchor count {t.count(old)}"
B.write_text(t.replace(old, new))
print("removeMany now reads through this.ctrl.get()")