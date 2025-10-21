# Stripe Configuration Guide

## ⚠️ Required Setup Before Testing Subscriptions

Your app is ready, but you need to configure Stripe before users can subscribe to Premium.

---

## 🔧 Step 1: Create Product & Price in Stripe Dashboard

1. **Log in to Stripe Dashboard**: https://dashboard.stripe.com/test/products
2. **Create a Product**:
   - Click "+ Add product"
   - Name: "DreamTrue Premium"
   - Description: "Unlock Deep Dive analysis and unlimited dream storage. Real insights rooted in research."
   
3. **Add Pricing**:
   - Pricing model: "Standard pricing"
   - Price: **$9.99** (or your preferred price)
   - Billing period: **Recurring** → **Monthly**
   - Click "Save product"

4. **Copy the Price ID**:
   - After saving, you'll see a Price ID like `price_1AbC2dEfGhIjKlMn`
   - **Copy this ID** - you'll need it in the next step

---

## 🔐 Step 2: Update Price ID in Code

Open `server/routes.ts` and find line **203**:

```typescript
// BEFORE (line 203):
price: 'price_dreamlens_premium', // Placeholder

// AFTER (replace with your actual Price ID):
price: 'price_1AbC2dEfGhIjKlMn', // Your actual Stripe Price ID
```

**Or** (recommended) use an environment variable:

1. Add to your secrets:
   ```
   STRIPE_PRICE_ID=price_1AbC2dEfGhIjKlMn
   ```

2. Update line 203:
   ```typescript
   price: process.env.STRIPE_PRICE_ID!,
   ```

---

## 🪝 Step 3: Configure Stripe Webhooks

Webhooks are **critical for security** - they prevent users from getting premium access without paying.

1. **Get Your Replit App URL**:
   - Your app URL: `https://[your-replit-username]-[project-name].replit.app`
   - Example: `https://john-dreamlens.replit.app`

2. **Go to Stripe Webhooks**:
   - Visit: https://dashboard.stripe.com/test/webhooks
   - Click "+ Add endpoint"

3. **Configure Endpoint**:
   - Endpoint URL: `https://[your-app-url]/api/stripe/webhook`
   - Example: `https://john-dreamlens.replit.app/api/stripe/webhook`
   
4. **Select Events** (click "Select events" button):
   - ✅ `invoice.payment_succeeded` - Sets user as premium after payment
   - ✅ `invoice.payment_failed` - Handles failed payments
   - ✅ `customer.subscription.deleted` - Removes premium when subscription ends

5. **Save Endpoint** and you're done!

---

## ✅ Step 4: Test the Flow

1. **Sign Up**: Click "Get Started Free" on landing page
2. **Upgrade**: Go to Settings → "Upgrade to Premium"
3. **Test Payment**: Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

4. **Verify Premium Access**:
   - Settings should show "Premium Active"
   - Deep Dive option should be available on Home page
   - Dreams are now saved persistently

---

## 🔒 Security Notes

- ✅ **Premium access is ONLY granted after webhook confirms payment**
- ✅ No bypass vulnerabilities - users can't get premium without paying
- ✅ Webhooks handle: payment success, failure, and cancellation
- ✅ Re-subscription works correctly after cancellation

---

## 🐛 Troubleshooting

### Error: "No such price: 'price_dreamlens_premium'"
- **Cause**: Price ID not updated in code
- **Fix**: Replace `price_dreamlens_premium` on line 203 with your actual Stripe Price ID

### Premium access not granted after payment
- **Cause**: Webhooks not configured
- **Fix**: Add webhook endpoint with `invoice.payment_succeeded` event

### User gets premium immediately without paying
- **Cause**: Previous security bug (now fixed)
- **Fix**: Already fixed in latest code - premium only granted via webhook

---

## 📝 Summary Checklist

- [ ] Created product "DreamTrue Premium" in Stripe Dashboard
- [ ] Created monthly price ($9.99)
- [ ] Copied Price ID and updated `server/routes.ts` line 203
- [ ] Added webhook endpoint: `https://[your-app]/api/stripe/webhook`
- [ ] Selected events: `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`
- [ ] Tested with Stripe test card `4242 4242 4242 4242`

Once completed, your freemium subscription system is fully operational! 🚀
