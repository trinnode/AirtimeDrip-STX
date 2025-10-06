import { NETWORK_NAME } from "../lib/config";

interface FaucetHelperProps {
  address?: string;
}

const FaucetHelper = ({ address }: FaucetHelperProps) => {
  if (NETWORK_NAME === "mainnet") {
    return null; // Don't show faucet on mainnet
  }

  const faucetUrl = address
    ? `https://explorer.hiro.so/sandbox/faucet?address=${address}`
    : "https://explorer.hiro.so/sandbox/faucet";

  return (
    <div className="faucet-helper">
      <div className="faucet-content">
        <span>🪙</span>
        <div>
          <p>
            <strong>Need testnet STX?</strong>
          </p>
          <p className="message">
            Get free tokens from the Hiro faucet to test this dApp.
          </p>
        </div>
      </div>
      <a
        href={faucetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="faucet-link"
      >
        Get testnet STX
      </a>
    </div>
  );
};

export default FaucetHelper;
