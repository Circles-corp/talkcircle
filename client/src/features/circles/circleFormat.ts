const COUNT_FORMAT = new Intl.NumberFormat("en-GB");

export function memberLabel(count: number): string {
  const noun = count === 1 ? "member" : "members";
  return `${COUNT_FORMAT.format(count)} ${noun}`;
}
