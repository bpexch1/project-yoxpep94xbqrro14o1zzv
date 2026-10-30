import type { Outcome } from './api';

/** Keep the server's deal order (first card at each seat, then tie cards). */
export function visible32Cards(outcome: Outcome | null, visible: number): Outcome | null {
 if (!outcome) return null;
 const order: Array<[number, number]> = [];
 const groups = outcome.groups;
 const max = Math.max(0, ...groups.map(group => group.cards?.length ?? 0));
 for (let card = 0; card < max; card++) {
  for (let seat = 0; seat < groups.length; seat++) {
   if (card < (groups[seat].cards?.length ?? 0)) order.push([seat, card]);
  }
 }
 const limit = Math.max(0, Math.min(Math.floor(visible), order.length));
 const counts = groups.map(() => 0);
 for (const [seat] of order.slice(0, limit)) counts[seat]++;
 return {
  winner: limit === order.length ? outcome.winner : null,
  summary: limit === order.length ? outcome.summary : 'Revealing cards…',
  groups: groups.map((group, seat) => {
   const cards = (group.cards ?? []).slice(0, counts[seat]);
   return counts[seat] === (group.cards?.length ?? 0)
    ? { ...group, cards }
    : { label: group.label, cards };
  }),
 };
}
