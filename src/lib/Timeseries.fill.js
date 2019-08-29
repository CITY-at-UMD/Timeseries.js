import dayjs from "dayjs";

const gapExists = ([duration, durationValue = 1]) => (pairA, pairB) => {
	const startDate = pairA[0];
	const endDate = pairB[0];
	let gapSize = Math.floor(
		dayjs(endDate).diff(startDate, duration, true) / durationValue
	);
	if (gapSize > 0) return true;
	return false;
};
const gapExists_old = (interval, maxGap) => (pairA, pairB) => {
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

const gapFillNull = ([duration, durationValue], flag) => (pairA, pairB) => {
	const startDate = pairA[0];
	const endDate = pairB[0];
	let gapSize = Math.floor(
		dayjs(endDate).diff(startDate, duration) / durationValue
	);
	const numEntries = gapSize - 1;
	const newEntries = [];

	for (let entryIndex = 0; entryIndex < numEntries; ++entryIndex) {
		let date = dayjs(startDate)
			.add((entryIndex + 1) * durationValue, duration)
			.toDate();
		newEntries.push([
			date.valueOf(),
			{ date, value: null, ...(flag && { flag: [flag] }) }
		]);
	}
	return newEntries;
};
const gapFillBlank = gapFillNull;

const valueFiller = (
	fillType,
	{ startValue, endValue, entryIndex, numEntries },
	{ overrideValue, dateFunction, date, flag: overRideFlag }
) => {
	if (
		["pad", "interpolate", "average"].indexOf(fillType) !== -1 &&
		(!startValue || !endValue || !entryIndex || !numEntries)
	)
		throw new Error("fill Type not supported without date, index and entries");
	let value, flag;
	if (fillType === "pad") {
		value = startValue.value;
		if (overrideValue) value = overrideValue;

		flag = ["fill", fillType];
	} else if (fillType === "interpolate") {
		value =
			startValue.value +
			(entryIndex + 1) * ((endValue.value - startValue.value) / numEntries);
		if (overrideValue) value = overrideValue;

		flag = ["fill", fillType];
	} else if (fillType === "average") {
		value = (startValue.value + endValue.value) / numEntries;
		if (overrideValue) value = overrideValue / numEntries;
		flag = ["fill", fillType];
	} else if (fillType === "dateFunction" && dateFunction) {
		value = dateFunction(date);
		flag = ["fill", fillType];
	} else if (fillType === "value" && !isNaN(overrideValue) && overrideValue) {
		value = overrideValue;
		flag = ["fill", fillType];
	} else {
		value = null;
		flag = ["fill"];
	}
	if (overRideFlag) flag = overRideFlag;
	return { value, flag };
};

const gapFill = (
	fillType,
	[duration, durationValue],
	{ overrideValue, dateFunction, flag } = {}
) => (pairA, pairB) => {
	// Fill values forward.
	const startDate = pairA[0];
	const endDate = pairB[0];
	let gapSize = Math.floor(
		dayjs(endDate).diff(startDate, duration) / durationValue
	);
	const numEntries = gapSize - 1;
	const startValue = pairA[1];
	const endValue = pairB[1];
	const newEntries = [];
	for (let entryIndex = 0; entryIndex < numEntries; ++entryIndex) {
		let adjustment = valueFiller(
				fillType,
				{ startValue, endValue, entryIndex, numEntries },
				{
					overrideValue,
					dateFunction,
					flag
				}
			),
			date = dayjs(startDate)
				.add((entryIndex + 1) * durationValue, duration)
				.toDate();

		let e = [date.valueOf(), Object.assign({}, adjustment, { date })];
		newEntries.push(e);
	}
	return newEntries;
};

export { gapExists, gapFill, gapFillBlank, gapFillNull, valueFiller };
