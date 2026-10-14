import pathlib

B = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/pine-ide/charts/workbench.bundle.js")
t = B.read_text()

old = """  removeMany(ids) {
    // [plutus-vision] same locked guard as remove(): never delete indicator output.
    // NOTE: this is the WRAPPER class - it reaches the store through `this.ctrl`, which has
    // `get()`. Using `this.byId` here throws (found 2026-10-01: the first patch landed here).
    this.ctrl.removeMany(ids.filter((id) => !this.ctrl.get(id)?.locked));
    return this;
  }"""

new = """  removeMany(ids) {
    // [plutus-vision] same locked guard as remove(): never delete indicator output.
    // Shape-agnostic lookup: depending on the build, `this.ctrl` exposes the drawing either as
    // `byId` (Map) or as `get()` (method) — probing both avoids the TypeError the first two
    // attempts hit (this.byId in the wrapper; this.ctrl.get when ctrl has no get()).
    const store = this.ctrl;
    const lockedOf = (id) => {
      let d = null;
      try { d = store && store.byId && typeof store.byId.get === "function" ? store.byId.get(id) : null; } catch (e) {}
      if (!d) { try { d = store && typeof store.get === "function" ? store.get(id) : null; } catch (e) {} }
      return !!(d && d.locked);
    };
    this.ctrl.removeMany(ids.filter((id) => !lockedOf(id)));
    return this;
  }"""

assert t.count(old) == 1, f"anchor count {t.count(old)}"
B.write_text(t.replace(old, new))
print("removeMany lookup is now shape-agnostic")