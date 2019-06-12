const Timeseries = require("./Timeseries.js");

let ts = Timeseries.blank(new Date(2017, 3, 3), new Date(2017, 4, 5, 0, 0), [
	"day",
	1
]);
ts.populate(100000);
console.log(ts.df.toString());
// console.log(ts.df.before(new Date(2017, 4, 5, 0, 0)).toString());
