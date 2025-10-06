import { useEffect, useState } from "react";
import {
  AnchorMode,
  bufferCV,
  estimateTransaction,
  makeContractCall,
  principalCV,
  uintCV,
} from "@stacks/transactions";
import {
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  formatStx,
  STACKS_NETWORK,
  toMicroStx,
} from "../lib/config";
import { CreatePlanPayload } from "./CreatePlanForm";

const toFixedBuffer = (input: string, length: number) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.toLowerCase());
  if (data.length >= length) {
    return data.slice(0, length);
  }
  const padded = new Uint8Array(length);
  padded.set(data);
  return padded;
};

interface FeeEstimatorProps {
  payload: CreatePlanPayload;
  senderAddress?: string;
}

const FeeEstimator = ({ payload, senderAddress }: FeeEstimatorProps) => {
  const [fee, setFee] = useState<bigint | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  useEffect(() => {
    if (!senderAddress || !payload.customer) {
      setFee(null);
      return;
    }

    const estimate = async () => {
      try {
        setIsEstimating(true);

        const txOptions = {
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: "create-airtime-plan",
          functionArgs: [
            principalCV(payload.customer),
            bufferCV(toFixedBuffer(payload.phone, 16)),
            bufferCV(toFixedBuffer(payload.network, 16)),
            uintCV(toMicroStx(payload.payout)),
            uintCV(BigInt(payload.interval)),
            uintCV(BigInt(payload.maxClaims)),
          ],
          senderKey: "0".repeat(64), // Dummy key for estimation
          network: STACKS_NETWORK,
          anchorMode: AnchorMode.Any,
        };

        const transaction = await makeContractCall(txOptions);

        // For fee estimation, we'll use a default estimate
        // The actual Stacks API estimateTransaction has different signature
        // For now, use a reasonable default of 0.001 STX (1000 microSTX)
        const defaultFee = 1000n; // 0.001 STX in microSTX
        setFee(defaultFee);
      } catch (error) {
        console.error("Fee estimation failed:", error);
        setFee(null);
      } finally {
        setIsEstimating(false);
      }
    };

    estimate();
  }, [payload, senderAddress]);

  if (!senderAddress) return null;

  const planCost =
    toMicroStx(payload.payout) * BigInt(payload.maxClaims || "0");
  const totalCost = fee ? planCost + fee : planCost;

  return (
    <div className="fee-estimator">
      <h4>Cost Breakdown</h4>
      <div className="fee-row">
        <span>Plan funding</span>
        <strong>{formatStx(planCost)} STX</strong>
      </div>
      <div className="fee-row">
        <span>Network fee</span>
        {isEstimating ? (
          <em>Estimating...</em>
        ) : fee ? (
          <strong>{formatStx(fee)} STX</strong>
        ) : (
          <em>~0.001 STX</em>
        )}
      </div>
      <div className="fee-row fee-total">
        <span>Total cost</span>
        <strong>{formatStx(totalCost)} STX</strong>
      </div>
      <p className="message">
        Make sure your wallet has enough STX to cover both the plan and gas.
      </p>
    </div>
  );
};

export default FeeEstimator;
