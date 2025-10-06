import { useState } from "react";

interface QRCodeShareProps {
  planId: number;
  customerAddress: string;
}

const QRCodeShare = ({ planId, customerAddress }: QRCodeShareProps) => {
  const [showQR, setShowQR] = useState(false);

  const shareUrl = `${window.location.origin}/?plan=${planId}&customer=${customerAddress}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    shareUrl
  )}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
  };

  return (
    <div className="qr-share">
      <button
        className="ghost"
        onClick={() => setShowQR(!showQR)}
        type="button"
      >
        {showQR ? "Hide" : "Share"} plan link
      </button>

      {showQR && (
        <div className="qr-content">
          <p className="message">
            Your customer can scan this QR or click the link to view and claim
            their airtime directly.
          </p>
          <img src={qrApiUrl} alt="Plan QR Code" className="qr-image" />
          <div className="qr-link">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="share-input"
            />
            <button className="secondary" onClick={handleCopyLink}>
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeShare;
