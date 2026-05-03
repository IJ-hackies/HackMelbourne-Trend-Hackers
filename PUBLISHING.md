# Publishing

How to release the VS Code extension and the static landing site.

---

## Extension icon

**File:** `packages/vscode/icon.png`
**Size:** 128×128 pixels (square, PNG)
**Background:** opaque preferred — the Marketplace doesn't render transparency consistently across light/dark themes
**Filename:** must be exactly `icon.png` (lowercase) — referenced by `packages/vscode/package.json` `"icon": "icon.png"`

If you change the filename or location, update `package.json` to match.

---

## Marketplace publish (extension)

Publishing is automated via `.github/workflows/publish-extension.yml`. It runs on any pushed tag matching `v*`.

### One-time setup (already done)

- Marketplace publisher `git-gud` exists at https://marketplace.visualstudio.com/manage
- `VSCE_PAT` GitHub secret holds an Azure DevOps PAT with **Marketplace: Manage** scope across all organizations
- `packages/vscode/package.json` has `publisher`, `icon`, `repository`, `bugs`, `homepage` set
- `packages/vscode/README.md` — becomes the Marketplace listing page
- `packages/vscode/LICENSE` — required by Marketplace

### Releasing a new version

1. **Bump the version** in `packages/vscode/package.json` (`"version": "0.1.1"`).
   Marketplace versions are immutable — you cannot republish the same number.

2. **Commit** the bump on `main`:
   ```bash
   git add packages/vscode/package.json
   git commit -m "chore: release v0.1.1"
   git push
   ```

3. **Tag and push the tag:**
   ```bash
   git tag v0.1.1
   git push origin v0.1.1
   ```

4. Watch the **Actions** tab on GitHub. The `Publish VS Code extension` workflow runs `vsce publish` with `VSCE_PAT`. New version appears on the Marketplace within a few minutes.

### Manual publish (fallback)

If CI is broken or you need to publish locally:

```bash
cd packages/vscode
npx @vscode/vsce login git-gud   # paste the PAT when prompted
npm run build
npx @vscode/vsce publish
```

### Common failure modes

- **"Publisher 'git-gud' not found"** — the publisher wasn't created or `package.json` uses a different ID.
- **"Missing icon"** — `packages/vscode/icon.png` isn't present or is the wrong size.
- **"Version X already exists"** — you forgot to bump `package.json` version before tagging.
- **PAT auth fails** — token expired (default 30 days), or scope isn't **Marketplace: Manage / All accessible organizations**. Mint a new one and update the `VSCE_PAT` secret.

---

## Landing site (GitHub Pages)

The site in `site/` deploys automatically via `.github/workflows/pages.yml` on every push to `main` that touches `site/` or the workflow file. Custom domain: `git-gud-extension.app` (configured via `site/CNAME` + name.com DNS + GitHub Pages settings).

### One-time setup (already done)

- GitHub repo → **Settings → Pages → Source: GitHub Actions**
- `site/CNAME` contains `git-gud-extension.app`
- name.com DNS: 4 A records for `@` pointing to GitHub Pages IPs (185.199.108.153 / .109.153 / .110.153 / .111.153), CNAME for `www` → `ij-hackies.github.io.`
- GitHub repo → **Settings → Pages → Custom domain**: `git-gud-extension.app`, **Enforce HTTPS** enabled

### Updating the site

Edit `site/index.html` or `site/styles.css`, commit to `main`, push. Live at:

```
https://git-gud-extension.app/
```

within ~30 seconds.

### After the extension is published to Marketplace

Update `site/index.html`:
- Remove the "Not on Marketplace yet" footnote.
- Replace the install instructions step list with a one-click Marketplace link.
- The existing `vscode:extension/git-gud.git-gud-vscode` deep link starts working automatically once the extension is live.
