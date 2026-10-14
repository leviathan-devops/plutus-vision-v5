import pathlib, sys

B = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/pine-ide/charts/workbench.bundle.js")
t = B.read_text()

# ── ROOT-CAUSE FIX: the drawing store's remove() must refuse a locked drawing ──
# Vela honours `locked` on the CANVAS path (deleteTargets() -> hit.locked ? [] : [hit.id],
# workbench.bundle.js:30689) but NOT on the object-tree paths: the Data Window row trash
# (48348), the context-menu "Remove" entry (48892) and one more remove site (51261) all call
# chart.drawings.remove(d.id) with no check. Result: a locked drawing cannot be dragged, but
# it CAN be deleted from the Data Window. Guarding the store covers EVERY caller at once.
old = """  remove(id) {
    const ok = this.byId.delete(id);
    if (ok)
      this.emit();
    return ok;
  }"""
new = """  remove(id) {
    // [plutus-vision] locked drawings are INDICATOR OUTPUT, not chart objects the user owns.
    // TradingView never lets an indicator's drawings be deleted. Vela already honoured this on
    // the canvas path (deleteTargets) but not on the Data Window / context-menu paths, which
    // reach remove() directly — so a locked drawing could still be deleted. Guarding here
    // covers every caller: keyboard, Data Window row trash, context menu, removeMany.
    const d = this.byId.get(id);
    if (d && d.locked) return false;
    const ok = this.byId.delete(id);
    if (ok)
      this.emit();
    return ok;
  }"""
assert t.count(old) == 1, f"remove() anchor count = {t.count(old)}"
t = t.replace(old, new)

# the batch path must honour it too
old2 = """  removeMany(ids) {
    this.ctrl.removeMany(ids);
    return this;
  }"""
new2 = """  removeMany(ids) {
    // [plutus-vision] same locked guard as remove(): never delete indicator output.
    this.ctrl.removeMany(ids.filter((id) => !this.byId.get(id)?.locked));
    return this;
  }"""
assert t.count(old2) == 1, f"removeMany anchor count = {t.count(t2 := old2)}"
t = t.replace(old2, new2)

B.write_text(t)
print("remove()/removeMany() now refuse locked drawings")