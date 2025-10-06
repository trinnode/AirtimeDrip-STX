import { Cl } from "@stacks/transactions";
import { describe, expect, it, beforeEach } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const merchant = accounts.get("wallet_1")!;
const customer = accounts.get("wallet_2")!;
const randomUser = accounts.get("wallet_3")!;

// Helper to create a 16-byte buffer from string
const toFixedBuffer = (str: string, length: number): Uint8Array => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str.toLowerCase());
  if (data.length >= length) {
    return data.slice(0, length);
  }
  const padded = new Uint8Array(length);
  padded.set(data);
  return padded;
};

describe("STX Token Streaming & Airtime Drip Contract", () => {
  describe("Contract Initialization", () => {
    it("should initialize with zero stream and plan IDs", () => {
      const latestStreamId = simnet.getDataVar("stream", "latest-stream-id");
      const latestPlanId = simnet.getDataVar(
        "stream",
        "latest-airtime-plan-id"
      );

      expect(latestStreamId).toBeUint(0);
      expect(latestPlanId).toBeUint(0);
    });
  });

  describe("Token Streaming", () => {
    beforeEach(() => {
      // Reset state by creating a fresh stream for each test
      const result = simnet.callPublicFn(
        "stream",
        "stream-to",
        [
          Cl.principal(customer),
          Cl.uint(1000),
          Cl.tuple({ "start-block": Cl.uint(1), "stop-block": Cl.uint(100) }),
          Cl.uint(10),
        ],
        merchant
      );
      expect(result.result).toBeOk(Cl.uint(0));
    });

    it("should create a new stream with correct parameters", () => {
      const stream = simnet.getMapEntry("stream", "streams", Cl.uint(0));

      expect(stream).toBeSome(
        Cl.tuple({
          sender: Cl.principal(merchant),
          recipient: Cl.principal(customer),
          balance: Cl.uint(1000),
          "withdrawn-balance": Cl.uint(0),
          "payment-per-block": Cl.uint(10),
          timeframe: Cl.tuple({
            "start-block": Cl.uint(1),
            "stop-block": Cl.uint(100),
          }),
        })
      );
    });

    it("should transfer STX from sender to contract on stream creation", () => {
      const result = simnet.callPublicFn(
        "stream",
        "stream-to",
        [
          Cl.principal(customer),
          Cl.uint(500),
          Cl.tuple({ "start-block": Cl.uint(1), "stop-block": Cl.uint(50) }),
          Cl.uint(10),
        ],
        merchant
      );

      expect(result.events).toHaveLength(1);
      expect(result.events[0].event).toBe("stx_transfer_event");
      expect(result.events[0].data.amount).toBe("500");
      expect(result.events[0].data.sender).toBe(merchant);
    });

    it("should allow sender to refuel an existing stream", () => {
      const refuel = simnet.callPublicFn(
        "stream",
        "refuel",
        [Cl.uint(0), Cl.uint(500)],
        merchant
      );

      expect(refuel.result).toBeOk(Cl.bool(true));
      expect(refuel.events[0].data.amount).toBe("500");

      const stream = simnet.getMapEntry("stream", "streams", Cl.uint(0));
      expect(stream).toBeSome(
        Cl.tuple({
          sender: Cl.principal(merchant),
          recipient: Cl.principal(customer),
          balance: Cl.uint(1500),
          "withdrawn-balance": Cl.uint(0),
          "payment-per-block": Cl.uint(10),
          timeframe: Cl.tuple({
            "start-block": Cl.uint(1),
            "stop-block": Cl.uint(100),
          }),
        })
      );
    });

    it("should reject refuel from non-sender", () => {
      const refuel = simnet.callPublicFn(
        "stream",
        "refuel",
        [Cl.uint(0), Cl.uint(500)],
        randomUser
      );

      expect(refuel.result).toBeErr(Cl.uint(0));
    });

    it("should allow recipient to withdraw vested tokens", () => {
      simnet.mineEmptyBlocks(10);

      const withdraw = simnet.callPublicFn(
        "stream",
        "withdraw",
        [Cl.uint(0)],
        customer
      );

      expect(withdraw.result).toBeOk(Cl.uint(100));
      expect(withdraw.events[0].event).toBe("stx_transfer_event");
      expect(withdraw.events[0].data.amount).toBe("100");
      expect(withdraw.events[0].data.recipient).toBe(customer);
    });

    it("should reject withdrawal by non-recipient", () => {
      simnet.mineEmptyBlocks(10);

      const withdraw = simnet.callPublicFn(
        "stream",
        "withdraw",
        [Cl.uint(0)],
        randomUser
      );

      expect(withdraw.result).toBeErr(Cl.uint(0));
    });

    it("should allow sender to refund remaining balance after stream ends", () => {
      simnet.mineEmptyBlocks(110);

      const refund = simnet.callPublicFn(
        "stream",
        "refund",
        [Cl.uint(0)],
        merchant
      );

      expect(refund.result).toBeOk(Cl.uint(0));
      expect(refund.events[0].event).toBe("stx_transfer_event");
    });
  });

  describe("Airtime Drip Plans", () => {
    describe("Plan Creation", () => {
      it("should create airtime plan with correct parameters", () => {
        const phoneBuffer = toFixedBuffer("08035839933", 16);
        const networkBuffer = toFixedBuffer("mtn-ng", 16);

        const result = simnet.callPublicFn(
          "stream",
          "create-airtime-plan",
          [
            Cl.principal(customer),
            Cl.buffer(phoneBuffer),
            Cl.buffer(networkBuffer),
            Cl.uint(1000000), // 1 STX per payout
            Cl.uint(6), // 6 blocks interval
            Cl.uint(4), // 4 max claims
          ],
          merchant
        );

        expect(result.result).toBeOk(Cl.uint(0));
        expect(result.events[0].event).toBe("stx_transfer_event");
        expect(result.events[0].data.amount).toBe("4000000"); // 4 STX total
      });

      it("should increment plan ID counter", () => {
        const phoneBuffer = toFixedBuffer("08012345678", 16);
        const networkBuffer = toFixedBuffer("glo", 16);

        simnet.callPublicFn(
          "stream",
          "create-airtime-plan",
          [
            Cl.principal(customer),
            Cl.buffer(phoneBuffer),
            Cl.buffer(networkBuffer),
            Cl.uint(500000),
            Cl.uint(5),
            Cl.uint(3),
          ],
          merchant
        );

        const latestPlanId = simnet.getDataVar(
          "stream",
          "latest-airtime-plan-id"
        );
        expect(latestPlanId).toBeUint(1);
      });

      it("should reject plan with zero payout", () => {
        const result = simnet.callPublicFn(
          "stream",
          "create-airtime-plan",
          [
            Cl.principal(customer),
            Cl.buffer(toFixedBuffer("08011111111", 16)),
            Cl.buffer(toFixedBuffer("airtel", 16)),
            Cl.uint(0), // Invalid
            Cl.uint(5),
            Cl.uint(3),
          ],
          merchant
        );

        expect(result.result).toBeErr(Cl.uint(7)); // ERR_INVALID_PARAM
      });

      it("should reject plan with zero interval", () => {
        const result = simnet.callPublicFn(
          "stream",
          "create-airtime-plan",
          [
            Cl.principal(customer),
            Cl.buffer(toFixedBuffer("08011111111", 16)),
            Cl.buffer(toFixedBuffer("airtel", 16)),
            Cl.uint(1000000),
            Cl.uint(0), // Invalid
            Cl.uint(3),
          ],
          merchant
        );

        expect(result.result).toBeErr(Cl.uint(7)); // ERR_INVALID_PARAM
      });

      it("should reject plan with zero max claims", () => {
        const result = simnet.callPublicFn(
          "stream",
          "create-airtime-plan",
          [
            Cl.principal(customer),
            Cl.buffer(toFixedBuffer("08011111111", 16)),
            Cl.buffer(toFixedBuffer("airtel", 16)),
            Cl.uint(1000000),
            Cl.uint(5),
            Cl.uint(0), // Invalid
          ],
          merchant
        );

        expect(result.result).toBeErr(Cl.uint(7)); // ERR_INVALID_PARAM
      });
    });

    describe("Claiming Airtime", () => {
      beforeEach(() => {
        const phoneBuffer = toFixedBuffer("08035839933", 16);
        const networkBuffer = toFixedBuffer("mtn-ng", 16);

        simnet.callPublicFn(
          "stream",
          "create-airtime-plan",
          [
            Cl.principal(customer),
            Cl.buffer(phoneBuffer),
            Cl.buffer(networkBuffer),
            Cl.uint(2000000), // 2 STX per payout
            Cl.uint(6), // 6 blocks interval
            Cl.uint(4), // 4 max claims
          ],
          merchant
        );
      });

      it("should allow customer to claim after interval", () => {
        simnet.mineEmptyBlocks(6);

        const claim = simnet.callPublicFn(
          "stream",
          "claim-airtime",
          [Cl.uint(0)],
          customer
        );

        expect(claim.result).toBeOk(Cl.uint(2000000));
        expect(claim.events[0].event).toBe("stx_transfer_event");
        expect(claim.events[0].data.amount).toBe("2000000");
        expect(claim.events[0].data.recipient).toBe(customer);
      });

      it("should update plan state after claim", () => {
        simnet.mineEmptyBlocks(6);

        simnet.callPublicFn("stream", "claim-airtime", [Cl.uint(0)], customer);

        const plan = simnet.callReadOnlyFn(
          "stream",
          "get-airtime-plan",
          [Cl.uint(0)],
          customer
        );

        const planData = plan.result;
        expect(planData).toBeSome(
          Cl.tuple({
            merchant: Cl.principal(merchant),
            customer: Cl.principal(customer),
            phone: Cl.buffer(toFixedBuffer("08035839933", 16)),
            network: Cl.buffer(toFixedBuffer("mtn-ng", 16)),
            "payout-amount": Cl.uint(2000000),
            interval: Cl.uint(6),
            "next-claim-block": Cl.uint(13), // Current block + interval
            "total-funded": Cl.uint(8000000),
            "remaining-balance": Cl.uint(6000000),
            "total-claims": Cl.uint(1),
            "max-claims": Cl.uint(4),
          })
        );
      });

      it("should reject claim before interval", () => {
        const claim = simnet.callPublicFn(
          "stream",
          "claim-airtime",
          [Cl.uint(0)],
          customer
        );

        expect(claim.result).toBeErr(Cl.uint(5)); // ERR_PLAN_NOT_READY
      });

      it("should reject claim by non-customer", () => {
        simnet.mineEmptyBlocks(6);

        const claim = simnet.callPublicFn(
          "stream",
          "claim-airtime",
          [Cl.uint(0)],
          randomUser
        );

        expect(claim.result).toBeErr(Cl.uint(0)); // ERR_UNAUTHORIZED
      });

      it("should allow multiple claims over time", () => {
        // First claim
        simnet.mineEmptyBlocks(6);
        const claim1 = simnet.callPublicFn(
          "stream",
          "claim-airtime",
          [Cl.uint(0)],
          customer
        );
        expect(claim1.result).toBeOk(Cl.uint(2000000));

        // Second claim
        simnet.mineEmptyBlocks(6);
        const claim2 = simnet.callPublicFn(
          "stream",
          "claim-airtime",
          [Cl.uint(0)],
          customer
        );
        expect(claim2.result).toBeOk(Cl.uint(2000000));
      });

      it("should reject claim after max claims reached", () => {
        // Claim all 4 times
        for (let i = 0; i < 4; i++) {
          simnet.mineEmptyBlocks(6);
          simnet.callPublicFn(
            "stream",
            "claim-airtime",
            [Cl.uint(0)],
            customer
          );
        }

        // Try 5th claim
        simnet.mineEmptyBlocks(6);
        const claim = simnet.callPublicFn(
          "stream",
          "claim-airtime",
          [Cl.uint(0)],
          customer
        );

        expect(claim.result).toBeErr(Cl.uint(8)); // ERR_PLAN_COMPLETE
      });
    });

    describe("Top-up Plan", () => {
      beforeEach(() => {
        simnet.callPublicFn(
          "stream",
          "create-airtime-plan",
          [
            Cl.principal(customer),
            Cl.buffer(toFixedBuffer("08011111111", 16)),
            Cl.buffer(toFixedBuffer("airtel", 16)),
            Cl.uint(1000000),
            Cl.uint(5),
            Cl.uint(2),
          ],
          merchant
        );
      });

      it("should allow merchant to add extra claims", () => {
        const topup = simnet.callPublicFn(
          "stream",
          "topup-airtime",
          [Cl.uint(0), Cl.uint(3)],
          merchant
        );

        expect(topup.result).toBeOk(Cl.uint(3000000));
        expect(topup.events[0].event).toBe("stx_transfer_event");
        expect(topup.events[0].data.amount).toBe("3000000");
      });

      it("should update plan balances after topup", () => {
        simnet.callPublicFn(
          "stream",
          "topup-airtime",
          [Cl.uint(0), Cl.uint(5)],
          merchant
        );

        const plan = simnet.callReadOnlyFn(
          "stream",
          "get-airtime-plan",
          [Cl.uint(0)],
          merchant
        );

        const planData = plan.result;
        expect(planData).toBeSome(
          Cl.tuple({
            merchant: Cl.principal(merchant),
            customer: Cl.principal(customer),
            phone: Cl.buffer(toFixedBuffer("08011111111", 16)),
            network: Cl.buffer(toFixedBuffer("airtel", 16)),
            "payout-amount": Cl.uint(1000000),
            interval: Cl.uint(5),
            "next-claim-block": Cl.uint(6),
            "total-funded": Cl.uint(7000000), // Original 2M + 5M topup
            "remaining-balance": Cl.uint(7000000),
            "total-claims": Cl.uint(0),
            "max-claims": Cl.uint(7), // Original 2 + 5 extra
          })
        );
      });

      it("should reject topup by non-merchant", () => {
        const topup = simnet.callPublicFn(
          "stream",
          "topup-airtime",
          [Cl.uint(0), Cl.uint(3)],
          randomUser
        );

        expect(topup.result).toBeErr(Cl.uint(0)); // ERR_UNAUTHORIZED
      });

      it("should reject topup with zero claims", () => {
        const topup = simnet.callPublicFn(
          "stream",
          "topup-airtime",
          [Cl.uint(0), Cl.uint(0)],
          merchant
        );

        expect(topup.result).toBeErr(Cl.uint(7)); // ERR_INVALID_PARAM
      });
    });

    describe("Cancel Plan", () => {
      beforeEach(() => {
        simnet.callPublicFn(
          "stream",
          "create-airtime-plan",
          [
            Cl.principal(customer),
            Cl.buffer(toFixedBuffer("08099999999", 16)),
            Cl.buffer(toFixedBuffer("9mobile", 16)),
            Cl.uint(3000000),
            Cl.uint(10),
            Cl.uint(5),
          ],
          merchant
        );
      });

      it("should allow merchant to cancel and withdraw remaining balance", () => {
        const cancel = simnet.callPublicFn(
          "stream",
          "cancel-airtime",
          [Cl.uint(0)],
          merchant
        );

        expect(cancel.result).toBeOk(Cl.uint(15000000));
        expect(cancel.events[0].event).toBe("stx_transfer_event");
        expect(cancel.events[0].data.amount).toBe("15000000");
        expect(cancel.events[0].data.recipient).toBe(merchant);
      });

      it("should set remaining balance to zero after cancel", () => {
        simnet.callPublicFn("stream", "cancel-airtime", [Cl.uint(0)], merchant);

        const plan = simnet.callReadOnlyFn(
          "stream",
          "get-airtime-plan",
          [Cl.uint(0)],
          merchant
        );

        const planData = plan.result;
        expect(planData).toBeSome(
          Cl.tuple({
            merchant: Cl.principal(merchant),
            customer: Cl.principal(customer),
            phone: Cl.buffer(toFixedBuffer("08099999999", 16)),
            network: Cl.buffer(toFixedBuffer("9mobile", 16)),
            "payout-amount": Cl.uint(3000000),
            interval: Cl.uint(10),
            "next-claim-block": Cl.uint(11),
            "total-funded": Cl.uint(15000000),
            "remaining-balance": Cl.uint(0),
            "total-claims": Cl.uint(0),
            "max-claims": Cl.uint(0), // Set to total-claims
          })
        );
      });

      it("should reject cancel by non-merchant", () => {
        const cancel = simnet.callPublicFn(
          "stream",
          "cancel-airtime",
          [Cl.uint(0)],
          randomUser
        );

        expect(cancel.result).toBeErr(Cl.uint(0)); // ERR_UNAUTHORIZED
      });

      it("should reject cancel if balance already empty", () => {
        simnet.callPublicFn("stream", "cancel-airtime", [Cl.uint(0)], merchant);

        const cancel2 = simnet.callPublicFn(
          "stream",
          "cancel-airtime",
          [Cl.uint(0)],
          merchant
        );

        expect(cancel2.result).toBeErr(Cl.uint(6)); // ERR_PLAN_EMPTY
      });
    });

    describe("Read-only Functions", () => {
      it("should return latest plan ID", () => {
        const result = simnet.callReadOnlyFn(
          "stream",
          "get-latest-airtime-plan-id",
          [],
          deployer
        );

        expect(result.result).toBeOk(Cl.uint(0));
      });

      it("should return none for non-existent plan", () => {
        const result = simnet.callReadOnlyFn(
          "stream",
          "get-airtime-plan",
          [Cl.uint(999)],
          deployer
        );

        expect(result.result).toBeNone();
      });
    });
  });
});
