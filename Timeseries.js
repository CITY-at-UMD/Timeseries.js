const { DataFrame, Series } = require("data-forge");
const dayjs = require("dayjs");
const { medianAbsoluteDeviation, quantile } = require("simple-statistics");
const { rosnerTest } = require("./Timeseries.statistics.js");
const modZScore = (value, mad, median) => {
	return (0.6745 * (value - median)) / mad;
};

const filter = (value, lowerThreshold, upperThreshold) => {
	if (
		value == null ||
		value === false ||
		value === undefined ||
		isNaN(value)
	) {
		return null;
	} else if (value < lowerThreshold) {
		return lowerThreshold;
	} else if (value > upperThreshold) {
		return upperThreshold;
	} else {
		return value;
	}
};

const gapFill = (
	sourceColumnName,
	destinationColumnName,
	fillType,
	interval,
	{ overrideValue } = {}
) => (pairA, pairB) => {
	// Fill values forward.
	const startDate = pairA[0];
	const endDate = pairB[0];
	const gapSize = dayjs(endDate).diff(startDate) / interval;
	const numEntries = gapSize - 1;
	const startValue = pairA[1];
	const endValue = pairB[1];
	const newEntries = [];
	for (let entryIndex = 0; entryIndex < numEntries; ++entryIndex) {
		let adjustment;
		let date = dayjs(startDate)
			.add(interval * (entryIndex + 1), "milliseconds")
			.toDate();
		if (fillType === "pad") {
			let val = startValue[sourceColumnName];
			if (overrideValue) val = overrideValue;
			adjustment = {
				date,
				[destinationColumnName]: val
			};
		} else if (fillType === "interpolate") {
			let val =
				startValue[sourceColumnName] +
				(entryIndex + 1) *
					((endValue[sourceColumnName] -
						startValue[sourceColumnName]) /
						numEntries);
			if (overrideValue) val = overrideValue;
			adjustment = {
				date,
				[destinationColumnName]: val
			};
		} else if (fillType === "average") {
			let val =
				(startValue[sourceColumnName] + endValue[sourceColumnName]) /
				numEntries;
			if (overrideValue) val = overrideValue / numEntries;
			adjustment = {
				date,
				[destinationColumnName]: val
			};
		} else {
			adjustment = { date, [destinationColumnName]: null };
		}

		let e = [date, adjustment];
		newEntries.push(e);
	}
	return newEntries;
};
const gapExists = (interval, maxGap) => (pairA, pairB) => {
	const startDate = pairA[0];
	const endDate = pairB[0];
	const gapSize = dayjs(endDate).diff(startDate);
	if (maxGap && maxGap > gapSize) return false;
	if (gapSize > interval) return true;
	return false;
};
const valueSelect = (row, order) => {
	return order.map(o => row[o]).reduce((a, b) => a || b);
};
class Timeseries {
	constructor(ts, { columnOrder, outlierBounds } = {}) {
		const valueColumns = [
			"value",
			"clean",
			"fill",
			"predicted",
			"normalized",
			"mean",
			"raw"
		];
		this.order = valueColumns;
		// let columnNames = Object.keys(ts[0]),
		// 	rows = ts.map(r => Object.values(r));
		// DataFrame or Timeseries Check
		if (ts instanceof Series) ts = new DataFrame(ts);
		if (ts instanceof DataFrame) ts = ts.toArray();
		if (ts instanceof Timeseries) ts = ts.toArrayFull();
		if (!Array.isArray(ts)) {
			console.error(ts);
			throw new Error("timeseries input was not a collection");
		}
		if (ts.map(t => Array.isArray(t)).every(r => r))
			ts = ts.map(r => ({ date: new Date(r[0]), raw: r[1] }));

		if (ts.length === 0) {
			this.df = new DataFrame({
				columnNames: ["date", ...valueColumns],
				values: []
			}).bake();
			return;
		}

		this.df = new DataFrame({
			columnNames: ["date", ...valueColumns],
			values: ts
		})
			.withIndex(row => row.date.valueOf())
			// .withIndex(row => row.date)
			.distinct(row => row.date)
			.orderBy(row => row.date)
			.bake();
		// .dropSeries("date");
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
		return this.df.getSeries("date").count();
	}
	get count() {
		return this.length;
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
			.getSeries("date")
			.window(2)
			.select(computeInterval)
			.detectValues()
			.orderBy(row => row.Frequency);
		this.tsInterval = intervals.last().Value;
	}
	detectOutliers(column, k) {
		let values = this.df.deflate(row => row[column]);
		if (!k) {
			k =
				values.count() < 1000
					? Math.floor(values.count() * 0.15)
					: Math.min(...[1000, Math.floor(values.count() * 0.02)]);
		}
		console.log(k);
		let { outliers, threshold } = rosnerTest(values.toArray(), k);
		return { outliers, threshold };
	}
	setOutlierBounds() {
		this.outlierBounds = { min: 0, max: 10000 };
	}
	toArray() {
		return this.df
			.generateSeries({
				value: row => valueSelect(row, this.order)
			})
			.select(row => ({ date: row.date, value: row.value }))
			.toArray();
	}
	toArrayFull() {
		return this.df.toArray();
	}
	calcStats(column) {
		const series = this.df.deflate(row => row[column]);
		// console.log(values);
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
		this.stats = Object.assign({}, this.stats, {
			[column]: { median, mean, count, std, min, max, mad, q1, q3, iqr }
		});
		return;
	}
	testClean(column) {
		if (!this.stats[column]) this.calcStats(column);
		const series = this.df.deflate(row => row[column]);
		let dirtyZ = series.where(
			value =>
				Math.abs(
					modZScore(
						value,
						this.stats[column].mad,
						this.stats[column].median
					)
				) > 3.5
		);
		console.log(dirtyZ.count(), dirtyZ.min());

		let dirtyQ = series.where(
			value => value > this.stats[column].q3 + 3 * this.stats[column].iqr
		);
		console.log(dirtyQ.count(), dirtyQ.min());
	}
	summarize(toString = false) {
		const summary = this.df.dropSeries("date").summarize();
		return summary;
	}
	clean(param, lowerThreshold, upperThreshold) {
		this.df = this.df
			.generateSeries({
				clean: row => filter(row[param], lowerThreshold, upperThreshold)
			})
			.bake();
		return;
	}
	quality() {}
	addMonthlyMean() {}
	// NOTE: Potentially this should collapse the values to a single one before the downsampling
	// or have an option to do this as the data fidelity is then lost when downsampling
	//  and then collapsing between all the options
	static downsample(dataframe, interval = "day", type = "sum") {
		if (!(dataframe instanceof DataFrame))
			dataframe = new Timeseries(dataframe);
		if (dataframe instanceof Timeseries) dataframe = dataframe.df;
		if (["hour", "day", "week", "month", "year"].indexOf(interval) < 0)
			throw new Error("interval type not supported");
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
					.forEach(c => (o[c] = group.deflate(row => row[c]).sum()));
				return o;
			})
			.inflate()
			.withIndex(row => row.date.valueOf());
		return new Timeseries(df);
	}
	static upsample(
		dataframe,
		sourceColumnName = "raw",
		destinationColumnName = "fill",
		fillType = "average",
		interval = 3.6e6,
		options
	) {
		if (dataframe instanceof Timeseries) dataframe = dataframe.df;
		let df = dataframe
			.fillGaps(
				gapExists(interval),
				gapFill(
					sourceColumnName,
					destinationColumnName,
					fillType,
					interval,
					options
				)
			)
			.withIndex(row => row.date.valueOf())
			.bake();
		return new Timeseries(df);
	}
	fill(type = "pad", interval) {
		if (!interval) interval = this.interval;
		// this.upsample("fill", type, interval);
		return;
	}
	filter(start, end) {
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
}
module.exports = Timeseries;
