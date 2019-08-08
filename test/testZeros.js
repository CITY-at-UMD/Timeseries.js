const dataForge = require("data-forge");
require("data-forge-fs");
const Timeseries = require("../Timeseries.js");
const { gapFillNull, gapExists } = require("../Timeseries.fill");
const { zeroReplacement } = require("../Timeseries.zero");
let df = dataForge
	.readFileSync("../testData/089B01ME_eem.csv")
	.parseCSV({ dynamicTyping: true })
	.withIndex(row => row.date.valueOf());

// let tss = new Timeseries(df);
// console.log(ts.toString())
// console.log(ts.calculateOutlierThresholds({ filterZeros: true }));
// console.log(ts.df.where(row => row.value > 125).toString());

// let { zeroSummary, zeroGroups } = ts.zeroCheck(25);

// console.log("count", ts.getIndex().count());
// console.log(ts.toString());

// let df = new dataForge.DataFrame(
// 	new Array(12).fill(0).map((v, i) => ({
// 		date: new Date(2018, i),
// 		value: Math.random() * 100
// 	}))
// ).withIndex(row => row.date.valueOf());
// let df2 = new dataForge.DataFrame(
// 	new Array(4).fill(0).map((v, i) => ({
// 		date: new Date(2018, i),
// 		value: null,
// 		raw: 0
// 	}))
// ).withIndex(row=>row.date.valueOf());

// console.log(df.toString());
// let merged = dataForge.DataFrame.merge([df, df2]);

// console.log(merged.toString());

console.log(
	df.getIndex().count(),
	df.getSeries("value").average(),
	df.getSeries("value").sum()
);
df = df.fillGaps(gapExists, gapFillNull(["minute", 15], "missing"));
console.log(
	df.getIndex().count(),
	df.getSeries("value").average(),
	df.getSeries("value").sum()
);
df = zeroReplacement(df, 25);
console.log(
	df.getIndex().count(),
	df.getSeries("value").average(),
	df.getSeries("value").sum()
);
