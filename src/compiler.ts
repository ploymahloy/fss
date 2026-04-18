import { validateFSS } from './validator.js';
import { processVariables } from './preprocessor.js';

export async function compileFSS(css: string): Promise<string> {
	await validateFSS(css);
	return processVariables(css);
}
