import {
  ClarityType,
  ClarityValue,
  OptionalCV,
  UIntCV,
  cvToJSON,
} from "@stacks/transactions";

export interface AirtimePlan {
  id: number;
  merchant: string;
  customer: string;
  phone: string;
  network: string;
  payoutAmount: bigint;
  interval: bigint;
  nextClaimBlock: bigint;
  totalFunded: bigint;
  remainingBalance: bigint;
  totalClaims: bigint;
  maxClaims: bigint;
}

const decoder = new TextDecoder();

const hexToBytes = (hex: string | undefined) => {
  if (!hex || typeof hex !== "string") {
    return new Uint8Array(0);
  }
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
};

const decodeBuff = (hex: string | undefined) => {
  if (!hex) return "";
  const text = decoder.decode(hexToBytes(hex));
  return text.replace(/\u0000+$/g, "").trim();
};

export const unwrapOk = (value: ClarityValue): ClarityValue => {
  if (value.type !== ClarityType.ResponseOk) {
    throw new Error("expected (ok ...) from contract");
  }
  return value.value;
};

export const unwrapUInt = (value: ClarityValue): bigint => {
  if (value.type !== ClarityType.UInt) {
    throw new Error("expected uint clarity value");
  }
  return (value as UIntCV).value;
};

export const parsePlanOption = (
  optionCv: ClarityValue,
  id: number
): AirtimePlan | null => {
  if (optionCv.type === ClarityType.OptionalNone) {
    return null;
  }

  if (optionCv.type !== ClarityType.OptionalSome) {
    throw new Error("expected optional clarity value for plan");
  }

  const json: any = cvToJSON(optionCv as OptionalCV<ClarityValue>);
  console.log("parsePlanOption debug:", { id, json, optionCv });

  // Check if json.value exists (the (some ...) wrapper)
  if (!json || !json.value) {
    throw new Error(`unexpected plan schema: json=${JSON.stringify(json)}`);
  }

  // The actual tuple data is in json.value.value (nested structure)
  const tupleData = json.value.value || json.value;

  if (!tupleData || typeof tupleData !== "object") {
    throw new Error(`unexpected plan tuple structure: ${JSON.stringify(json)}`);
  }

  const tuple = tupleData as Record<string, any>;
  console.log("parsePlanOption tuple:", tuple);

  // Helper to safely extract nested value
  const getValue = (key: string) => {
    const field = tuple[key];
    if (!field) return undefined;
    // Handle both {value: "..."} and direct values
    return field.value !== undefined ? field.value : field;
  };

  return {
    id,
    merchant: getValue("merchant") as string,
    customer: getValue("customer") as string,
    phone: decodeBuff(getValue("phone")),
    network: decodeBuff(getValue("network")),
    payoutAmount: BigInt(getValue("payout-amount") || "0"),
    interval: BigInt(getValue("interval") || "0"),
    nextClaimBlock: BigInt(getValue("next-claim-block") || "0"),
    totalFunded: BigInt(getValue("total-funded") || "0"),
    remainingBalance: BigInt(getValue("remaining-balance") || "0"),
    totalClaims: BigInt(getValue("total-claims") || "0"),
    maxClaims: BigInt(getValue("max-claims") || "0"),
  };
};
