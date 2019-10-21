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

function setDateIndex(col = "date") {
	if (this.getColumnNames().indexOf(col) === -1)
		throw new Error("No Date Column in DataFrame");
	return this.orderBy(row => row[col].valueOf()).withIndex(row =>
		dayjs(row.date).toDate()
	);
}

function blank(start, end) {
	return new Timeseries([{ date: start }, { date: end }]);
}

Timeseries.prototype.interval = interval;
Timeseries.prototype.setDateIndex = setDateIndex;
Timeseries.blank = blank;

// Test
let data = new Array(4 * 24 * 10).fill(0).map((v, i) => ({
	date: dayjs()
		.startOf("hour")
		.subtract(15 * i, "minute"),
	value: 100
}));
let df = new Timeseries(data).setDateIndex();
console.log(df.toString());
console.log(df.interval());

let bl = Timeseries.blank(new Date(20), new Date());
console.log(bl.toString());
