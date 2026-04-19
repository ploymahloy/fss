# FSS editor tooling

Flat Style Sheets (`.fss`) support for editors: TextMate grammar (syntax highlighting), a bundled language server (diagnostics, completions, hover), and a VS Code/Cursor extension.

There is no single installer for every IDE. Use the VS Code extension where supported; reuse the grammar or run the language server elsewhere.

## Prerequisites (first-time setup)

Install dependencies for the editor subpackages once (`npm ci` works if lockfiles are committed and in sync):

```bash
npm install --prefix editor/fss-language-server
npm install --prefix editor/vscode-fss
```

From the repository root, build everything:

```bash
npm run editor:build
```

This produces `editor/fss-language-server/out/server.js` and compiles `editor/vscode-fss` (syntax assets, bundled server copy, extension `out/`).

## VS Code / Cursor / VSCodium

1. Build artifacts (see above).

2. Install the extension locally:

   - **VS Code**: _File → Open Folder…_ and choose `editor/vscode-fss`, then run **Extensions: Install Extension from Location…** (or **Developer: Install Extension from Location…**).
   - **VSIX**: From the repo root run `npm run editor:package`, then install the generated `editor/vscode-fss/vscode-fss-*.vsix` with **Extensions: Install from VSIX…**.

3. **File icon**: Command Palette → **Preferences: File Icon Theme** → **FSS File Icons**.

Extension metadata and publishing to the Visual Studio Marketplace and Open VSX are documented in [`vscode-fss/README.md`](./vscode-fss/README.md).

## Grammar only (JetBrains, Sublime Text, Zed, …)

Reuse these files under [`editor/grammars/`](./grammars/):

- [`fss.tmLanguage.json`](./grammars/fss.tmLanguage.json) — TextMate grammar (`source.fss`).
- [`language-configuration.json`](./grammars/language-configuration.json) — brackets, comments, indentation.

**JetBrains** (IntelliJ, WebStorm, …): _Settings → Editor → TextMate Bundles → Add…_ and select a folder that contains `fss.tmLanguage.json` (layout may vary by version; see JetBrains docs for TextMate import).

**Icons**: VS Code file icon themes do not apply to JetBrains. To customize icons there, use _Settings → Editor → File Types_ (mapping `*.fss`) and optional custom icon plugins for your IDE.

**Sublime Text**: Install the `.tmLanguage` / JSON grammar via package or **View → Syntax → Open all with…** after adding the syntax definition; consult Sublime’s TextMate import docs.

**Zed**: Use extension or JSON/TextMate grammar import per [Zed docs](https://zed.dev/docs) for custom languages.

## Language server only (Neovim, Helix, Emacs, …)

After `npm run editor:build`, the server is a single Node bundle:

- Path: `editor/fss-language-server/out/server.js`
- Start with **`cwd`** set to `editor/fss-language-server` (or absolute paths everywhere).

The server speaks LSP over **stdio** (`node out/server.js`). Clients must negotiate text document sync. Capabilities include diagnostics, completion (trigger characters `.` and `$`), and hover on `$variables` and `.classes`.

### Neovim (`nvim-lspconfig`)

Adjust the repo path and ensure `editor:build` has been run:

```lua
local root = '~/dev/fss' -- change to your clone

vim.api.nvim_create_autocmd('FileType', {
	pattern = 'fss',
	callback = function()
		vim.lsp.start({
			name = 'fss',
			cmd = {
				'node',
				vim.fn.expand(root .. '/editor/fss-language-server/out/server.js'),
			},
			cmd_cwd = vim.fn.expand(root .. '/editor/fss-language-server'),
			root_dir = vim.fs.dirname(vim.api.nvim_buf_get_name(0)),
		})
	end,
})

vim.filetype.add({ extension = { fss = 'fss' } })
```

Also set a grammar (Tree-sitter/TextMate via plugin) if you want highlighting beyond `filetype`.

### Helix

In `languages.toml` (see [Helix languages](https://docs.helix-editor.com/master/languages.html)):

```toml
[[language]]
name = "fss"
scope = "source.fss"
file-types = ["fss"]
roots = []
language-servers = ["fss"]

[language-server.fss]
command = "node"
args = ["/ABS/PATH/TO/fss/editor/fss-language-server/out/server.js"]
working-directory = "/ABS/PATH/TO/fss/editor/fss-language-server"
```

Add a `[[grammar]]` or external highlighter if you need TextMate-level highlighting in Helix.

### Emacs (`eglot`)

```elisp
(with-eval-after-load 'eglot
  (add-to-list 'eglot-server-programs
               '(fss-mode . ("node" "/ABS/PATH/TO/fss/editor/fss-language-server/out/server.js"))))
```

Define `fss-mode` with `auto-mode-alist` for `\\.fss\\'`, or reuse `css-mode` as a base and hook eglot.

## TypeScript `import '*.fss'`

The compiler package ships ambient typings at [`../types/fss-module.d.ts`](../types/fss-module.d.ts). Include `types` in your `tsconfig` `include`, or copy that declaration into your app.
