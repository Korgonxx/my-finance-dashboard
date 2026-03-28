# Korgon Finance - Web2 & Web3 Financial Dashboard

A modern, feature-rich financial dashboard built with Next.js 16, React 19, TypeScript, Tailwind CSS, and Framer Motion. Seamlessly switch between traditional Web2 finance and Web3 crypto features.

## ✨ Features

### 🌐 Web2/Web3 Mode Switching
- **Dual Mode Support** - Toggle between Web2 (traditional finance) and Web3 (crypto) modes
- **Dynamic UI** - Interface adapts based on selected mode
- **Persistent State** - Mode preference saved to localStorage
- **Smooth Transitions** - Animated mode switching with Framer Motion

### 🎨 Design & UI
- **Dark Mode Support** - Toggle between light and dark themes with smooth transitions
- **Framer Motion Animations** - Professional animations throughout the app
- **Glassmorphism Design** - Modern, semi-transparent card designs with backdrop blur
- **Responsive Layout** - Works perfectly on desktop, tablet, and mobile devices
- **Custom Branding** - Korgon logo with gradient design
- **Interactive Elements** - Hover effects, scale animations, and smooth transitions
- **Loading States** - Skeleton loaders and spinner animations

### 📊 Core Features

1. **Dashboard** (/)
   
   **Web2 Mode:**
   - Available balance card with growth indicators
   - Cash flow metrics (Saved/Given)
   - Quick stats (Total Earned, Saved, Given)
   - Yearly earnings goal tracker
   - Monthly breakdown charts
   - Recent projects table
   
   **Web3 Mode:**
   - Total portfolio value with wallet address
   - Network activity metrics (Staked/Transferred)
   - Crypto-focused stats (Total Assets, Staked, Transferred)
   - Portfolio growth goal tracker
   - Transaction history with wallet addresses
   - Address naming and editing

2. **Cards/Wallets** (/cards)
   
   **Web2 Mode:**
   - Credit/debit card management
   - Balance and limit tracking
   - Card type indicators
   - Beautiful gradient card designs
   
   **Web3 Mode:**
   - Wallet address management
   - Multi-network support (Ethereum, Polygon, BSC, Arbitrum, Optimism)
   - Balance tracking per wallet
   - Address naming (e.g., "My Main Wallet")
   - Copy address functionality
   - Edit and delete wallets
   - Network indicators

3. **Transactions** (/transactions)
   
   **Web2 Mode:**
   - Project-based transactions
   - Income tracking
   - Category management
   
   **Web3 Mode:**
   - Wallet address integration
   - "Sent $200 to [address]" format
   - Named addresses (e.g., "My Second Wallet")
   - Editable wallet names
   - Transaction type indicators

4. **Data Export & Sync**
   - **CSV Export** - Download all transaction data
   - **Google Sheets Sync** - Sync data to Google Sheets
   - **Formatted Export** - Clean, organized data format
   - **One-Click Actions** - Easy export and sync buttons

5. **Additional Pages**
   - **Accounts** - Account overview and management
   - **Payees** - Payee management with transaction history
   - **Spend Groups** - Budget group management
   - **Integrations** - Third-party service connections
   - **Invoices** - Invoice creation and tracking

### 🎯 Key Features
- **LocalStorage Persistence** - All data saved locally
- **Framer Motion** - Smooth, professional animations
- **Web2/Web3 Toggle** - Seamless mode switching
- **Wallet Management** - Full wallet address CRUD operations
- **Address Naming** - Custom names for wallet addresses
- **Multi-Network Support** - Support for major blockchain networks
- **Responsive Design** - Mobile-first approach
- **Theme Support** - Light and dark modes
- **Search Functionality** - Quick search in sidebar

## 🚀 Getting Started

### Installation

```bash
cd finance-dashboard
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Build

```bash
npm run build
npm start
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16.2.1 (App Router)
- **React**: 19.2.4
- **TypeScript**: 5.x
- **Styling**: Tailwind CSS 3.x
- **Animations**: Framer Motion 12.x
- **Charts**: Recharts 3.8.1
- **Icons**: Lucide React 1.7.0

## 📱 Responsive Design

The dashboard is fully responsive and works seamlessly across:
- Desktop (1920px+)
- Laptop (1024px - 1919px)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🎨 Theme Support

Toggle between light and dark modes using the theme switcher in the sidebar. Theme preference is saved to localStorage.

## 📦 Project Structure

```
finance-dashboard/
├── app/
│   ├── components/
│   │   ├── DashboardLayout.tsx
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── ThemeProvider.tsx
│   ├── context/
│   │   └── Web3Context.tsx
│   ├── utils/
│   │   └── exportUtils.ts
│   ├── accounts/
│   ├── cards/
│   ├── transactions/
│   ├── payees/
│   ├── spend-groups/
│   ├── integrations/
│   ├── invoices/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/
│   ├── favicon.svg
│   └── logo.png
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 🎭 Animations

The dashboard features extensive Framer Motion animations:

### Entry Animations
- Fade in with opacity transitions
- Slide in from various directions
- Scale animations
- Staggered list animations

### Interaction Animations
- Hover scale effects
- Button press animations
- Modal transitions
- Page transitions

### Loading States
- Spinner animations
- Progress bar animations
- Shimmer effects

## 🌐 Web2 vs Web3 Mode

### Web2 Mode Features
- Traditional banking interface
- Credit/debit cards
- Project-based transactions
- Standard financial metrics
- Blue color scheme

### Web3 Mode Features
- Crypto-focused interface
- Wallet addresses
- Multi-network support
- Blockchain transactions
- Purple/blue gradient color scheme
- Address naming and management
- Copy address functionality

## 💾 Data Persistence

All data is stored in browser localStorage:
- `finance_data` - Transaction records (with wallet addresses)
- `wallet_addresses` - Wallet address list
- `finance_goal` - Yearly/portfolio goal
- `theme` - Light/dark mode preference
- `app_mode` - Web2/Web3 mode preference

## 🚀 Deployment to Vercel

### Quick Deploy

1. **Via Vercel Dashboard** (Recommended):
   ```bash
   # Push to GitHub
   git init
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   
   # Then go to vercel.com and import your repo
   ```

2. **Via Vercel CLI**:
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

See `DEPLOYMENT.md` for detailed deployment instructions.

## 🔮 Future Enhancements

- Web3 wallet connection (MetaMask, WalletConnect)
- Real blockchain integration
- NFT portfolio tracking
- DeFi protocol integration
- Gas fee tracking
- Token swap functionality
- Multi-chain support expansion
- Real-time price feeds
- Transaction history from blockchain
- Smart contract interactions

---

Built with ❤️ using Next.js, Tailwind CSS, and Framer Motion
