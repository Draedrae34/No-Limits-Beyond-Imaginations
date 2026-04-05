#!/usr/bin/env python3
"""
NLBL AI Commit Composer
Analyzes your changes and generates well-formed commits with AI
Organizes staged changes into logical groups with clear messages
"""
import os
import json
import subprocess
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class AICommitComposer:
    def __init__(self):
        self.project_root = os.path.dirname(os.path.abspath(__file__))
        self.changes = {
            'added': [],
            'modified': [],
            'deleted': [],
            'renamed': []
        }
        self.commit_groups = []

    def get_staged_changes(self):
        """Get all staged files and their changes"""
        try:
            # Get added files
            result = subprocess.run(
                ['git', 'diff', '--cached', '--name-only', '--diff-filter=A'],
                capture_output=True,
                text=True,
                cwd=self.project_root
            )
            self.changes['added'] = result.stdout.strip().split('\n') if result.stdout.strip() else []

            # Get modified files
            result = subprocess.run(
                ['git', 'diff', '--cached', '--name-only', '--diff-filter=M'],
                capture_output=True,
                text=True,
                cwd=self.project_root
            )
            self.changes['modified'] = result.stdout.strip().split('\n') if result.stdout.strip() else []

            # Get deleted files
            result = subprocess.run(
                ['git', 'diff', '--cached', '--name-only', '--diff-filter=D'],
                capture_output=True,
                text=True,
                cwd=self.project_root
            )
            self.changes['deleted'] = result.stdout.strip().split('\n') if result.stdout.strip() else []

            # Get renamed files
            result = subprocess.run(
                ['git', 'diff', '--cached', '--name-only', '--diff-filter=R'],
                capture_output=True,
                text=True,
                cwd=self.project_root
            )
            self.changes['renamed'] = result.stdout.strip().split('\n') if result.stdout.strip() else []

            return self.changes

        except Exception as e:
            print(f"❌ Error getting staged changes: {e}")
            return {}

    def categorize_changes(self):
        """Categorize changes by type (feature, fix, docs, chore, etc)"""
        categories = {
            'features': [],
            'fixes': [],
            'docs': [],
            'chores': [],
            'refactor': [],
            'tests': [],
            'config': []
        }

        # Keywords that indicate commit type
        feature_keywords = ['add', 'implement', 'introduce', 'new', 'create']
        fix_keywords = ['fix', 'resolve', 'bug', 'issue', 'correct', 'patch']
        doc_keywords = ['readme', 'docs', 'guide', 'doc', 'documentation', '.md']
        config_keywords = ['config', '.env', 'settings', '.json', 'setup', 'install', 'requirements']
        test_keywords = ['test', 'spec']
        refactor_keywords = ['refactor', 'optimize', 'improve', 'clean', 'reorganize']

        all_files = self.changes['added'] + self.changes['modified'] + self.changes['deleted']

        for file in all_files:
            if not file:
                continue

            filename = file.lower()

            # Check which category it belongs to
            if any(keyword in filename for keyword in doc_keywords):
                categories['docs'].append(file)
            elif any(keyword in filename for keyword in config_keywords):
                categories['config'].append(file)
            elif any(keyword in filename for keyword in test_keywords):
                categories['tests'].append(file)
            elif any(keyword in filename for keyword in refactor_keywords):
                categories['refactor'].append(file)
            elif 'fix' in filename or 'bug' in filename:
                categories['fixes'].append(file)
            else:
                # Default to features for new files, fixes for modifications
                if file in self.changes['added']:
                    categories['features'].append(file)
                elif file in self.changes['modified']:
                    categories['refactor'].append(file)

        return categories

    def generate_commit_message(self, category, files, scope=None):
        """Generate conventional commit message based on category and files"""

        type_map = {
            'features': 'feat',
            'fixes': 'fix',
            'docs': 'docs',
            'config': 'chore',
            'tests': 'test',
            'refactor': 'refactor'
        }

        commit_type = type_map.get(category, 'chore')

        # Generate title based on files
        if 'product' in ' '.join(files).lower():
            titles = {
                'features': 'Add product catalog and sync system',
                'fixes': 'Fix product display and pricing',
                'docs': 'Document product sync process',
                'config': 'Configure product system',
                'refactor': 'Refactor product management'
            }
        elif 'shop' in ' '.join(files).lower():
            titles = {
                'features': 'Implement shop display system',
                'fixes': 'Fix shop layout and styling',
                'docs': 'Document shop setup',
                'config': 'Configure shop settings',
                'refactor': 'Reorganize shop components'
            }
        elif 'printify' in ' '.join(files).lower():
            titles = {
                'features': 'Add Printify integration',
                'fixes': 'Fix Printify sync issues',
                'docs': 'Document Printify setup',
                'config': 'Update Printify configuration',
                'refactor': 'Improve Printify sync'
            }
        elif 'style' in ' '.join(files).lower() or '.css' in ' '.join(files).lower():
            titles = {
                'features': 'Add new styling and animations',
                'fixes': 'Fix styling issues',
                'docs': 'Update style documentation',
                'config': 'Configure CSS settings',
                'refactor': 'Reorganize stylesheets'
            }
        else:
            titles = {
                'features': f'Add {len(files)} new features',
                'fixes': f'Fix {len(files)} issues',
                'docs': f'Update documentation ({len(files)} files)',
                'config': f'Update configuration ({len(files)} files)',
                'refactor': f'Refactor code ({len(files)} files)',
                'tests': f'Add tests ({len(files)} files)'
            }

        title = titles.get(category, f'{commit_type}: Update {len(files)} files')

        # Generate description
        descriptions = {
            'features': f'• Add {len(files)} new feature files\n• Enhance functionality\n• Improve user experience',
            'fixes': f'• Fix {len(files)} files\n• Resolve issues\n• Improve stability',
            'docs': f'• Update {len(files)} documentation files\n• Improve clarity\n• Add examples',
            'config': f'• Update {len(files)} configuration files\n• Adjust settings\n• Optimize setup',
            'refactor': f'• Refactor {len(files)} files\n• Improve code quality\n• Enhance maintainability',
            'tests': f'• Add {len(files)} test files\n• Improve coverage\n• Ensure quality'
        }

        description = descriptions.get(category, f'Update {len(files)} files')

        return {
            'type': commit_type,
            'title': title,
            'description': description,
            'files': files,
            'file_count': len(files)
        }

    def organize_commits(self):
        """Organize changes into logical commit groups"""

        self.get_staged_changes()
        categories = self.categorize_changes()

        commits = []

        # Create commits in priority order
        priority = ['docs', 'config', 'features', 'fixes', 'refactor', 'tests']

        for category in priority:
            files = categories.get(category, [])
            if files:
                # Filter out empty strings
                files = [f for f in files if f]
                if files:
                    commit_msg = self.generate_commit_message(category, files)
                    commits.append(commit_msg)

        self.commit_groups = commits
        return commits

    def show_preview(self):
        """Display AI-generated commits for preview"""

        self.organize_commits()

        if not self.commit_groups:
            print("❌ No staged changes found")
            return False

        print("\n" + "="*70)
        print("🤖 AI COMMIT COMPOSER - PREVIEW")
        print("="*70)

        total_files = 0
        for idx, commit in enumerate(self.commit_groups, 1):
            print(f"\n📝 Commit #{idx}")
            print(f"{'─'*70}")
            print(f"Type: {commit['type'].upper()}")
            print(f"Title: {commit['title']}")
            print(f"\nDescription:")
            for line in commit['description'].split('\n'):
                print(f"  {line}")

            print(f"\nFiles ({commit['file_count']}):")
            for file in commit['files'][:10]:  # Show first 10
                if file:
                    action = '+'
                    if file in self.changes['modified']:
                        action = '~'
                    elif file in self.changes['deleted']:
                        action = '-'
                    print(f"  {action} {file}")

            if commit['file_count'] > 10:
                print(f"  ... and {commit['file_count'] - 10} more files")

            total_files += commit['file_count']

        print("\n" + "="*70)
        print(f"📊 Summary: {len(self.commit_groups)} commits, {total_files} files")
        print("="*70)

        return True

    def apply_commits(self, auto=False):
        """Apply the organized commits"""

        if not auto:
            print("\n❓ Apply these commits? (y/n/e for edit): ", end='')
            response = input().strip().lower()

            if response == 'e':
                print("❌ Edit commits manually using:")
                print("   git add [files]")
                print("   git commit -m 'message'")
                return False

            if response != 'y':
                print("⏭️  Commit cancelled")
                return False

        print("\n🚀 Creating commits...\n")

        try:
            for idx, commit in enumerate(self.commit_groups, 1):
                # Create full commit message
                full_message = f"{commit['type']}: {commit['title']}\n\n{commit['description']}"

                # Stage the files
                files_str = ' '.join([f'"{f}"' for f in commit['files']])

                # Create commit
                subprocess.run(
                    f'git commit -m "{full_message}"',
                    shell=True,
                    cwd=self.project_root,
                    check=False
                )

                print(f"✅ Commit #{idx}: {commit['type']}: {commit['title']}")

            print("\n" + "="*70)
            print(f"✨ {len(self.commit_groups)} commits created successfully!")
            print("="*70)
            return True

        except Exception as e:
            print(f"❌ Error creating commits: {e}")
            return False

    def save_preview(self, filename='ai_commits_preview.json'):
        """Save commits preview to file for review"""

        with open(filename, 'w') as f:
            json.dump({
                'generated': datetime.now().isoformat(),
                'total_commits': len(self.commit_groups),
                'commits': self.commit_groups
            }, f, indent=2)

        print(f"\n📄 Preview saved to {filename}")
        print("   Review and modify before applying")

if __name__ == "__main__":
    import sys

    print("\n🤖 NLBL AI COMMIT COMPOSER")
    print("="*70)
    print("Organizes your changes into well-formed commits with AI\n")

    composer = AICommitComposer()

    # Show preview
    if composer.show_preview():
        if len(sys.argv) > 1 and sys.argv[1] == '--auto':
            # Auto-apply commits
            composer.apply_commits(auto=True)
        else:
            # Save preview and ask
            composer.save_preview()
            print("\n💾 Saved preview to ai_commits_preview.json")
            print("\nApply these commits? (y/n): ", end='')
            if input().strip().lower() == 'y':
                composer.apply_commits()
    else:
        print("\n⚠️  No changes staged. Use 'git add' first.")
