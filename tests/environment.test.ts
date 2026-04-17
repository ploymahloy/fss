import { describe, it, expect } from 'vitest';

describe('Environment Setup', () => {
	it('should support ES Modules', () => {
		const message = 'FSS is ready!';
		expect(message).toBeTypeOf('string');
	});

	it('can import local files', async () => {
		const module = await import('../src/index.js');
		expect(module).toBeDefined();
	});
});
