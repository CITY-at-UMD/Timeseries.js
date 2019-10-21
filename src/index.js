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

const Timeseries = dataForge.DataFrame;

function setDateIndex(col = "date") {
	if (this.getColumnNames().indexOf(col) === -1)
		throw new Error("No Date Column in DataFrame");
	return this.orderBy(row => row[col].valueOf()).withIndex(row =>
		dayjs(row.date).toDate()
	);
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

function getValueColumns() {
	return this.detectTypes()
		.where(row => row.Type === "number")
		.distinct(row => row.Column)
		.getSeries("Column")
		.toArray();
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
function claculateStatistics(options = {}) {
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

function removeOutliers({
	column = "value",
	lowerThreshold,
	upperThreshold
} = {}) {
	if (lowerThreshold > upperThreshold) throw new Error("thresholds invalid");
	let outlierCheck = (value, lowerThreshold, upperThreshold) =>
		value < lowerThreshold || value > upperThreshold;
	let outliers = this.where(row => outlierCheck(row.value))
		.generateSeries({
			raw: row => row.value,
			flag: ({ flag = [] }) => ["outlier", ...flag]
		})
		.transformSeries({
			value: row => null
		});
	let df = this.merge(outliers);
	return df;
}
function reset() {
	return this.withSeries({
		value: row =>
			row.flag && Array.isArray(row.flag) && row.flag.length > 0
				? row.raw
				: row.value
	}).dropSeries(["flag", "raw"]);
}
function group(interval, toArray) {
	if (["hour", "day", "month", "year"].indexOf(interval) === -1)
		throw new Error("interval type not supported");
	let dateComparison = row => dayjs(row.date).startOf(interval);
	let groups = this.groupBy(dateComparison);
	return groups;
}
function upsample([duration, value], fillType = "avg") {
	// Dont use this b/c it has the raw and flag values
	let df = this.fillGaps(
		gapExists([duration, value]),
		gapFill(fillType, [duration, value])
	);
	return df;
}
function downsample([duration, value], fillType = "sum") {
	if (["hour", "day", "month", "year"].indexOf(duration) === -1)
		throw new Error("interval type not supported");
	if (["sum", "avg", "median"].indexOf(fillType) === -1) {
		throw new Error("aggregation type not suppported, only:");
	}
	let dateComparison = row => row.date.startOf(duration);
	let valueColumns = this.valueColumns;
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
									.where(v => v)
									.median();
								break;
							case "avg":
								value = group
									.deflate(row => row[col])
									.where(v => v)
									.average();
								break;
							default:
								// sum
								value = group
									.deflate(row => row[col])
									.where(v => v)
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
	return df;
}
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
	return df;
}
function fill() {
	let startDate = this.first().date.toDate(),
		endDate = this.last().date.toDate();
	let interval = this.getInterval();
	let bdf = Timeseries.blank(startDate, endDate, interval, "missing");
	let df = this.joinOuterRight(
		bdf,
		origional => origional.date.valueOf(),
		blank => blank.date.valueOf(),
		(data, fill) => {
			if (data) {
				return data;
			} else {
				return fill;
			}
		}
	);
	return df;
}
function reduceToValue(columnNames) {
	function chooseValue(row, columnNames = []) {
		let values = columnNames.map(n => row[n]).filter(v => v);
		return values[0] || 0;
	}
	let df = this.generateSeries({
		value: row => chooseValue(row, columnNames)
	}).subset(["date", "value"]);
	return df;
}
// Specific Functions
function addBaselineDelta(baselineDF) {
	// Only Change in Year
	if (!(baselineDF instanceof Timeseries))
		baselineDF = new Timeseries(baselineDF).setDateIndex();
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
	return dfwb;
}
function annualMonthlyAverage({ startDate, endDate }) {
	let months = this.downsample(["month", 1], "sum").between(startDate, endDate);
	let avg = months.getSeries("value").average();
}
// Building Functions
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
					this.valueColumns.map(col => [
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
	return annual;
}
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
	let df = new Timeseries(dates.map(date => ({ date }))).setDateIndex();
	if (flag)
		df = df.generateSeries({
			flag: row => [flag]
		});
	return df;
}
function aggregate(dataframes) {
	if (!Array.isArray(dataframes)) dataframes = [dataframes];
	dataframes = dataframes.map(df => new Timeseries(df).setDateIndex());
	const valueColumns = [
		...new Set(
			dataframes
				.map(df => df.getValueColumns())
				.reduce((a, b) => a.concat(b), [])
		)
	];
	const concatenated = dataForge.DataFrame.concat(dataframes)
		.groupBy(row => row.date)
		.select(group => {
			const date = group.first().date;
			let o = { date };
			valueColumns.forEach(c => (o[c] = group.deflate(row => row[c]).sum()));
			return o;
		})
		.inflate()
		.toArray();
	return new Timeseries(concatenated.toArray()).setDateIndex();
}
Timeseries.prototype.setDateIndex = setDateIndex;
Timeseries.prototype.getInterval = interval;
Timeseries.prototype.getValueColumns = getValueColumns;
Timeseries.prototype.getDateRange = dateRange;
Timeseries.prototype.calculateThresholdOptions = calculateThresholdOptions;
Timeseries.prototype.claculateStatistics = claculateStatistics;
Timeseries.prototype.transformAllSeries = transformAllSeries;
Timeseries.prototype.removeOutliers = removeOutliers;
Timeseries.prototype.clean = removeOutliers;
Timeseries.prototype.group = group;
Timeseries.prototype.downsample = downsample;
Timeseries.prototype.upsample = upsample;
Timeseries.prototype.populateSeries = populate;
Timeseries.prototype.fill = fill;
Timeseries.prototype.reduceToValue = reduceToValue;
Timeseries.prototype.annualIntensity = annualIntensity;
Timeseries.prototype.addBaselineDelta = addBaselineDelta;

Timeseries.blank = blank;
Timeseries.aggregate = aggregate;

export default Timeseries;
