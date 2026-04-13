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

