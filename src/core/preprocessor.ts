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
		for (const pair of rawVars?.split(';') ?? []) {
			const [key, value] = pair.split(':').map(s => s.trim());
			if (!key || !value || !key.startsWith('$')) continue;
			variables[key] = value;
		}
	}

	const defineKeywordRemoved = css.replace(defineRegex, '');

	const processor = postcss([
		{
			postcssPlugin: 'fss-variables',
			Declaration(decl) {
				decl.value = valueParser(decl.value)
					.walk(node => {
						if (node.type !== 'word' || !node.value.startsWith('$')) return;

						const replacement = variables[node.value];
						// Check for undefined variables
						if (replacement === undefined) {
							throw decl.error(`Variable ${node.value} is not defined in @define`, { word: node.value });
						}

						usedVariables.add(node.value);
						node.value = replacement;
					})
					.toString();
			}
		}
	]);

	const result = await processor.process(defineKeywordRemoved, { from: undefined });

	// Check for unused variables
	const unusedVariables = Object.keys(variables).filter(variable => !usedVariables.has(variable));
	if (unusedVariables.length > 0) {
		const message =
			unusedVariables.length === 1 ?
				`Variable ${unusedVariables[0]} is not used`
			:	`Variables ${unusedVariables.join(', ')} are not used`;
		throw new Error(message);
	}

	return result.css;
}
