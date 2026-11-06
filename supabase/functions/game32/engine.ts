export const GAME32_PLAYERS = ["8", "9", "10", "11"] as const;
export const GAME32_BACK_ODDS: Record<string, number> = {
  "8": 12.2, "9": 5.95, "10": 3.2, "11": 2.08,
};
export const GAME32_LAY_ODDS: Record<string, number> = {
  "8": 13.7, "9": 6.45, "10": 3.45, "11": 2.18,
};

export type Game32Outcome = {
  winner: string | null;
  groups: { label: string; cards: number[]; value: string }[];
  summary: string;
};

export const cardRank = (card: number) => card % 13 + 2;

export function validGame32Deck(deck: number[]): boolean {
  return deck.length === 32 && new Set(deck).size === 32 &&
    deck.every(card => Number.isInteger(card) && card >= 0 && card < 52 &&
      cardRank(card) >= 6 && cardRank(card) <= 13);
}

export function secureRandomInt(max: number): number {
  if (!Number.isInteger(max) || max < 1 || max > 0x100000000) {
    throw new Error("Invalid random range");
  }
  const limit = Math.floor(0x100000000 / max) * max;
  const sample = new Uint32Array(1);
  do crypto.getRandomValues(sample); while (sample[0] >= limit);
  return sample[0] % max;
}

export function secureDeck(rand = secureRandomInt): number[] {
  const deck = Array.from({ length: 52 }, (_, card) => card)
    .filter(card => cardRank(card) >= 6 && cardRank(card) <= 13);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function resolveGame32(deck: number[]): Game32Outcome {
  if (!validGame32Deck(deck)) throw new Error("Invalid 32 Cards deck");
  const groups: number[][] = [[], [], [], []];
  let cursor = 0;
  let contenders = [0, 1, 2, 3];
  for (const player of contenders) groups[player].push(deck[cursor++]);
  while (contenders.length > 1) {
    const totals = groups.map((cards, index) =>
      index + 8 + cards.reduce((sum, card) => sum + cardRank(card), 0));
    const best = Math.max(...contenders.map(index => totals[index]));
    contenders = contenders.filter(index => totals[index] === best);
    if (contenders.length === 1 || cursor + contenders.length > deck.length) break;
    for (const player of contenders) groups[player].push(deck[cursor++]);
  }
  const totals = groups.map((cards, index) =>
    index + 8 + cards.reduce((sum, card) => sum + cardRank(card), 0));
  const winner = contenders.length === 1 ? String(contenders[0] + 8) : null;
  return {
    winner,
    groups: groups.map((cards, index) => ({
      label: `Player ${index + 8}`,
      cards,
      value: `${index + 8} + ${cards.map(cardRank).join(" + ")} = ${totals[index]}`,
    })),
    summary: winner ? `Player ${winner} wins with ${totals[Number(winner) - 8]}` :
      "Unresolved tie — all bets void",
  };
}

export function revealOutcome(
  outcome: Game32Outcome,
  visibleCards: number,
  settled: boolean,
): Game32Outcome {
  const groups = outcome.groups.map(group => ({ ...group, cards: [] as number[], value: "" }));
  const maximum = Math.max(...outcome.groups.map(group => group.cards.length));
  let revealed = 0;
  for (let cardIndex = 0; cardIndex < maximum; cardIndex++) {
    for (let player = 0; player < outcome.groups.length; player++) {
      const card = outcome.groups[player].cards[cardIndex];
      if (card !== undefined && revealed++ < visibleCards) groups[player].cards.push(card);
    }
  }
  const total = outcome.groups.reduce((sum, group) => sum + group.cards.length, 0);
  const complete = settled && visibleCards >= total;
  if (complete) {
    return { ...outcome, groups: outcome.groups.map(group => ({ ...group })) };
  }
  return { winner: null, groups, summary: visibleCards ? "Revealing cards…" : "Betting open" };
}

export async function commitmentFor(deck: number[], nonce: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${nonce}:${deck.join(",")}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}
