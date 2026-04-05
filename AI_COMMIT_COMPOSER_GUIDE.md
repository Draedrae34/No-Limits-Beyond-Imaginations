# 🤖 NLBL AI COMMIT COMPOSER - Complete Setup Guide

## What This Does

Automatically organizes your changes into **well-formed, meaningful commits** using AI:

- ✅ Analyzes all staged files
- ✅ Groups changes by type (feature, fix, docs, etc.)
- ✅ Generates clear conventional commit messages
- ✅ Shows preview before committing
- ✅ Integrates with GitLens for enhanced visualization

**Result:** Better commit history, easier code reviews, professional git log.

---

## Quick Start (30 seconds)

### Option 1: Interactive Menu (Easiest)

```bash
cd /home/aundrae/Silent-Spirits-Legacy
chmod +x commit.sh
./commit.sh
```

Then choose:

- **1** for AI Auto-Compose (Recommended)
- **2** for GitLens Commit Composer
- **3** for Preview Only
- **4** for Manual Commit

### Option 2: Direct Python Script

```bash
python3 ai-commit-composer.py
```

### Option 3: GitLens Integration (In VS Code)

```
Ctrl+Shift+P → "GitLens: Open Commit Composer"
```

---

## How It Works

### 1. Stage Your Changes

```bash
git add .                # Add all changes
# or
git add file1.py file2.js  # Add specific files
```

### 2. Run Composer

```bash
./commit.sh
```

### 3. Review AI Preview

The tool analyzes your changes and suggests commits:

```
📝 Commit #1
─────────────────────────────────────────────────────────
Type: FEAT
Title: Add product catalog and sync system

Description:
  • Add 3 new feature files
  • Enhance functionality
  • Improve user experience

Files (3):
  + generate-product-catalog.py
  + printify-sync-master.py
  + generate-shop-feed.py
```

### 4. Confirm & Apply

```
Apply these commits? (y/n): y
```

Done! Commits created with professional messages.

---

## Features

### Automatic Categorization

The AI automatically determines commit types based on files:

| File Type           | Becomes    | Example              |
| ------------------- | ---------- | -------------------- |
| `*.py` (new)        | `feat`     | Add new feature      |
| `*.py` (modified)   | `refactor` | Improve code         |
| README.md, \*.md    | `docs`     | Update documentation |
| .env, config files  | `chore`    | Update configuration |
| test\_\*.py         | `test`     | Add tests            |
| .css, .js (styling) | `style`    | Update styling       |

### Smart Grouping

Related files are grouped into single commits:

- All documentation changes → 1 commit
- All configuration changes → 1 commit
- All feature additions → 1 commit

### Conventional Commits

Follows standard format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Examples:

```
feat: Add product catalog and sync system
fix: Resolve product pricing calculation
docs: Update installation guide
chore: Update .env configuration
refactor: Reorganize shop components
test: Add unit tests for payment processing
```

---

## GitLens Commit Composer Integration

For **interactive, visual commit composing** in VS Code:

1. **Install GitLens** (Already done ✅)
2. **Open Commit Composer:**
   - Press `Ctrl+Shift+P`
   - Type: `GitLens: Open Commit Composer`

3. **Visual Features:**
   - Staged files visualization
   - Scopes for organizing commits
   - Message templates
   - Description formatting
   - Real-time preview

---

## Pre-commit Hooks

Automatically validates commits before they're applied:

- ✅ Detects debug code (console.log, print)
- ✅ Warns about .env files
- ✅ Checks file sizes (warns if > 5MB)
- ✅ Prevents common mistakes

Already installed! Runs automatically.

---

## Command Examples

### Generate Preview (Don't Commit)

```bash
python3 ai-commit-composer.py --preview
```

Shows suggested commits without applying them.

### Auto-Apply Commits

```bash
python3 ai-commit-composer.py --auto
```

Creates commits without asking for confirmation.

### Interactive Menu

```bash
./commit.sh
```

Choose between AI composer, GitLens, preview, or manual.

### Create Custom Alias

```bash
alias commit='./commit.sh'
```

Then just type: `commit`

---

## Example Workflow

### Scenario: You updated product system and fixed bugs

```bash
# 1. Make your changes in VS Code

# 2. Stage files
git add generate-product-catalog.py printify-sync-master.py fix_product_bug.py README.md

# 3. Run composer
./commit.sh

# 4. View AI preview
📊 Summary: 3 commits, 4 files

📝 Commit #1 - feat: Add product catalog system
📝 Commit #2 - fix: Resolve product pricing
📝 Commit #3 - docs: Update README

# 5. Confirm (y)

# 6. Result - Professional git log:
git log --oneline
→ a1b2c3d fix: Resolve product pricing
→ e4f5g6h feat: Add product catalog system
→ i7j8k9l docs: Update README
```

---

## Advanced Usage

### Preview to JSON File

```bash
python3 ai-commit-composer.py > ai_commits_preview.json
```

Saves suggestions for later review.

### Customize Categories

Edit `ai-commit-composer.py`:

```python
feature_keywords = ['add', 'implement', 'introduce', 'new', 'create']
fix_keywords = ['fix', 'resolve', 'bug', 'issue', 'correct', 'patch']
```

### Configure Scope

Modify the `generate_commit_message()` function to add scope:

```
feat(products): Add product sync system
fix(pricing): Resolve calculation bug
docs(setup): Update installation guide
```

---

## Troubleshooting

### "No staged changes found"

```bash
# Stage files first
git add .
git add file.py
```

### "GitLens Composer not available"

```bash
# Install/enable GitLens
code --install-extension eamodio.gitlens
```

### "Python script won't run"

```bash
# Make it executable
chmod +x ai-commit-composer.py
```

### "Pre-commit hook blocking commits"

```bash
# Review the errors before continuing
# Or bypass with: git commit --no-verify
```

---

## File Structure

```
/home/aundrae/Silent-Spirits-Legacy/
├── ai-commit-composer.py        ← Main AI script
├── commit.sh                     ← Easy access wrapper
├── .git/hooks/
│   └── pre-commit              ← Validation hook
├── .vscode/
│   └── settings.json           ← GitLens config
└── ai_commits_preview.json      ← Generated previews (new)
```

---

## Next Steps

1. **Make scripts executable:**

   ```bash
   chmod +x commit.sh
   chmod +x ai-commit-composer.py
   ```

2. **Test the system:**

   ```bash
   git add .
   ./commit.sh
   ```

3. **Create alias (optional):**

   ```bash
   echo "alias commit='./commit.sh'" >> ~/.zshrc
   source ~/.zshrc
   ```

4. **Use on every commit going forward**

---

## Benefits

### For You

- ✅ Faster commits with less thinking
- ✅ Professional git history
- ✅ Pre-commit validation
- ✅ Easy to review changes

### For Reviewers

- ✅ Clear, descriptive commit messages
- ✅ Logical grouping of changes
- ✅ Easy to understand what changed and why
- ✅ Find bugs faster with better history

### For Your Project

- ✅ Auto-generated CHANGELOG potential
- ✅ Better code archaeology
- ✅ Easier debugging with git blame
- ✅ Professional project appearance

---

## Your NLBL Legacy

Every commit tells a story of your brothers' legacy living on.
Make that story clear and professional. 👻✨

---

## Support

**Questions?**

```bash
python3 ai-commit-composer.py --help
./commit.sh --help
```

**View examples:**

```bash
cat ai_commits_preview.json
```

**Reset and start over:**

```bash
git reset HEAD~1    # Undo last commit (keep changes)
./commit.sh         # Try again with composer
```

---

## Ready? Let's Go! 🚀

```bash
./commit.sh
```

Your next commits will be legendary. 💫
