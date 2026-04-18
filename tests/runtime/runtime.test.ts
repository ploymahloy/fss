/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

async function loadRuntime() {
	return import('../../src/runtime/shadow-styles.js');
}

describe('createFssShadowStyles runtime', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('getFssBaseStyleSheet returns the same CSSStyleSheet instance', async () => {
		const { getFssBaseStyleSheet } = await loadRuntime();
		const a = getFssBaseStyleSheet();
		const b = getFssBaseStyleSheet();
		expect(a).toBe(b);
	});

	it('adopt sets adoptedStyleSheets with base first then component', async () => {
		const { getFssBaseStyleSheet, createFssShadowStyles } = await loadRuntime();
		const host = document.createElement('div');
		const shadow = host.attachShadow({ mode: 'open' });
		const styles = createFssShadowStyles('.x { color: red; }');
		styles.adopt(shadow);

		expect(shadow.adoptedStyleSheets).toHaveLength(2);
		expect(shadow.adoptedStyleSheets[0]).toBe(getFssBaseStyleSheet());
		expect(shadow.adoptedStyleSheets[1]).not.toBe(getFssBaseStyleSheet());
	});

	it('update replaces component sheet CSS via replaceSync', async () => {
		const { createFssShadowStyles } = await loadRuntime();
		const host = document.createElement('div');
		const shadow = host.attachShadow({ mode: 'open' });
		const styles = createFssShadowStyles('.a { color: red; }');
		styles.adopt(shadow);

		const componentSheet = shadow.adoptedStyleSheets[1];
		expect(componentSheet).toBeDefined();
		const before = Array.from(componentSheet!.cssRules)
			.map(r => r.cssText)
			.join(' ');
		expect(before).toMatch(/color:\s*red/);

		styles.update('.a { color: blue; }');
		const after = Array.from(componentSheet!.cssRules)
			.map(r => r.cssText)
			.join(' ');
		expect(after).toMatch(/color:\s*blue/);
		expect(after).not.toMatch(/color:\s*red/);
	});
});
