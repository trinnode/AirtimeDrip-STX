import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AnchorMode,
  bufferCV,
  callReadOnlyFunction,
  PostConditionMode,
  principalCV,
  uintCV,
} from "@stacks/transactions";
import { useConnect } from "@stacks/connect-react";
import type { UserSession } from "@stacks/connect";

import AnimatedBackground from "./components/AnimatedBackground";
import CreatePlanForm, { CreatePlanPayload } from "./components/CreatePlanForm";
import PlanCard from "./components/PlanCard";
import CustomerPortal from "./components/CustomerPortal";
import MerchantPortal from "./components/MerchantPortal";
import ReadOnlyView from "./components/ReadOnlyView";
import FaucetHelper from "./components/FaucetHelper";
import LandingPage from "./components/LandingPage";
import { ToastContainer } from "./components/Toast";
import { useToast } from "./hooks/useToast";
import { useBlockHeight } from "./hooks/useBlockHeight";
import {
  AirtimePlan,
  parsePlanOption,
  unwrapOk,
  unwrapUInt,
} from "./lib/clarity";
import {
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  NETWORK_KEY,
  NETWORK_NAME,
  STACKS_NETWORK,
  formatStx,
  toMicroStx,
} from "./lib/config";

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

interface AppProps {
  userSession: UserSession;
}

type ViewMode = "landing" | "all" | "customer" | "merchant";

const App = ({ userSession }: AppProps) => {
  const {
    doOpenAuth,
    doContractCall,
    userSession: connectSession,
  } = useConnect();
  const session = connectSession ?? userSession;
  const { toasts, showToast, dismissToast, updateToast } = useToast();
  const { blockHeight } = useBlockHeight();

  const [plans, setPlans] = useState<AirtimePlan[]>([]);
  const [isFetching, setFetching] = useState(false);
  const [busyPlanId, setBusyPlanId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("landing");
  const [lookupAddress, setLookupAddress] = useState("");

  // Check URL params for direct plan viewing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get("plan");
    const customerParam = params.get("customer");

    if (planParam && customerParam) {
      setLookupAddress(customerParam);
      showToast(
        `Viewing plan #${planParam} for ${customerParam.slice(0, 8)}...`,
        "info"
      );
    }
  }, [showToast]);

  const isSignedIn = session?.isUserSignedIn() ?? false;

  const currentAddress = useMemo(() => {
    if (!session || !isSignedIn) return undefined;
    const data = session.loadUserData();
    const addresses = (data?.profile as any)?.stxAddress ?? {};
    return addresses[NETWORK_KEY];
  }, [isSignedIn, session]);

  const shortAddress = useMemo(() => {
    if (!currentAddress) return null;
    return `${currentAddress.slice(0, 6)}…${currentAddress.slice(-4)}`;
  }, [currentAddress]);

  const contractReady = CONTRACT_ADDRESS.length > 0;

  const refreshPlans = useCallback(
    async (address?: string) => {
      if (!contractReady) {
        setPlans([]);
        showToast(
          "Contract address not configured. Set VITE_CONTRACT_ADDRESS in .env",
          "error"
        );
        return;
      }

      const loadingToastId = showToast(
        "Loading plans from blockchain...",
        "pending",
        0
      );

      try {
        setFetching(true);
        const lookupAddr = address || currentAddress || CONTRACT_ADDRESS;

        const latestResponse = await callReadOnlyFunction({
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: "get-latest-airtime-plan-id",
          functionArgs: [],
          senderAddress: lookupAddr,
          network: STACKS_NETWORK,
        });

        const totalPlans = unwrapUInt(unwrapOk(latestResponse));
        const items: AirtimePlan[] = [];

        for (let i = 0n; i < totalPlans; i += 1n) {
          const planId = Number(i);
          const planCv = await callReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: "get-airtime-plan",
            functionArgs: [uintCV(i)],
            senderAddress: lookupAddr,
            network: STACKS_NETWORK,
          });
          const parsed = parsePlanOption(planCv, planId);
          if (parsed) {
            items.push(parsed);
          }
        }

        items.sort((a, b) => b.id - a.id);
        setPlans(items);
        updateToast(
          loadingToastId,
          `✓ Synced ${items.length} plan${items.length === 1 ? "" : "s"}`,
          "success",
          3000
        );
      } catch (error) {
        console.error("refreshPlans", error);
        updateToast(
          loadingToastId,
          "Failed to load plans. Check your network connection.",
          "error"
        );
      } finally {
        setFetching(false);
      }
    },
    [contractReady, currentAddress, showToast, updateToast]
  );

  useEffect(() => {
    refreshPlans();
  }, [refreshPlans]);

  const requireWallet = () => {
    if (!isSignedIn) {
      throw new Error("Connect your Stacks wallet first.");
    }
  };

  const handleCreatePlan = async (payload: CreatePlanPayload) => {
    requireWallet();
    if (!contractReady) {
      throw new Error("Contract address is missing.");
    }

    const toastId = showToast("Preparing transaction...", "pending", 0);

    await new Promise<void>((resolve, reject) => {
      doContractCall({
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
        network: STACKS_NETWORK,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        onFinish: (result) => {
          updateToast(
            toastId,
            `Plan created! Transaction: ${result.txId.slice(0, 8)}...`,
            "success"
          );
          setTimeout(() => refreshPlans(), 8000);
          resolve();
        },
        onCancel: () => {
          updateToast(toastId, "Transaction cancelled", "info", 3000);
          reject(new Error("User cancelled"));
        },
      });
    });
  };

  const runPlanAction = async (
    planId: number,
    functionName: "claim-airtime" | "topup-airtime" | "cancel-airtime",
    args: ReturnType<typeof uintCV>[],
    actionName: string
  ) => {
    requireWallet();
    if (!contractReady) {
      throw new Error("Contract address is missing.");
    }

    const toastId = showToast(`${actionName}...`, "pending", 0);

    await new Promise<void>((resolve, reject) => {
      doContractCall({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName,
        functionArgs: args,
        network: STACKS_NETWORK,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        onFinish: (result) => {
          updateToast(
            toastId,
            `✓ ${actionName} successful! Tx: ${result.txId.slice(0, 8)}...`,
            "success"
          );
          setTimeout(() => refreshPlans(), 8000);
          resolve();
        },
        onCancel: () => {
          updateToast(toastId, "Transaction cancelled", "info", 3000);
          reject(new Error("User cancelled"));
        },
      });
    });
  };

  const handleClaim = async (planId: number) => {
    try {
      setBusyPlanId(planId);
      await runPlanAction(
        planId,
        "claim-airtime",
        [uintCV(BigInt(planId))],
        "Claiming airtime"
      );
    } catch (error) {
      showToast((error as Error).message || "Claim failed", "error");
    } finally {
      setBusyPlanId(null);
    }
  };

  const handleClaimAll = async () => {
    if (!currentAddress) return;

    const customerPlans = plans.filter(
      (p) =>
        p.customer.toLowerCase() === currentAddress.toLowerCase() &&
        p.remainingBalance > 0n &&
        p.totalClaims < p.maxClaims &&
        blockHeight &&
        p.nextClaimBlock <= blockHeight
    );

    if (customerPlans.length === 0) {
      showToast("No plans ready to claim", "info");
      return;
    }

    showToast(`Claiming from ${customerPlans.length} plans...`, "pending", 0);

    for (const plan of customerPlans) {
      try {
        await handleClaim(plan.id);
      } catch (error) {
        console.error(`Failed to claim plan ${plan.id}:`, error);
      }
    }

    showToast("Bulk claim complete!", "success");
  };

  const handleTopup = async (planId: number, extraClaims: number) => {
    try {
      setBusyPlanId(planId);
      await runPlanAction(
        planId,
        "topup-airtime",
        [uintCV(BigInt(planId)), uintCV(BigInt(extraClaims))],
        "Topping up plan"
      );
    } catch (error) {
      showToast((error as Error).message || "Top-up failed", "error");
    } finally {
      setBusyPlanId(null);
    }
  };

  const handleCancel = async (planId: number) => {
    try {
      setBusyPlanId(planId);
      await runPlanAction(
        planId,
        "cancel-airtime",
        [uintCV(BigInt(planId))],
        "Cancelling plan"
      );
    } catch (error) {
      showToast((error as Error).message || "Cancellation failed", "error");
    } finally {
      setBusyPlanId(null);
    }
  };

  const handleSignIn = () => {
    doOpenAuth(true);
  };

  const handleSignOut = () => {
    session?.signUserOut();
    window.location.reload();
  };

  const handleLookup = (address: string) => {
    setLookupAddress(address);
    refreshPlans(address);
  };

  const renderContent = () => {
    if (viewMode === "landing") {
      return (
        <LandingPage
          onGetStarted={() => setViewMode("all")}
          onLookup={handleLookup}
          lookupAddress={lookupAddress}
        />
      );
    }

    if (viewMode === "customer") {
      return (
        <CustomerPortal
          plans={plans}
          currentAddress={currentAddress}
          currentBlock={blockHeight}
          onClaimAll={handleClaimAll}
          onClaim={handleClaim}
          onTopup={handleTopup}
          onCancel={handleCancel}
          busy={busyPlanId}
        />
      );
    }

    if (viewMode === "merchant") {
      return (
        <MerchantPortal
          plans={plans}
          currentAddress={currentAddress}
          currentBlock={blockHeight}
          onClaim={handleClaim}
          onTopup={handleTopup}
          onCancel={handleCancel}
          busy={busyPlanId}
        />
      );
    }

    return (
      <>
        <section className="panel">
          <h2>All airtime plans</h2>
          <p className="message">
            {isFetching
              ? "Syncing with blockchain..."
              : plans.length === 0
              ? "No plans yet. Create your first one below."
              : `Showing ${plans.length} plan${plans.length === 1 ? "" : "s"}.`}
          </p>
          <div className="plan-list">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                currentAddress={currentAddress}
                currentBlock={blockHeight}
                onClaim={handleClaim}
                onTopup={handleTopup}
                onCancel={handleCancel}
                busy={busyPlanId === plan.id}
              />
            ))}
          </div>
        </section>
        <footer className="app-footer">
          <div className="footer-stats">
            <span>
              Total locked:{" "}
              <strong>
                {formatStx(
                  plans.reduce((sum, plan) => sum + plan.remainingBalance, 0n)
                )}{" "}
                STX
              </strong>
            </span>
            <span>•</span>
            <span>
              Block height:{" "}
              <strong>{blockHeight?.toString() || "Loading..."}</strong>
            </span>
          </div>
          <p className="message">
            Contract: {CONTRACT_ADDRESS || "Not configured"}
          </p>
        </footer>
      </>
    );
  };

  return (
    <div className="app-shell">
      <AnimatedBackground />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <header className="app-header">
        <div className="brand">
          <h1>💰 STX Airtime Drip</h1>
          <p>Keep your people topped up — no POS queues, no wahala.</p>
        </div>
        <div className="wallet-actions">
          {isSignedIn && (
            <button
              className="neutral"
              onClick={() => setViewMode("landing")}
              title="Back to home"
            >
              🏠 Home
            </button>
          )}
          {shortAddress && (
            <span className="badge">
              {shortAddress} ·{" "}
              {NETWORK_NAME === "mainnet" ? "Mainnet" : "Testnet"}
            </span>
          )}
          {isSignedIn ? (
            <button className="neutral" onClick={handleSignOut}>
              Disconnect
            </button>
          ) : (
            <button className="primary" onClick={handleSignIn}>
              Connect wallet
            </button>
          )}
        </div>
      </header>

      {!isSignedIn ? (
        <LandingPage
          onGetStarted={handleSignIn}
          onLookup={handleLookup}
          lookupAddress={lookupAddress}
        />
      ) : (
        <>
          {viewMode !== "landing" && (
            <CreatePlanForm
              onSubmit={handleCreatePlan}
              disabled={!contractReady}
              currentAddress={currentAddress}
            />
          )}

          <div className="view-switcher">
            <button
              className={viewMode === "landing" ? "active" : ""}
              onClick={() => setViewMode("landing")}
            >
              🏠 Home
            </button>
            <button
              className={viewMode === "all" ? "active" : ""}
              onClick={() => setViewMode("all")}
            >
              All Plans
            </button>
            <button
              className={viewMode === "customer" ? "active" : ""}
              onClick={() => setViewMode("customer")}
            >
              My Claims
            </button>
            <button
              className={viewMode === "merchant" ? "active" : ""}
              onClick={() => setViewMode("merchant")}
            >
              My Business
            </button>
          </div>

          {renderContent()}
        </>
      )}
    </div>
  );
};

export default App;
