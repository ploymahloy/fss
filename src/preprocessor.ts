import postcss from 'postcss';
import valueParser from 'postcss-value-parser';

export async function processVariables(css: string): Promise<string> {
	const variables: Record<string, string> = {};
	const usedVariables = new Set<string>();

	// Extract @define block
	const defineRegex = /@define\s*\{([\s\S]*?)\}/;
	const match = css.match(defineRegex);

	if (match) {
		const rawVars = match[1];
		rawVars?.split(';').forEach(pair => {
			const [key, value] = pair.split(':').map(s => s.trim());
			if (key && value && key.startsWith('$')) {
				variables[key] = value;
			}
		});
	}

	// Remove the @define block from the CSS
	const cleanCss = css.replace(defineRegex, '');

	// Replace variables in the remaining CSS
	const processor = postcss([
		{
			postcssPlugin: 'fss-variables',
			Declaration(decl) {
				decl.value = valueParser(decl.value)
					.walk(node => {
						if (node.type === 'word' && node.value.startsWith('$')) {
							const replacement = variables[node.value];
							if (replacement !== undefined) {
								usedVariables.add(node.value);
								node.value = replacement;
							} else {
								// Variable used but not defined
								throw decl.error(`Variable ${node.value} is not defined in @define`, { word: node.value });
							}
						}
					})
					.toString();
			}
		}
	]);

	const result = await processor.process(cleanCss, { from: undefined });

	const unusedVariables = Object.keys(variables).filter(variable => !usedVariables.has(variable));
	if (unusedVariables.length > 0) {
		if (unusedVariables.length === 1) {
			throw new Error(`Variable ${unusedVariables[0]} is not used`);
		}

		throw new Error(`Variables ${unusedVariables.join(', ')} are not used`);
	}

	return result.css;
}
