import { StacksMainnet, StacksNetwork, StacksTestnet } from "@stacks/network";

const contractAddress = (import.meta.env.VITE_CONTRACT_ADDRESS ?? "").trim();
const contractName = (import.meta.env.VITE_CONTRACT_NAME ?? "stream").trim();
const networkName = (import.meta.env.VITE_NETWORK ?? "testnet").toLowerCase();
const apiUrl = (
  import.meta.env.VITE_STACKS_API_URL ?? "https://api.testnet.hiro.so"
).trim();

const network: StacksNetwork =
  networkName === "mainnet"
    ? new StacksMainnet({ url: apiUrl })
    : new StacksTestnet({ url: apiUrl });

const networkKey = networkName === "mainnet" ? "mainnet" : "testnet";

export const STACKS_NETWORK: StacksNetwork = network;
export const CONTRACT_ADDRESS = contractAddress;
export const CONTRACT_NAME = contractName;
export const NETWORK_KEY = networkKey;
export const NETWORK_NAME = networkName;
export const STACKS_API_URL = apiUrl;

export const MICRO_STX = 1_000_000n;

export const formatStx = (value: bigint) => {
  const whole = value / MICRO_STX;
  const fraction = value % MICRO_STX;
  if (fraction === 0n) return whole.toString();
  const fractionStr = fraction.toString().padStart(6, "0").replace(/0+$/, "");
  return `${whole.toString()}.${fractionStr}`;
};

export const toMicroStx = (raw: string) => {
  const cleaned = raw.trim();
  if (cleaned.length === 0) return 0n;
  const parts = cleaned.split(".");
  const whole = BigInt(parts[0] || "0");
  const fraction = (parts[1] || "").padEnd(6, "0").slice(0, 6);
  return whole * MICRO_STX + BigInt(fraction || "0");
};
