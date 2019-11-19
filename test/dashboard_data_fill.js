const dataForge = require("data-forge");
require("data-forge-fs");
const { Timeseries } = require("../dist/index");
const {
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

async function testClean(meter) {
	let rawData = await dataForge.readFile(`../data/${meter}.csv`).parseCSV();

	let df = new Timeseries(
		rawData.toArray().map(({ date, value }) => ({
			date: dayjs(date),
			value: parseFloat(value)
		}))
	);

	// Cleaning Process
	// 1. Test For Thresholds
	// 2. Remove Outliers
	// 3. Fillin Missing Timeseries
	// 4. Create Forecast values
	// 5. Fill in null values with forecast

	let thresholds = df.calculateThresholdOptions();
	console.log(thresholds);
	let upper = df.getBestThreshold();
	let threshold = {
		lower: 0,
		upper: upper
	};
	console.log(threshold);

	let cleaned = df.removeOutliers(threshold);
	console.log(
		df.count(),
		"# cleaned:",
		cleaned.where(v => Array.isArray(v.flag)).count()
	);
	console.log("zero count", cleaned.where(v => v.value === 0).count());
	console.time("zero");

	cleaned = cleaned.zeroFaultDetection(["hour", 6]);
	console.log("zero count", cleaned.where(v => v.value === 0).count());
	console.timeEnd("zero");
	let full = cleaned.fillMissing();

	let rolling = monthlyRollingAverageMap(full);
	console.log(rolling);
	console.log(
		"filling: ",
		full
			.getSeries("value")
			.where(v => !v && v !== 0)
			.count()
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

	console.log(filled.dataQuality().toString());
	console.log(
		filled
			.betweenDates(new Date(2018, 0), new Date(2019, 0, 0))
			.dataQuality()
			.toString()
	);
	let both = Timeseries.merge([
		filled.renameSeries({ value: "cleaned" }),
		df.renameSeries({ value: "raw" })
	]);
	console.log(both.head(10).toString());
	console.log(both.cvrsme("cleaned", "raw"));
	console.log(both.nmbe("cleaned", "raw"));
}

testClean("225A01ME");
