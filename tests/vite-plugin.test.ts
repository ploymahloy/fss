import { describe, it, expect, vi } from 'vitest';
import fssPlugin from '../src/vite-plugin.js';

// Mock the Phase 1 engine so we aren't testing its logic here
vi.mock('../src/compiler.js', () => ({
	compileFSS: vi.fn(input => `.btn { color: ${input}; }`)
}));

describe('vite-plugin-fss', () => {
	const plugin = fssPlugin();

	it('should ignore non-fss files', async () => {
		const result = await plugin.compile('body { color: red; }', 'styles.css');
		expect(result).toBeNull();
	});

	it('should compile .fss files into a JS module', async () => {
		const fssContent = 'blue'; // Simplified input for the mock
		const id = 'test.fss';

		const result = await plugin.compile(fssContent, id);
		if (result === null) {
			expect.fail('compile() returned null for .fss input');
		}

		// Verify the result is an object with a 'code' property
		expect(result).toHaveProperty('code');

		// Check that it exports a default string (our mocked output)
		expect(result.code).toContain('export default ".btn { color: blue; }";');
	});

	it('should include HMR logic in the output', async () => {
		const result = await plugin.compile('red', 'test.fss');
		if (result === null) {
			expect.fail('compile() returned null for .fss input');
		}

		// Verify HMR check exists
		expect(result.code).toContain('if (import.meta.hot)');
		expect(result.code).toContain('import.meta.hot.accept');
	});

	it('should throw a helpful error if compileation fails', async () => {
		const { compileFSS } = await import('../src/compiler.js');
		vi.mocked(compileFSS).mockImplementationOnce(() => {
			throw new Error('Syntax Error');
		});

		const mockContext = { error: vi.fn() };

		plugin.compile.call(mockContext, 'invalid-syntax', 'error.fss');

		expect(mockContext.error).toHaveBeenCalledWith(expect.stringContaining('FSS Compilation Error'));
	});
});
