const { DataFrame, Series } = require("data-forge");
const dayjs = require("dayjs");
const { medianAbsoluteDeviation, quantile } = require("simple-statistics");
const isEqual = require("lodash/isEqual");
const {
	rosnerTest,
	modifiedZScoreTest,
	boxPlotTest,
	quality
} = require("./Timeseries.statistics.js");
const {
	gapExists,
	gapFill,
	gapFillBlank,
	valueFiller
} = require("./Timeseries.fill.js");
const { msToInterval } = require("./Timeseries.interval");
const { processTimeseries } = require("./Timeseries.process");
const { group } = require("./Timeseries.arrange");

class Timeseries extends DataFrame {
	constructor(ts) {
		super(ts);
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
		if (!this._interval) {
			this.calculateInterval();
		}
		return this._interval;
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

		let val = intervals.last().Value;
		this._interval = msToInterval(val);
	}
	calculateOutlierThresholds({ k, filterZeros = true } = {}) {
		let values = this.df
			.where(
				row =>
					row.flag === null || row.flag === undefined || Array.isArray(row.flag)
			)
			.where(row => !isNaN(row.value) && row.value !== null)
			.getSeries("value");
		// if (filterZeros) values = values.where(value => value !== 0);
		if (filterZeros) values = values.where(value => value > 0);
		if (!k) {
			k =
				values.count() < 1000
					? Math.floor(values.count() * 0.15)
					: Math.min(...[1000, Math.floor(values.count() * 0.02)]);
		}
		if (values.count() < 5) return {};
		let { thresholds: esd } = rosnerTest(values.toArray(), k);
		let { thresholds: box } = boxPlotTest(values.toArray());
		let { thresholds: modz } = modifiedZScoreTest(values.toArray());
		// this.thresholds = threshold;
		return { esd, box, modz };
	}
	toString() {
		return this.df.toString();
	}
	toArray(columnName) {
		if (columnName) {
			return this.df.getSeries(columnName).toArray();
		} else {
			return this.df.toArray();
		}
	}
	sum(columnName = "value") {
		const sum = this.df.deflate(row => row[columnName]).sum();
		return sum;
	}
	get goodValues() {
		let values = this.df
			.where(row => row.flag === null || row.flag === undefined)
			.where(row => row.value !== null && !isNaN(row.value));
		return values;
	}
	get validMean() {
		let values = this.df
			.getSeries("value")
			.where(value => typeof value === "number");
		return values.average();
	}
	get validMonthlyMeanMap() {
		let dateComparison = row =>
			dayjs(row.date)
				.startOf("month")
				.month();
		// Failed filter out values with flags
		// .where(
		// 		row =>
		// 			row.flag === null ||
		// 			row.flag === undefined ||
		// 			(Array.isArray(row.flag) && row.flag.length === 0)
		// 	)
		let df = this.df
			.where(row => typeof row.value === "number")
			.groupBy(dateComparison)
			.select(group => ({
				month: new Date(group.first().date).getMonth(),
				value: group.deflate(row => row.value).average()
			}));
		return new Map(df.toArray().map(({ month, value }) => [month, value]));
	}
	calculateStatistics(columnName = "value", filterZeros = false) {
		let series = this.df
			.deflate(row => row[columnName])
			.where(value => !isNaN(value));
		if (filterZeros) series = series.where(value => value > 0);
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

	zeroCheck(threshold = 2) {
		let zeroGroups = this.df
			.variableWindow((a, b) => {
				return a.value === b.value && a.value === 0;
			})
			.where(window => window.getIndex().count() >= threshold);
		let zeroSummary = zeroGroups
			.select(window => ({
				start: window.first().date,
				end: window.last().date,
				count: window.count()
			}))
			.inflate(); // Series -> dataframe.
		// .toArray()
		return { zeroSummary, zeroGroups };
	}

	zeroReplacement(threshold) {
		let { zeroGroups } = this.zeroCheck(threshold);
		let odf = new DataFrame(this.df).withIndex(row =>
			new Date(row.date).valueOf()
		);
		let dfs = zeroGroups.toArray().map(df => {
			df = df
				.transformSeries({
					value: value => null,
					raw: 0,
					flag: value => ["zero", ...(value || [])]
				})
				.withIndex(row => new Date(row.date).valueOf());
			return df;
		});

		odf = DataFrame.merge([odf, ...dfs]);
		this.df = odf;
		return this;
	}

	fillMissingTimeseries({ start, end, interval } = {}) {
		if (!start) start = this.first.date;
		if (!end) end = this.last.date;
		if (!interval) interval = this.interval;
		let blank = Timeseries.upsample(
			[{ date: start, value: null }, { date: end, value: null }],
			"value",
			interval
		);
		this.df = DataFrame.merge([blank.df, this.df]);
		console.log(
			"missin",
			this.df
				.getSeries("value")
				.where(value => value === null)
				.count(),
			this.count
		);
		return this;
	}
	fillNullData(fillType, { overrideValue, dateFunction } = {}) {
		let data = this.df.toArray().map(row => {
			if (row.value === null || row.value === undefined) {
				let { value, flag } = valueFiller(
					fillType,
					{},
					{ overrideValue, date: row.date, dateFunction }
				);
				return { ...row, value, flag: [...flag, ...(row.flag || [])] };
			} else {
				return row;
			}
		});
		this.df = new Timeseries(data).df;
		return this;
	}
	/**
	 * Remove Outliers
	 * @param  {Number} options.lower lower threshold
	 * @param  {Number} options.upper upper threshold
	 * @return {}               cleaned data dataframe
	 */
	removeOutliers({ lower, upper } = {}, fillValue = null) {
		if (!lower || !upper) {
			if (!this.thresholds) this.calculateOutlierThresholds();
			lower = this.thresholds.lower;
			upper = this.thresholds.upper;
		}
		const filterValue = (value, lower, upper) => {
			if (value < lower || value >= upper) {
				return true;
			}
			return false;
		};
		this.df = this.df.generateSeries({
			raw: row => (filterValue(row.value, lower, upper) ? row.value : null),
			flag: row =>
				filterValue(row.value, lower, upper)
					? [...(row.flag || []), "clean"]
					: row.flag,
			value: row =>
				filterValue(row.value, lower, upper) ? fillValue : row.value
		});
		return this;
	}

	clean(params) {
		this.removeOutliers(params);
		return this;
	}

	reset() {
		this.df = this.df
			.withSeries({
				value: df =>
					df
						.deflate(row => (row.flags ? row.raw : row.value))
						.select(value => value)
			})
			.where(row => row.value !== null && !isNaN(row.value))
			.dropSeries("flags")
			.dropSeries("raw");
		return this;
	}
	between(start, end) {
		// inclusive
		this.df = this.df.between(start, end);
		return this;
	}
	quality() {
		let count = this.length;
		let valid = this.df
			.getSeries("flag")
			.where(
				value => value === null || (Array.isArray(value) && value.length === 0)
			)
			.count();
		let missing = this.df
			.getSeries("flag")
			.where(value => Array.isArray(value))
			.where(value => value.indexOf("missing") !== -1)
			.count();
		let invalid = this.df
			.getSeries("flag")
			.where(value => Array.isArray(value))
			.where(value => value.indexOf("clean") !== -1)
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
		return { breakdown, report, count };
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
	populate(value) {
		let v = value / this.df.getIndex().count();
		let df = this.df.generateSeries({ value: row => v });
		this.df = df;
		return this;
	}
	group(interval = "day", toArray = true) {
		if (["hour", "day", "month", "year"].indexOf(interval) < 0)
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
	// NOTE: Potentially this should collapse the values to a single one before the downsampling
	// or have an option to do this as the data fidelity is then lost when downsampling
	//  and then collapsing between all the options
	static downsample(dataframe, interval = "day", type = "sum") {
		if (!(dataframe instanceof DataFrame))
			dataframe = new Timeseries(dataframe);
		if (dataframe instanceof Timeseries) dataframe = dataframe.df;
		if (["quarterHour", "hour", "day", "month", "year"].indexOf(interval) < 0) {
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
		fillType = "average",
		[duration = "hour", value = 1],
		options
	) {
		if (!(dataframe instanceof DataFrame))
			dataframe = new Timeseries(dataframe);
		if (dataframe instanceof Timeseries) dataframe = dataframe.df;
		if (["minute", "hour", "day", "month", "year"].indexOf(duration) < 0) {
			throw new Error("interval type not supported");
		}
		let df = dataframe
			.fillGaps(
				gapExists([duration, value]),
				gapFill(fillType, [duration, value], options)
			)
			// .withIndex(row => row.date.valueOf())
			.bake();
		return new Timeseries(df);
	}
	static merge(...dataframes) {
		//merged in ascending order (eg last df with column is the value used)
		// dataframes = dataframes.map(df => new Timeseries(df)).map(df => df.df);
		let merged = DataFrame.merge(dataframes);
		let ts = new Timeseries(merged);
		return ts;
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
		if (["minute", "hour", "day", "month", "year"].indexOf(duration) < 0) {
			console.error(interval);
			throw new Error("interval type not supported");
		}
		let dataframe = new Timeseries([
			{ date: new Date(startDate) },
			{ date: new Date(endDate) }
		]).df;
		let blankDF = dataframe
			.fillGaps(gapExists([duration, value]), gapFillBlank([duration, value]))
			.startAt(startDate)
			.before(endDate)
			.withIndex(row => row.date.valueOf())
			.toArray();
		return new Timeseries(blankDF);
	}
}
module.exports = Timeseries;
