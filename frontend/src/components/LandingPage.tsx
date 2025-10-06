import ReadOnlyView from "./ReadOnlyView";
import FaucetHelper from "./FaucetHelper";

interface LandingPageProps {
  onGetStarted: () => void;
  onLookup?: (address: string) => void;
  lookupAddress?: string;
}

const LandingPage = ({
  onGetStarted,
  onLookup,
  lookupAddress = "",
}: LandingPageProps) => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        `
        <div className="hero-content">
          <div className="hero-badge">
            <span className="pulse-dot"></span>
            <span>Built on Stacks Blockchain</span>
          </div>
          <h1 className="hero-title">
            Automate Airtime Top-ups with{" "}
            <span className="accent">STX Streaming</span>
          </h1>
          <p className="hero-subtitle">
            No more POS queues, no more last-minute runs to buy airtime. Set it
            once, let your people collect small-small as they need am. Like ajo
            for airtime — steady, automated, and transparent.
          </p>
          <div className="hero-actions">
            <button className="primary large" onClick={onGetStarted}>
              Get Started Now
            </button>
            <a href="#how-it-works" className="secondary large">
              Learn How It Works
            </a>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <strong>100%</strong>
              <span>On-chain</span>
            </div>
            <div className="stat-item">
              <strong>Zero</strong>
              <span>Middleman</span>
            </div>
            <div className="stat-item">
              <strong>~10min</strong>
              <span>Per Block</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testnet Faucet Helper */}
      <section className="section">
        <FaucetHelper />
      </section>

      {/* Read-Only Lookup */}
      <section className="section">
        <div className="readonly-section">
          <h2 className="section-title">Check Plans Without Connecting</h2>
          <p className="section-subtitle">
            No wallet? No wahala. Enter any Stacks address to view their airtime
            plans. Great for checking your balance before connecting.
          </p>
          {onLookup && (
            <ReadOnlyView lookupAddress={lookupAddress} onLookup={onLookup} />
          )}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section">
        <h2 className="section-title">How It Works</h2>
        <p className="section-subtitle">
          Three simple steps to start streaming airtime to your people
        </p>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Create a Plan</h3>
            <p>
              Connect your Stacks wallet and create an airtime drip plan.
              Specify your customer's wallet address, phone number, network
              (MTN, Glo, Airtel, 9mobile), and how much STX they should get per
              interval.
            </p>
            <div className="step-example">
              <strong>Example:</strong> Send 2 STX every 144 blocks (~24 hours)
              for 30 days
            </div>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Funds Lock On-Chain</h3>
            <p>
              Your STX gets locked in the smart contract — no one can touch it,
              not even you (until the plan ends). The contract releases funds
              automatically based on block height. Fully trustless and
              transparent.
            </p>
            <div className="step-example">
              <strong>Example:</strong> Lock 60 STX for 30 daily payments of 2
              STX each
            </div>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Customer Claims Anytime</h3>
            <p>
              Your customer connects their wallet and claims their airtime
              whenever the next interval is ready. No permission needed from
              you. They see a countdown timer and claim with one click. Simple
              and clean.
            </p>
            <div className="step-example">
              <strong>Example:</strong> After 24 hours, claim 2 STX. Repeat
              daily.
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="section alt-bg">
        <h2 className="section-title">Perfect For</h2>
        <div className="usecases-grid">
          <div className="usecase-card">
            <div className="usecase-icon">📱</div>
            <h3>Airtime Merchants</h3>
            <p>
              Automate recurring top-ups for loyal customers. Set it once,
              forget it. They collect when they need data or airtime, you don't
              have to remember.
            </p>
          </div>

          <div className="usecase-card">
            <div className="usecase-icon">💼</div>
            <h3>Small Business Owners</h3>
            <p>
              Keep your staff connected without manually sending airtime every
              week. Lock the budget on-chain, let them draw small amounts as
              needed.
            </p>
          </div>

          <div className="usecase-card">
            <div className="usecase-icon">👨‍👩‍👧‍👦</div>
            <h3>Parents & Guardians</h3>
            <p>
              Send pocket money to your children or dependents gradually. No
              bulk payments they'll finish in one week. Controlled, steady
              allowance system.
            </p>
          </div>

          <div className="usecase-card">
            <div className="usecase-icon">🚗</div>
            <h3>Transport & Logistics</h3>
            <p>
              Keep your drivers topped up with airtime/data for route updates.
              No more "I no get airtime" excuses. Automated delivery every
              interval.
            </p>
          </div>

          <div className="usecase-card">
            <div className="usecase-icon">🏘️</div>
            <h3>Community Groups</h3>
            <p>
              Like ajo/esusu but automated on blockchain. Pool funds, create
              plans for members, everyone collects their share on schedule.
              Transparent and fair.
            </p>
          </div>

          <div className="usecase-card">
            <div className="usecase-icon">💰</div>
            <h3>Subscription Services</h3>
            <p>
              Vendors can offer "pay-as-you-go" services with streaming
              payments. Customers pay gradually instead of big upfront costs.
              Win-win.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <h2 className="section-title">Why Choose STX Airtime Drip?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Trustless & Secure</h3>
            <p>
              Smart contract enforces rules. No middleman, no "he said, she
              said." Code is law. Your funds are safe on-chain.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Full Transparency</h3>
            <p>
              See everything on the blockchain. Check balances without
              connecting wallet. Activity history shows every transaction.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⏱️</div>
            <h3>Real-time Countdown</h3>
            <p>
              Live timer shows exactly when next claim is ready. No guessing, no
              waiting. See blocks remaining and estimated time.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>Flexible Management</h3>
            <p>
              Top up anytime to extend plans. Cancel and withdraw leftover
              funds. Update as your needs change. Full control.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Mobile-Friendly</h3>
            <p>
              Works on phone, tablet, laptop. QR codes for easy sharing.
              Responsive design that adapts to any screen size.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💸</div>
            <h3>Low Fees</h3>
            <p>
              Pay only Stacks network fees (usually less than 0.001 STX). No
              platform fees, no hidden charges. What you see is what you pay.
            </p>
          </div>
        </div>
      </section>

      {/* How Blockchain Makes It Better */}
      <section className="section blockchain-section">
        <div className="blockchain-content">
          <div className="blockchain-text">
            <h2>Why Blockchain?</h2>
            <p>
              Traditional airtime drip systems require trust in a central
              platform. They can freeze accounts, change rules, or disappear
              with your money. Not here.
            </p>
            <ul className="benefits-list">
              <li>
                <strong>Immutable Rules:</strong> Once you create a plan, the
                smart contract enforces it. No one can change the terms.
              </li>
              <li>
                <strong>No Custody:</strong> You lock funds directly on-chain.
                No platform holds your money. Contract releases it
                automatically.
              </li>
              <li>
                <strong>Verifiable:</strong> Every transaction is public. Check
                the blockchain yourself. No need to trust us — verify it.
              </li>
              <li>
                <strong>Censorship-Resistant:</strong> No one can block you from
                creating plans or claiming your funds. Pure peer-to-peer.
              </li>
            </ul>
          </div>
          <div className="blockchain-visual">
            <div className="chain-box">
              <div className="chain-item">You → Lock STX</div>
              <div className="chain-arrow">↓</div>
              <div className="chain-item">Smart Contract</div>
              <div className="chain-arrow">↓</div>
              <div className="chain-item">Customer Claims</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section faq-section">
        <h2 className="section-title">Common Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h3>Do I need STX to use this?</h3>
            <p>
              Yes. You need STX to create plans (to fund them) and a small
              amount for network fees. If you're on testnet, you can get free
              STX from the faucet.
            </p>
          </div>

          <div className="faq-item">
            <h3>What wallets are supported?</h3>
            <p>
              Currently Hiro Wallet and Xverse Wallet. Any wallet that supports
              Stacks Connect will work. Install the browser extension to get
              started.
            </p>
          </div>

          <div className="faq-item">
            <h3>How long until funds are available?</h3>
            <p>
              It depends on the interval you set. Stacks blocks are ~10 minutes
              each. If you set 144 blocks (1 day), customer can claim every 24
              hours.
            </p>
          </div>

          <div className="faq-item">
            <h3>Can I cancel a plan?</h3>
            <p>
              Yes, merchants can cancel anytime and withdraw the remaining
              balance. Customers keep what they've already claimed. Clean and
              fair.
            </p>
          </div>

          <div className="faq-item">
            <h3>Is this for mainnet or testnet?</h3>
            <p>
              You can deploy on either. For testing, use testnet (free STX). For
              real usage, deploy on mainnet. Configure via environment
              variables.
            </p>
          </div>

          <div className="faq-item">
            <h3>What if the customer loses access to their wallet?</h3>
            <p>
              Only the customer can claim with their wallet. If they lose
              access, funds stay locked until you cancel the plan. Recovery
              depends on their wallet backup.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-section">
        <h2>Ready to Start?</h2>
        <p>
          Connect your Stacks wallet and create your first airtime drip plan in
          less than 2 minutes.
        </p>
        <button className="primary large" onClick={onGetStarted}>
          Connect Wallet & Begin
        </button>
        <p className="cta-note">
          No account needed. Just your wallet. Fully decentralized.
        </p>
      </section>
    </div>
  );
};

export default LandingPage;
