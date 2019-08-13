const { DataFrame } = require("data-forge");
const dayjs = require("dayjs");
const { msToInterval } = require("./Timeseries.interval");
const _ = require("lodash");
const { gapExists, gapFill, gapFillBlank } = require("./Timeseries.fill");
const { medianAbsoluteDeviation, quantile } = require("simple-statistics");
class Timeseries extends DataFrame {
	constructor(data = []) {
		if (data instanceof DataFrame || data instanceof Timeseries)
			data = data.toArray();

		let config = {
			values: data,
			index: data.map(({ date }) => new Date(date).valueOf()),
			considerAllRows: true
		};
		super(config);
	}
	get interval() {
		let startDate = this.first().date;
		let endDate = this.last().date;
		function computeInterval(window) {
			return window.last() - window.first();
		}
		const intervals = this.between(startDate, endDate)
			.getIndex()
			.window(2)
			.select(computeInterval)
			.detectValues()
			.orderBy(row => row.Frequency);
		let val = intervals.last().Value;
		return msToInterval(val);
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
		return super.at(new Date(date).valueOf());
	}
	group(inverval, toArray) {
		if (["hour", "day", "month", "year"].indexOf(inverval) === -1)
			throw new Error("interval type not supported");
		let dateComparison = row => dayjs(row.date).startOf(interval);
		let groups = this.groupBy(dateComparison);
		return groups;
	}
	resample([duration, value = 1], fillType) {
		if (["hour", "day", "month", "year"].indexOf(duration) === -1)
			throw new Error("interval type not supported");
		let interval = this.getInterval();
		if (_.isEqual(interval, [duration, value])) {
			return this;
		}
		let d0 = dayjs(0);
		let currentSampleDiff = dayjs(0)
			.add(interval[1], interval[0])
			.diff(d0);
		let newSampleDiff = dayjs(0)
			.add(value, duration)
			.diff(d0);
		console.log(currentSampleDiff, newSampleDiff);
	}
	upsample([duration, value], fillType = "avg") {
		// Dont use this b/c it has the raw and flag values
		let df = this.fillGaps(
			gapExists([duration, value]),
			gapFill(fillType, [duration, value])
		);
		return df;
	}
	downsample([duration, value], fillType = "sum") {
		if (["hour", "day", "month", "year"].indexOf(duration) === -1)
			throw new Error("interval type not supported");
		if (["sum", "avg", "median"].indexOf(fillType) === -1) {
			throw new Error(
				"aggregation type not suppported, only:",
				aggregationTypes.toString()
			);
		}
		let dateComparison = row => dayjs(row.date).startOf(duration);
		if (value)
			dateComparison = row =>
				dayjs(row.date)
					.startOf(duration)
					.add(value, duration);
		let df = this.groupBy(dateComparison)
			.select(group => {
				const date = dayjs(group.first().date)
					.startOf(duration)
					.toDate();
				return {
					date,
					..._.fromPairs(
						group
							.getColumnNames()
							.filter(col => col !== "date")
							.map(col => {
								let value;
								switch (fillType) {
									case "median":
										value = group.deflate(row => row[col]).median();
										break;
									case "avg":
										value = group.deflate(row => row[col]).average();
										break;
									default:
										// sum
										value = group.deflate(row => row[col]).sum();
										break;
								}
								return [col, value];
							})
					)
				};
			})
			.inflate()
			.withIndex(row => row.date.valueOf());
		return df;
	}
	calculateStatistics({
		column = "value",
		filterZeros = false,
		filterNegative = true
	} = {}) {
		let series = this.deflate(row => row[columnName]).where(
			value => !isNaN(value)
		);
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
	populateAverage(value) {
		let v = value / this.getIndex().count();
		let df = this.generateSeries({ value: row => v });
		return df;
	}
	static blank(startDate, endDate, [duration, value = 1]) {
		if (["minute", "hour", "day", "month", "year"].indexOf(duration) < 0) {
			console.error(interval);
			throw new Error("interval type not supported");
		}
		let df = new Timeseries([
			{ date: new Date(startDate) },
			{ date: new Date(endDate) }
		])
			.fillGaps(gapExists([duration, value]), gapFillBlank([duration, value]))
			.between(startDate, endDate);
		return new Timeseries(df);
	}
	static aggregate(dataframes) {
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
			.inflate();
		return new Timeseries(concatenated);
	}
}
module.exports = Timeseries;
