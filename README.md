# CreatorProof – Blockchain Content Protection System

CreatorProof is a decentralized digital content protection and intellectual property registry platform. It enables digital creators, artists, musicians, and developers to register immutable SHA-256 cryptographic proofs of their creative assets on-chain, issue commercial licenses, verify authenticity, and resolve copyright disputes.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (version 18 or higher recommended)
- npm (version 8 or higher)

### Installation
Unzip the project files and run:
```bash
npm install
```

### Running in Development Mode
Start the development server with Vite middleware:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building & Running for Production
To build the optimized static assets and server bundle:
```bash
npm run build
npm start
```
The production server will be running at [http://localhost:3000](http://localhost:3000).

---

## 🔑 Default Demo Credentials

The platform comes pre-configured with a demo account:
- **Email / Username**: `alex.vance@creatorproof.io` (or `alexvance`)
- **Password**: `Password123!`
- *Alternatively, click the **✨ Demo Login** button on the sign-in screen.*

You can also register a new account with your own credentials using the **Create an Account** tab.

---

## 🌟 Key Application Features

1. **Cryptographic Proof Registration**:
   - Upload any digital asset (image, audio, video, document).
   - Generates real client-side SHA-256 cryptographic hashes via Web Crypto API.
   - Simulates on-chain Merkle proof minting on Polygon PoS.

2. **Integrity Verification & Tamper Detection**:
   - Verify digital files against on-chain block digests.
   - Immediate detection of byte-level alterations, tampering, or bit-flips.

3. **Commercial IP Licensing**:
   - Issue commercial, exclusive, or attribution licenses with unique transaction receipts.
   - Track active licenses and revoke agreements on-chain.

4. **Copyright Dispute Resolution**:
   - File claims and submit cryptographic evidence.
   - Audit trail and status transitions (Under Review, Resolved, Escalated).

5. **PDF Certificate & Ledger Export**:
   - Generate official cryptographic certificates of registration.
   - Export comprehensive registry reports and JSON manifests.

6. **Creator Profile & Validation**:
   - Dedicated standalone profile page (`/profile.html` and `/profile`).
   - Strict input validation for names, emails, phone numbers, handles, and URLs.

---

## 🛠️ Project Structure

- `server.ts`: Express backend entry point with Vite dev middleware & static production serving on port 3000.
- `index.html`: Main SPA entry point.
- `profile.html` / `public/profile.html`: Standalone profile page with strict validation logic.
- `src/App.tsx`: Primary application state manager, navigation, and view coordinator.
- `src/components/`: Modular React components for Dashboard, Registration, Verification, Licenses, Disputes, and Settings.
- `src/context/AuthContext.tsx`: Authentication state management with localStorage persistence.
- `src/utils/crypto.ts`: SHA-256 digest computation, hash shortening, and clipboard helpers.
- `src/utils/pdfExport.ts`: jsPDF export engines for certificates and registry reports.
