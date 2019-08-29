const Timeseries = require("../index.js");

let ts = Timeseries.blank(new Date(2019, 0, 4), new Date(2019, 1, 11), [
	"day",
	1
]).populate(1000);


let tss = new Timeseries([
	{ date: new Date(2018, 1), value: 12 },
	{ date: new Date(2018, 2), value: 32 },
	{ date: new Date(2018, 4), value: 22 },
	{ date: new Date(2014, 4), value: 22 }]);

console.log(tss.toString())