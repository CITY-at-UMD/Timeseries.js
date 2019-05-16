const Timeseries = require("./Timeseries.js");
const dataForge = require("data-forge");
require("data-forge-fs");

const util = require("util");
const fs = require("fs");
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

// let csvData = fs.readFileSync("./88_electricity.csv", "utf-8");

let df = dataForge
	.readFileSync("./88_electricity.csv")
	.parseCSV({ dynamicTyping: true });
let ts = new Timeseries(df);
// console.log(ts.df.toString());
ts.calcStats("raw");
console.log(ts.stats);
// ts.testClean("raw");
console.time("rosner");
let { outliers, threshold } = ts.detectOutliers("raw");
console.timeEnd("rosner");
console.log(outliers.toString());
ts.clean("raw", threshold.min, threshold.max);
ts.calcStats("clean");
console.log(ts.stats);
