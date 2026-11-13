/** Pure, non-authoritative mechanics. No random outcomes or wallet writes. */
export type Stake = 1 | 5 | 10 | 50 | 100;
export type Token = '' | '0' | '00' | '1' | '5' | '10';
export type Special = 'none' | '2x' | '5x' | '10x' | 'respin' | 'green-pig' | 'red-pig';
export const STAKES: readonly Stake[] = [1, 5, 10, 50, 100];

export function tier(stake: Stake): { baseReels: 2 | 3; bonusLevels: 1 | 2 | 3; specials: readonly Special[] } {
  if (!STAKES.includes(stake)) throw new RangeError('Unsupported stake');
  const high = stake >= 50;
  return {
    baseReels: stake === 1 ? 2 : 3,
    bonusLevels: stake === 1 ? 1 : high ? 3 : 2,
    specials: ['none', '2x', '5x', ...(stake >= 10 ? ['10x' as const] : []), 'respin', high ? 'red-pig' : 'green-pig'],
  };
}

/** Treat tokens as strings: blanks disappear; leading zeroes are harmless. */
export function concatenate(tokens: readonly Token[]): bigint {
  if (tokens.length !== 3 || tokens.some(t => !['', '0', '00', '1', '5', '10'].includes(t))) throw new RangeError('Invalid reel tokens');
  return BigInt(tokens.join('') || '0');
}

/** Award arithmetic in integer units; caller supplies an independently approved cap. */
export function cappedAward(parts: readonly bigint[], multiplier: bigint, cap: bigint): bigint {
  if (cap < 0n || multiplier < 1n || parts.some(x => x < 0n)) throw new RangeError('Invalid award');
  const value = parts.reduce((sum, x) => sum + x, 0n) * multiplier;
  return value > cap ? cap : value;
}
