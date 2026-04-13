# Portfolio

This is Annika's portfolio site.

## Deploy / host

- GitHub Pages works well for this (static `index.html`).

## Keeping GitHub in sync

1) Make sure you can authenticate to GitHub from this machine (choose **one**):

- **Recommended (PAT over HTTPS)**:
  - Create a GitHub Personal Access Token (classic) with `repo` scope.
  - Then run one push so your credential gets stored by macOS Keychain.

- **SSH**:
  - Create an SSH key and add it to GitHub.
  - Switch `origin` to the SSH URL.

2) Use the sync script:

```bash
./sync.sh "Update site"
```

If you omit the message, it uses a default.

## Auto-sync on every change (macOS)

If you want GitHub to update automatically whenever files change in this folder, you can use a macOS LaunchAgent.

1) Install the agent file (creates it in your home directory):

```bash
mkdir -p ~/Library/LaunchAgents
cat > ~/Library/LaunchAgents/com.annika.portfolio.autosync.plist <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.annika.portfolio.autosync</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>/Users/annika/Desktop/Annika/Portfolio/autosync.sh</string>
    </array>

    <key>WorkingDirectory</key>
    <string>/Users/annika/Desktop/Annika/Portfolio</string>

    <key>WatchPaths</key>
    <array>
      <string>/Users/annika/Desktop/Annika/Portfolio</string>
    </array>

    <key>StandardOutPath</key>
    <string>/tmp/portfolio-autosync.out</string>
    <key>StandardErrorPath</key>
    <string>/tmp/portfolio-autosync.err</string>
  </dict>
</plist>
PLIST
```

2) Load it:

```bash
launchctl unload ~/Library/LaunchAgents/com.annika.portfolio.autosync.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.annika.portfolio.autosync.plist
```

To stop auto-sync later:

```bash
launchctl unload ~/Library/LaunchAgents/com.annika.portfolio.autosync.plist
```

