const dataForge = require("data-forge");
require("data-forge-fs");
// const Timeseries = require("../dist/index").default;
const {
	Timeseries,
	averageMonthlyMap,
	fillMonthlyByMap,
	pad,
	annualAverage,
	annualMonthlyAverageMap,
	monthlyRollingAverageMap,
	fillMonthlyBAnnualyMap
} = require("../dist/index");
const dayjs = require("dayjs");
const plt = require("matplotnode");
const { ckmeans, mean, max, min } = require("simple-statistics");
var readline = require("readline-promise").default;
const get = require("lodash/get");

function testClean() {
	let df = new Timeseries(
		new Array(8760 * 4).fill(0).map((v, i) => ({
			date: dayjs(new Date(2018, 0, 0, i)),
			value: Math.random() * 100
		}))
	);
	// Cleaning Process
	// 1. Test For Thresholds
	// 2. Remove Outliers
	// 3. Fillin Missing Timeseries
	// 4. Create Forecast values
	// 5. Fill in null values with forecast

	let missing = new Timeseries(
		df.where(
			row =>
				row.date.hour() !== Math.floor(Math.random() * 24) ||
				row.date.day() !== Math.floor(Math.random() * 7) ||
				row.date.month() !== Math.floor(Math.random() * 12)
		)
	);
	console.log("# missing:", df.count() - missing.count());
	let thresholds = missing.calculateThresholdOptions();
	let upper = missing.getBestThreshold();
	let threshold = {
		lower: 0,
		upper: 95
	};
	let cleaned = missing.removeOutliers(threshold);
	console.log(
		"# cleaned:",
		missing.count() -
			cleaned
				.getSeries("value")
				.where(v => v)
				.count()
	);
	let full = cleaned.fillMissing();

	let monthMap = averageMonthlyMap(full);
	let mmc = row => monthMap.get(row.date.month());
	let tya = row => {};
	let rolling = monthlyRollingAverageMap(full);
	console.log(rolling);
	console.log(
		"filling: ",
		full
			.getSeries("value")
			.where(v => !v && v !== 0)
			.count(0)
	);

	console.time("filling");
	let filled = full.fillNull({ callback: fillMonthlyBAnnualyMap(rolling) });
	console.timeEnd("filling");
	// console.log(filled.toString());
	console.log(
		df.getSeries("value").sum(),
		cleaned
			.getSeries("value")
			.where(v => v)
			.sum(),
		filled.getSeries("value").sum()
	);
}
let df = new Timeseries(
	new Array(8760 * 10).fill(0).map((v, i) => ({
		date: dayjs(new Date(2015, 0, 1, i)),
		value: Math.random() * 100,
		v2: Math.random() * 100,
		v3: Math.random() * 100
	}))
);
console.log(df.tail(10).toString());
let ndf = df.generateSeries({
	total: row => ["value", "v2"].map(v => row[v]).reduce((a, b) => a + b, 0)
});

console.log(ndf.tail(10).toString());
