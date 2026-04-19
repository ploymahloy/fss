# Flat Style Sheets — VS Code / Cursor extension

Provides **syntax highlighting**, **diagnostics**, **completion** (after `.` and `$`), **hover** for `.fss` files, an optional **FSS File Icons** theme, and a bundled **language server**.

## Install from this repository

From the repo root:

```bash
npm run editor:build
```

Then either **Develop**: open `editor/vscode-fss` in VS Code / Cursor and run **Developer: Install Extension from Location…**, or build a VSIX:

```bash
npm run editor:package
```

Install the generated `editor/vscode-fss/vscode-fss-*.vsix` via **Extensions: Install from VSIX…**.

## File icon theme

Command Palette → **Preferences: File Icon Theme** → **FSS File Icons**.

## Publish to extension marketplaces

Prerequisites:

- A [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage) publisher and [Personal Access Token](https://learn.microsoft.com/azure/devops/organizations/organizations/pats) with **Marketplace (Publish)** scope.
- An [Open VSX](https://open-vsx.org/) account, [namespace](https://github.com/eclipse/openvsx/wiki/Namespace-Access), and [personal access token](https://open-vsx.org/user-settings/tokens) for publishing.

From `editor/vscode-fss`, after installing dependencies (`npm install` from the repo root use `npm install --prefix editor/vscode-fss`) and running `npm run compile`, or from the repo root run `npm run editor:build` then `npm run vsix --prefix editor/vscode-fss` to produce a `.vsix`.

**Visual Studio Marketplace**

```bash
cd editor/vscode-fss
export VSCE_PAT=<your-azure-devops-token>
npx vsce publish
```

`vsce` reads the token from `VSCE_PAT` (see [vsce](https://github.com/microsoft/vscode-vsce#vsce-publish) for `-p` and other options).

**Open VSX**

After building a VSIX at `editor/vscode-fss/vscode-fss-<version>.vsix`:

```bash
cd editor/vscode-fss
export OVSX_PAT=<your-open-vsx-token>
npx ovsx publish vscode-fss-*.vsix -p "$OVSX_PAT"
```

Use the same `publisher` field in [`package.json`](./package.json) as your Open VSX namespace when required.

Version bumps: edit `version` in `package.json` before each publish.

## Troubleshooting

- **No highlighting / language id**: Ensure the extension is enabled and `.fss` files are not overridden by another extension’s file association.
- **No diagnostics**: Confirm `editor/fss-language-server/out/server.js` exists (run `npm run editor:build` from the repo root).
