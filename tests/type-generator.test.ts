import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs/promises';
import { generateTypes } from '../src/type-generator.js';

vi.mock('node:fs/promises');

describe('FSS Type Generator', () => {
	it('should generate valid TypeScript definitions from FSS classes', async () => {
		const fssContent = '.primaryBtn { color: red; } .sidebar_link { display: flex; }';
		const filePath = '/project/src/Button.fss';

		await generateTypes(filePath, fssContent);

		expect(fs.writeFile).toHaveBeenCalledWith(
			'/project/src/Button.fss.d.ts',
			expect.stringContaining('export const classes: {'),
			'utf-8'
		);
	});

	it('should handle empty FSS files gracefully', async () => {
		await generateTypes('empty.fss', ':host { margin: 0; }');
		const generatedContent = vi.mocked(fs.writeFile).mock?.calls?.[1]?.[1] as string;

		expect(generatedContent).toBeDefined();
		expect(generatedContent).toContain('export const classes: {}');
	});
});
