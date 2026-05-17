export const formatUsd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: value >= 100000 ? "compact" : "standard",
    maximumFractionDigits: value >= 100000 ? 1 : 0
  }).format(value);

export const shortAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

export const normalizeWallet = (wallet: string) => wallet.trim().toLowerCase();

export const formatTokenAmount = (value: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: value >= 1000 ? 0 : 2,
    maximumFractionDigits: value >= 1000 ? 2 : 4
  }).format(value);

export const formatPriceRatio = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "Unavailable";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 1000 ? 2 : 4
  }).format(value);
};
