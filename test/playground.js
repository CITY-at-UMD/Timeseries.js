const Timeseries = require("../dist/index");
const dayjs = require("dayjs");

let monthlyData = new Array(4380).fill(0).map((x, i) => {
	let date = dayjs()
		.startOf("day")
		.subtract(i, "day");

	return {
		date,
		...(date.day() % 3 && { forecast: Math.random() * 12 }),
		value: Math.random() * 15,
		units: "kWh"
	};
});
let yearlyData = new Array(12).fill(0).map((x, i) => {
	let date = dayjs()
		.startOf("year")
		.subtract(i, "year");

	return {
		date,
		...(date.year() % 3 && { forecast: Math.random() * 12 }),
		value: Math.random() * 15,
		units: "kWh"
	};
});
let df = new Timeseries(monthlyData);

console.log(df.toString());
let baseline = df
	.between(new Date(2015, 0), new Date(2016, 0, 0))
	.subset(["date", "value"]);

console.log(baseline.toString());
let dfwb = df.addBaselineDelta(baseline);

let yDF = new Timeseries(yearlyData);
let yearlybaseline = yDF
	.between(new Date(2015, 0), new Date(2016, 0, 0))
	.subset(["date", "value"]);
console.log(yearlybaseline.toString());
let ydfwb = yDF.addBaselineDelta(yearlybaseline);
