// units.ts - asset unit scaling for the canon's absolute price constants.
// The 5.3.3 canon states every absolute threshold in DXY index points (0.5 move, 0.15 wick, 0.05/0.10 LSZ, ...).
// Those numbers are DXY PIPS (0.01) at work: 0.5 = 50 pips, 0.15 = 15 pips, 0.25 round step = 25 pips.
// The generalisation is PIP-PARITY: the same pip count on every asset. unit = pip / 0.01, so DXY gets unit 1.0
// (every canon number stays byte-identical to the measured DXY cards) and EURUSD/GBPUSD (pip 0.0001) get 0.01.
// Measured fit on the operator's documented EURUSD zones: his LQZ bands are 4.5-9 pips wide vs the canon LSZ
// 5/10 pips; the Jun 22 OB move is 149 pips vs the canon D1 OB 100 pips; the Jul 2 BS move is 98 pips vs the
// 4H/1H S/D 50 pips - all three qualify under pip-parity.
export const PIP: Record<string, number> = { DXY: 0.01, EURUSD: 0.0001, GBPUSD: 0.0001 };
export function unitFor(asset: string): number {
  const pip = PIP[asset];
  if (!pip) throw new Error(`UNIT_UNKNOWN: no pip size for asset ${asset} - add it to PIP in m1/src/units.ts (DXY 0.01, 4-decimal FX 0.0001)`);
  return pip / 0.01;
}
export function pipFor(asset: string): number {
  const pip = PIP[asset];
  if (!pip) throw new Error(`UNIT_UNKNOWN: no pip size for asset ${asset} - add it to PIP in m1/src/units.ts`);
  return pip;
}
