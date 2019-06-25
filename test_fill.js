const Timeseries = require("./Timeseries.js");

// let ts = Timeseries.blank(new Date(2017, 3, 3), new Date(2017, 4, 5, 0, 0), [
// 	"day",
// 	1
// ]);
// ts.populate(100000);
// console.log(ts.df.toString());
// console.log(ts.df.before(new Date(2017, 4, 5, 0, 0)).toString());

let withMissing = new Timeseries([
	{ date: new Date(2018, 0, 1), value: 100 },
	{ date: new Date(2018, 0, 2), value: -100 },
	{ date: new Date(2018, 0, 3), value: 100000 },
	{ date: new Date(2018, 0, 4), value: 120 },
	{ date: new Date(2018, 0, 5), value: 120 },
	{ date: new Date(2018, 0, 10), value: 0 },
	{ date: new Date(2018, 0, 11), value: 0 },
	{ date: new Date(2018, 0, 12), value: 0 },
	{ date: new Date(2018, 0, 13), value: 10 },
	{ date: new Date(2018, 0, 14), value: 10 },
	{ date: new Date(2018, 0, 15), value: 0 },
	{ date: new Date(2018, 0, 16), value: 0 },
	{ date: new Date(2018, 0, 17), value: 0 },
	{ date: new Date(2018, 0, 18), value: 0 },
	{ date: new Date(2018, 0, 25), value: 155 }
]);
withMissing.detectOutliers();
console.log(withMissing.df.toString())
console.log(withMissing.thresholds);
withMissing.clean(withMissing.thresholds)
console.log(withMissing.df.toString())
withMissing = Timeseries.upsample(withMissing, 'value', withMissing.interval)
console.log(withMissing.df.toString())
console.log(withMissing.quality())

withMissing.zeroCheck()
let dateFunction = date =>{
	let monthMap = new Map([
		[0,20],
		[1,15],
		[2,17],
		[3,12],
		[4,9],
		[5,6],
		[6,2],
		[7,1],
		[8,1],
		[9,5],
		[10,7],
		[11,13],
	])
	return monthMap.get(new Date(date).getMonth())
}
withMissing.fillData("dateFunction", {dateFunction:dateFunction});
console.log(withMissing.df.toString())