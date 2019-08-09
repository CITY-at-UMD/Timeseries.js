const { DataFrame } = require("data-forge");
const dayjs = require("dayjs");
const { msToInterval } = require("../Timeseries.interval");
const _ = require("lodash");
class Timeseries extends DataFrame {
	constructor(data) {
		let config = {
			values: data,
			index: data.map(({ date }) => new Date(date).valueOf()),
			considerAllRows: true
		};
		super(config);
	}
	getInterval(startDate, endDate) {
		if (!startDate) startDate = this.first().date;
		if (!endDate) endDate = this.last().date;
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
		let groups = this.df.groupBy(dateComparison);
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
}

// Test
let values = new Array(36)
	.fill(0)
	.map((v, i) => ({ date: new Date(2010, 0 + i), value: i }));
values.push({ date: new Date(), raw: 122, value: 12, flag: ["outlier"] });
let df = new Timeseries(values);
console.log(df.toString());
console.log(df.between(new Date(2015, 0), new Date()).toString());
console.log(df.at(new Date(2012, 0)));
console.log(df.getInterval());
// df.resample(["day", 1], "pad");
let years = df.downsample(["year", 1], "sum");

console.log(years.toString());
