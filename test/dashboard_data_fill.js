const dataForge = require("data-forge");
require("data-forge-fs");
const { Timeseries } = require("../dist/index");
const fs = require("fs");
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
	fs.writeFileSync(
		`../data/clean_${meter}_daily.csv`,
		cleaned
			.downsample(["day", 1])
			.betweenDates(new Date(2015, 0), new Date(2019, 0, 0))
			.subset(["date", "value"])
			.where(row => row.value !== null && row.value !== 0)
			.transformSeries({ date: d => d.format("YYYY-MM-DD") })
			.toCSV()
	);
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
	let monthly = full.downsampleClean(["month", 1]);
	console.log(monthly.dropSeries("flag").toString());
	let rollingmap = monthlyRollingAverageMap(monthly);
	console.log(rollingmap);
	console.log(
		"filling: ",
		monthly
			.getSeries("value")
			.where(v => !v && v !== 0)
			.count()
	);

	console.time("filling");
	let filled = monthly.fillNull({
		callback: fillMonthlyBAnnualyMap(rollingmap)
	});
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
	let s = filled.betweenDates(new Date(2016, 0), new Date(2017, 0, 0));
	let e = filled.betweenDates(new Date(2018, 0), new Date(2019, 0, 0));
	console.log("2016");
	console.log(s.dataQuality().toString());
	console.log(s.getSeries("value").sum());
	console.log("2018");
	console.log(e.dataQuality().toString());
	console.log(e.getSeries("value").sum());
	console.log(e.toString());
}

// testClean("233A01ME");
testClean("225A01ME");
