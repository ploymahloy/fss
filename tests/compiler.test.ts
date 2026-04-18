import { describe, it, expect } from 'vitest';
import { compileFSS } from '../src/compiler.js';
import { FSS_BASE_CSS } from '../src/base-css.js';

describe('FSS Compiler', () => {
	it('should return component CSS only (reset lives in FSS_BASE_CSS)', async () => {
		const input = '.btn { color: red; }';
		const output = await compileFSS(input);

		expect(output).toBe('.btn { color: red; }');
		expect(output).not.toContain(':host *');

		expect(FSS_BASE_CSS).toContain(':host * {');
		expect(FSS_BASE_CSS).toContain('all: unset');
	});

	it('should still fail on illegal selectors during compilation', async () => {
		const input = '.parent .child { color: blue; }';
		await expect(compileFSS(input)).rejects.toThrow(/descendant combinators/);
	});
});

it('should handle @define variables and remove the block from output', async () => {
	const input = `
	  @define { 
		$bg: #000; 
		$text: white; 
	  }
	  .box { background: $bg; color: $text; }
	`;

	const output = await compileFSS(input);

	expect(output).toContain('background: #000');
	expect(output).toContain('color: white');
	expect(output).not.toContain('@define');
	expect(output).not.toContain('$bg');
});

it('should fail if a variable is used but not defined', async () => {
	const input = '.box { color: $missing; }';
	await expect(compileFSS(input)).rejects.toThrow(/Variable \$missing is not defined/);
});

it('should fail if a variable is defined but not used', async () => {
	const input = `
	  @define { $bg: #000; }
	`;
	await expect(compileFSS(input)).rejects.toThrow(/Variable \$bg is not used/);
});
