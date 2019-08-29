const Timeseries = require("./Timeseries.js");
const dataForge = require("data-forge");
const {
	gapExists,
	gapFill,
	gapFillBlank,
	valueFiller
} = require("./Timeseries.fill");
require("data-forge-fs");

// let csvData = fs.readFileSync("./88_electricity.csv", "utf-8");

function test() {
	let df = dataForge
		.readFileSync("./testData/88_electricity_5c848e1d2d71b6c3807a616c.csv")
		.parseCSV({ dynamicTyping: true });

	let ts = new Timeseries(df);
	
	ts.fillMissingTimeseries()
		.removeOutliers()
		.zeroReplacement(16);

	let mean = ts.validMean;
	let monthly = ts.validMonthlyMeanMap;
	let dateFunction = date => {
		return monthly.get(new Date(date).getMonth()) || mean;
	};
	ts.fillNullData("dateFunction", { dateFunction: dateFunction });
	console.log(ts.toString());
	console.log(ts.quality());
}

test()