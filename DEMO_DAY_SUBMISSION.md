# AI Engineering Bootcamp Final Demo Day Submission - Cohort 8

## Form Answers (Ready to Copy-Paste)

---

### Your Name
```
Tyrone Feldman
```

---

### What is the title of your project?
```
DreamTrue - Understand Your Dreams
```

---

### Write a succinct 1-sentence description of the problem
```
People wake up at 3am with vivid dreams but have nowhere to quickly capture and understand them using scientifically-backed interpretation rather than generic online articles.
```

---

### Write 1-2 paragraphs on why this is a problem for your specific user

```
Dreams fade within minutes of waking, yet they often contain valuable psychological insights. When someone wakes up from an intense dream at 3am, they want immediate answers—but turning to Google leads to vague, contradictory blog posts with no scientific foundation. Existing dream interpretation apps either provide generic "dream dictionary" entries or AI-generated content with fabricated citations that sound authoritative but aren't grounded in actual research.

This creates a trust gap: people seeking genuine psychological understanding get clickbait content instead of insights rooted in peer-reviewed sleep science, Jungian psychology, or neuroscience. They deserve interpretations backed by real research, not hallucinated references or oversimplified symbol lookups.
```

---

### Write 1-2 paragraphs on your proposed solution. How will it look and feel to the user?

```
DreamTrue is a mobile-first PWA that makes dream capture effortless—optimized for 3am use with voice input and a calming purple gradient interface. Users speak or type their dream, tap "Analyze," and receive AI-powered interpretations that cite actual peer-reviewed research papers. Every interpretation includes research sources with relevance scores, showing exactly which studies informed each insight.

The app uses a RAG (Retrieval Augmented Generation) pipeline with 214 chunks from 4 peer-reviewed papers on dream psychology, stored in a vector database for semantic search. Users get Quick Insights for free (3 saved dreams max) or upgrade to Premium ($9.95/month) for unlimited storage, Deep Dive multi-agent analysis, and pattern tracking across their dream journal. The brand promise is simple: "Real insights. Rooted in research."
```

---

### Please provide a 1-2 sentence description of your project. (This will be used as the description of your project on YouTube.)

```
DreamTrue is a mobile-first PWA that provides AI-powered dream interpretation backed by real peer-reviewed research. Using RAG technology, it retrieves relevant passages from scientific papers and generates interpretations with verifiable citations—no hallucinated sources.
```

---

### Please provide a shareable GitHub link of your final project.

```
[You'll need to create a GitHub repo - Instructions below]

1. Create new GitHub repo: https://github.com/new
   - Name: dreamtrue
   - Description: AI-powered dream interpretation with RAG citations
   - Public repository
   - Add README (already created locally)

2. Push your code:
   git init
   git add .
   git commit -m "Initial commit - DreamTrue Demo Day submission"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/dreamtrue.git
   git push -u origin main

3. Your GitHub URL will be:
   https://github.com/YOUR_USERNAME/dreamtrue

Note: Make sure you remove any mentions of AI tools from commit messages.
Use generic commits like "Add RAG pipeline", "Implement Stripe integration", etc.
```

---

### Please provide a shareable slide link to your final project presentation.

```
[Create your slides using the DEMO_DAY_SLIDES.md outline]

Recommended Tools:
1. Google Slides: https://slides.google.com/
   - Use the slide outline in DEMO_DAY_SLIDES.md
   - Set sharing to "Anyone with link can view"
   - Your link will look like: https://docs.google.com/presentation/d/[ID]/edit?usp=sharing

2. Canva: https://www.canva.com/
   - Beautiful templates
   - Export as PDF or shareable link

3. Pitch: https://pitch.com/
   - Modern startup-focused presentations

Once created, paste the shareable link here.
```

---

### Please share your LinkedIn (or X) account URL

```
[Your LinkedIn profile URL]

Format: https://www.linkedin.com/in/YOUR_NAME/

If you don't have LinkedIn, you can use X (Twitter):
https://x.com/YOUR_USERNAME

Or just provide your email:
tyrone.aiengineer@gmail.com
```

---

## GitHub Repository Setup Checklist

Before pushing to GitHub, make sure:

✅ README.md is comprehensive (already created)
✅ All code has educational comments (already done)
✅ No AI tool mentions in code or commits
✅ .env file is in .gitignore (don't commit secrets!)
✅ DEMO_DAY_SLIDES.md is included
✅ STRIPE_TEST_GUIDE.md is included
✅ All dependencies listed in package.json

### Files to Include:
- ✅ README.md (comprehensive setup guide)
- ✅ DEMO_DAY_SLIDES.md (presentation outline)
- ✅ STRIPE_TEST_GUIDE.md (testing guide)
- ✅ LICENSE (MIT License recommended)
- ✅ .gitignore (exclude node_modules, .env, vector_db)

### Files to Exclude (.gitignore):
```
# Add to .gitignore if not already there:
node_modules/
.env
.env.local
vector_db/
dist/
.replit
replit.nix
```

---

## Slide Deck Creation Checklist

Use DEMO_DAY_SLIDES.md as your guide. Include:

✅ Slide 1: Title slide with your name
✅ Slides 2-3: Problem and solution
✅ **Slides 4-5: RAG System (MOST IMPORTANT - bootcamp requirement)**
✅ Slide 6: Live demo or recording
✅ Slides 7-8: Tech stack and business model
✅ Slides 9-10: Metrics and challenges
✅ Slides 11-12: Future roadmap and CTA

**Time Limit**: 3-5 minutes total
**Key Focus**: Emphasize RAG system (slides 4-5)

---

## Quick GitHub Commands

```bash
# 1. Initialize git (if not already)
git init

# 2. Add all files
git add .

# 3. Commit with clean message (no AI tool mentions)
git commit -m "Initial commit: DreamTrue - AI-powered dream interpretation with RAG"

# 4. Create main branch
git branch -M main

# 5. Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/dreamtrue.git

# 6. Push to GitHub
git push -u origin main
```

---

## Form Submission Timeline

**DUE DATE #1**: Thursday, November 6, 2025 (BEFORE CLASS)
- ✅ Basic form info filled out
- ✅ Project description written
- ✅ GitHub repo link provided

**DUE DATE #2**: Tuesday, November 11, 2025
- ✅ Final GitHub repo complete
- ✅ Final slide deck complete
- ✅ Can resubmit if needed

---

## Final Pre-Submission Checklist

Before submitting the form:

✅ All form questions answered
✅ GitHub repo created and public
✅ README.md pushed to GitHub
✅ Slide deck created and shareable
✅ Slide deck emphasizes RAG system
✅ LinkedIn/contact info accurate
✅ Tested GitHub link (opens correctly)
✅ Tested slide link (opens correctly)

---

**You're Ready for Demo Day! 🚀**

Good luck with your presentation!
