import { FSS_BASE_CSS } from './base-css.js';

let baseStyleSheet: CSSStyleSheet | null = null;

export function getFssBaseStyleSheet(): CSSStyleSheet {
	if (!baseStyleSheet) {
		baseStyleSheet = new CSSStyleSheet();
		baseStyleSheet.replaceSync(FSS_BASE_CSS);
	}
	return baseStyleSheet;
}

export type FssShadowStylesHandle = {
	adopt(shadowRoot: ShadowRoot): void;
	update(compiledComponentCss: string): void;
};

export function createFssShadowStyles(compiledComponentCss: string): FssShadowStylesHandle {
	const componentSheet = new CSSStyleSheet();
	componentSheet.replaceSync(compiledComponentCss);

	return {
		adopt(shadowRoot: ShadowRoot): void {
			shadowRoot.adoptedStyleSheets = [getFssBaseStyleSheet(), componentSheet];
		},
		update(nextCss: string): void {
			componentSheet.replaceSync(nextCss);
		}
	};
}
