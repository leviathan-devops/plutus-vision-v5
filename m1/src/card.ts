// card.ts - the sealed E1 card shape as written by run.ts and consumed by compose.ts / evaluate.ts.
import type { Zone, Regime } from './assemble';
import type { SdZone, Lsz } from './p5';

export interface CardMember { id: string; pillar: string; kind: string; price: number; label: string; total: number; why: string[] }
export type CardZone = Omit<Zone, 'members'> & { members: CardMember[] };
export interface Card {
  schema_version: string; asset: string; week_monday: string;
  window: { open: string; cutoff: string; end: string; render_from: string; render_to: string };
  spot_at_cutoff: number; regime: Regime;
  source_manifest: { prior_week: { key: string; high: number; low: number; close: number } };
  pillars: { P3P8: { K: number; audit: string[] }; P5: { sd: SdZone[]; lsz: Lsz[] } };
  zones: CardZone[]; missing_data: { protocol: string; reason: string; impact: string }[];
  render_policy: { synthesis: string; band: { lo: number; hi: number }; basis: string };
}
export interface SealedCard { sha256: string; card: Card }
export function readCard(text: string): SealedCard {
  const v: unknown = JSON.parse(text);
  if (!v || typeof v !== 'object' || !('sha256' in v) || !('card' in v)) throw new Error('CARD_SHAPE_INVALID: missing sha256/card');
  const c = (v as { card: unknown }).card;
  if (!c || typeof c !== 'object' || !('zones' in c) || !('render_policy' in c) || !('window' in c)) throw new Error('CARD_SHAPE_INVALID: missing zones/render_policy/window');
  return v as SealedCard;     // fields checked above; the card is this repo's own generated artifact
}
