import { AirtimePlan } from "../lib/clarity";
import { formatStx } from "../lib/config";
import PlanCard from "./PlanCard";
import BlockCountdown from "./BlockCountdown";

interface MerchantPortalProps {
  plans: AirtimePlan[];
  currentAddress?: string;
  currentBlock: bigint | null;
  onClaim: (planId: number) => Promise<void>;
  onTopup: (planId: number, extraClaims: number) => Promise<void>;
  onCancel: (planId: number) => Promise<void>;
  busy?: number | null;
}

const MerchantPortal = ({
  plans,
  currentAddress,
  currentBlock,
  onClaim,
  onTopup,
  onCancel,
  busy,
}: MerchantPortalProps) => {
  const myPlans = plans.filter(
    (p) => p.merchant.toLowerCase() === currentAddress?.toLowerCase()
  );

  const totalLocked = myPlans.reduce((sum, p) => sum + p.remainingBalance, 0n);
  const totalFunded = myPlans.reduce((sum, p) => sum + p.totalFunded, 0n);
  const totalClaimed = myPlans.reduce(
    (sum, p) => sum + p.totalClaims * p.payoutAmount,
    0n
  );

  const activePlans = myPlans.filter((p) => p.remainingBalance > 0n);
  const completedPlans = myPlans.filter((p) => p.remainingBalance === 0n);

  if (myPlans.length === 0) {
    return (
      <div className="portal-empty">
        <h3>Merchant Dashboard</h3>
        <p className="message">
          No plans found where you are the merchant. Create your first plan
          below to start dripping airtime.
        </p>
      </div>
    );
  }

  return (
    <div className="merchant-portal">
      <div className="portal-header">
        <h3>Merchant Dashboard</h3>
        <p className="message">
          Managing {myPlans.length} airtime plan
          {myPlans.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="portal-stats">
        <div className="stat-card">
          <span className="stat-label">Total funded</span>
          <span className="stat-value">{formatStx(totalFunded)} STX</span>
          <span className="stat-subtitle">Lifetime investment</span>
        </div>
        <div className="stat-card stat-highlight">
          <span className="stat-label">Currently locked</span>
          <span className="stat-value">{formatStx(totalLocked)} STX</span>
          <span className="stat-subtitle">In active plans</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Already claimed</span>
          <span className="stat-value">{formatStx(totalClaimed)} STX</span>
          <span className="stat-subtitle">By customers</span>
        </div>
      </div>

      <div className="portal-stats">
        <div className="stat-card">
          <span className="stat-label">Active plans</span>
          <span className="stat-value">{activePlans.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Completed plans</span>
          <span className="stat-value">{completedPlans.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total customers</span>
          <span className="stat-value">
            {new Set(myPlans.map((p) => p.customer)).size}
          </span>
        </div>
      </div>

      {activePlans.length > 0 && (
        <>
          <h4>Active Plans</h4>
          <div className="plan-list">
            {activePlans.map((plan) => (
              <div key={plan.id} className="portal-plan-wrapper">
                {currentBlock && plan.nextClaimBlock > 0n ? (
                  <BlockCountdown
                    currentBlock={currentBlock}
                    targetBlock={plan.nextClaimBlock}
                    label="Customer can claim in"
                  />
                ) : null}
                <PlanCard
                  plan={plan}
                  currentAddress={currentAddress}
                  onClaim={onClaim}
                  onTopup={onTopup}
                  onCancel={onCancel}
                  busy={busy === plan.id}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {completedPlans.length > 0 && (
        <>
          <h4>Completed Plans</h4>
          <div className="plan-list">
            {completedPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                currentAddress={currentAddress}
                onClaim={onClaim}
                onTopup={onTopup}
                onCancel={onCancel}
                busy={busy === plan.id}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MerchantPortal;
