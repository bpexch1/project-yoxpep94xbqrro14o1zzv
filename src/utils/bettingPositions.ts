/**
 * Utility functions for computing Betting Exchange Runner Positions,
 * Market P&L (Profit/Loss), and User Liabilities.
 */

export interface MarketBet {
  id?: string;
  match_id?: string;
  match_title?: string;
  selection: string;
  bet_type: 'back' | 'lay';
  stake: number;
  odds: number;
  potential_win?: number;
  status?: string;
  created_at?: string;
}

/**
 * Calculates net P&L position for each runner in a market given all active bets.
 * 
 * Formula:
 * If runner R wins:
 * - Back on R: + stake * (odds - 1)
 * - Lay on R:  - stake * (odds - 1)
 * - Back on another runner in this market: - stake
 * - Lay on another runner in this market:  + stake
 */
export function calculateMarketPositions(
  runners: string[],
  bets: MarketBet[]
): Record<string, number> {
  const positions: Record<string, number> = {};
  runners.forEach((r) => {
    positions[r] = 0;
  });

  if (!bets || bets.length === 0) {
    return positions;
  }

  // Filter bets that belong to this set of runners
  const validBets = bets.filter((b) =>
    runners.some((r) => r.toLowerCase().trim() === b.selection.toLowerCase().trim())
  );

  if (validBets.length === 0) {
    return positions;
  }

  runners.forEach((runner) => {
    let net = 0;
    const cleanRunner = runner.toLowerCase().trim();

    validBets.forEach((b) => {
      const isBack = b.bet_type?.toLowerCase() === 'back';
      const isThisRunner = b.selection.toLowerCase().trim() === cleanRunner;
      const stake = Number(b.stake) || 0;
      const odds = Number(b.odds) || 1;
      const profitIfWin = stake * (odds - 1);

      if (isThisRunner) {
        if (isBack) {
          net += profitIfWin;
        } else {
          net -= profitIfWin;
        }
      } else {
        if (isBack) {
          net -= stake;
        } else {
          net += stake;
        }
      }
    });

    positions[runner] = Math.round(net);
  });

  return positions;
}

/**
 * Calculate total user liability across all open/pending bets.
 */
export function calculateTotalLiability(bets: MarketBet[]): number {
  if (!bets || bets.length === 0) return 0;

  // Group bets by match_id
  const matchGroups: Record<string, MarketBet[]> = {};
  bets.forEach((b) => {
    const key = b.match_id || 'unknown';
    if (!matchGroups[key]) matchGroups[key] = [];
    matchGroups[key].push(b);
  });

  let totalLiability = 0;

  Object.values(matchGroups).forEach((matchBets) => {
    // Collect distinct selections
    const selections = Array.from(new Set(matchBets.map((b) => b.selection)));
    if (selections.length === 0) return;

    // Calculate positions for these selections
    const positions = calculateMarketPositions(selections, matchBets);
    
    // Find worst-case loss (most negative position)
    let maxLoss = 0;
    Object.values(positions).forEach((pos) => {
      if (pos < 0 && Math.abs(pos) > maxLoss) {
        maxLoss = Math.abs(pos);
      }
    });

    // If maxLoss is 0 but there are bets, calculate standard stake liability
    if (maxLoss === 0) {
      matchBets.forEach((b) => {
        const isBack = b.bet_type?.toLowerCase() === 'back';
        const stake = Number(b.stake) || 0;
        const odds = Number(b.odds) || 1;
        maxLoss += isBack ? stake : stake * (odds - 1);
      });
    }

    totalLiability += maxLoss;
  });

  return Math.round(totalLiability);
}
