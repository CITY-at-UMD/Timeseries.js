const dataForge = require("data-forge");
// require("../dist/index");
const Timeseries = require("../dist/index");
const dayjs = require("dayjs");
const plt = require("matplotnode");
const { ckmeans, mean } = require("simple-statistics");
require("data-forge-fs");
var readline = require("readline-promise").default;

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
function test() {
	let data = new Array(4 * 24 * 365 * 0.1).fill(0).map((v, i) => ({
		date: dayjs()
			.startOf("hour")
			.subtract(15 * i, "minute"),
		value: 100 * Math.random() - 20
	}));
	let df1 = new Timeseries(
		new Array(4 * 24 * 365 * 0.1).fill(0).map((v, i) => ({
			date: dayjs(new Date(2020, 4))
				.startOf("hour")
				.subtract(15 * i, "minute"),
			value: 100 * Math.random() - 20
		}))
	);
	let df = new Timeseries(data);
	// df = df.where(row => row.date.minute() !== 15);

	let clean = df.removeOutliers({ lowerThreshold: 0, upperThreshold: 50 });

	let agg = Timeseries.aggregate(df, df);
	console.log(agg.toString());
	let conc = Timeseries.concat([df, df1]);
	console.log(conc.toString());
}
test();
