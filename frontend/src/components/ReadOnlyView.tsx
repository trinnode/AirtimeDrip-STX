import { useEffect, useState } from "react";

interface ReadOnlyViewProps {
  lookupAddress: string;
  onLookup: (address: string) => void;
}

const ReadOnlyView = ({ lookupAddress, onLookup }: ReadOnlyViewProps) => {
  const [inputAddress, setInputAddress] = useState(lookupAddress);

  useEffect(() => {
    setInputAddress(lookupAddress);
  }, [lookupAddress]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLookup(inputAddress);
  };

  return (
    <div className="readonly-view">
      <div className="panel">
        <h3>View Plans (No Wallet Required)</h3>
        <p className="message">
          Enter a Stacks address to view their airtime plans. Perfect for
          checking your balance before connecting a wallet.
        </p>
        <form onSubmit={handleSubmit} className="lookup-form">
          <input
            type="text"
            placeholder="ST1ABC...XYZ"
            value={inputAddress}
            onChange={(e) => setInputAddress(e.target.value)}
            className="lookup-input"
          />
          <button type="submit" className="primary">
            Look up plans
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReadOnlyView;
