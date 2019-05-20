const dayjs = require("dayjs");

const gapExists = (interval, maxGap) => (pairA, pairB) => {
	const startDate = pairA[0];
	const endDate = pairB[0];
	let gapSize;
	if (interval === "quarterHour") {
		gapSize = Math.floor(dayjs(endDate).diff(startDate, "minutes") / 15);
	} else {
		gapSize = dayjs(endDate).diff(startDate, interval);
	}
	if (maxGap && maxGap > gapSize) return false;
	if (gapSize > 0) return true;
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
	let gapSize;
	if (interval === "quarterHour") {
		gapSize = Math.floor(dayjs(endDate).diff(startDate, "minutes") / 15);
	} else {
		gapSize = dayjs(endDate).diff(startDate, interval);
	}
	const numEntries = gapSize - 1;
	const startValue = pairA[1];
	const endValue = pairB[1];
	const newEntries = [];
	for (let entryIndex = 0; entryIndex < numEntries; ++entryIndex) {
		let adjustment, date;
		if (interval === "quarterHour") {
			date = dayjs(startDate)
				.add((entryIndex + 1) * 15, "minutes")
				.toDate();
		} else {
			date = dayjs(startDate)
				.add(entryIndex + 1, interval)
				.toDate();
		}
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
