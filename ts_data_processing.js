const Timeseries = require("./Timeseries.js");
const dataForge = require("data-forge");
require("data-forge-fs");

// let csvData = fs.readFileSync("./88_electricity.csv", "utf-8");

function test() {
	let df = dataForge
		.readFileSync("./88_electricity_5c848e1d2d71b6c3807a616c.csv")
		.parseCSV({ dynamicTyping: true });
	console.time("timeseries");
	let ts = new Timeseries(df);
	ts.calcStats("value");
	console.time("rosner");
	// ts.between(new Date(2015, 0, 0).valueOf(), new Date(2015, 0, 2, 0).valueOf());
	let { outliers, threshold } = ts.detectOutliers("value", 100);
	console.log(outliers.toString());
	console.timeEnd("rosner");
	console.log(ts.thresholds);
	console.log(
		ts.df
			.getSeries("value")
			.where(value => value >= 23568978)
			.count()
	);
	ts.clean();
	ts.calcStats("value");
	ts = Timeseries.upsample(ts.df, "value", "interpolate", 3.6e6 / 4);
	ts.calcStats("value");
	console.log(ts.stats);
	ts.dataStatistics();
	console.timeEnd("timeseries");
	console.log(
		ts.df
			.getSeries("value")
			.where(value => value >= 23568978)
			.count()
	);
}
test();
function dfTest() {
	let df = new Timeseries([
		...new Array(8760).fill(0).map((v, i) => ({
			date: new Date(2018, 0, 1, i),
			value: Math.random() * 100
		})),
		{ date: new Date(2019, 2), value: 44 }
	]);
	console.log(df.df.toString());
	df.clean({ lower: 0, upper: 50 });
	df = Timeseries.upsample(df.df, "value", "interpolate", 3.6e6);
	console.log(df.df.toString());
	// console.log(df.df.summarize());
	df.dataStatistics();
}
// dfTest();
