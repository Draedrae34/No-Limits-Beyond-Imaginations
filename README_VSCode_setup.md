# VS Code setup — quick sync + install

Files added to this repo to standardize your VS Code environment:

- [.vscode/settings.json](.vscode/settings.json)
- [.vscode/extensions.json](.vscode/extensions.json)
- [.vscode/keybindings.json](.vscode/keybindings.json)
- [scripts/vscode-setup.ps1](scripts/vscode-setup.ps1)

Quick steps to apply these on a Windows machine:

1. Ensure VS Code's `code` CLI is available (open Command Palette → 'Shell Command: Install "code" command in PATH').
2. Run the installer from PowerShell (from repo root):

```powershell
cd <repo-root>
.
\scripts\vscode-setup.ps1
```

3. Open VS Code and confirm recommended extensions installed.
4. Enable Settings Sync (click the account / sync icon) and choose to merge or replace — merging preserves machine-specific secrets.

Next suggested steps (I can do these for you):
- Add curated snippets and macros for Python and common stacks.
- Install and configure `ruff`, `black`, and `isort` in your project virtualenvs.
- Create a dotfiles repo or Gist for multi-machine backup of the `.vscode` folder.
