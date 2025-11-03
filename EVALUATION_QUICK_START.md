# DreamTrue Evaluation - Quick Start Guide

**Use this document for**: Fast evaluation checklist  
**For full framework**: See `DREAMTRUE_EVALUATION_FRAMEWORK.md`

---

## Pre-Launch Critical Checklist

This is the **must-have** checklist before going live. Every item must be ✅.

### 🔴 BLOCKERS (Cannot launch without these)

#### Core Functionality
- [ ] User can register/login via Replit Auth
- [ ] User can enter dream text (10-3500 chars)
- [ ] User receives Quick Insight interpretation
- [ ] Premium users get Deep Dive analysis
- [ ] Dreams auto-save (within limits)
- [ ] Dream journal displays saved dreams

#### Freemium Model
- [ ] Free users limited to 3 dreams
- [ ] 4th dream interpreted but not saved
- [ ] Premium users have unlimited saves
- [ ] Stripe checkout works
- [ ] Subscription status updates in DB
- [ ] Premium features properly gated

#### RAG System
- [ ] 4 research papers configured (real peer-reviewed)
- [ ] No fabricated citations
- [ ] ChromaDB deployment documented
- [ ] Graceful degradation works (empty citations if no DB)
- [ ] Ingestion script ready

#### Security
- [ ] No secrets in client code
- [ ] Session management secure
- [ ] SQL injection prevented (Drizzle ORM)
- [ ] Premium checks on backend
- [ ] Input validation on all forms

#### Critical UX
- [ ] Mobile responsive (320px min width)
- [ ] No console errors on critical paths
- [ ] Loading states on async operations
- [ ] Error messages user-friendly
- [ ] Works on iOS Safari and Chrome mobile

---

## 5-Minute Smoke Test

Run this quick test before any deployment:

### Test 1: New User Flow (2 min)
1. Open incognito window
2. Visit app → Click login → Complete auth
3. Enter dream text (100 chars)
4. Click "Quick Insight"
5. ✅ Interpretation appears in < 10 seconds
6. ✅ Dream saved to journal
7. ✅ Can navigate to Dreams page and see it

### Test 2: Free Tier Limit (1.5 min)
1. As free user, save 3 dreams
2. Try to save 4th dream
3. ✅ Interpretation works
4. ✅ Dream NOT saved
5. ✅ Toast says "Dream Interpreted! (Not Saved)"
6. ✅ Upgrade CTA shown

### Test 3: Premium Gate (1 min)
1. As free user, try to select "Deep Dive"
2. ✅ Blocked with upgrade prompt
3. Log in as premium user
4. ✅ Deep Dive accessible
5. ✅ Pattern tracking accessible

### Test 4: Mobile Check (30 sec)
1. Open on phone (or DevTools mobile)
2. ✅ Layout not broken
3. ✅ Voice button visible
4. ✅ Bottom nav works

---

## RAG Verification Checklist

**Before claiming "research-backed"**:

### Research Paper Verification
- [ ] **Schredl (2010)**: PDF opens, is peer-reviewed journal article
- [ ] **Hall & Van de Castle (1967)**: PDF opens, is legitimate review
- [ ] **Holzinger et al. (2020)**: DOI 10.3389/fpsyg.2020.585702 works
- [ ] **Flores Mosri (2021)**: DOI 10.3389/fpsyg.2021.718372 works
- [ ] All DOIs link to real journal articles
- [ ] No AI-generated papers in the set

### RAG Pipeline Check
- [ ] Vector store connects to ChromaDB (or degrades gracefully)
- [ ] Document processor handles PDFs
- [ ] Ingestion script runs without errors
- [ ] Search returns relevant results
- [ ] Citations appear in interpretations
- [ ] Citation format is APA-style
- [ ] Relevance scores between 0-1

### Post-Deployment RAG Test
```bash
# After deploying ChromaDB:
npx tsx server/scripts/ingest-research.ts

# Expected output:
# ✓ Schredl (2010): Added ~180 chunks
# ✓ Hall & Van de Castle (1967): Added ~48 chunks
# ✓ Holzinger et al. (2020): Added ~246 chunks
# ✓ Flores Mosri (2021): Added ~358 chunks
# Total: ~832 chunks
```

Then test interpretation:
- [ ] Citations array not empty
- [ ] At least 2-3 citations per interpretation
- [ ] Citation text contains author + year
- [ ] Excerpt is relevant to dream

---

## Performance Benchmarks

### Target Metrics
| Metric | Free Tier (Quick) | Premium (Deep) |
|--------|-------------------|----------------|
| Interpretation Time | < 5 seconds | < 10 seconds |
| Page Load Time | < 2 seconds | < 2 seconds |
| Dream Save | < 500ms | < 500ms |
| Mobile Lighthouse | > 90 | > 90 |

### Quick Performance Test
```bash
# Test API response time
time curl -X POST http://localhost:5000/api/interpret \
  -H "Content-Type: application/json" \
  -d '{"dreamText":"Flying over water","analysisType":"quick_insight"}'

# Should complete in < 6 seconds total
```

---

## Security Quick Audit

### Secrets Check
```bash
# These should NEVER appear in client code:
grep -r "ANTHROPIC_API_KEY" client/  # Should find nothing
grep -r "STRIPE_SECRET_KEY" client/  # Should find nothing
grep -r "SESSION_SECRET" client/     # Should find nothing

# These are OK in client (VITE_ prefixed):
grep -r "VITE_STRIPE_PUBLIC_KEY" client/  # OK to find
```

### SQL Injection Check
- [ ] All queries use Drizzle ORM (parameterized automatically)
- [ ] No raw SQL with `${userInput}`
- [ ] Zod validation before database operations

### XSS Check
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] React auto-escapes all JSX variables
- [ ] User input not in `<script>` tags

---

## Common Issues & Quick Fixes

### Issue: "Unauthorized" on API calls
**Fix**: Check if user is logged in, session cookie present

### Issue: Dream not saving
**Fix**: Check dream count, verify isPremium flag, check backend logs

### Issue: No citations in interpretation
**Fix**: ChromaDB not running → graceful degradation (expected until deployed)

### Issue: Stripe checkout fails
**Fix**: Verify STRIPE_PRICE_ID env var set

### Issue: Character counter stuck
**Fix**: Check React state updating, verify onChange handler

### Issue: Voice input not working
**Fix**: Requires HTTPS or localhost, check microphone permissions

---

## Launch Readiness Score

### Quick Self-Assessment

**Count your YES answers**:

#### Functionality (10 points)
- [ ] All core features work (dream input, interpret, journal)
- [ ] Voice input functional on mobile
- [ ] Freemium limits enforced
- [ ] Premium upgrade flow complete
- [ ] Stripe payment works
- [ ] Pattern tracking works (premium)
- [ ] User auth secure
- [ ] Mobile responsive
- [ ] No critical bugs
- [ ] Error handling graceful

#### RAG System (8 points)
- [ ] 4 real research papers verified
- [ ] Zero fabricated citations
- [ ] Ingestion script tested
- [ ] ChromaDB deployment plan
- [ ] Graceful degradation confirmed
- [ ] Citation formatting correct
- [ ] RAG pipeline documented
- [ ] Brand promise verified

#### Quality (7 points)
- [ ] Performance targets met
- [ ] Security audit passed
- [ ] Accessibility basics (keyboard nav, contrast)
- [ ] Documentation complete
- [ ] Testing done (manual + E2E)
- [ ] Deployment process documented
- [ ] Monitoring/logging set up

**Score Interpretation**:
- **23-25/25**: 🚀 Launch ready! Go live.
- **20-22/25**: ✅ Near ready. Fix 2-3 items then launch.
- **15-19/25**: ⚠️ Functional but needs polish. 1-2 weeks work.
- **<15/25**: ❌ Not ready. Address critical gaps first.

---

## Pre-Publish Checklist

Right before clicking "Publish" on Replit:

- [ ] Restart workflow: `npm run dev` runs without errors
- [ ] Visit homepage: No console errors
- [ ] Test login: Auth works
- [ ] Test dream interpretation: Quick Insight works
- [ ] Check mobile: Layout looks good
- [ ] Verify secrets: All env vars set
- [ ] Database: Connection works
- [ ] Review replit.md: Up to date
- [ ] Check logs: No critical errors
- [ ] Final smoke test: New user flow works end-to-end

✅ **Ready to publish!**

---

## Post-Launch Monitoring

### First 24 Hours
- [ ] Monitor server logs for errors
- [ ] Check Stripe dashboard for subscriptions
- [ ] Test on real devices (iOS, Android)
- [ ] Monitor API response times
- [ ] Check database growth
- [ ] User feedback collection ready

### First Week
- [ ] Deploy ChromaDB server
- [ ] Run research ingestion
- [ ] Verify citations appearing
- [ ] Monitor citation relevance scores
- [ ] A/B test free → premium conversion
- [ ] Performance optimization based on real usage

---

## Emergency Rollback

If critical issues found post-launch:

1. Use Replit rollback feature (checkpoints)
2. Check logs to identify issue
3. Fix in development environment
4. Re-test thoroughly
5. Re-publish with fix

**Document all issues in**: `POST_LAUNCH_ISSUES.md`

---

## Contact for Evaluation Help

**Framework Author**: DreamTrue Team  
**Last Updated**: November 3, 2025  
**Framework Version**: 1.0

**Full Evaluation**: See `DREAMTRUE_EVALUATION_FRAMEWORK.md` (624 points)

---

**Quick Tip**: If you score ≥20/25 on the self-assessment above, you're ready to launch! The rest is optimization.

🚀 **Good luck with your launch!**
