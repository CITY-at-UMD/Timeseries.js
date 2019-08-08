const { DataFrame } = require("data-forge");
const { resample } = require("../Timeseries.sample");

let ts = new DataFrame(
	new Array(12).fill(0).map((v, i) => ({
		start: new Date(2018, 0, i + 35 * (i - 1)),
		end: new Date(2018, 0, i + 35 * i),
		value: Math.random() * 100
	}))
)
	.withIndex(row => row.start.valueOf())
	.generateSeries({ date: row => row.start });

console.log(
	ts
		.dropSeries("start")
		.dropSeries("end")
		.toString()
);
let full = resample(ts, ["day", 1]);
console.log(full.toString())
