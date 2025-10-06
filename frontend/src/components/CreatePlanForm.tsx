import { ChangeEvent, FormEvent, useState } from "react";
import { toMicroStx } from "../lib/config";
import FeeEstimator from "./FeeEstimator";

export interface CreatePlanPayload {
  customer: string;
  phone: string;
  network: string;
  payout: string;
  interval: string;
  maxClaims: string;
}

interface CreatePlanFormProps {
  onSubmit: (payload: CreatePlanPayload) => Promise<void>;
  disabled?: boolean;
  currentAddress?: string;
}

const initialValues: CreatePlanPayload = {
  customer: "",
  phone: "",
  network: "",
  payout: "1",
  interval: "6",
  maxClaims: "4",
};

const CreatePlanForm = ({
  onSubmit,
  disabled = false,
  currentAddress,
}: CreatePlanFormProps) => {
  const [values, setValues] = useState<CreatePlanPayload>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      if (!values.customer.startsWith("ST")) {
        setError("Drop a valid Stacks address for your customer.");
        return;
      }
      if (toMicroStx(values.payout) === 0n) {
        setError("Payout must be more than zero.");
        return;
      }
      if (Number(values.interval) <= 0) {
        setError("Interval needs to be at least one block.");
        return;
      }
      if (Number(values.maxClaims) <= 0) {
        setError("Max claims should be at least one.");
        return;
      }

      setSubmitting(true);
      await onSubmit(values);
      setValues(initialValues);
    } catch (err) {
      console.error("create-plan", err);
      setError((err as Error).message ?? "Could not submit plan");
    } finally {
      setSubmitting(false);
    }
  };

  const onChange =
    (key: keyof CreatePlanPayload) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((prev) => ({ ...prev, [key]: event.target.value }));
    };

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2>Set up airtime drip</h2>
      <p className="message">
        Fund a plan once and your guy will receive steady STX they can spend on
        airtime or data.
      </p>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="customer">Customer address</label>
          <input
            id="customer"
            placeholder="ST3..."
            value={values.customer}
            onChange={onChange("customer")}
            required
          />
          <small>Use the STX address they shared with you.</small>
        </div>
        <div className="field">
          <label htmlFor="phone">Phone number</label>
          <input
            id="phone"
            placeholder="0803xxxxxxx"
            value={values.phone}
            onChange={onChange("phone")}
            maxLength={16}
            required
          />
          <small>
            Supports only Nigerian SIMs for now!
          </small>
        </div>
        <div className="field">
          <label htmlFor="network">Telco network</label>
          <input
            id="network"
            placeholder="mtn-ng | glo | airtel"
            value={values.network}
            onChange={onChange("network")}
            maxLength={16}
            required
          />
          <small>Pick the provider they recharge on.</small>
        </div>
        <div className="field">
          <label htmlFor="payout">Amount per drop (STX)</label>
          <input
            id="payout"
            type="number"
            min="0"
            step="0.000001"
            value={values.payout}
            onChange={onChange("payout")}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="interval">Blocks between drops</label>
          <input
            id="interval"
            type="number"
            min="1"
            value={values.interval}
            onChange={onChange("interval")}
            required
          />
          <small>≈10 mins per block on Stacks.</small>
        </div>
        <div className="field">
          <label htmlFor="maxClaims">Number of drops</label>
          <input
            id="maxClaims"
            type="number"
            min="1"
            value={values.maxClaims}
            onChange={onChange("maxClaims")}
            required
          />
        </div>
      </div>
      {error && (
        <p className="message" style={{ color: "#fda4af" }}>
          {error}
        </p>
      )}
      {currentAddress && values.customer && values.payout && values.maxClaims && (
        <FeeEstimator payload={values} senderAddress={currentAddress} />
      )}
      <div className="wallet-actions">
        <button
          type="submit"
          className="primary"
          disabled={disabled || isSubmitting}
        >
          {isSubmitting ? "Setting up..." : "Create plan"}
        </button>
      </div>
    </form>
  );
};

export default CreatePlanForm;
