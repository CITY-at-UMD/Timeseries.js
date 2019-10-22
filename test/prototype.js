const dayjs = require("dayjs");
const dataForge = require("data-forge");
// const { msToInterval } = require("../src/lib/Timeseries.interval");

// const Timeseries = dataForge.DataFrame;
// module.exports = { Timeseries };
function Timeseries(data) {
	let df = new dataForge.DataFrame(data);
	return setDateIndexDF(df);
}
Timeseries.prototype = Object.create(dataForge.DataFrame.prototype);
Timeseries.prototype.constructor = Timeseries;
Timeseries.prototype.interval = interval;
Timeseries.prototype.setDateIndex = setDateIndex;
Timeseries.blank = blank;

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
function setDateIndexDF(df, col = "date") {
	if (df.getColumnNames().indexOf(col) === -1)
		throw new Error("No Date Column in DataFrame");
	return df
		.orderBy(row => row[col].valueOf())
		.withIndex(row => dayjs(row.date).toDate());
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

// Test
let data = new Array(4 * 24 * 10).fill(0).map((v, i) => ({
	date: dayjs()
		.startOf("hour")
		.subtract(15 * i, "minute"),
	value: 100
}));
let df = new Timeseries(data);
console.log(df.toString());
console.log(df.interval());

let bl = Timeseries.blank(new Date(20), new Date());
console.log(bl.toString());
