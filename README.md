# STX Airtime Drip 💰# STX Streaming & Airtime Drip



> Automate airtime payments on the Stacks blockchain. No wahala, no POS queues.I built this to drip Stacks (STX) safely from one person to another. It feels like how we do ajo/esusu back home, just automated on the blockchain. **Now with prepaid airtime drip for Nigerian networks!**



A decentralized payment streaming platform built for Nigerian merchants and customers. Lock STX once, let your people claim their airtime drops automatically — like digital ajo/esusu, but on the blockchain.## What the contract does

- **Stream STX**: Sender locks STX inside the contract, receiver earns small pieces every block and can cash out what has accrued.

## Why This Exists- **Airtime Drip Plans**: Create recurring airtime payment plans for customers - perfect for merchants providing prepaid services.

- **Flexible Management**: Top up plans, cancel anytime, and withdraw remaining balance.

If you've ever run a small business in Lagos or Abuja, you know the headache: customers calling for airtime top-ups, chasing people down for payments, POS transfers that fail at 5pm. This dApp solves that.- **Multi-network Support**: Works with MTN, Glo, Airtel, and 9mobile.



**How it works:**All of this runs in `contracts/stream.clar` using Clarity.

- Merchants create airtime plans for regular customers

- Lock STX once for multiple scheduled drops## ✨ New Features (Professional Edition)

- Customers claim their own airtime when it's ready

- No manual transfers, no WhatsApp messages, no stress### 🎯 Enhanced User Experience

- **Transaction Status Notifications**: Real-time toast notifications for all blockchain interactions

Built with Clarity smart contracts on Stacks — your funds stay locked on-chain until customers claim them.- **Block Height Countdown**: Live countdown showing when next claim is ready (~10 min per block)

- **Activity History**: View complete transaction history for each plan

## What You Can Do- **QR Code Sharing**: Generate shareable links and QR codes for customers

- **Network Fee Estimation**: See total costs before creating plans

### For Merchants

- **Create Plans**: Set up recurring payments (daily, weekly, monthly)### 📊 Portal Views

- **Bulk Management**: Handle multiple customers from one dashboard- **Customer Portal**: View all your plans, total claimable balance, and bulk claim feature

- **Track Everything**: See total funded, claimed amounts, active plans- **Merchant Dashboard**: Track total locked value, revenue metrics, active/completed plans

- **Top Up Anytime**: Add more drops without creating new plans- **Read-Only Mode**: Look up plans by address without connecting wallet

- **Cancel & Refund**: Get remaining balance back if customer is sorted

### 🌐 Additional Tools

### For Customers- **Testnet Faucet Integration**: Quick access to get testnet STX

- **View Your Plans**: See all merchants sending you airtime- **View Mode Switcher**: Toggle between All Plans, My Claims, and My Business views

- **Claim When Ready**: Get notified when your next drop is available- **URL Plan Sharing**: Direct links to specific plans (e.g., `?plan=5&customer=ST1ABC...`)

- **Bulk Claims**: Collect from multiple plans in one go- **Bulk Claiming**: Claim from multiple plans with one click

- **No Wallet? No Problem**: Check your balance without connecting

## Features

### For Everyone### STX Streaming

- Real-time transaction notifications- Sender locks STX inside the contract

- Live countdown to next claim (~10 min per block)- Receiver earns small pieces every block and can cash out what has accrued

- QR codes for easy plan sharing- Sender can top up the pot or pull back whatever is left when the schedule ends

- Activity history for each plan- Both sides can agree to tweak the plan if they sign the same message

- Network fee preview before transactions

### Airtime Drip (NEW!)

## Quick Start- **Create Plans**: Merchants set up recurring airtime payments with customer address, phone number, and network

- **Auto Claims**: Customers claim airtime every interval (e.g., every 144 blocks = ~24 hours)

### Prerequisites- **Top Up**: Add more STX to existing plans anytime

- Node.js 18+ and pnpm installed- **Cancel**: Merchants can cancel plans and withdraw remaining balance

- Hiro or Xverse wallet (for testnet/mainnet)

- Clarinet CLI (for contract development)## Local setup

```bash

### Local Developmentpnpm install

pnpm run dev      # Start frontend at http://localhost:5173

```bash```

# Clone and install

git clone <your-repo-url>### Testing

cd stacks-token-streaming```bash

pnpm installclarinet check    # Check contract compiles

pnpm test        # Run tests (note: currently being debugged)

# Start the frontend```

pnpm run dev

# Visit http://localhost:5173## Frontend


clarinet check- **Wallet Integration**: Connect with Hiro Wallet using @stacks/connect

```- **Real-time Notifications**: Toast messages for all transactions

- **Block Countdown Timer**: Live updates showing when claims are ready

### First Time Setup- **Smart Portals**: Dedicated views for customers and merchants

- **Fee Estimation**: See total costs before submitting transactions

1. **Get testnet STX** (if testing)- **QR Code Generation**: Share plans easily with customers

   - Click "Get testnet STX" in the app- **Activity Logs**: Complete history for each plan

   - Or visit: https://explorer.hiro.so/sandbox/faucet- **Read-Only Lookup**: View plans without wallet connection

- **Bulk Operations**: Claim from multiple plans at once

2. **Connect your wallet**- **Nigerian Theme**: Black/orange/army-green color scheme with Nunito fonts

   - Click "Connect wallet" 

   - Approve in Hiro/XverseAccess at `http://localhost:5173` after running `pnpm run dev`.



3. **Create your first plan**## Use Cases

   - Fill in customer address- **Airtime Merchants**: Automate recurring airtime top-ups for loyal customers

   - Set phone number and network (MTN, Glo, Airtel, 9mobile)- **Employer Payments**: Stream monthly salary so staff can draw cash anytime

   - Choose amount per drop and frequency- **Pocket Money**: Parents drip feed to kids without giving everything at once

   - Submit and sign the transaction- **Subscription Services**: Vendors providing data or airtime little by little



## Smart Contract## Contract Functions

### Airtime Functions

The heart of this dApp is `contracts/stream.clar` — 366 lines of Clarity code handling:- `create-airtime-plan`: Create a new recurring airtime plan

- `claim-airtime`: Customer claims their scheduled airtime payout

- **Airtime Plans**: Recurring payments with interval-based claims- `topup-airtime`: Add more STX to an existing plan

- **STX Streaming**: Continuous per-block token release (original feature)- `cancel-airtime`: Cancel plan and withdraw remaining balance

- **Access Control**: Only merchant can top-up/cancel, only customer can claim

- **Safe Transfers**: Funds locked in contract until explicitly claimed### Streaming Functions

- `stream-to`: Create a new STX stream

### Main Functions- `refuel`: Add more STX to existing stream

- `withdraw`: Receiver claims available STX

```clarity- `refund`: Sender withdraws excess after stream ends

;; Merchant creates a plan

(create-airtime-plan customer phone network payout-amount interval max-claims)## Credits

Project started during the LearnWeb3 Stacks track.

;; Customer claims their dropExtended with Airtime Drip functionality for Nigerian prepaid services.

(claim-airtime plan-id)

;; Merchant adds more drops
(topup-airtime plan-id extra-claims)

;; Merchant cancels and gets refund
(cancel-airtime plan-id)
```

## Tech Stack

- **Smart Contract**: Clarity (Stacks blockchain)
- **Frontend**: React 18 + TypeScript + Vite
- **Wallet**: @stacks/connect (Hiro/Xverse integration)
- **Styling**: Custom CSS (Nigerian colors: black, orange, army-green)
- **3D Graphics**: Three.js for animated background
- **Testing**: Vitest + Clarinet SDK


## Deployment

### To Testnet

```bash
# Deploy contract
clarinet deployments apply -p deployments/default.testnet-plan.yaml

# Update frontend config
# Create frontend/.env
VITE_CONTRACT_ADDRESS=<your-deployed-address>
VITE_CONTRACT_NAME=stream
VITE_NETWORK=testnet

# Restart frontend
pnpm run dev
```

### To Mainnet

Same process but use `default.mainnet-plan.yaml` and set `VITE_NETWORK=mainnet`.

**Warning**: Test thoroughly on testnet first. Mainnet transactions use real STX.

## Use Cases (Real Life)

1. **Airtime Resellers**: Automate daily top-ups for loyal customers
2. **Small Businesses**: Pay staff salaries in scheduled drops
3. **Parents**: Drip-feed allowance to kids without sending everything at once
4. **Subscription Services**: Manage recurring data/airtime bundles
5. **Savings Groups**: Digital ajo/esusu with transparent on-chain records

## Nigerian Networks Supported

- MTN Nigeria
- Glo Mobile
- Airtel Nigeria
- 9mobile

(Network identifiers stored on-chain; actual airtime redemption requires off-chain integration)

## Known Limitations

- Test suite has simnet wallet initialization issues (documented, not code bugs)
- Contract address must be manually configured post-deployment
- Stacks block time is ~10 minutes (slower than Ethereum/Polygon)
- No actual telco integration yet (requires API partnerships)

## Future Plans

- Direct integration with Nigerian telco APIs
- Mobile app (React Native)
- Multi-currency support (STX, xBTC, stablecoins)
- Email/SMS notifications for ready claims
- Plan templates and CSV bulk imports

## Contributing

Found a bug? Got ideas? PRs welcome. 

Keep it simple, keep it clean, make it work for Nigerians first.

## License

MIT — use it, fork it, build on it.

## Credits

Started during LearnWeb3 Stacks track. Extended for Nigerian airtime use case.

Built with ❤️ for merchants and customers tired of payment wahala.

---
