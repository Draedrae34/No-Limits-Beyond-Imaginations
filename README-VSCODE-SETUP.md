VS Code setup for an advanced, synchronized developer environment

Steps

- Enable Settings Sync in VS Code (click the account/profile -> "Turn on Settings Sync").
- From this workspace root run the installer (PowerShell):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-vscode-setup.ps1
```

- Recommended global Python packages (if you prefer virtualenvs, install inside them):

```powershell
python -m pip install --user black flake8 mypy isort pylint pytest
```

- The workspace-provided files are:
- [.vscode/settings.json](.vscode/settings.json)
- [.vscode/keybindings.json](.vscode/keybindings.json)
- [.vscode/extensions.json](.vscode/extensions.json)
- [.vscode/snippets/python.json](.vscode/snippets/python.json)
- [scripts/install-vscode-setup.ps1](scripts/install-vscode-setup.ps1)

Sync notes

- Use VS Code Settings Sync to push these settings to your account so they appear on other devices.
- Optionally create a dotfiles repository and include the `.vscode/` folder if you want repo-backed syncing.
