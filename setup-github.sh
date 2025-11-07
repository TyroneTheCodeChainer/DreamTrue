#!/bin/bash

# DreamTrue - GitHub Repository Setup Script
# This script initializes your GitHub repository with clean commit history

echo "🚀 Setting up DreamTrue GitHub Repository..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if git is initialized
if [ ! -d ".git" ]; then
    echo "${YELLOW}Initializing git repository...${NC}"
    git init
    echo "${GREEN}✓ Git initialized${NC}"
else
    echo "${GREEN}✓ Git already initialized${NC}"
fi

# Step 2: Create .gitignore if it doesn't exist or update it
echo "${YELLOW}Setting up .gitignore...${NC}"
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.production

# Vector database (regenerate with ingest script)
vector_db/

# Build output
dist/
build/
.next/

# IDE
.vscode/
.idea/
*.swp
*.swo

# Replit specific
.replit
replit.nix

# OS files
.DS_Store
Thumbs.db

# Logs
*.log

# Testing
coverage/

# Temporary files
*.tmp
.cache/
EOF
echo "${GREEN}✓ .gitignore updated${NC}"

# Step 3: Add all files
echo "${YELLOW}Adding files to git...${NC}"
git add .
echo "${GREEN}✓ Files added${NC}"

# Step 4: Create initial commit
echo "${YELLOW}Creating initial commit...${NC}"
git commit -m "Initial commit: DreamTrue - AI-powered dream interpretation with RAG

Features:
- RAG system with 214 research paper chunks
- Anthropic Claude 3.5 Sonnet integration
- Vectra vector database for semantic search
- Replit Auth (OIDC) authentication
- Stripe payment integration (freemium model)
- Mobile-first PWA with voice input
- PostgreSQL database with Drizzle ORM
- Comprehensive error monitoring
- Pattern analytics dashboard

Tech Stack:
- Frontend: React, TypeScript, Tailwind CSS, Shadcn/ui
- Backend: Node.js, Express, PostgreSQL, Neon
- AI/ML: Claude API, Vectra, Xenova transformers
- Payments: Stripe
- Auth: Replit OIDC"

echo "${GREEN}✓ Initial commit created${NC}"

# Step 5: Set main branch
echo "${YELLOW}Setting up main branch...${NC}"
git branch -M main
echo "${GREEN}✓ Main branch set${NC}"

# Step 6: Instructions for GitHub remote
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "${YELLOW}Next Steps:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to GitHub: https://github.com/new"
echo ""
echo "2. Create a new repository with these settings:"
echo "   - Repository name: dreamtrue"
echo "   - Description: AI-powered dream interpretation with RAG citations"
echo "   - Visibility: Public ✓"
echo "   - Initialize: Leave unchecked (we already have code)"
echo ""
echo "3. After creating the repo, run these commands:"
echo ""
echo "${GREEN}   git remote add origin https://github.com/YOUR_USERNAME/dreamtrue.git${NC}"
echo "${GREEN}   git push -u origin main${NC}"
echo ""
echo "4. Replace YOUR_USERNAME with your actual GitHub username"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "${GREEN}✅ Repository ready to push!${NC}"
echo ""
echo "Your GitHub URL will be: https://github.com/YOUR_USERNAME/dreamtrue"
echo ""
