import { validateFSS } from './validator.js';
import { processVariables } from './preprocessor.js';

const SANE_RESET = `
:host {
  display: block;
  contain: content;
}

:host * {
  all: unset;
  display: revert; // IMPORTANT! Keeps <div> as block and <span> as inline
  box-sizing: border-box;
  font-family: inherit;
}
`.trim();

export async function compileFSS(css: string): Promise<string> {
	// Validate
	await validateFSS(css);

	// Process Variables
	const transformedCss = await processVariables(css);

	// Return reset/flat CSS
	return `${SANE_RESET}\n\n${transformedCss}`;
}
