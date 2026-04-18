import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

export function extractClasses(css: string): string[] {
	const classSet = new Set<string>();
	const root = postcss.parse(css);

	const processor = selectorParser(selectors => {
		selectors.walkClasses(classNode => {
			classSet.add(classNode.value);
		});
	});

	root.walkRules(rule => {
		processor.processSync(rule.selector);
	});

	return Array.from(classSet);
}
