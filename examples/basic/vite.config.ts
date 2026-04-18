import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import fssPlugin from '../../src/integrations/vite-plugin.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [fssPlugin()],
	resolve: {
		alias: {
			'fss-compiler': path.resolve(__dirname, '../../src/index.ts')
		}
	}
});
