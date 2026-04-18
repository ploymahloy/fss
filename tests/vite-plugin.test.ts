import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compileFSS } from '../src/compiler.js';
import fssPlugin from '../src/vite-plugin.js';

vi.mock('../src/compiler.js', () => ({
	compileFSS: vi.fn((input: string) => Promise.resolve(`.btn { color: ${input}; }`))
}));

async function importGeneratedModule(code: string) {
	const url = `data:text/javascript;charset=utf-8,${encodeURIComponent(code)}`;
	return import(url);
}

describe('vite-plugin-fss', () => {
	const plugin = fssPlugin();

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

			const expectedDefault = JSON.stringify(`.btn { color: ${fssContent}; }`);
			expect(result.code.startsWith(`export default ${expectedDefault};`)).toBe(true);
		});

		it('should stringify CSS with quotes, backslashes, and newlines for a valid export', async () => {
			const compiledCss = '.rule { content: "x"; }\n.line2\\path';
			vi.mocked(compileFSS).mockResolvedValueOnce(compiledCss);

			const result = await plugin.compile('input', 'edge.fss');
			expect(result).not.toBeNull();
			if (result === null) {
				return;
			}

			const expectedLine = `export default ${JSON.stringify(compiledCss)};`;
			expect(result.code.startsWith(expectedLine)).toBe(true);
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
		});
	});

	describe('HMR lifecycle', () => {
		it('should register import.meta.hot and accept callback for DOM updates', async () => {
			const result = await plugin.compile('red', 'test.fss');
			expect(result).not.toBeNull();
			if (result === null) {
				return;
			}

			const { code } = result;
			expect(code).toContain('if (import.meta.hot)');
			expect(code).toContain('import.meta.hot.accept');
			expect(code).toContain('import.meta.hot.accept((newModule) => {');
			expect(code).toContain('if (newModule) {');
			expect(code).toContain('// HMR logic will be implemented here for DOM updates');
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
});
