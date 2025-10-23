# 🚀 DreamTrue Pre-Launch Guide

**Goal:** Get DreamTrue ready to launch within 1 week  
**Estimated Time:** 8-12 hours total  
**Status:** Ready to Execute

---

## ✅ Completed Tasks

- [x] **Terms of Service** created (`/public/terms-of-service.html`)
- [x] **Privacy Policy** created (`/public/privacy-policy.html`)
- [x] **Footer with legal links** added to Landing page
- [x] **Pricing corrected** to $9.95/month and $79.95/year

---

## 🔥 Critical Tasks (Do These First)

### Task 2: Domain Registration (30 minutes)

**Option 1: DreamTrue.app (Recommended)**
1. Go to https://www.namecheap.com or https://domains.google.com
2. Search for "dreamtrue.app"
3. Purchase domain ($12/year approximately)
4. Configure DNS:
   - Wait for your Replit production URL
   - Add CNAME record pointing to your `.replit.app` URL
   - Or use Replit custom domain feature

**Option 2: DreamTrue.com**
1. Check availability (may be taken or expensive)
2. If available, purchase
3. Configure DNS same as above

**For Now (Launch This Week):**
- You can launch on the free `.replit.app` domain
- Purchase custom domain within 30 days
- Update branding once domain is live

---

### Task 3: Stripe Production Setup (15 minutes)

**Current Status:** Stripe is in TEST mode

**Steps to Move to Production:**

1. **Log into Stripe Dashboard**
   - Go to https://dashboard.stripe.com
   - Switch from "Test mode" to "Production mode" (toggle in top right)

2. **Get Production API Keys**
   - Go to Developers → API Keys
   - Copy **Secret key** (starts with `sk_live_...`)
   - Copy **Publishable key** (starts with `pk_live_...`)

3. **Update Replit Secrets**
   - In Replit, go to Tools → Secrets
   - Update `STRIPE_SECRET_KEY` = `sk_live_...` (your production secret)
   - Update `VITE_STRIPE_PUBLIC_KEY` = `pk_live_...` (your production publishable)

4. **Verify Keys Are Set**
   - Click the lock icon in Replit to verify secrets exist
   - DO NOT share these keys with anyone

---

### Task 4: Create Stripe Product & Price IDs (20 minutes)

**You need to create 2 subscription products in Stripe:**

1. **Log into Stripe Dashboard (Production Mode)**
   - Make sure toggle says "Production" not "Test"

2. **Create Monthly Subscription**
   - Go to Products → Add Product
   - **Name:** "DreamTrue Premium - Monthly"
   - **Description:** "Unlimited Deep Dive dream analysis, unlimited storage, pattern tracking"
   - **Pricing:**
     - Type: Recurring
     - Price: $9.95
     - Billing period: Monthly
     - Currency: USD
   - Click "Save product"
   - **Copy the Price ID** (starts with `price_...`)

3. **Create Annual Subscription**
   - Go to Products → Add Product
   - **Name:** "DreamTrue Premium - Annual"
   - **Description:** "Unlimited Deep Dive dream analysis, unlimited storage, pattern tracking (Save 33%!)"
   - **Pricing:**
     - Type: Recurring
     - Price: $79.95
     - Billing period: Yearly
     - Currency: USD
   - Click "Save product"
   - **Copy the Price ID** (starts with `price_...`)

4. **Update Replit Secrets**
   - In Replit, go to Tools → Secrets
   - **Option A (Single monthly price):**
     - Set `STRIPE_PRICE_ID` = monthly price ID (for now)
   
   - **Option B (Both monthly + annual - RECOMMENDED):**
     - Set `STRIPE_MONTHLY_PRICE_ID` = monthly price ID
     - Set `STRIPE_ANNUAL_PRICE_ID` = annual price ID
     - You'll need to update Subscribe.tsx to use both (I can help with this)

**For Quick Launch:** Just set `STRIPE_PRICE_ID` to the monthly price ID for now. You can add annual later.

---

### Task 5: Stripe Webhook Configuration (15 minutes)

**Webhooks ensure Stripe tells your app when subscriptions are created/canceled.**

1. **Get Your Production URL First**
   - In Replit, click "Deploy" or view your app
   - Your URL will be something like: `https://your-repl-name.your-username.repl.co`
   - Or if published: `https://your-app-name.replit.app`
   - **Note this URL**

2. **Create Webhook in Stripe**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Click "+ Add endpoint"
   - **Endpoint URL:** `https://YOUR-REPLIT-URL.com/api/webhook`
   - **Description:** "DreamTrue Subscription Events"
   - **Events to send:**
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `checkout.session.completed`
   - Click "Add endpoint"

3. **Get Webhook Signing Secret**
   - After creating webhook, click on it
   - Click "Reveal" next to "Signing secret"
   - Copy the secret (starts with `whsec_...`)

4. **Update Replit Secrets**
   - In Replit, go to Tools → Secrets
   - Set `STRIPE_WEBHOOK_SECRET` = `whsec_...` (the signing secret)

**Important:** Your webhook URL won't work until the app is deployed and accessible publicly.

---

### Task 6: End-to-End Payment Testing (30 minutes)

**CRITICAL: Test the complete flow before launch**

**Test Flow:**
1. Sign up as a new user (use incognito browser)
2. Enter a dream and get Quick Insight (free tier)
3. Try to enter a 4th dream → should prompt to upgrade
4. Click "Upgrade to Premium"
5. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/26)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
6. Complete payment
7. Verify you now have premium access
8. Try Deep Dive interpretation
9. Check Stripe Dashboard → you should see test payment

**If this works in test mode → Switch to production and test with real card:**
- Use your own credit card
- Immediately cancel the subscription in Stripe Customer Portal
- Verify you get refunded

**Common Issues:**
- "Invalid price ID" → Check `STRIPE_PRICE_ID` secret is set correctly
- "Webhook failed" → Check `STRIPE_WEBHOOK_SECRET` is set
- "Not premium after paying" → Check webhook events are being received

---

## 📝 Important (But Can Do After Launch)

### Task 7: Free Tier Limit Testing (15 minutes)

**What to test:**
1. Sign up as free user
2. Save 3 dreams → all should work
3. Try to save 4th dream → should still analyze but NOT save
4. Verify you see "Dream Interpreted! (Not Saved)" toast
5. Verify "Upgrade" messaging appears

**Check in code:**
- `server/routes.ts` line ~250-300 (dream save logic with 3-dream limit)
- `client/src/pages/Home.tsx` (toast messages)

---

### Task 8: AI Interpretation Testing (20 minutes)

**Test different dream lengths:**

1. **Short dream (10 chars):** "I was sad"
   - Should work
   - Quick Insight only

2. **Medium dream (1000 chars):** Realistic dream description
   - Should work smoothly
   - Both Quick + Deep Dive (if premium)

3. **Long dream (3400 chars):** Very detailed dream
   - Should NOT truncate JSON
   - Should complete successfully
   - Verify response has all fields (interpretation, symbols, emotions, themes)

**If JSON truncates → Bug! Let me know.**

---

### Task 9: Mobile Responsiveness Check (15 minutes)

**Test on:**
1. iOS Safari (iPhone)
2. Android Chrome
3. PWA install (Add to Home Screen)
4. Voice input on mobile

**Use Chrome DevTools:**
- Press F12 → Toggle device toolbar
- Test iPhone 14 Pro, Samsung Galaxy S21
- Verify all buttons are tappable
- Verify text is readable

---

### Task 10: Analytics Setup (30 minutes)

**Option 1: Plausible (Privacy-Friendly, Recommended)**
1. Sign up at https://plausible.io (free 30-day trial, then $9/month)
2. Add your domain
3. Get tracking script
4. Add to `client/index.html` before `</head>`:
```html
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

**Option 2: Google Analytics (Free)**
1. Create GA4 property at https://analytics.google.com
2. Get Measurement ID (G-XXXXXXXXXX)
3. Add to `client/index.html`:
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

**Track conversions:**
- Free signup
- Premium upgrade
- Dream analyzed

---

### Task 11: Error Monitoring (30 minutes)

**Option 1: Sentry (Recommended)**
1. Sign up at https://sentry.io (free tier: 5k events/month)
2. Create project: "DreamTrue"
3. Select "React" platform
4. Follow setup instructions
5. Add Sentry to `client/src/main.tsx`

**Option 2: Skip for now**
- Monitor console errors manually
- Add later when you have traffic

---

## 🎨 Marketing Assets (Critical for Launch)

### Task 12: Screenshots (1 hour)

**You need 5 high-quality screenshots:**

1. **Homepage/Landing Page**
   - Full screen capture
   - Show "Understand Your Dreams" hero
   - Mobile + desktop versions

2. **Dream Input with Voice**
   - Show microphone button active
   - Dream text input visible
   - Character counter visible

3. **Quick vs Deep Dive Comparison**
   - Side-by-side showing difference in output quality
   - Highlight research citations in Deep Dive
   - Show premium badge

4. **Dream Journal**
   - List of saved dreams
   - Search functionality
   - Pattern indicators

5. **Pattern Analytics** (if implemented)
   - Charts showing recurring symbols
   - Timeline view
   - Insights

**Tools:**
- Mac: Cmd+Shift+4
- Windows: Snipping Tool or Win+Shift+S
- Browser: DevTools → Take screenshot
- Clean up: Remove test data, use realistic dream examples

---

### Task 13: Demo Video (1-2 hours)

**30-second demo showing:**
1. Landing page (3 seconds)
2. Sign up (3 seconds)
3. Voice input of dream (5 seconds)
4. Quick Insight result (5 seconds)
5. Upgrade prompt (3 seconds)
6. Deep Dive result (8 seconds)
7. Dream journal (3 seconds)

**Tools:**
- Loom (free): https://www.loom.com
- Screen recording: QuickTime (Mac), OBS (Windows/Mac)
- Edit: iMovie, Kapwing, Descript

**OR hire someone:**
- Fiverr: $20-50 for 30-second demo video
- Search: "app demo video"

---

## 🚢 Launch Preparation

### Task 14: Product Hunt Preparation (30 minutes)

**Create Product Hunt Account:**
1. Go to https://www.producthunt.com
2. Sign up / Log in
3. Build profile (add Twitter, bio)
4. Engage with 5-10 products (upvote, comment) to build karma

**Prepare Launch Post:**
- **Name:** DreamTrue - AI Dream Interpreter
- **Tagline:** Real insights. Rooted in research, not myths.
- **Description:**
  ```
  DreamTrue interprets your dreams using AI grounded in psychology research, not mystical superstition.
  
  🧠 Research-Backed Analysis
  Unlike dream dictionaries, we cite peer-reviewed psychology research.
  
  🎤 Voice-First Capture
  No typing at 3am. Just speak your dream.
  
  ⚡ Two Analysis Modes
  • Quick Insight (free): Instant reassurance in 10 seconds
  • Deep Dive (premium $9.95/mo): Comprehensive psychological analysis
  
  🔒 Private & Secure
  Your dreams are intimate. We never sell your data.
  
  Perfect for: Self-discovery, therapy supplement, understanding recurring nightmares
  
  First 100 users get 50% off annual plan ($39.97 instead of $79.95)!
  ```

- **First Comment (Maker Introduction):**
  ```
  Hey Product Hunt! 👋
  
  I built DreamTrue because I was frustrated with mystical dream dictionaries that rely on superstition instead of science.
  
  As someone who struggled with recurring anxiety dreams, I wanted an AI tool that could provide REAL psychological insights backed by research.
  
  What makes DreamTrue different:
  ✅ Every interpretation cites psychology research
  ✅ Voice-first design (optimized for 3am use)
  ✅ Freemium model (3 free dreams to build habit)
  ✅ No mystical BS, just science
  
  I'd love your feedback! Ask me anything about dream interpretation, AI, or building this solo.
  
  Happy to offer PH community a special discount code: DREAMERS50 for 50% off first year.
  ```

**When to launch:**
- **Best day:** Tuesday (most engagement)
- **Best time:** 12:01am PT (midnight Pacific Time)
- **Why:** Gives you full 24 hours, catches early risers globally

**Launch checklist:**
- [ ] Screenshots uploaded (5 images)
- [ ] Video uploaded (30 seconds)
- [ ] Description written
- [ ] First comment prepared
- [ ] Promo code created in Stripe
- [ ] Friends/family ready to upvote at 12:01am

---

### Task 15: Social Media Setup (1 hour)

**Twitter/X (@dreamtrue or @dreamtrue_app):**
1. Create account
2. Profile pic: DreamTrue logo (Moon icon or custom)
3. Banner: Screenshot of app
4. Bio: "AI dream interpretation rooted in research, not myths. $9.95/month for unlimited insights."
5. Pin tweet: Launch announcement
6. Pre-schedule 10 tweets:
   - Dream facts
   - Psychology research snippets
   - "Did you know?" content
   - Launch countdown

**Instagram (@dreamtrue_app):**
1. Create business account
2. Profile pic: Same as Twitter
3. Bio: "Understand your dreams through AI + psychology research 🧠✨"
4. Link: DreamTrue.app
5. Create 5-10 posts:
   - Carousel: "Dream Myths vs Science"
   - Reel: "How DreamTrue Works"
   - Story: Behind-the-scenes building the app

**Reddit:**
- Join r/Dreams, r/Psychology, r/SideProject
- Build karma (comment genuinely on 10+ posts)
- Prepare launch post for r/SideProject

---

### Task 16: Email Marketing Setup (30 minutes)

**ConvertKit (Recommended) or Mailchimp:**

1. **Sign up:**
   - ConvertKit: https://convertkit.com (free up to 1,000 subscribers)
   - Mailchimp: https://mailchimp.com (free up to 500 subscribers)

2. **Create Welcome Email:**
   - Subject: "Welcome to DreamTrue! Here's how to get started"
   - Content:
     ```
     Hi [Name],
     
     Thanks for joining DreamTrue! Here's how to make the most of it:
     
     1️⃣ Record Your Next Dream
     Use voice input for fastest capture at 3am
     
     2️⃣ Try Quick Insight (Free)
     Get instant reassurance about what your dream means
     
     3️⃣ Upgrade for Deep Dive
     Unlock comprehensive psychological analysis backed by research
     
     Your first 3 dreams are saved free. After that, upgrade to Premium for unlimited storage.
     
     Sweet dreams!
     - [Your Name], Creator of DreamTrue
     ```

3. **Create Trial Conversion Sequence:**
   - Day 1: Welcome email (above)
   - Day 3: "You have 2 free Deep Dives left"
   - Day 5: Comparison email (Quick vs Deep Dive)
   - Day 7: "Upgrade now - save 33% on annual"
   - Day 14: Win-back offer (50% off first month)

4. **Add Signup Form to Website:**
   - ConvertKit will give you embed code
   - Add to footer or landing page

---

### Task 17: Customer Support Setup (15 minutes)

**Create Support Email:**
1. Set up `support@dreamtrue.app` (if you have custom domain)
2. OR use Gmail with professional signature:
   ```
   Thanks,
   [Your Name]
   DreamTrue Support
   
   DreamTrue - Real insights. Rooted in research.
   https://dreamtrue.app
   ```

**Create FAQ Page:**
- Add to `/public/faq.html` or as React component
- Cover:
  - How does DreamTrue work?
  - Is my data private?
  - What's the difference between Quick and Deep Dive?
  - How do I cancel my subscription?
  - Can I export my dreams?
  - Do you offer refunds?

**Prepare Response Templates:**
1. Billing questions
2. Technical issues
3. Feature requests
4. Refund requests
5. "How does it work?"

---

### Task 18: SEO Foundation (2 hours)

**Write 3 Foundational Blog Posts:**

1. **"What Does Dreaming About Falling Mean? Psychology Research Explains"**
   - Target keyword: "dreaming about falling meaning"
   - 800-1,200 words
   - Include research citations
   - FAQ schema markup
   - CTA: "Analyze your dream with DreamTrue"

2. **"Teeth Falling Out in Dreams: Scientific Interpretation (Not Superstition)"**
   - Target keyword: "teeth falling out dream meaning"
   - Debunk mystical interpretations
   - Cite psychology studies
   - Include example interpretation from DreamTrue

3. **"Why Do We Have Dreams? Neuroscience and Psychology Explained"**
   - Educational content
   - Build authority
   - Link to other articles
   - Newsletter signup CTA

**SEO Checklist per Article:**
- [ ] Keyword in title
- [ ] Keyword in first 100 words
- [ ] H2/H3 headings with related keywords
- [ ] Meta description (155 chars)
- [ ] Alt text on images
- [ ] Internal links to other articles
- [ ] External links to research sources
- [ ] Schema markup (FAQ or Article)

**Submit to Google Search Console:**
1. Go to https://search.google.com/search-console
2. Add property (your domain)
3. Verify ownership
4. Submit sitemap (Replit should auto-generate)

---

## 🔥 Launch Day (Task 19)

### Launch Execution Checklist

**T-minus 24 hours:**
- [ ] All screenshots ready
- [ ] Demo video uploaded
- [ ] Product Hunt post scheduled for 12:01am PT Tuesday
- [ ] Email 5-10 friends to upvote at launch
- [ ] Prepare Hacker News "Show HN" post
- [ ] Schedule launch tweets

**Launch Morning (Tuesday 12:01am PT):**
1. **Product Hunt:** Post goes live
2. **Hacker News:** Submit "Show HN: DreamTrue - AI Dream Interpreter"
   - Title: "Show HN: I built an AI dream interpreter backed by psychology research"
   - URL: Your live app URL
   - Text: Short description + ask for feedback
3. **Reddit:** Post to r/SideProject
4. **Twitter:** Launch announcement thread
5. **Email:** Send to personal network

**During Launch Day:**
- [ ] Respond to EVERY comment on Product Hunt (within 1 hour)
- [ ] Respond to EVERY comment on Hacker News
- [ ] Monitor analytics (signups, conversions)
- [ ] Monitor errors (check Sentry or console)
- [ ] Tweet 3-4 updates throughout day
- [ ] Thank everyone who upvotes/comments

**Success Metrics:**
- Product Hunt: Top 10 product = Success
- Hacker News: Front page = Major win
- Signups: 100+ = Great, 500+ = Excellent, 1000+ = Amazing
- Conversions: 5+ paying users on Day 1 = Validation

---

## 🎯 Week 1 Post-Launch (Task 20)

**Days 2-7 after launch:**

1. **Continue Reddit Engagement:**
   - Post in r/Dreams (provide value first)
   - Post in r/Psychology (educational content)
   - Answer dream questions, soft-sell DreamTrue

2. **Email Follow-Up:**
   - Send thank-you email to early users
   - Ask for testimonials
   - Request Product Hunt review

3. **Content Publishing:**
   - Publish 2-3 more SEO articles
   - Share on social media
   - Post in relevant subreddits

4. **Analytics Review:**
   - What's working? Double down.
   - What's not? Iterate quickly.
   - Where are users dropping off?

5. **First User Interviews:**
   - Email 5-10 users
   - Ask: "Why did you sign up?"
   - Ask: "Would you recommend to a friend?"
   - Ask: "What would make you upgrade?"

---

## 📊 Success Criteria (Month 1)

**By Day 30, you should have:**
- [ ] 50-100 premium paying users (validation!)
- [ ] 1,000-3,000 free users
- [ ] 3%+ conversion rate (free → paid)
- [ ] <5% monthly churn
- [ ] 10+ positive testimonials
- [ ] $500-1,000 MRR

**If you hit these → Scale marketing (Phase 2)**
**If you don't → Iterate product/positioning before spending money**

---

## 🆘 Common Issues & Solutions

### "Stripe webhook not working"
- Check `STRIPE_WEBHOOK_SECRET` is set
- Verify webhook URL is correct (your deployed URL + `/api/webhook`)
- Test with Stripe CLI: `stripe listen --forward-to localhost:5000/api/webhook`

### "User not premium after paying"
- Check webhook events in Stripe Dashboard
- Verify `customer.subscription.created` was received
- Check database: `users` table → `isPremium` should be `true`

### "JSON truncation in interpretations"
- Reduce `max_tokens` if needed (currently 1600 for Quick Insight)
- Check dream length (max 3500 chars)
- Verify `interpretDream()` in `ai-interpreter.ts`

### "Can't deploy on Replit"
- Check all secrets are set
- Check for TypeScript errors: `npm run build`
- Check logs: refresh_all_logs tool

### "Domain not working"
- DNS propagation takes 24-48 hours
- Use free `.replit.app` domain initially
- Verify CNAME record points to Replit URL

---

## 🎓 Resources

### Learning Materials
- Stripe Docs: https://stripe.com/docs
- Product Hunt Guide: https://www.producthunt.com/ship
- SEO for Beginners: https://moz.com/beginners-guide-to-seo
- Freemium SaaS Models: https://www.profitwell.com/freemium

### Tools Used
- Stripe (payments): https://stripe.com
- Replit (hosting): https://replit.com
- ConvertKit (email): https://convertkit.com
- Plausible (analytics): https://plausible.io
- Loom (video): https://loom.com

### Community
- r/SaaS - https://reddit.com/r/saas
- r/Entrepreneur - https://reddit.com/r/entrepreneur
- Indie Hackers - https://indiehackers.com
- Product Hunt Ship - https://www.producthunt.com/ship

---

## ✅ Final Pre-Launch Checklist

**Before pressing "Launch":**
- [ ] Terms of Service accessible at `/terms-of-service.html`
- [ ] Privacy Policy accessible at `/privacy-policy.html`
- [ ] Stripe production mode enabled
- [ ] Production API keys set in Replit secrets
- [ ] Stripe product created (monthly $9.95)
- [ ] Webhook configured and tested
- [ ] End-to-end payment flow tested
- [ ] Free tier 3-dream limit tested
- [ ] AI interpretation tested (short, medium, long dreams)
- [ ] Mobile responsive (tested on iOS + Android)
- [ ] Analytics installed (Plausible or GA)
- [ ] Screenshots taken (5 images)
- [ ] Demo video created (30 seconds)
- [ ] Product Hunt post prepared
- [ ] Social media accounts created
- [ ] Email welcome sequence set up
- [ ] Support email configured
- [ ] 3 SEO blog posts published
- [ ] App deployed and accessible publicly
- [ ] No critical bugs in production

**If all checked → YOU'RE READY TO LAUNCH! 🚀**

---

**Questions? Issues? Stuck?**
Ask me and I'll help you troubleshoot or build the feature you need.

**Ready to tackle the next task?**
Let me know which one you want help with (I recommend Task 3: Stripe Production Setup next).
