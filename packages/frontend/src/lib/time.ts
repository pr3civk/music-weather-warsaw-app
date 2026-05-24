export function startOfHourMinusIso(hoursAgo = 0): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() - hoursAgo);
  return d.toISOString();
}

export function startOfHourIso(): string {
  return startOfHourMinusIso(0);
}
