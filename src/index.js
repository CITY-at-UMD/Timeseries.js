import dayjs from "dayjs";
import dataForge from "data-forge";
import { msToInterval, intervalToMS } from "./lib/Timeseries.interval";
import isEqual from "lodash/isEqual";
import has from "lodash/has";
import fromPairs from "lodash/fromPairs";
import { gapExists, gapFill, gapFillBlank } from "./lib/Timeseries.fill";
import { medianAbsoluteDeviation, quantile } from "simple-statistics";
import {
	rosnerTest,
	boxPlotTest,
	modifiedZScoreTest
} from "./lib/Timeseries.statistics";
import { annualScale, calculateChange } from "./lib/misc";
import { zeroCheck } from "./lib/Timeseries.zero";
import { timingSafeEqual } from "crypto";

export default Timeseries;

function Timeseries(data) {
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
		.orderBy(row => -row.Frequency)
		.orderBy(row => row.Value);
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

// Chainable Methods
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

function removeOutliers({
	column = "value",
	lowerThreshold,
	upperThreshold
} = {}) {
	if (lowerThreshold > upperThreshold) throw new Error("thresholds invalid");
	let outlierCheck = (value, lowerThreshold, upperThreshold) =>
		value < lowerThreshold || value > upperThreshold;

	let outliers = this.where(row =>
		outlierCheck(row[column], lowerThreshold, upperThreshold)
	)
		.generateSeries({
			raw: row => row[column],
			flag: ({ flag = [] }) => ["outlier", ...flag]
		})
		.transformSeries({
			[column]: row => null
		});
	// let df = this.withSeries("raw", outliers.getSeries("raw")).withSeries(
	// 	"flag",
	// 	outliers.getSeries("flag")
	// );

	let merged = this.merge(outliers);
	return new Timeseries(merged.toArray());
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

// Baseline Functions

function addBaselineDelta(baselineDF) {
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

Timeseries.prototype.addBaselineDelta = addBaselineDelta;

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
	let startDate = this.first().date.toDate(),
		endDate = this.last().date.toDate();
	let interval = this.getInterval();
	let bdf = Timeseries.blank(startDate, endDate, interval, "missing").withIndex(
		row => row.date.valueOf()
	);
	let m = this.withIndex(row => row.date.valueOf())
		.merge(bdf)
		.transformSeries({
			flag: row => (row.value ? undefined : row.flag)
		});
	return new Timeseries(m);
}
Timeseries.prototype.fillMissing = fillMissing;
function fillNull(v) {
	let df = this.transformSeries({
		value: value => (value === null || value === undefined ? v : value)
	});
	return new Timeseries(df);
}
Timeseries.prototype.fillNull = fillNull;

function zeroReplacement(threshold) {
	let df = this;
	let { zeroGroups } = zeroCheck(df, threshold);
	let dfs = zeroGroups.toArray().map((zdf, i) => {
		zdf = zdf
			.transformSeries({
				value: () => null,
				raw: () => 0,
				flag: value => ["zero", ...(value || [])]
			})
			.withIndex(row => new Date(row.date).valueOf());
		return zdf;
	});
	let merged = df.withIndex(row => row.date.valueOf()).merge(...dfs);
	return new Timeseries(merged);
}
Timeseries.prototype.zeroReplacement = zeroReplacement;

function monthlyWithQual() {
	let duration = "month";
	let dateComparison = row =>
		dayjs(row.date)
			.startOf(duration)
			.valueOf();
	let ts = this.groupBy(dateComparison)
		.select(group => {
			const date = dayjs(group.first().date)
				.startOf(duration)
				.toDate();
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
				days,
				score: count / days
			};
		})
		.inflate()
		.withIndex(row => row.date.toDate());
	return new Timeseries(ts);
}
Timeseries.prototype.monthlyWithQual = monthlyWithQual;

function threeYearAverage(date, column = "value", defaultValue) {
	date = dayjs(date);
	if (!defaultValue)
		defaultValue = this.getSeries("value")
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
			.getSeries(column)
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
	let df = new Timeseries(dates.map(date => ({ date, ...(flag && { flag }) })));
	// if (flag) {
	// 	df = df.generateSeries({
	// 		flag: row => [flag]
	// 	});
	// 	df = new Timeseries(df);
	// }
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
	// .toArray();

	return new Timeseries(concatenated);
}
Timeseries.aggregate = aggregate;
Timeseries.concat = dataframes => {
	if (!Array.isArray(dataframes)) dataframes = [dataframes];
	dataframes = dataframes.map(df => new Timeseries(df));
	let df = dataForge.DataFrame.concat(dataframes);
	return new Timeseries(df);
};
Timeseries.merge = dataframes => {
	if (!Array.isArray(dataframes)) dataframes = [dataframes];
	dataframes = dataframes.map(df => new Timeseries(df));
	let df = dataForge.DataFrame.merge(dataframes);
	return new Timeseries(df);
};
