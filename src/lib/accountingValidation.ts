// Percentages have two decimal places; Company allocation authority is always 100%.
export function shareCeiling(role: unknown, assigned: unknown): number {
  if (String(role).toLowerCase() === 'company') return 100;
  const value = Number(assigned);
  return assigned != null && Number.isFinite(value) && value >= 0 && value <= 100 ? value : 0;
}

export function validShare(value: string, ceiling: number): boolean {
  return /^\d+(\.\d{1,2})?$/.test(value) && Number(value) <= ceiling;
}

export function validPLTransfer(value: string, outstanding: number): boolean {
  const amount = Number(value);
  return /^-?\d+(\.\d{1,2})?$/.test(value) && Number.isFinite(amount)
    && amount !== 0 && Math.sign(amount) === Math.sign(outstanding)
    && Math.abs(amount) <= Math.abs(outstanding);
}
