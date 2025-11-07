#!/bin/bash

# Simple GitHub Push Script for DreamTrue
# Uses CODECHAINER_DREAMTRUE secret for authentication

echo "🚀 Pushing DreamTrue to GitHub..."
echo ""

# Check if token secret exists
if [ -z "$CODECHAINER_DREAMTRUE" ]; then
    echo "❌ Error: CODECHAINER_DREAMTRUE secret not found"
    echo "Please make sure the secret is set in Replit Secrets"
    exit 1
fi

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
git add PUSH_TO_GITHUB.sh

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

if [ $? -ne 0 ]; then
    echo "ℹ️  No changes to commit (already up to date)"
    echo ""
fi

# Configure remote
echo "🔗 Configuring GitHub remote..."
if git remote | grep -q "^origin$"; then
    git remote set-url origin https://github.com/TyroneTheCodeChainer/DreamTrue.git
else
    git remote add origin https://github.com/TyroneTheCodeChainer/DreamTrue.git
fi

echo "✅ Remote configured"
echo ""

# Push to GitHub using the secret token
echo "⬆️  Pushing to GitHub..."
git push https://$CODECHAINER_DREAMTRUE@github.com/TyroneTheCodeChainer/DreamTrue.git main

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
    echo "2. ✅ Add repo to Demo Day submission"
    echo "3. ✅ Create slide deck (use DEMO_DAY_SLIDES.md)"
    echo "4. ✅ Practice presentation (use PRESENTATION_SCRIPT.md)"
    echo ""
else
    echo ""
    echo "❌ Push failed. Possible reasons:"
    echo ""
    echo "1. Repository doesn't exist yet"
    echo "   → Create it at: https://github.com/new"
    echo "   → Name: DreamTrue"
    echo "   → Make it Public"
    echo "   → Don't add README/license (we have those)"
    echo ""
    echo "2. Token permissions issue"
    echo "   → Check token has 'repo' scope"
    echo "   → Generate new token at: https://github.com/settings/tokens"
    echo ""
    echo "3. Branch protection rules"
    echo "   → Check GitHub repo settings"
    echo ""
fi
