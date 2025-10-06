import { AirtimePlan } from "../lib/clarity";
import { formatStx } from "../lib/config";
import PlanCard from "./PlanCard";
import BlockCountdown from "./BlockCountdown";

interface CustomerPortalProps {
  plans: AirtimePlan[];
  currentAddress?: string;
  currentBlock: bigint | null;
  onClaimAll: () => Promise<void>;
  onClaim: (planId: number) => Promise<void>;
  onTopup: (planId: number, extraClaims: number) => Promise<void>;
  onCancel: (planId: number) => Promise<void>;
  busy?: number | null;
}

const CustomerPortal = ({
  plans,
  currentAddress,
  currentBlock,
  onClaimAll,
  onClaim,
  onTopup,
  onCancel,
  busy,
}: CustomerPortalProps) => {
  const myPlans = plans.filter(
    (p) => p.customer.toLowerCase() === currentAddress?.toLowerCase()
  );

  const totalClaimable = myPlans.reduce((sum, p) => {
    const claimsLeft = p.maxClaims - p.totalClaims;
    if (
      p.remainingBalance > 0n &&
      claimsLeft > 0n &&
      currentBlock &&
      p.nextClaimBlock <= currentBlock
    ) {
      return sum + p.payoutAmount;
    }
    return sum;
  }, 0n);

  const totalLocked = myPlans.reduce((sum, p) => sum + p.remainingBalance, 0n);

  const claimablePlans = myPlans.filter((p) => {
    const claimsLeft = p.maxClaims - p.totalClaims;
    return (
      p.remainingBalance > 0n &&
      claimsLeft > 0n &&
      currentBlock &&
      p.nextClaimBlock <= currentBlock
    );
  });

  if (myPlans.length === 0) {
    return (
      <div className="portal-empty">
        <h3>Customer View</h3>
        <p className="message">
          No plans found where you are the customer. Ask your merchant to
          create one for you.
        </p>
      </div>
    );
  }

  return (
    <div className="customer-portal">
      <div className="portal-header">
        <h3>Your Airtime Plans</h3>
        <p className="message">
          {myPlans.length} plan{myPlans.length === 1 ? "" : "s"} active
        </p>
      </div>

      <div className="portal-stats">
        <div className="stat-card">
          <span className="stat-label">Total balance</span>
          <span className="stat-value">{formatStx(totalLocked)} STX</span>
        </div>
        <div className="stat-card stat-highlight">
          <span className="stat-label">Ready to claim</span>
          <span className="stat-value">{formatStx(totalClaimable)} STX</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total plans</span>
          <span className="stat-value">{myPlans.length}</span>
        </div>
      </div>

      {claimablePlans.length > 1 && (
        <div className="claim-all-section">
          <button className="primary" onClick={onClaimAll} disabled={!!busy}>
            {busy ? "Processing..." : `Claim all (${claimablePlans.length} plans)`}
          </button>
          <p className="message">
            Save time by claiming from multiple plans at once.
          </p>
        </div>
      )}

      <div className="plan-list">
        {myPlans.map((plan) => (
          <div key={plan.id} className="portal-plan-wrapper">
            {currentBlock && plan.remainingBalance > 0n && plan.nextClaimBlock > 0n && (
              <BlockCountdown
                currentBlock={currentBlock}
                targetBlock={plan.nextClaimBlock}
              />
            )}
            <PlanCard
              plan={plan}
              currentAddress={currentAddress}
              currentBlock={currentBlock}
              onClaim={onClaim}
              onTopup={onTopup}
              onCancel={onCancel}
              busy={busy === plan.id}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerPortal;
