import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compileFSS } from '../src/compiler.js';
import fssPlugin from '../src/vite-plugin.js';

vi.mock('../src/compiler.js', () => ({
	compileFSS: vi.fn((input: string) => Promise.resolve(`.btn { color: ${input}; }`))
}));

const TEST_RUNTIME_IMPORT = new URL('../src/index.ts', import.meta.url).href;

async function importGeneratedModule(code: string) {
	const stripped = code.replace(/^import \{ createFssShadowStyles \} from [^;]+;\s*\n/m, '');
	const wrapped = [
		`function createFssShadowStyles(css) {`,
		`	return { adopt() {}, update(_next) {} };`,
		`}`,
		stripped
	].join('\n');
	const url = `data:text/javascript;charset=utf-8,${encodeURIComponent(wrapped)}`;
	return import(url);
}

describe('vite-plugin-fss', () => {
	const plugin = fssPlugin({ runtimeImport: TEST_RUNTIME_IMPORT });

	beforeEach(() => {
		vi.mocked(compileFSS).mockImplementation((input: string) => Promise.resolve(`.btn { color: ${input}; }`));
	});

	describe('module integrity', () => {
		it('should ignore non-fss files', async () => {
			const result = await plugin.compile('body { color: red; }', 'styles.css');
			expect(result).toBeNull();
		});

		it('should compile .fss files into a JS module with map', async () => {
			const fssContent = 'blue';
			const id = 'test.fss';

			const result = await plugin.compile(fssContent, id);
			expect(result).not.toBeNull();
			if (result === null) {
				return;
			}

			expect(result).toHaveProperty('code');
			expect(result.map).toEqual({ mappings: '' });

			const compiledMock = `.btn { color: ${fssContent}; }`;
			expect(result.code).toContain(`import { createFssShadowStyles } from ${JSON.stringify(TEST_RUNTIME_IMPORT)}`);
			expect(result.code).toContain(`const compiledCss = ${JSON.stringify(compiledMock)};`);
			expect(result.code).toContain('export default compiledCss');
			expect(result.code).not.toContain(':host *');
		});

		it('should stringify CSS with quotes, backslashes, and newlines for a valid export', async () => {
			const compiledCss = '.rule { content: "x"; }\n.line2\\path';
			vi.mocked(compileFSS).mockResolvedValueOnce(compiledCss);

			const result = await plugin.compile('input', 'edge.fss');
			expect(result).not.toBeNull();
			if (result === null) {
				return;
			}

			expect(result.code).toContain(`const compiledCss = ${JSON.stringify(compiledCss)};`);
			expect(result.code).toContain('export default compiledCss');
		});

		it('should produce ESM that dynamic-imports without syntax errors', async () => {
			const compiledCss = '.ok { color: green; }';
			vi.mocked(compileFSS).mockResolvedValueOnce(compiledCss);

			const result = await plugin.compile('any', 'smoke.fss');
			expect(result).not.toBeNull();
			if (result === null) {
				return;
			}

			const mod = await importGeneratedModule(result.code);
			expect(mod.default).toBe(compiledCss);
			expect(mod.fssStyles).toBeDefined();
			expect(typeof mod.fssStyles.adopt).toBe('function');
			expect(typeof mod.fssStyles.update).toBe('function');
		});
	});

	describe('HMR lifecycle', () => {
		it('should persist handle on hot.data and update on accept', async () => {
			const result = await plugin.compile('red', 'test.fss');
			expect(result).not.toBeNull();
			if (result === null) {
				return;
			}

			const { code } = result;
			expect(code).toContain('if (import.meta.hot)');
			expect(code).toContain('import.meta.hot.accept');
			expect(code).toContain('import.meta.hot.accept((newModule) => {');
			expect(code).toContain('import.meta.hot.data ??=');
			expect(code).toContain('import.meta.hot.data.fssStyles ??=');
			expect(code).toContain('fssStyles.update(newModule.default)');
			expect(code).toContain('newModule?.default !== undefined');
		});
	});

	describe('error resilience', () => {
		it('should call this.error with file id and message and return null', async () => {
			vi.mocked(compileFSS).mockRejectedValueOnce(new Error('Syntax Error'));

			const mockContext = { error: vi.fn() };

			const out = await plugin.compile.call(mockContext, 'invalid-syntax', 'path/to/error.fss');

			expect(out).toBeNull();
			expect(mockContext.error).toHaveBeenCalledTimes(1);
			expect(mockContext.error).toHaveBeenCalledWith('FSS Compilation Error in path/to/error.fss: Syntax Error');
		});

		it('should throw when this.error is not available', async () => {
			vi.mocked(compileFSS).mockRejectedValueOnce(new Error('boom'));

			await expect(plugin.compile.call({}, 'bad', 'x.fss')).rejects.toThrow(/FSS Compilation Error in x\.fss: boom/);
		});
	});

	describe('transform hook', () => {
		it('should delegate transform to compile', async () => {
			const compiledCss = '.delegate { }';
			vi.mocked(compileFSS).mockResolvedValue(compiledCss);

			const fromTransform = await plugin.transform.call(plugin, 'src', 'widget.fss');
			const fromCompile = await plugin.compile.call(plugin, 'src', 'widget.fss');

			expect(fromTransform).toEqual(fromCompile);
		});
	});

	describe('defaults', () => {
		it('uses fss-compiler as runtimeImport when omitted', async () => {
			const plain = fssPlugin();
			const result = await plain.compile.call({}, 'x', 'a.fss');
			expect(result).not.toBeNull();
			if (result === null) {
				return;
			}
			expect(result.code).toContain('from "fss-compiler"');
		});
	});
});
