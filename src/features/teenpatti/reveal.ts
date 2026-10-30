import type { Outcome } from './api';

export function publicCardCount(outcome: Outcome | null): number {
  return outcome?.groups.reduce((total, group) => total + (group.cards?.length ?? 0), 0) ?? 0;
}

// Deal across the seats, then repeat for any extra cards awarded on a tie.
// The server only sends cards that are already public; this buffers missed polls
// so a slow response still animates one card at a time.
export function progressiveCards(outcome: Outcome | null, visible: number, settled: boolean): Outcome | null {
  if (!outcome) return null;
  const dealt = outcome.groups.map(() => [] as number[]);
  const maxCards = Math.max(0, ...outcome.groups.map(group => group.cards?.length ?? 0));
  let shown = 0;
  for (let cardIndex = 0; cardIndex < maxCards; cardIndex++) {
    for (let groupIndex = 0; groupIndex < outcome.groups.length; groupIndex++) {
      const card = outcome.groups[groupIndex].cards?.[cardIndex];
      if (card !== undefined && shown++ < visible) dealt[groupIndex].push(card);
    }
  }
  const complete = settled && visible >= publicCardCount(outcome);
  return {
    ...outcome,
    winner: complete ? outcome.winner : null,
    summary: complete ? outcome.summary : 'Revealing cards…',
    groups: outcome.groups.map((group, index) => ({
      ...group,
      cards: dealt[index],
      value: complete ? group.value : undefined,
    })),
  };
}
