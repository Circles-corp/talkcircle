export interface InviteOptions {
  maxUses: number;
  days: number | null;
}

function readNumberFlag(args: readonly string[], name: string): number | null {
  const prefix = `--${name}=`;
  const match = args.find((arg) => arg.startsWith(prefix));
  if (match === undefined) {
    return null;
  }
  const value = Number(match.slice(prefix.length));
  if (!Number.isInteger(value) || value < 1 || value > 1000) {
    throw new Error(`--${name} must be a whole number from 1 to 1000`);
  }
  return value;
}

export function parseInviteOptions(args: readonly string[]): InviteOptions {
  return {
    maxUses: readNumberFlag(args, "uses") ?? 1,
    days: readNumberFlag(args, "days"),
  };
}
