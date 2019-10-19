const Timeseries = require("../dist/index");
const dayjs = require("dayjs");
const plt = require("matplotnode");
const dataForge = require("data-forge");
const { ckmeans, mean } = require("simple-statistics");
require("data-forge-fs");
var readline = require("readline-promise").default;

async function testFull(filename) {
	const rlp = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		terminal: true
	});

	let data = await dataForge
		.readFile(filename)
		.parseCSV({ dynamicTyping: true });
	let df = new Timeseries(data);
	// console.log(df.toString());
	let stats = df.calculateStatistics({ filterZeros: true });
	let thresholds = df.calculateThresholds();
	console.log(stats);
	console.log(thresholds);
	const thresholdGroups = ckmeans(
		[
			thresholds.esd.upper,
			thresholds.modz.upper,
			thresholds.box.lowerOuter,
			thresholds.box.upperOuter
		],
		2
	);
	console.log(thresholdGroups);
	let threshold_actual = await rlp.questionAsync("Threshold?\n");
	console.log("Threshold set at : ", threshold_actual);
	let cleaned = df.clean("value", {
		lowerThreshold: 0,
		upperThreshold: threshold_actual
	});
	console.log(
		"cleaned",
		cleaned.where(row => row.flag && row.flag.includes("outlier")).count()
	);
	console.log(cleaned.calculateStatistics({ filterZeros: true }));
	let filled;
}
// testFull("../data/225A01ME.csv");
let data = new Array(4 * 24 * 365 * 10).fill(0).map((v, i) => ({
	date: dayjs()
		.startOf("hour")
		.subtract(15 * i, "minute"),
	value: 100
}));

let df = new Timeseries(data).where(row => row.date.minute() !== 15);
// console.log(df.toString());
console.time("create");
df = new Timeseries(df);
console.timeEnd("create");
console.time("fill");
df = df.fill();
console.timeEnd("fill");
// console.log(df.toString());
console.log("done");
