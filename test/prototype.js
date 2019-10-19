const dayjs = require("dayjs");
const dataForge = require("data-forge");
const Timeseries = dataForge.DataFrame;
// const { msToInterval } = require("../src/lib/Timeseries.interval");
module.exports = { Timeseries };

function interval() {
	function computeInterval(window) {
		return window.last() - window.first();
	}
	const intervals = this.getIndex()
		.window(2)
		.select(computeInterval)
		.detectValues()
		.orderBy(row => -row.Frequency)
		.orderBy(row => row.Value);
	// console.log(intervals.toString());
	let val = intervals.first().Value;
	// return msToInterval(val);
	return val;
}

function setDateIndex() {
	if (this.getColumnNames().indexOf("date") === -1)
		throw new Error("No Date Column in DataFrame");
	return this.orderBy(row => row.date.valueOf()).withIndex(row =>
		row.date.toDate()
	);
}

Timeseries.prototype.interval = interval;
Timeseries.prototype.setDateIndex = setDateIndex;

// Test
let data = new Array(4 * 24 * 10).fill(0).map((v, i) => ({
	date: dayjs()
		.startOf("hour")
		.subtract(15 * i, "minute"),
	value: 100
}));
let df = new Timeseries(data).setDateIndex();
// console.log(df.toString());
console.log(df.interval());
