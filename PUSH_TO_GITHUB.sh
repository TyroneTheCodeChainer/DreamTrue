#!/bin/bash

# Simple GitHub Push Script
# Run this in the Replit Shell

echo "🚀 Pushing DreamTrue to GitHub..."
echo ""

# Stage the important files
echo "📦 Staging files..."
git add LICENSE
git add README.md
git add setup-github.sh
git add .gitignore
git add DEMO_DAY_SLIDES.md
git add PRESENTATION_SCRIPT.md
git add DEMO_DAY_SUBMISSION.md
git add GITHUB_PUSH_INSTRUCTIONS.md

echo "✅ Files staged"
echo ""

# Show what will be committed
echo "📋 Files ready to commit:"
git status --short
echo ""

# Commit
echo "💾 Creating commit..."
git commit -m "Add AGPL-3.0 license and Demo Day documentation

- Add LICENSE file with GNU Affero GPL v3.0
- Update README with license and GitHub links
- Add comprehensive Demo Day documentation
- Improve .gitignore to exclude secrets
- Ready for AI Makerspace Bootcamp submission"

echo "✅ Commit created"
echo ""

# Configure remote
echo "🔗 Configuring GitHub remote..."
if git remote | grep -q "^origin$"; then
    echo "Remote 'origin' already exists, updating URL..."
    git remote set-url origin https://github.com/TyroneTheCodeChainer/DreamTrue.git
else
    echo "Adding remote 'origin'..."
    git remote add origin https://github.com/TyroneTheCodeChainer/DreamTrue.git
fi

echo "✅ Remote configured"
echo ""

# Push to GitHub
echo "⬆️  Pushing to GitHub..."
echo "If prompted for credentials, you may need a Personal Access Token"
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ SUCCESS! Code pushed to GitHub!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🔗 Your repo: https://github.com/TyroneTheCodeChainer/DreamTrue"
    echo ""
    echo "📝 Next steps:"
    echo "1. ✅ Verify repo is live on GitHub"
    echo "2. ✅ Create your slide deck (use DEMO_DAY_SLIDES.md)"
    echo "3. ✅ Submit Demo Day form (use DEMO_DAY_SUBMISSION.md)"
    echo ""
else
    echo ""
    echo "❌ Push failed. This might be because:"
    echo ""
    echo "1. The GitHub repo doesn't exist yet"
    echo "   → Create it at: https://github.com/new"
    echo "   → Name: DreamTrue"
    echo "   → Public, no README/license (we have those)"
    echo ""
    echo "2. You need authentication"
    echo "   → Create Personal Access Token:"
    echo "   → GitHub → Settings → Developer settings → Tokens"
    echo "   → Then run: git push https://YOUR_TOKEN@github.com/TyroneTheCodeChainer/DreamTrue.git main"
    echo ""
fi
