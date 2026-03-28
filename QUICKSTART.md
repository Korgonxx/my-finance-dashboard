# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
cd finance-dashboard
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Open in Browser
Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 First Steps

### Add Your First Transaction
1. Click the "Add Entry" button
2. Fill in the project details
3. Enter earned, saved, and given amounts
4. Select a category (Family, Charity, or Gift)
5. Click "Save Transaction"

### Export Your Data
1. Add some transactions
2. Click "Export CSV" to download your data
3. Click "Sync to Sheets" to sync with Google Sheets

### Toggle Dark Mode
- Click the Moon/Sun icon in the sidebar
- Theme preference is saved automatically

### Navigate Pages
Use the sidebar to explore:
- **Dashboard** - Overview and charts
- **Accounts** - Manage bank accounts
- **Cards** - View credit/debit cards
- **Transactions** - Track income/expenses
- **Payees** - Manage payees
- **Spend Groups** - Budget groups
- **Integrations** - Connect services
- **Invoices** - Manage invoices

## 📱 Features to Try

### Dashboard
- ✅ View balance and cash flow
- ✅ Set yearly earnings goal
- ✅ View monthly breakdown chart
- ✅ Track cumulative growth
- ✅ Edit/delete transactions

### Export & Sync
- ✅ Export data as CSV
- ✅ Sync to Google Sheets
- ✅ Download formatted reports

### Customization
- ✅ Toggle dark/light mode
- ✅ Adjust yearly goal
- ✅ Organize by categories
- ✅ Filter transactions

## 🛠️ Build for Production

```bash
npm run build
npm start
```

## 🚢 Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

Or push to GitHub and import in Vercel dashboard.

## 💡 Tips

1. **Data Persistence**: All data is saved in browser localStorage
2. **Responsive Design**: Works on mobile, tablet, and desktop
3. **Keyboard Shortcuts**: Use Tab to navigate forms quickly
4. **Dark Mode**: Automatically saves your preference
5. **Export Regularly**: Download CSV backups of your data

## 🆘 Need Help?

- Check `README.md` for full documentation
- See `DEPLOYMENT.md` for deployment guide
- Review code comments for implementation details

## 🎨 Customization

### Change Logo
Replace `/public/logo.png` with your own image

### Modify Colors
Edit `tailwind.config.ts` to change color scheme

### Add Features
All components are in `/app/components/`
All pages are in `/app/[page-name]/`

---

Happy tracking! 💰✨
