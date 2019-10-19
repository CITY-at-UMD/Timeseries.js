import { DataFrame } from "data-forge";
import dayjs from "dayjs";
// const isBetween = require('dayjs/plugin/isBetween')
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
const annualScale = (start, end) => 365 / dayjs(end).diff(dayjs(start), "day");
const calculateChange = (baseline, value) => (value - baseline) / baseline;

class Timeseries extends DataFrame {
	constructor(data = []) {
		if (data instanceof Timeseries) return data;
		if (data instanceof DataFrame) {
			data = data.toArray();
		}
		// sort
		data = data
			.map(({ date, ...others }) => ({ date: dayjs(date), ...others }))
			.sort((a, b) => a.date.valueOf() - b.date.valueOf());
		let config = {
			values: data,
			index: data.map(({ date }) => date.toDate()),
			considerAllRows: true
		};
		super(config);
	}
	get interval() {
		function computeInterval(window) {
			return window.last() - window.first();
		}
		const intervals = this.getIndex()
			.window(2)
			.select(computeInterval)
			.detectValues()
			.orderBy(row => -row.Frequency)
			.orderBy(row => row.Value);
		// console.log(intervals.toString());
		let val = intervals.first().Value;
		return msToInterval(val);
	}
	get valueColumns() {
		return this.detectTypes()
			.where(row => row.Type === "number")
			.distinct(row => row.Column)
			.getSeries("Column")
			.toArray();
	}
	dateRange(unit, adjustment) {
		let start = dayjs(this.first().date),
			end = dayjs(this.last().date);
		if (adjustment) {
			start = start.startOf(adjustment);
			end = end.endOf(adjustment);
		}
		return end.diff(start, unit);
	}
	at(date) {
		return super.at(dayjs(date));
	}
	calculateThresholds({ k, filterZeros = true, filterNegative = true } = {}) {
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
	calculateStatistics({
		column = "value",
		filterZeros = false,
		filterNegative = true
	} = {}) {
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
	dataQuality() {
		let count = this.count();
		let valid = this.getSeries("flag")
			.where(
				value =>
					value === null ||
					value === undefined ||
					(Array.isArray(value) && value.length === 0)
			)
			.count();
		let missing = this.getSeries("flag")
			.where(value => Array.isArray(value))
			.where(value => value.indexOf("missing") !== -1)
			.count();
		let invalid = this.getSeries("flag")
			.where(value => Array.isArray(value))
			.where(value => value.indexOf("outlier") !== -1)
			.count();
		let zeroFill = this.getSeries("flag")
			.where(value => Array.isArray(value))
			.where(value => value.indexOf("zeroFill") !== -1)
			.count();
		let breakdown = {
			valid: valid / count,
			missing: missing / count,
			invalid: invalid / count
		};
		let report = {
			accuracy: 0,
			completeness: 0,
			consistency: 0
		};
		return {};
	}
	// Chainable Methods
	transformAll(adjustmentFunction = v => v, columns) {
		let df = this;
		if (!columns) {
			columns = df
				.detectTypes()
				.where(row => row.Type === "number")
				.distinct(row => row.Column)
				.getSeries("Column")
				.toArray();
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
		return new Timeseries(df);
	}
	removeOutliers({ lowerThreshold, upperThreshold } = {}) {
		if (lowerThreshold > upperThreshold) throw new Error("thresholds invalid");
		let outlierCheck = (value, lowerThreshold, upperThreshold) =>
			value < lowerThreshold || value > upperThreshold;
		let df = this.generateSeries({
			raw: row =>
				outlierCheck(row.value, lowerThreshold, upperThreshold)
					? row.value
					: null,
			flag: row =>
				outlierCheck(row.value, lowerThreshold, upperThreshold)
					? ["outlier"]
					: null
		}).transformSeries({
			value: value =>
				outlierCheck(value, lowerThreshold, upperThreshold) ? null : value
		});
		return new Timeseries(df);
	}
	reset() {
		return this.withSeries({
			value: row => (row.raw && !isNaN(row.raw) ? row.raw : row.value)
		}).dropSeries(["flag", "raw"]);
	}
	group(interval, toArray) {
		if (["hour", "day", "month", "year"].indexOf(interval) === -1)
			throw new Error("interval type not supported");
		let dateComparison = row => dayjs(row.date).startOf(interval);
		let groups = this.groupBy(dateComparison);
		return groups;
	}
	// Not Working Yet, downsample and upsample independently work
	resample([duration, value = 1], fillType) {
		if (["hour", "day", "month", "year"].indexOf(duration) === -1)
			throw new Error("interval type not supported");
		let interval = this.interval;
		if (isEqual(interval, [duration, value])) {
			return this;
		}
		let d0 = dayjs(0);
		let currentSampleDiff = dayjs(0)
			.add(interval[1], interval[0])
			.diff(d0);
		let newSampleDiff = dayjs(0)
			.add(value, duration)
			.diff(d0);
		if (currentSampleDiff < newSampleDiff) {
			return this.downsample([duration, value], fillType);
		} else {
			return this.upsample([duration, value], fillType);
		}
	}
	upsample([duration, value], fillType = "avg") {
		// Dont use this b/c it has the raw and flag values
		let df = this.fillGaps(
			gapExists([duration, value]),
			gapFill(fillType, [duration, value])
		);
		return new Timeseries(df);
	}
	downsample([duration, value], fillType = "sum") {
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
		return new Timeseries(df);
	}

	populate(value, type = "avg") {
		let v;
		switch (type) {
			case "fill":
				v = value;
				break;
			default:
				v = value / this.getIndex().count();
				break;
		}
		let df = this.generateSeries({ value: row => v });
		return new Timeseries(df);
	}
	// fill(interval, fillType) {
	// 	// let interval = this.interval;
	// 	if (!interval || !Array.isArray(interval)) interval = this.interval;
	// 	let ndf = this.fillGaps(gapExists(interval), gapFill(fillType, interval));
	// 	return new Timeseries(ndf);
	// }
	fill() {
		let startDate = this.first().date.toDate(),
			endDate = this.last().date.toDate();
		let interval = this.interval;
		console.time("blank");
		let bdf = Timeseries.blank(startDate, endDate, interval, "missing");
		console.timeEnd("blank");
		console.time("join");
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
		// let df = this.zip(bdf, (data, fill) => {
		// 	if (data) {
		// 		return data;
		// 	} else {
		// 		return fill;
		// 	}
		// });
		console.timeEnd("join");
		console.time("new timeseries");
		// df = new Timeseries(df);
		console.timeEnd("new timeseries");
		return df;
	}
	reduceToValue(columnNames) {
		function chooseValue(row, columnNames = []) {
			let values = columnNames.map(n => row[n]).filter(v => v);
			return values[0] || 0;
		}
		let df = this.generateSeries({
			value: row => chooseValue(row, columnNames)
		}).subset(["date", "value"]);
		return new Timeseries(df);
	}
	clean(columnName = "value", { lowerThreshold, upperThreshold }) {
		let arr = this.toArray().map(row => {
			if (row.value > upperThreshold || row.value < lowerThreshold) {
				let { value, flag = [], ...others } = row;
				if (!flag) flag = [];
				if (!Array.isArray(flag)) flag = [flag];
				return {
					value: undefined,
					raw: value,
					flag: ["outlier", ...flag],
					...others
				};
			} else {
				return row;
			}
		});
		return new Timeseries(arr);
	}
	// Static Methods
	static blank(startDate, endDate, [duration, value = 1], flag) {
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
		// let df = new Timeseries([
		// 	{ date: dayjs(startDate) },
		// 	{ date: dayjs(endDate) }
		// ])
		// 	.fillGaps(gapExists([duration, value]), gapFillBlank([duration, value]))
		// 	.between(startDate, endDate);
		console.log(df.count());
		if (flag)
			df = df.generateSeries({
				flag: row => [flag]
			});
		return new Timeseries(df);
	}
	static aggregate(dataframes) {
		if (!Array.isArray(dataframes)) dataframes = [dataframes];
		dataframes = dataframes.map(df => new Timeseries(df));
		const concatenated = DataFrame.concat(dataframes)
			.groupBy(row => row.date)
			.select(group => {
				const date = group.first().date;
				let o = { date };
				group
					.getColumnNames()
					.filter(c => c !== "date")
					.forEach(c => (o[c] = group.deflate(row => row[c]).sum()));
				return o;
			})
			.inflate()
			.toArray();
		return new Timeseries(concatenated);
	}
	// Models
	annualMonthlyAverage({ startDate, endDate }) {
		let months = this.downsample(["month", 1], "sum").between(
			startDate,
			endDate
		);
		let avg = months.getSeries("value").average();
	}
	// Building Functions
	annualIntensity(normalizeValue = 1) {
		let interval = this.interval;
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
		return new Timeseries(annual);
	}
	addBaselineDelta(baselineDF) {
		// Only Change in Year
		if (!(baselineDF instanceof Timeseries))
			baselineDF = new Timeseries(baselineDF);
		let dfwb;
		if (baselineDF.count() > 1) {
			let interval = this.interval;
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
}
export default Timeseries;
