import dayjs from "dayjs";
import fromPairs from "lodash/fromPairs";
import toPairs from "lodash/toPairs";
import { mean } from "simple-statistics";
import { Timeseries } from "../index";
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
const annualMonthlyAverageMap = df =>
	new Map(
		df
			.groupBy(row => row.date.year())
			.select(group => {
				const date = group.first().date.startOf("year");
				let ts = new Timeseries(group).downsample(["month", 1], "avg");
				let avg = ts.getSeries("value").average();
				let map = averageMonthlyMap(ts);
				map.set("avg", avg);
				return [date.year(), map];
			})
			.toArray()
	);
const monthlyRollingAverageMap = (
	df,
	{ years = 3, series = "value", aggregator = "average", validOnly = true } = {}
) => {
	let months = df
		.groupBy(row => row.date.startOf("month").toDate())
		.select(group => {
			let date = group.first().date.startOf("month");
			let value = group
				.getSeries(series)
				.where(v => (validOnly ? Boolean(v) : true))
				.average();
			return { date, value };
		})
		.inflate()
		.withIndex(row => row.date.toDate())
		.bake();
	let data = months
		.groupBy(row => row.date.month())
		.select(group => {
			let values = new Map(
				group.rollingWindow(years).select(window => [
					window.last().date.year(),
					window
						.getSeries(series)
						.where(v => (validOnly ? Boolean(v) : true))
						.average() ||
						group
							.getSeries(series)
							.where(v => (validOnly ? Boolean(v) : true))
							.average()
				])
			);
			group
				.where(row => !values.has(row.date.year()))
				.forEach(row => {
					let value =
						months.before(row.date.toDate()).count() > 0
							? months.before(row.date.toDate()).last()[series]
							: months.getSeries(series).average();
					values.set(row.date.year(), value);
				});

			let month = group.first().date.month();
			return [month, values];
		});

	return new Map(data.toArray());
};

const fillMonthlyByMap = monthMap => row => monthMap.get(row.date.month());
const fillMonthlyBAnnualyMap = annualMonthlyMap => row => {
	let month = row.date.month(),
		year = row.date.year();
	if (annualMonthlyMap.has(month)) {
		if (annualMonthlyMap.has(month)) {
			return annualMonthlyMap.get(month).get(year);
		} else {
			return mean([...annualMonthlyMap.get(month).values()]);
		}
	} else {
		return mean(
			[...annualMonthlyMap.values()].map(m =>
				[...m.values()].reduce((a, b) => a.concat(b), [])
			)
		);
	}
};

const pad = (df, { validOnly = true, series = "value" } = {}) => row => {
	let values = df
		.before(row.date.toDate())
		.getSeries(series)
		.where(v => v);
	let value = values.count() > 0 ? values.last() : 0;
	return value;
};
const annualAverage = (
	df,
	{ validOnly = true, series = "value", years = 3, defaultValue } = {}
) => row => {
	let subset = df
		.subset(["date", series])
		.after(row.date.subtract(years, "year").toDate())
		.before(row.date.toDate())
		.bake();
	let values = subset
		.where(r => r.date.month() === row.date.month())
		.where(r => r.date.date() === row.date.date())
		.where(r => r.date.hour() === row.date.hour())
		.where(r => r.date.minute() === row.date.minute())
		.getSeries(series)
		.where(v => v);

	let value;
	if (values.count() < years) {
		value = values
			.appendPair([
				null,
				subset
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
	annualAverage,
	annualMonthlyAverageMap,
	monthlyRollingAverageMap,
	fillMonthlyBAnnualyMap
};
