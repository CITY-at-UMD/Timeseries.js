import dayjs from "dayjs";
import fromPairs from "lodash/fromPairs";
import toPairs from "lodash/toPairs";

const gapExists = ([duration, durationValue = 1]) => (pairA, pairB) => {
	const startDate = pairA[0];
	const endDate = pairB[0];
	let gapSize = Math.floor(
		dayjs(endDate).diff(startDate, duration, true) / durationValue
	);

	if (gapSize > 0) return true;
	return false;
};

const valueFiller = (
	fillType,
	{ startValue, endValue, entryIndex, numEntries },
	{ overrideValue, dateFunction, date, flag }
) => {
	if (
		["pad", "interpolate", "average", "dateFunction", "value"].indexOf(
			fillType
		) === -1
	) {
		throw new Error("fill Type not supported");
	}
	let value;
	if (fillType === "pad") {
		value = fromPairs(
			toPairs(startValue).map(([key, val]) => {
				return [key, startValue[key]];
			})
		);

		flag = flag ? flag : ["fill", "pad"];
	} else if (fillType === "interpolate") {
		value = fromPairs(
			toPairs(startValue).map(([key, val]) => {
				let nv =
					startValue[key] +
					(entryIndex + 1) *
						((endValue[key] - startValue[key]) / (numEntries + 1));
				return [key, nv];
			})
		);

		flag = flag ? flag : ["fill", fillType];
	} else if (fillType === "average") {
		value = fromPairs(
			toPairs(startValue).map(([key, val]) => {
				let nv = (startValue[key] + endValue[key]) / numEntries;
				return [key, nv];
			})
		);

		flag = flag ? flag : ["fill", fillType];
	} else if (fillType === "dateFunction" && dateFunction) {
		value = fromPairs(
			toPairs(startValue).map(([key, val]) => {
				let nv = dateFunction(date);
				return [key, nv];
			})
		);
		flag = flag ? flag : ["fill", fillType];
	} else if (fillType === "value") {
		value = fromPairs(
			toPairs(startValue).map(([key, val]) => {
				let nv;
				if (typeof overrideValue === "number") {
					nv = overrideValue;
				} else {
					nv = overrideValue[key];
				}
				return [key, nv];
			})
		);
		flag = flag ? flag : ["fill", fillType];
	} else {
		value = fromPairs(
			toPairs(startValue).map(([key, val]) => {
				return [key, null];
			})
		);
		flag = ["fill"];
	}
	return { ...value, flag };
};

const gapFill = (
	fillType,
	[duration, durationValue],
	{ overrideValue, dateFunction, flag } = {}
) => (pairA, pairB) => {
	// Fill values forward.

	const startDate = dayjs(pairA[0]);
	const endDate = dayjs(pairB[0]);
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

// Basic Fill Functions
const averageMonthlyMap = df =>
	new Map(
		df
			.group("month")
			.select(group => ({
				month: group.first().date.month(),
				value: group
					.getSeries("value")
					.where(v => v)
					.average()
			}))
			.toArray()
			.map(({ month, value }) => [month, value])
	);
const fillMonthlyByMap = monthMap => row => monthMap.get(row.date.month());

const pad = (df, { validOnly = true, series = "value" } = {}) => row => {
	let values = df
		.before(row.date.toDate())
		.getSeries(series)
		.where(v => v);
	let value = values.count() > 0 ? values.last() : 0;
	// console.log(row.date.toDate(), value);
	return value;
};
const annualAverage = (
	df,
	{ validOnly = true, series = "value", years = 3, defaultValue } = {}
) => row => {
	df = df.subset(["date", series]).before(row.date.toDate());
	let values = df
		.where(r => r.date.year(row.date.year()).isSame(row.date))
		.after(row.date.subtract(years, "year"))
		.getSeries(series)
		.where(v => v)
		.bake();

	let value;
	if (values.count() < years) {
		value = values
			.appendPair([
				null,
				df
					.getSeries(series)
					.where(v => v)
					.average()
			])
			.average();
	} else {
		value = values.average();
	}
	return value;
};
export {
	gapExists,
	gapFill,
	averageMonthlyMap,
	fillMonthlyByMap,
	pad,
	annualAverage
};
