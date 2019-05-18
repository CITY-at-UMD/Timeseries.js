const dayjs = require("dayjs");

const gapExists = (interval, maxGap) => (pairA, pairB) => {
	const startDate = pairA[0];
	const endDate = pairB[0];
	const gapSize = dayjs(endDate).diff(startDate);
	if (maxGap && maxGap > gapSize) return false;
	if (gapSize > interval) return true;
	return false;
};

const gapFill = (
	sourceColumnName,
	fillType,
	interval,
	{ overrideValue } = {}
) => (pairA, pairB) => {
	// Fill values forward.
	const startDate = pairA[0];
	const endDate = pairB[0];
	const gapSize = dayjs(endDate).diff(startDate) / interval;
	const numEntries = gapSize - 1;
	const startValue = pairA[1];
	const endValue = pairB[1];
	const newEntries = [];
	for (let entryIndex = 0; entryIndex < numEntries; ++entryIndex) {
		let adjustment;
		let date = dayjs(startDate)
			.add(interval * (entryIndex + 1), "milliseconds")
			.toDate();
		if (fillType === "pad") {
			let value = startValue[sourceColumnName];
			if (overrideValue) value = overrideValue;
			adjustment = {
				value,
				flag: ["fill", fillType]
			};
		} else if (fillType === "interpolate") {
			let value =
				startValue[sourceColumnName] +
				(entryIndex + 1) *
					((endValue[sourceColumnName] -
						startValue[sourceColumnName]) /
						numEntries);
			if (overrideValue) value = overrideValue;
			adjustment = {
				value,
				flag: ["fill", fillType]
			};
		} else if (fillType === "average") {
			let value =
				(startValue[sourceColumnName] + endValue[sourceColumnName]) /
				numEntries;
			if (overrideValue) value = overrideValue / numEntries;
			adjustment = {
				value,
				flag: ["fill", fillType]
			};
		} else {
			adjustment = { value: null, flag: ["fill"] };
		}

		let e = [date.valueOf(), adjustment];
		newEntries.push(e);
	}
	return newEntries;
};

module.exports = { gapExists, gapFill };
