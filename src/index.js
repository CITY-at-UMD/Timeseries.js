import dayjs from "dayjs";
import dataForge from "data-forge";
import { msToInterval, intervalToMS } from "./lib/Timeseries.interval";
import isEqual from "lodash/isEqual";
import has from "lodash/has";
import get from "lodash/get";
import fromPairs from "lodash/fromPairs";
import {
	gapExists,
	gapFill,
	averageMonthlyMap,
	fillMonthlyByMap,
	pad,
	annualAverage,
	annualMonthlyAverageMap,
	monthlyRollingAverageMap,
	fillMonthlyBAnnualyMap
} from "./lib/Timeseries.fill";
import {
	ckmeans,
	max,
	medianAbsoluteDeviation,
	quantile
} from "simple-statistics";

import {
	rosnerTest,
	boxPlotTest,
	modifiedZScoreTest
} from "./lib/Timeseries.statistics";
import { annualScale, calculateChange } from "./lib/misc";

// export default ;
// Fill Options
export {
	Timeseries,
	annualAverage,
	averageMonthlyMap,
	annualMonthlyAverageMap,
	monthlyRollingAverageMap,
	fillMonthlyBAnnualyMap,
	fillMonthlyByMap,
	pad
};
function Timeseries(data = [], options = {}) {
	// const { msIndex } = options;
	if (data instanceof Timeseries) {
		return data;
	}
	if (data instanceof dataForge.DataFrame) {
		data = data.toArray();
	}

	data = data
		.map(({ date, ...others }) => ({ date: dayjs(date), ...others }))
		.sort((a, b) => a.date.valueOf() - b.date.valueOf());
	let config = {
		// columns: ['date', 'value', 'raw', 'flag'],
		values: data,
		index: data.map(({ date }) => date.toDate()),
		considerAllRows: true
	};
	dataForge.DataFrame.call(this, config);
}

Timeseries.prototype = Object.create(dataForge.DataFrame.prototype);
Timeseries.prototype.constructor = Timeseries;

// Getters
function getValueColumns() {
	return this.detectTypes()
		.where(row => row.Type === "number")
		.distinct(row => row.Column)
		.getSeries("Column")
		.toArray();
}
function interval() {
	const computeInterval = window => window.last() - window.first();
	const intervals = this.getIndex()
		.window(2)
		.select(computeInterval)
		.detectValues()
		.orderBy(row => -row.Frequency);
	// .orderBy(row => row.Value);

	let val = intervals.first().Value;

	return msToInterval(val);
}

function dateRange(unit, adjustment) {
	let start = dayjs(this.first().date),
		end = dayjs(this.last().date);
	if (adjustment) {
		start = start.startOf(adjustment);
		end = end.endOf(adjustment);
	}
	return end.diff(start, unit);
}
Timeseries.prototype.getValueColumns = getValueColumns;
Timeseries.prototype.getInterval = interval;
Timeseries.prototype.getDateRange = dateRange;

// Statistics
function cvrsme(actual, simulated) {
	let df = this.subset([actual, simulated])
		.resetIndex()
		.generateSeries({
			actual: row => row[actual] || 0,
			simulated: row => row[simulated] || 0
		})
		.dropSeries([actual, simulated])
		.generateSeries({ diff: row => row.actual - row.simulated });
	let n = df.count();
	let p = 1.0;
	let ybar = df.getSeries("actual").sum() / n;
	let v = Math.sqrt(df.getSeries("diff").sum() / (n - p)) / ybar;
	return v;
}
function nmbe(actual, simulated) {
	let df = this.subset([actual, simulated])
		.resetIndex()
		.generateSeries({
			actual: row => row[actual] || 0,
			simulated: row => row[simulated] || 0
		})
		.dropSeries([actual, simulated])
		.generateSeries({ diff: row => row.actual - row.simulated });

	let n = df.count();
	let p = 1.0;
	let ybar = df.getSeries("actual").sum() / n;
	let b = df.getSeries("diff").sum() / ((n - p) * ybar);
	return b;
}
Timeseries.prototype.cvrsme = cvrsme;
Timeseries.prototype.nmbe = nmbe;

// Methods
function calculateThresholdOptions({
	k,
	filterZeros = true,
	filterNegative = true
} = {}) {
	let noflags = this.where(
		row =>
			row.flag === null ||
			row.flag === undefined ||
			(Array.isArray(row.flag) && row.flag.length === 0)
	)
		.where(row => !isNaN(row.value) && row.value !== null)
		.getSeries("value");
	if (filterZeros) noflags = noflags.where(value => value !== 0);
	if (filterNegative) noflags = noflags.where(value => value > 0);
	if (!k) {
		k =
			noflags.count() < 1000
				? Math.floor(noflags.count() * 0.15)
				: Math.min(...[1000, Math.floor(noflags.count() * 0.02)]);
	}
	if (noflags.count() < 5) return {};
	let { thresholds: esd } = rosnerTest(noflags.toArray(), k);
	let { thresholds: box } = boxPlotTest(noflags.toArray());
	let { thresholds: modz } = modifiedZScoreTest(noflags.toArray());
	return { esd, box, modz };
}

function getBestThreshold() {
	try {
		let thresholds = this.calculateThresholdOptions();
		const thresholdGroups = ckmeans(
			[
				get(thresholds, "esd.upper", null),
				get(thresholds, "modz.upper", null),
				get(thresholds, "box.lowerOuter", null),
				get(thresholds, "box.upperOuter", null)
			].filter(v => v),
			2
		);
		let threshold_actual = max(
			thresholdGroups.reduce((a, b) => (a.length > b.length ? a : b))
		);
		return threshold_actual;
	} catch (error) {
		console.error(error);
		throw new Error("Cannot determine threshold");
	}
}

function calculateStatistics(options = {}) {
	const {
		column = "value",
		filterZeros = false,
		filterNegative = true
	} = options;
	let series = this.deflate(row => row[column]).where(value => !isNaN(value));
	if (filterNegative) series = series.where(value => value >= 0);
	if (filterZeros) series = series.where(value => value !== 0);
	let median = series.median();
	let mean = series.average();
	let count = series.count();
	let std = series.std();
	let min = series.min();
	let max = series.max();
	let mad = medianAbsoluteDeviation(series.toArray());
	let q1 = quantile(series.toArray(), 0.25);
	let q3 = quantile(series.toArray(), 0.75);
	let iqr = q3 - q1;
	let stats = {
		median,
		mean,
		count,
		std,
		min,
		max,
		mad,
		q1,
		q3,
		iqr
	};
	return stats;
}

Timeseries.prototype.calculateStatistics = calculateStatistics;
Timeseries.prototype.calculateThresholdOptions = calculateThresholdOptions;
Timeseries.prototype.getBestThreshold = getBestThreshold;

// Chainable Methods
function betweenDates(start, end) {
	start = dayjs(start).toDate();
	end = dayjs(end).toDate();
	let df = this.between(start, end);
	return new Timeseries(df);
}
Timeseries.prototype.betweenDates = betweenDates;

function transformAllSeries(adjustmentFunction, { exclude }) {
	let df = this;
	let columns = (columns = df
		.detectTypes()
		.where(row => row.Type === "number")
		.distinct(row => row.Column)
		.getSeries("Column")
		.toArray());
	if (exclude && Array.isArray(exclude)) {
		columns = columns.filter(col => exclude.indexOf(col) === -1);
	}
	columns.forEach(col => {
		df = df.transformSeries({
			[col]: value => {
				if (isNaN(value)) {
					return value;
				} else {
					return adjustmentFunction(value);
				}
			}
		});
	});
	return df;
}

Timeseries.prototype.transformAllSeries = transformAllSeries;

function reset() {
	let df = this.withSeries({
		value: row =>
			row.flag && Array.isArray(row.flag) && row.flag.length > 0
				? row.raw
				: row.value
	})
		.subset(["date", "value"])
		.where(row => !isNaN(row.value) && row.value !== null);
	return new Timeseries(df);
}
Timeseries.prototype.reset = reset;

function group(interval, toArray) {
	if (["hour", "day", "month", "year"].indexOf(interval) === -1)
		throw new Error("interval type not supported");
	let dateComparison = row => dayjs(row.date).startOf(interval);
	let groups = this.groupBy(dateComparison);
	return groups;
}

Timeseries.prototype.group = group;

function removeOutliers({ series = "value", lower, upper } = {}) {
	if (lower > upper) throw new Error("thresholds invalid");
	let outlierCheck = (value, lower, upper) => value < lower || value > upper;

	let outliers = this.where(row => outlierCheck(row[series], lower, upper))
		.generateSeries({
			raw: row => row[series],
			flag: ({ flag = [] }) => ["outlier", ...flag]
		})
		.transformSeries({
			[series]: value => null
		});

	let merged = this.merge(outliers);
	return new Timeseries(merged);
}

Timeseries.prototype.removeOutliers = removeOutliers;
Timeseries.prototype.clean = removeOutliers;

function downsample([duration, value], fillType = "sum") {
	if (["hour", "day", "month", "year"].indexOf(duration) === -1)
		throw new Error("interval type not supported");
	if (["sum", "avg", "median"].indexOf(fillType) === -1) {
		throw new Error("aggregation type not suppported, only:");
	}
	let dateComparison = row => row.date.startOf(duration);
	let valueColumns = this.getValueColumns();
	if (value) {
		dateComparison = row => row.date.startOf(duration).add(value, duration);
	}
	let df = this.groupBy(dateComparison)
		.select(group => {
			const date = group.first().date.startOf(duration);
			return {
				date,
				...fromPairs([
					...valueColumns.map(col => {
						let value;
						switch (fillType) {
							case "median":
								value = group
									.deflate(row => row[col])
									.where(v => !isNaN(v) && v !== null)
									.median();
								break;
							case "avg":
								value = group
									.deflate(row => row[col])
									.where(v => !isNaN(v) && v !== null)
									.average();
								break;
							default:
								// sum
								value = group
									.deflate(row => row[col])
									.where(v => !isNaN(v) && v !== null)
									.sum();
								break;
						}
						return [col, value];
					}),
					...group
						.getColumnNames()
						.filter(col => col !== "date")
						.filter(col => valueColumns.indexOf(col) === -1)
						.map(col => {
							let value = group
								.deflate(row => row[col])
								.distinct()
								.toArray();
							if (value.length === 1) value = value[0];
							return [col, value];
						})
				])
			};
		})
		.inflate()
		.withIndex(row => dayjs(row.date).toDate());
	return new Timeseries(df);
}

Timeseries.prototype.downsample = downsample;
function downsampleClean([duration, value], threshold = 0.8) {
	if (["hour", "day", "month", "year"].indexOf(duration) === -1)
		throw new Error("interval type not supported");
	let dateComparison = row => row.date.startOf(duration);
	let valueColumns = this.getValueColumns();
	if (value) {
		dateComparison = row => row.date.startOf(duration).add(value, duration);
	}
	let df = this.groupBy(dateComparison)
		.select(group => {
			const date = group.first().date.startOf(duration);
			let quality = new Timeseries(group).dataQuality().setIndex("flag");
			let clean = quality.at("clean").percent;
			return {
				date,
				value:
					clean >= threshold
						? group
								.deflate(row => row.value)
								.where(v => !isNaN(v) && v !== null)
								.sum()
						: null
			};
		})
		.inflate()
		.withIndex(row => dayjs(row.date).toDate());
	return new Timeseries(df);
}
Timeseries.prototype.downsampleClean = downsampleClean;
function upsample([duration, value], fillType = "avg") {
	// Dont use this b/c it has the raw and flag values
	let df = this.fillGaps(
		gapExists([duration, value]),
		gapFill(fillType, [duration, value])
	);
	return new Timeseries(df);
}

Timeseries.prototype.upsample = upsample;

function populate(value, type = "avg") {
	let v;
	switch (type) {
		case "fill":
			v = value;
			break;
		default:
			v = value / this.count();
			break;
	}
	let df = this.generateSeries({ value: row => v });
	return new Timeseries(df);
}

Timeseries.prototype.populate = populate;

function reduceToValue(columnNames) {
	function chooseValue(row, columnNames = []) {
		let values = columnNames.map(n => row[n]).filter(v => v);
		return values[0] || 0;
	}
	let df = this.generateSeries({
		value: row => chooseValue(row, columnNames)
	}).subset(["date", "value"]);
	return new Timeseries(df);
}

Timeseries.prototype.reduceToValue = reduceToValue;

function cumulativeSum(columns) {
	if (!columns) columns = this.getValueColumns();
	if (columns & !Array.isArray(columns)) columns = [columns];
	let df = this;
	const cumulativeSum = sum => value => (sum += value);
	columns.forEach(s => {
		df = df.withSeries(s, df.getSeries(s).select(cumulativeSum(0)));
	});
	return new Timeseries(df);
}
Timeseries.prototype.cumulativeSum = cumulativeSum;

function totalRows(series = ["value"], colname = "total") {
	let ndf = this.generateSeries({
		[colname]: row => series.map(v => row[v] || 0).reduce((a, b) => a + b, 0)
	});
	return new Timeseries(ndf);
}
Timeseries.prototype.totalRows = totalRows;
Timeseries.prototype.totalRow = totalRows;
Timeseries.prototype.totalColumns = totalRows;

// Baseline Functions
function rollingPercentChange(col = "value", decimal = true) {
	let df = this;
	let delta = df.withSeries("delta", df.getSeries("value").percentChange());
	if (decimal) delta = delta.transformSeries({ delta: value => value / 100 });
	return new Timeseries(delta);
}

Timeseries.prototype.rollingPercentChange = rollingPercentChange;
function baselinePercentChange(baselineDF) {
	// Only Change in Year
	if (!(baselineDF instanceof Timeseries))
		baselineDF = new Timeseries(baselineDF);
	let dfwb;
	if (baselineDF.count() > 1) {
		let interval = this.getInterval();
		let baselineInterval = baselineDF.interval;
		if (!isEqual(interval, baselineInterval)) {
			console.error(interval, baselineInterval);
			throw new Error("baseline and data intervals do not match");
		}
		let indexer;
		switch (interval[0]) {
			case "day":
				indexer = date => `${date.month()}-${date.date()}`;
				break;
			case "month":
				indexer = date => date.month();

				break;
			default:
				indexer = date => 0;
				break;
		}

		let indexedBaseline = baselineDF.withIndex(row => indexer(row.date));
		let getBaselineValue = index => {
			let at = indexedBaseline.at(index);
			if (at && has(at, "value")) {
				return at.value;
			} else {
				return indexedBaseline.getSeries("value").average();
			}
		};
		dfwb = this.generateSeries({
			baseline: row => getBaselineValue(indexer(row.date))
		});
	} else {
		dfwb = this.generateSeries({
			baseline: row => baselineDF.first().value
		});
	}
	dfwb = dfwb.generateSeries({
		delta: row => calculateChange(row.baseline, row.value)
	});
	return new Timeseries(dfwb);
}

Timeseries.prototype.baselinePercentChange = baselinePercentChange;
Timeseries.prototype.addBaselineDelta = baselinePercentChange;

function annualIntensity(normalizeValue = 1) {
	let interval = this.getInterval();
	let annual = this.groupBy(row => row.date.year())
		.select(group => {
			let startDate = group.first().date;
			let endDate = group
				.last()
				.date.add(interval[1] || 1, interval[0] || "month");
			let scaler = annualScale(startDate, endDate);
			return {
				startDate,
				endDate,
				...fromPairs(
					this.getValueColumns().map(col => [
						col,
						(group
							.deflate(row => row[col])
							.where(v => v)
							.sum() *
							scaler) /
							normalizeValue
					])
				)
			};
		})
		.inflate()
		.renameSeries({ startDate: "date" })
		.dropSeries("endDate");
	return new Timeseries(annual);
}

Timeseries.prototype.annualIntensity = annualIntensity;

// Fill Functions

function fillMissing() {
	let df = this;
	let startDate = df.first().date.toDate(),
		endDate = df.last().date.toDate();
	let interval = df.getInterval();
	let bdf = Timeseries.blank(
		startDate,
		endDate,
		interval,
		"missing"
	).withIndex(row => row.date.valueOf());
	let m = bdf.merge(df.withIndex(row => row.date.valueOf())).generateSeries({
		flag: row =>
			row.value === null || row.value === undefined ? row.flag : undefined
	});
	m = new Timeseries(m);
	return m;
}
Timeseries.prototype.fillMissing = fillMissing;

function fillNull({ series = "value", value, callback }) {
	const seriesCheck = row => row[series] === null || row[series] === undefined;
	if (callback) {
		let df = this.generateSeries({
			flag: row =>
				seriesCheck(row) ? ["fill", ...(row.flag || [])] : row.flag,
			[series]: row => (seriesCheck(row) ? callback(row) : row[series])
		});
		return new Timeseries(df);
	} else if (value) {
		let df = this.generateSeries({
			flag: row => (seriesCheck(row) ? ["fill", ...(row.flag || [])] : row.flag)
		}).transformSeries({
			[series]: currentValue =>
				currentValue === null || currentValue === undefined
					? value
					: currentValue
		});
		return new Timeseries(df);
	} else {
		return this;
	}
}
Timeseries.prototype.fillNull = fillNull;

function zeroFaultDetection(thresholdInterval) {
	if (!Array.isArray(thresholdInterval))
		thresholdInterval = [thresholdInterval, 1];
	thresholdInterval = intervalToMS(thresholdInterval);
	let df = this;
	let zeroFaultDates = df
		.where(row => row.value === 0)
		.ensureSeries(
			"interval",
			df
				.where(row => row.value === 0)
				.getSeries("date")
				.amountChange()
		)
		.where(v => v.interval <= thresholdInterval)
		.subset(["date"])
		.generateSeries({ value: row => null, flag: row => ["zeroFault"] });

	let zeroFaultDF = new Timeseries(this.merge(zeroFaultDates));
	return zeroFaultDF;
}

Timeseries.prototype.zeroFaultDetection = zeroFaultDetection;

function dataQuality() {
	let count = this.count();
	let withFlags = this.where(r => Array.isArray(r.flag) && r.flag.length > 0)
		.groupBy(r => r.flag.toString())
		.select(group => ({
			flag: group.first().flag,
			count: group.count(),
			percent: group.count() / count
		}))
		.inflate();
	let good = this.where(
		r =>
			r.flag === undefined ||
			r.flag === null ||
			(Array.isArray(r.flag) && r.flag.length === 0)
	).count();
	let quality = withFlags
		.appendPair([
			withFlags.count(),
			{ flag: "clean", count: good, percent: good / count }
		])
		.orderByDescending(row => row.count);
	return quality;
}

Timeseries.prototype.dataQuality = dataQuality;

function monthlyWithQual() {
	let interval = this.getInterval();
	let ms = intervalToMS(interval);
	const duration = "month";
	let dateComparison = row =>
		dayjs(row.date)
			.startOf()
			.valueOf();
	let ts = this.groupBy(dateComparison)
		.select(group => {
			const date = dayjs(group.first().date)
				.startOf(duration)
				.toDate();
			let fullCount = Math.floor(
				dayjs(date)
					.endOf("month")
					.diff(dayjs(date), "millisecond") / ms
			);
			let days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
			let count = group
				.getSeries("value")
				.where(v => v && v !== 0)
				.toArray().length;
			let value = group
				.getSeries("value")
				.where(v => !isNaN(v))
				.sum();
			return {
				date,
				value: isNaN(value) ? 0 : value,
				count,
				fullCount,
				score: count / fullCount
			};
		})
		.inflate()
		.withIndex(row => row.date.toDate());
	return new Timeseries(ts);
}
Timeseries.prototype.monthlyWithQual = monthlyWithQual;

function threeYearAverage(date, series = "value", defaultValue) {
	date = dayjs(date);
	if (!defaultValue)
		defaultValue = this.getSeries(series)
			.where(v => !isNaN(v) && v !== null)
			.average();

	// let months = df
	// 	.before(date.valueOf())
	// 	.where(row => dayjs(row.date).month() === date.month())
	// 	.where(row => row.score > 0.9)
	// 	.tail(3);
	let months = this.before(date.toDate())
		.where(row => row.date.month() === date.month())
		.orderBy(row => dayjs(row.date))
		.tail(3);
	// .where(row => row.score > 0.9);
	if (months.count() > 0) {
		let val = months
			.getSeries(series)
			.where(v => !isNaN(v) && v !== null)
			.average();
		return val;
	} else {
		return defaultValue;
	}
}
Timeseries.prototype.threeYearAverage = threeYearAverage;

function averageFill() {
	let df = this;
	let avg = df
		// .where(row => row.score ?row.score >= 0.9)
		.getSeries("value")
		.where(v => !isNaN(v) && v !== null)
		.average();
	let monthlyAvg = df
		.generateSeries({
			rollingAverage: row => df.threeYearAverage(row.date, "value", avg)
		})
		.generateSeries({
			flag: row => (row.value ? row.flag : ["filled", ...(row.flag || [])])
		})
		.generateSeries({
			value: row => (row.value ? row.value : row.rollingAverage)
		})
		.dropSeries(["rollingAverage"]);
	return new Timeseries(monthlyAvg);
}

Timeseries.prototype.averageFill = averageFill;
function toArray() {
	const values = [];
	for (const value of this.getContent().values) {
		if (value !== undefined) {
			values.push(value);
		}
	}
	return values.map(({ date, ...others }) => ({
		date: date.toDate(),
		...others
	}));
}
Timeseries.prototype.toArray = toArray;

function atDate(date) {
	if (this.none()) {
		return undefined;
	}
	date = dayjs(date).valueOf();

	for (const pair of this.getContent().pairs) {
		if (pair[0].valueOf() === date) {
			return pair[1];
		}
	}
	return undefined;
}
Timeseries.prototype.atDate = atDate;

// Static Methods
function blank(startDate, endDate, [duration, value = 1], flag) {
	if (["minute", "hour", "day", "month", "year"].indexOf(duration) < 0) {
		console.error(interval);
		throw new Error("interval type not supported");
	}
	startDate = dayjs(startDate);
	endDate = dayjs(endDate);
	let dates = [startDate];
	let interval = intervalToMS([duration, value]);
	while (dates[dates.length - 1].valueOf() < endDate.valueOf()) {
		dates.push(dayjs(dates[dates.length - 1]).add(value, duration));
	}
	let df = new Timeseries(dates.map(date => ({ date })));

	if (flag) {
		df = new Timeseries(
			df.generateSeries({
				flag: row => [flag]
			})
		);
	}

	return df;
}
Timeseries.blank = blank;
function aggregate(dataframes) {
	if (!Array.isArray(dataframes)) dataframes = [dataframes];
	dataframes = dataframes.map(df => new Timeseries(df));
	const valueColumns = new Set(
		dataframes.map(df => df.getValueColumns()).reduce((a, b) => a.concat(b), [])
	);
	const concatenated = dataForge.DataFrame.concat(dataframes)
		.groupBy(row => row.date)
		.select(group => {
			const date = group.first().date;
			let o = { date };
			valueColumns.forEach(c => (o[c] = group.deflate(row => row[c]).sum()));
			group
				.getColumnNames()
				.filter(col => col !== "date")
				.filter(col => valueColumns.has(col) === -1)
				.forEach(col => {
					let value = group
						.deflate(row => row[col])
						.distinct()
						.toArray();
					if (value.length === 1) value = value[0];
					o[col] = value;
					return;
				});
			return o;
		})
		.inflate();
	return new Timeseries(concatenated);
}

Timeseries.aggregate = aggregate;
Timeseries.concat = dataframes => {
	if (!Array.isArray(dataframes)) dataframes = [dataframes];
	dataframes = dataframes.map(df =>
		new Timeseries(df).withIndex(row => row.date.valueOf())
	);
	let df = dataForge.DataFrame.concat(dataframes);
	return new Timeseries(df);
};
Timeseries.merge = dataframes => {
	if (!Array.isArray(dataframes)) dataframes = [dataframes];
	dataframes = dataframes.map(df =>
		new Timeseries(df).withIndex(row => row.date.valueOf())
	);
	let df = dataForge.DataFrame.merge(dataframes);
	return new Timeseries(df);
};
