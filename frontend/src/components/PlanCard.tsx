import { useState } from "react";
import { AirtimePlan } from "../lib/clarity";
import { formatStx } from "../lib/config";
import BlockCountdown from "./BlockCountdown";
import PlanHistory from "./PlanHistory";
import QRCodeShare from "./QRCodeShare";

interface PlanCardProps {
  plan: AirtimePlan;
  currentAddress?: string;
  currentBlock?: bigint | null;
  onClaim: (planId: number) => Promise<void>;
  onTopup: (planId: number, extraClaims: number) => Promise<void>;
  onCancel: (planId: number) => Promise<void>;
  busy?: boolean;
}

const PlanCard = ({
  plan,
  currentAddress,
  currentBlock,
  onClaim,
  onTopup,
  onCancel,
  busy = false,
}: PlanCardProps) => {
  const [extraClaims, setExtraClaims] = useState("1");
  const [isRunning, setRunning] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const isMerchant =
    currentAddress?.toLowerCase() === plan.merchant.toLowerCase();
  const isCustomer =
    currentAddress?.toLowerCase() === plan.customer.toLowerCase();

  const claimsLeft = plan.maxClaims - plan.totalClaims;
  const hasBalance = plan.remainingBalance > 0n;
  const canClaim = isCustomer && hasBalance && claimsLeft > 0n;

  const handleClaim = async () => {
    try {
      setRunning(true);
      await onClaim(plan.id);
    } finally {
      setRunning(false);
    }
  };

  const handleTopup = async () => {
    const value = Number(extraClaims);
    if (!Number.isFinite(value) || value <= 0) return;
    try {
      setRunning(true);
      await onTopup(plan.id, value);
    } finally {
      setRunning(false);
    }
  };

  const handleCancel = async () => {
    try {
      setRunning(true);
      await onCancel(plan.id);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="plan-card">
      <div className="plan-meta">
        <span>ID</span>
        <strong>#{plan.id}</strong>
        <span>Merchant</span>
        <strong>{plan.merchant}</strong>
        <span>Customer</span>
        <strong>{plan.customer}</strong>
      </div>
      <div className="plan-meta">
        <span>Telco</span>
        <strong>{plan.network || "-"}</strong>
        <span>Phone</span>
        <strong>{plan.phone || "-"}</strong>
        <span>Payout</span>
        <strong>{formatStx(plan.payoutAmount)} STX</strong>
      </div>
      <div className="plan-meta">
        <span>Interval</span>
        <strong>{plan.interval.toString()} blocks</strong>
        <span>Claims served</span>
        <strong>
          {plan.totalClaims.toString()} / {plan.maxClaims.toString()}
        </strong>
        <span>Balance left</span>
        <strong>{formatStx(plan.remainingBalance)} STX</strong>
      </div>
      <div className="plan-actions">
        {isCustomer && (
          <>
            {currentBlock && (
              <BlockCountdown
                currentBlock={currentBlock}
                targetBlock={plan.nextClaimBlock}
              />
            )}
            <button
              className="secondary"
              onClick={handleClaim}
              disabled={!canClaim || busy || isRunning}
            >
              {isRunning ? "Processing..." : "Claim next drop"}
            </button>
          </>
        )}

        {isMerchant && (
          <>
            <div className="topup-row">
              <input
                type="number"
                min="1"
                value={extraClaims}
                onChange={(event) => setExtraClaims(event.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(8, 10, 12, 0.8)",
                  border: "1px solid rgba(249, 115, 22, 0.25)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  color: "#f4f4f5",
                  fontFamily: "Fira Code, monospace",
                }}
              />
              <button
                className="primary"
                type="button"
                onClick={handleTopup}
                disabled={busy || isRunning}
              >
                Top up drops
              </button>
            </div>
            <button
              className="ghost"
              type="button"
              onClick={handleCancel}
              disabled={busy || isRunning || plan.remainingBalance === 0n}
            >
              Cash out leftover
            </button>
            <small className="message">
              Once cancelled, plan locks to the amount already collected. No
              long talk.
            </small>
            <QRCodeShare planId={plan.id} customerAddress={plan.customer} />
          </>
        )}

        {!isMerchant && !isCustomer && (
          <small className="message">
            Connect with the right wallet to manage this plan.
          </small>
        )}

        <button
          className="ghost"
          onClick={() => setShowHistory(!showHistory)}
          type="button"
        >
          {showHistory ? "Hide" : "View"} activity log
        </button>
      </div>

      {showHistory && <PlanHistory plan={plan} />}
    </div>
  );
};

export default PlanCard;
