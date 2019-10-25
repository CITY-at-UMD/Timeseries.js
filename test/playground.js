const dataForge = require("data-forge");
require("data-forge-fs");
const Timeseries = require("../dist/index");
const dayjs = require("dayjs");
const plt = require("matplotnode");
const { ckmeans, mean, max, min } = require("simple-statistics");
var readline = require("readline-promise").default;
const get = require("lodash/get");
async function testFull(filename) {
	const rlp = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		terminal: true
	});
	console.time("read file");
	let data = await dataForge
		.readFile(filename)
		.parseCSV({ dynamicTyping: true });
	console.timeEnd("read file");
	console.time("timeseries");
	let df = new Timeseries(
		data
			.toArray()
			.map(({ date, value }) => ({ date: dayjs(date), value: Number(value) }))
	);
	console.log("size", df.count());
	console.timeEnd("timeseries");

	// console.time("stats");
	// let stats = df.calculateStatistics({ filterZeros: true });
	// console.timeEnd("stats");
	// console.time("thresholds");
	// let thresholds = df.calculateThresholdOptions();
	// console.timeEnd("thresholds");
	// console.log(stats);
	// console.log(thresholds);
	// const thresholdGroups = ckmeans(
	// 	[
	// 		thresholds.esd.upper,
	// 		thresholds.modz.upper,
	// 		thresholds.box.lowerOuter,
	// 		thresholds.box.upperOuter
	// 	],
	// 	2
	// );
	// console.log(thresholdGroups);

	let threshold_actual = await rlp.questionAsync("Threshold?\n");
	console.log("Threshold set at : ", threshold_actual);

	console.time("clean");
	let cleaned = df.clean({
		lowerThreshold: 0,
		upperThreshold: threshold_actual
	});

	console.timeEnd("clean");
	console.log(
		"cleaned",
		cleaned.where(row => row.flag && row.flag.includes("outlier")).count()
	);
	// console.log(cleaned.calculateStatistics({ filterZeros: true }));
	console.time("fill missing");
	let missing = cleaned.fillMissing(); //.fillNull(10);
	console.timeEnd("fill missing");
	console.time("zeroed");
	// let zeroed = new Timeseries(missing.tail(20000)).zeroReplacement(60);
	// console.log(zeroed.head(10).toString());
	console.timeEnd("zeroed");
	// console.log(df.getIndex.count(), cleaned.getIndex.count(), missing.getIndex.count());

	let full = new Timeseries(
		missing.monthlyWithQual().generateSeries({
			value: row => (row.score > 0.9 ? row.value : null)
		})
	).averageFill();
	console.log(full.toString());

	// PLOT;
	console.time("downsample");
	cleaned = cleaned.downsample(["month", 1], "sum");
	df = df.downsample(["month", 1], "sum");
	missing = missing.downsample(["month", 1], "sum");
	console.timeEnd("downsample");

	plt.plot(
		df
			.getSeries("date")
			.toArray()
			.map(d => d.valueOf()),
		df.getSeries("value").toArray(),
		"color=r",
		"label=raw"
	);
	// plt.plot(
	// 	cleaned
	// 		.getSeries("date")
	// 		.toArray()
	// 		.map(d => d.valueOf()),
	// 	cleaned.getSeries("value").toArray(),
	// 	"color=o",
	// 	"label=filled"
	// );
	// plt.plot(
	// 	missing
	// 		.getSeries("date")
	// 		.toArray()
	// 		.map(d => d.valueOf()),
	// 	missing.getSeries("value").toArray(),
	// 	"color=y",
	// 	"label=filled W/ missing"
	// );
	plt.plot(
		full
			.getSeries("date")
			.toArray()
			.map(d => d.valueOf()),
		full.getSeries("value").toArray(),
		"color=g",
		"label=Cleaned & Filled"
	);
	plt.grid(true);
	plt.ylim(0, df.getSeries("value").max());
	plt.legend();
	plt.xkcd();
	plt.show();
	console.log("done");
}
// testFull("../data/225A01ME.csv");
async function testFill(meter, plot) {
	let consumptionReport = await dataForge
		.readFile(`../data/parsedConsumtionReportElectricity.csv`)
		.parseCSV();

	// console.log(consumptionReport.head(10).toString());
	consumptionReport = consumptionReport
		.subset(["date", meter])
		.parseDates(["date"])
		.parseFloats([meter])
		.renameSeries({
			[meter]: "value"
		});
	let consumptionDF = new Timeseries(consumptionReport);
	// console.log(consumptionDF.toString());
	let rawData = await dataForge.readFile(`../data/${meter}.csv`).parseCSV();
	rawData = rawData.parseDates("date").parseFloats("value");
	let meterDataDF = new Timeseries(rawData); //.downsample(["month", 1], "sum");

	let thresholds = meterDataDF.calculateThresholdOptions();

	const thresholdGroups = ckmeans(
		[
			get(thresholds, "esd.upper", null),
			get(thresholds, "modz.upper", null),
			get(thresholds, "box.lowerOuter", null),
			get(thresholds, "box.upperOuter", null)
		].filter(v => v),
		2
	);

	let threshold_actual = max(
		thresholdGroups.reduce((a, b) => (a.length > b.length ? a : b))
	);
	let cleaned = meterDataDF
		.clean({
			lowerThreshold: 0,
			upperThreshold: threshold_actual
		})
		.fillMissing()
		.monthlyWithQual()
		.generateSeries({
			value: row => (row.score > 0.9 ? row.value : null)
		});

	let meterFill = new Timeseries(cleaned).averageFill();
	// console.log(meterFill.toString());
	let compareRange = {
		start: dayjs(
			max([
				meterFill.first().date.valueOf(),
				consumptionDF.first().date.valueOf()
			])
		).toDate(),
		end: dayjs(
			min([
				meterFill.last().date.valueOf(),
				consumptionDF.last().date.valueOf()
			])
		).toDate()
	};
	// console.log(compareRange);
	let compareDF = meterFill
		.renameSeries({ value: "meter" })
		.withIndex(row => row.date.valueOf())
		.merge(
			consumptionDF
				.renameSeries({ value: "consumption" })
				.withIndex(row => row.date.valueOf()),
			new Timeseries(rawData)
				.downsample(["month", 1])
				.renameSeries({ value: "raw" })
				.withIndex(row => row.date.valueOf())
		)
		.between(compareRange.start, compareRange.end);
	console.log(compareDF.toString());
	if (plot) {
		plt.plot(
			compareDF
				.getSeries("date")
				.toArray()
				.map(d => d.valueOf()),
			compareDF.getSeries("consumption").toArray(),
			"color=b",
			"label=consumption"
		);

		plt.plot(
			compareDF
				.getSeries("date")
				.toArray()
				.map(d => d.valueOf()),
			compareDF.getSeries("meter").toArray(),
			"color=g",
			"label=Cleaned & Filled"
		);

		plt.grid(true);
		plt.ylim(
			0,
			max([
				compareDF.getSeries("consumption").max(),
				compareDF.getSeries("meter").max()
			])
		);
		plt.legend();
		plt.show();
		console.log("done");
	}
}
testFill("225A02ME", true);
