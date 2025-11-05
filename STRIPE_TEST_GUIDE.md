# 🧪 Stripe Payment Testing Guide

## Quick Test Instructions

### 1. Navigate to Subscribe Page
- Log in to DreamTrue (tfel4139@gmail.com)
- Click "Upgrade to Premium" or visit `/subscribe`

### 2. Use Stripe Test Card
**Card Number**: `4242 4242 4242 4242`  
**Expiry**: Any future date (e.g., 12/34)  
**CVC**: Any 3 digits (e.g., 123)  
**ZIP**: Any 5 digits (e.g., 12345)

### 3. Expected Flow
1. ✅ Payment form loads with Stripe Elements
2. ✅ Enter test card details
3. ✅ Click "Subscribe" button
4. ✅ Processing spinner appears
5. ✅ Redirect to success page
6. ✅ Toast: "Welcome to Premium!"
7. ✅ Premium features now unlocked:
   - Deep Dive analysis available
   - Unlimited dream storage
   - Pattern tracking enabled

### 4. Verify Premium Status
- Go to Home page
- Check for "Deep Dive Analysis" option
- Try interpreting a dream with Deep Dive mode
- Verify dream is saved (no 3-dream limit)

---

## Test Scenarios

### ✅ Success Path (Happy Path)
- Card: `4242 4242 4242 4242`
- Expected: Payment succeeds, user upgraded to premium

### ❌ Declined Card
- Card: `4000 0000 0000 0002`
- Expected: Error message "Your card was declined"

### ⏳ Requires Authentication
- Card: `4000 0027 6000 3184`
- Expected: 3D Secure authentication popup

### 🔄 Processing Delay
- Card: `4000 0000 0000 0077`  
- Expected: "Payment processing" message

---

## Stripe Dashboard Verification

### Check Payment in Dashboard
1. Go to: https://dashboard.stripe.com/test/payments
2. Verify test payment appears
3. Check amount: $9.95 USD
4. Status: "Succeeded"

### Check Subscription
1. Go to: https://dashboard.stripe.com/test/subscriptions
2. Find customer (tfel4139@gmail.com)
3. Verify subscription is active
4. Check interval: Monthly

---

## Troubleshooting

### Payment Form Doesn't Load
- Check: VITE_STRIPE_PUBLIC_KEY is set
- Check: Browser console for errors
- Verify: Server is running

### "Stripe not configured" Error
- Check: STRIPE_PRICE_ID is set in environment
- Check: STRIPE_SECRET_KEY is set
- Restart server

### Payment Succeeds But Premium Not Activated
- Check Stripe webhook is configured
- Verify: User's `isPremium` field in database
- Check server logs for webhook errors

---

## More Test Cards

All Stripe test cards: https://stripe.com/docs/testing

**Common Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Insufficient funds: `4000 0000 0000 9995`
- Invalid CVC: `4000 0000 0000 0127` (use wrong CVC)
- Expired card: `4000 0000 0000 0069`

---

## Production Checklist (Before Launch)

When ready for real payments:
1. ⬜ Switch from test API keys to live API keys
2. ⬜ Update VITE_STRIPE_PUBLIC_KEY (pk_live_...)
3. ⬜ Update STRIPE_SECRET_KEY (sk_live_...)
4. ⬜ Configure Stripe webhook endpoint in production
5. ⬜ Test with real credit card (small amount)
6. ⬜ Set up email receipts in Stripe Dashboard
7. ⬜ Enable automatic tax collection (if needed)
8. ⬜ Review pricing ($9.95/month, $79.95/year)
9. ⬜ Test cancellation flow
10. ⬜ Set up refund policy

---

## Support

**Stripe Documentation**: https://stripe.com/docs  
**Test Mode**: Always use test cards in development  
**Dashboard**: https://dashboard.stripe.com/test

**DreamTrue Pricing:**
- Monthly: $9.95/month  
- Yearly: $79.95/year (save 33%)

Good luck! 🚀
