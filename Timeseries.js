const { DataFrame, Series } = require("data-forge");
const dayjs = require("dayjs");
const { medianAbsoluteDeviation, quantile } = require("simple-statistics");
const isEqual = require("lodash/isEqual");
const { rosnerTest, modZScore } = require("./Timeseries.statistics.js");
const { gapExists, gapFill, gapFillBlank } = require("./Timeseries.fill.js");

class Timeseries {
	constructor(ts, { outlierBounds } = {}) {
		// DataFrame or Timeseries Check
		if (ts instanceof Series) ts = new DataFrame(ts);
		if (ts instanceof DataFrame) ts = ts.toArray();
		if (ts instanceof Timeseries) ts = ts.toArray();
		if (!Array.isArray(ts)) {
			console.error(ts);
			throw new Error("timeseries input was not a collection");
		}
		if (ts.map(t => Array.isArray(t)).every(r => r))
			ts = ts.map(r => ({ date: new Date(r[0]), raw: r[1] }));

		if (ts.length === 0) {
			this.df = new DataFrame({
				columnNames: ["date", "value", "flag"],
				values: []
			})
				// .setIndex("date")
				.withIndex(row => row.date.valueOf())
				// .dropSeries("date")
				.bake();
			return;
		}
		// let allcolumns = [
		// 	...ts.map(r => Object.keys(r)).reduce((a, b) => a.concat(...b), [])
		// ];
		let columnNames = [
			...new Set([...Object.keys(ts[0]), "date", "value", "flag"])
		];
		this.df = new DataFrame({
			columnNames,
			values: ts
		})
			.withIndex(row => dayjs(row.date).valueOf())
			// .withIndex(row => row.date)
			// .distinct(row => row.date)
			.orderBy(row => dayjs(row.date).valueOf())
			// .dropSeries("date")
			.bake();
	}
	get first() {
		return this.df.first();
	}
	get last() {
		return this.df.last();
	}
	get interval() {
		if (!this.tsInterval) {
			this.calculateInterval();
		}
		return this.tsInterval;
	}
	get length() {
		return this.df.getIndex().count();
	}
	get count() {
		return this.length;
	}
	dateRange(unit, options = {}) {
		let start = dayjs(this.first.date);
		if (options.adjustment) {
			start = start.startOf(options.adjustment);
		}
		let end = dayjs(this.last.date);
		if (options.adjustment) {
			end = end.endOf(options.adjustment);
		}
		return end.diff(start, unit);
	}
	setInterval(interval) {
		this.tsInterval = interval;
		return;
	}
	calculateInterval(startDate, endDate) {
		if (!startDate) startDate = this.first.date;
		if (!endDate) endDate = this.last.date;
		function computeInterval(window) {
			return window.last() - window.first();
		}
		const intervals = this.df
			.between(startDate, endDate)
			.getIndex()
			.window(2)
			.select(computeInterval)
			.detectValues()
			.orderBy(row => row.Frequency);
		this.tsInterval = intervals.last().Value;
	}
	detectOutliers(column = "value", k) {
		let values = this.df.deflate(row => row[column]);
		if (!k) {
			k =
				values.count() < 1000
					? Math.floor(values.count() * 0.15)
					: Math.min(...[1000, Math.floor(values.count() * 0.02)]);
		}
		let { outliers, threshold } = rosnerTest(values.toArray(), k);
		this.setOutlierThreshold(threshold);
		return { outliers, threshold };
	}
	setOutlierThreshold({ lower, upper } = {}) {
		this.thresholds = { lower, upper };
	}
	toArray(columnName) {
		if (columnName) {
			return this.df.getSeries(columnName).toArray();
			// .toPairs()
			// .map(([date, values]) =>
			// 	Object.assign({}, { date: new Date(date) }, values)
			// );
		} else {
			return this.df.toArray();
			// .toPairs()
			// .map(([date, values]) =>
			// 	Object.assign({}, { date: new Date(date) }, values)
			// );
		}
	}
	sum(columnName = "value") {
		const sum = this.df.deflate(row => row[columnName]).sum();
		return sum;
	}
	calculateStatistics(columnName = "value") {
		const series = this.df
			.deflate(row => row[columnName])
			.where(value => !isNaN(value));
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

	summarize(toString = false) {
		const summary = this.df.dropSeries("date").summarize();
		return summary;
	}
	/**
	 * Clean Timerseies
	 * @param  {Number} options.lower lower threshold
	 * @param  {Number} options.upper upper threshold
	 * @return {}               cleaned data dataframe
	 */
	clean({ lower, upper } = {}) {
		// if (!lower || lower === false || !upper || upper === false) {
		// 	if (!this.thresholds) this.detectOutliers("value");
		// 	lower = this.thresholds.lower;
		// 	upper = this.thresholds.upper;
		// }

		const filterValue = (value, lower, upper) => {
			if (value < lower || value >= upper) {
				return true;
			}
			return false;
		};
		this.df = this.df.generateSeries({
			raw: row =>
				filterValue(row.value, lower, upper) ? row.value : null,
			flag: row =>
				filterValue(row.value, lower, upper)
					? [...(row.flag || []), "clean"]
					: row.flag,
			value: row => (filterValue(row.value, lower, upper) ? 0 : row.value)
		});
		return;
	}
	dataStatistics() {
		let changes = this.df
			.getSeries("flag")
			.detectValues()
			.groupBy(row =>
				Array.isArray(row.Value) ? row.Value.toString() : row.Value
			)
			.select(group => ({
				Value: group.first().Value,
				Frequency: group.deflate(row => row.Frequency).sum()
			}))
			.inflate();
		let analysis = changes.toArray().reduce(
			(a, b) =>
				Object.assign({}, a, {
					[b.Value ? b.Value[0] : "available"]: b.Frequency
				}),
			{}
		);
		return analysis;
	}
	// NOTE: Potentially this should collapse the values to a single one before the downsampling
	// or have an option to do this as the data fidelity is then lost when downsampling
	//  and then collapsing between all the options
	static downsample(dataframe, interval = "day", type = "sum") {
		if (!(dataframe instanceof DataFrame))
			dataframe = new Timeseries(dataframe);
		if (dataframe instanceof Timeseries) dataframe = dataframe.df;
		if (
			["quarterHour", "hour", "day", "week", "month", "year"].indexOf(
				interval
			) < 0
		) {
			console.error(interval);
			throw new Error("interval type not supported");
		}
		let aggregationTypes = ["sum", "avg", "min", "max", "median"];
		if (aggregationTypes.indexOf(type) === -1) {
			throw new Error(
				"aggregation type not suppported, only:",
				aggregationTypes.toString()
			);
		}
		let dateComparison = row => dayjs(row.date).startOf(interval);
		let df = dataframe
			.groupBy(dateComparison)
			.select(group => {
				const date = dayjs(group.first().date)
					.startOf(interval)
					.toDate();
				let o = { date };
				group
					.getColumnNames()
					.filter(c => c !== "date")
					.forEach(c => {
						if (type === "sum") {
							o[c] = group.deflate(row => row[c]).sum();
						} else if (type === "min") {
							o[c] = group.deflate(row => row[c]).min();
						} else if (type === "max") {
							o[c] = group.deflate(row => row[c]).max();
						} else if (type === "median") {
							o[c] = group.deflate(row => row[c]).median();
						} else {
							o[c] = group.deflate(row => row[c]).average();
						}
					});
				return o;
			})
			.inflate()
			.withIndex(row => row.date.valueOf());
		return new Timeseries(df);
	}
	static upsample(
		dataframe,
		sourceColumnName = "value",
		fillType = "average",
		[duration = "hour", value = 1],
		options
	) {
		if (!(dataframe instanceof DataFrame))
			dataframe = new Timeseries(dataframe);
		if (dataframe instanceof Timeseries) dataframe = dataframe.df;
		if (
			["minute", "hour", "day", "week", "month", "year"].indexOf(
				duration
			) < 0
		) {
			console.error(interval);
			throw new Error("interval type not supported");
		}
		let df = dataframe
			.fillGaps(
				gapExists([duration, value]),
				gapFill(sourceColumnName, fillType, [duration, value], options)
			)
			// .withIndex(row => row.date.valueOf())
			.bake();
		return new Timeseries(df);
	}

	between(start, end) {
		// inclusive
		this.df = this.df.between(start, end);
		return;
	}
	static merge(...dataframes) {
		//merged in ascending order (eg last df with column is the value used)
		dataframes = dataframes.map(df => new Timeseries(df)).map(df => df.df);
		let merged = DataFrame.merge(dataframes);
		return new Timeseries(merged);
	}
	static aggregate(...dataframes) {
		dataframes = dataframes.map(df => new Timeseries(df)).map(df => df.df);
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
			.withIndex(row => row.date.valueOf());
		return new Timeseries(concatenated);
	}
	static concat(...dataframes) {
		dataframes = dataframes.map(df => new Timeseries(df)).map(df => df.df);
		let df = DataFrame.concat(dataframes);
		return new Timeseries(df);
	}
	/**
	 * make a blank timeseries
	 * @param  {Date} startDate Start Date
	 * @param  {Date} endDate   End Date
	 * @param  {Array} interval  [duration, value] where duration is string 'see dayjs'
	 *                           and value is an ajustment of that duration ['minute', 15]
	 *                           is a 15 min interval
	 * @return {Timeseries}           Timeseries array with no values
	 */
	static blank(startDate, endDate, [duration, value = 1]) {
		if (
			["minute", "hour", "day", "week", "month", "year"].indexOf(
				duration
			) < 0
		) {
			console.error(interval);
			throw new Error("interval type not supported");
		}
		let dataframe = new Timeseries([{ date: startDate }, { date: endDate }])
			.df;
		let df = dataframe
			.fillGaps(
				gapExists([duration, value]),
				gapFillBlank([duration, value])
			)
			.startAt(startDate)
			.before(endDate)
			// .withIndex(row => row.date.valueOf())
			.bake();
		return new Timeseries(df);
	}
	populate(value) {
		let v = value / this.df.getIndex().count();
		let df = this.df.generateSeries({ value: row => v });
		this.df = df;
		return;
	}
	group(interval = "day", toArray = true) {
		if (["hour", "day", "week", "month", "year"].indexOf(interval) < 0)
			throw new Error("interval type not supported");
		let dateComparison = row => dayjs(row.date).startOf(interval);
		let series = this.df.groupBy(dateComparison);
		if (toArray) {
			let groups = [];
			for (const g of series) {
				groups.push([dateComparison(g.first()).toDate(), g.toArray()]);
			}
			return groups;
		} else {
			return series;
		}
	}
}
module.exports = Timeseries;
