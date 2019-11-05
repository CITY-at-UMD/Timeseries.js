import { DataFrame } from "data-forge";

const zerogrouping = dataframe => {
	// group sequential
	let df = dataframe.variableWindow((a, b) => a.value === b.value);
};

function zeroCheck(threshold = 2) {
	let zeroGroups = this.variableWindow((a, b) => {
		return a.value === b.value && a.value === 0;
	}).where(window => window.getIndex().count() >= threshold);
	let zeroSummary = zeroGroups
		.select(window => ({
			start: window.first().date,
			end: window.last().date,
			count: window.count()
		}))
		.inflate(); // Series -> dataframe.
	// .toArray()
	return { zeroSummary, zeroGroups };
}

function zeroReplacement(threshold) {
	let { zeroGroups } = this.zeroCheck(df, threshold);
	let dfs = zeroGroups.toArray().map(zdf => {
		zdf = zdf
			.transformSeries({
				value: () => null,
				raw: 0,
				flag: value => ["zero", ...(value || [])]
			})
			.withIndex(row => new Date(row.date).valueOf());
		return zdf;
	});
	let merged = DataFrame.merge([df, ...dfs]);

	return merged;
}
export { zerogrouping, zeroReplacement, zeroCheck };
