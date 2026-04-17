import { compileFSS } from './compiler.js';

interface FssTransformResult {
	code: string;
	map: { mappings: string };
}

export default function fssPlugin() {
	return {
		name: 'vite-plugin-fss',
		async compile(this: any, code: string, id: string): Promise<FssTransformResult | null> {
			if (!id.endsWith('.fss')) {
				return null;
			}

			try {
				const compiledCss: string = await compileFSS(code);
				const jsCode: string = [
					`export default ${JSON.stringify(compiledCss)};`,
					`if (import.meta.hot) {`,
					`  import.meta.hot.accept((newModule) => {`,
					`    if (newModule) {`,
					`      // HMR logic will be implemented here for DOM updates`,
					`    }`,
					`  });`,
					`}`
				].join('\n');

				return {
					code: jsCode,
					map: { mappings: '' }
				};
			} catch (err: any) {
				const errorMessage = `FSS Compilation Error in ${id}: ${err.message}`;

				if (this && typeof this.error === 'function') {
					this.error(errorMessage);
				} else {
					throw new Error(errorMessage);
				}

				return null;
			}
		},

		transform(this: any, code: string, id: string) {
			return this.compile(code, id);
		}
	};
}
