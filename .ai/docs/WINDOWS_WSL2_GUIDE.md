# Windows 11 + WSL2 Guide

## PowerShell-first recommendation

If your daily workflow is already PowerShell-based, keep using PowerShell for native Windows repositories. Use WSL2 when you need Linux-native tooling, Linux shell scripts, or better parity with CI.

## Access Windows files from WSL2

Windows drives are mounted under `/mnt`.

```bash
cd /mnt/c/Users/<YourWindowsUser>/path/to/repo
ls
```

Example:

```bash
cd /mnt/c/Users/alex/source/repos/my-app
```

## Access WSL files from Windows

In File Explorer, open:

```text
\\wsl$\Ubuntu\home\<your-linux-user>
```

## Performance recommendation

For heavy Node.js projects, prefer cloning repos inside the WSL Linux filesystem:

```bash
mkdir -p ~/code
cd ~/code
git clone <repo-url>
cd <repo>
```

Then open VS Code from WSL:

```bash
code .
```

## Common commands

```bash
# See installed distros
wsl -l -v

# Start Ubuntu
wsl -d Ubuntu

# Go to Windows C drive
cd /mnt/c

# Go back to Linux home
cd ~

# Show current path
pwd
```

## Safety note

Do not copy secrets between Windows and WSL casually. Keep `.env` files local and ignored by Git. Do not allow AI agents to read them unless you have a very specific, approved reason.
