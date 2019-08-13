const Timeseries = require("../index.js");

let ts = Timeseries.blank(new Date(2019, 0, 4), new Date(2019, 1, 11), [
	"day",
	1
]).populateAverage(1000);
let ts1 = Timeseries.blank(new Date(2019, 1, 12), new Date(2019, 2, 2), [
	"day",
	1
]).populateAverage(2000);
let combined = Timeseries.concat([ts, ts1]).orderBy(row => row.date);
console.log(combined.toString());

let tt = Timeseries.merge(ts, ts1);
