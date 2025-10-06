import { AirtimePlan } from "../lib/clarity";
import { formatStx } from "../lib/config";

interface PlanHistoryProps {
  plan: AirtimePlan;
}

interface HistoryEvent {
  date: string;
  description: string;
  type: "create" | "claim" | "topup";
}

const PlanHistory = ({ plan }: PlanHistoryProps) => {
  const events: HistoryEvent[] = [];

  // Plan creation
  events.push({
    date: "Plan start",
    description: `Created with ${formatStx(
      plan.totalFunded
    )} STX for ${plan.maxClaims.toString()} drops`,
    type: "create",
  });

  // Calculate claims made (we don't have exact timestamps, so we show counts)
  if (plan.totalClaims > 0n) {
    events.push({
      date: "Claims",
      description: `${plan.totalClaims.toString()} airtime drop${
        plan.totalClaims === 1n ? "" : "s"
      } claimed (${formatStx(plan.totalClaims * plan.payoutAmount)} STX)`,
      type: "claim",
    });
  }

  // Check if there was a top-up (total funded > initial calculation)
  const initialFunding = plan.payoutAmount * plan.maxClaims;
  if (plan.totalFunded > initialFunding) {
    const topupAmount = plan.totalFunded - initialFunding;
    events.push({
      date: "Top-up",
      description: `Merchant added ${formatStx(topupAmount)} STX`,
      type: "topup",
    });
  }

  // Check if plan is completed
  if (plan.totalClaims >= plan.maxClaims || plan.remainingBalance === 0n) {
    events.push({
      date: "Status",
      description:
        plan.remainingBalance === 0n ? "Plan fully claimed" : "Plan completed",
      type: "claim",
    });
  }

  return (
    <div className="plan-history">
      <h4>Activity Log</h4>
      <div className="history-timeline">
        {events.map((event, index) => (
          <div key={index} className={`history-event history-${event.type}`}>
            <span className="history-date">{event.date}</span>
            <span className="history-desc">{event.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanHistory;
