#!/bin/bash
# NLBL AI Commit Composer - Easy Access Script
# Usage: ./commit.sh [--auto] [--preview] [--gitlens]

cd /home/aundrae/Silent-Spirits-Legacy

echo ""
echo "🤖 NLBL AI COMMIT COMPOSER"
echo "═════════════════════════════════════════════════════════════════"

# Check for staged changes
STAGED=$(git diff --cached --name-only 2>/dev/null | wc -l)

if [ "$STAGED" -eq 0 ]; then
    echo "❌ No staged changes found"
    echo ""
    echo "Tip: Use 'git add' to stage files first"
    echo "  git add ."           # Add all changes
    echo "  git add file.py"     # Add specific file
    exit 1
fi

echo "📊 Found $STAGED staged files"
echo ""

# Handle arguments
case "$1" in
    --gitlens)
        echo "🔗 Opening GitLens Commit Composer..."
        code --command "gitlens.openCommitComposer"
        ;;
    --preview)
        echo "👀 Showing commit preview..."
        python3 ai-commit-composer.py | head -50
        echo ""
        echo "📄 Full preview saved to: ai_commits_preview.json"
        ;;
    --auto)
        echo "✅ Auto-composing commits..."
        python3 ai-commit-composer.py --auto
        ;;
    *)
        echo "Choose commit mode:"
        echo ""
        echo "  1️⃣  AI Auto-Compose (Recommended)"
        echo "       Organizes changes into well-formed commits"
        echo ""
        echo "  2️⃣  GitLens Composer"
        echo "       Interactive VS Code commit tool"
        echo ""
        echo "  3️⃣  Preview Only"
        echo "       Show AI suggestions without committing"
        echo ""
        echo "  4️⃣  Manual Commit"
        echo "       Write your own commit message"
        echo ""
        read -p "Choose (1-4): " choice

        case $choice in
            1)
                python3 ai-commit-composer.py
                ;;
            2)
                code --command "gitlens.openCommitComposer"
                ;;
            3)
                python3 ai-commit-composer.py --preview
                ;;
            4)
                git commit
                ;;
            *)
                echo "❌ Invalid choice"
                exit 1
                ;;
        esac
        ;;
esac

echo ""
echo "✨ Done!"
