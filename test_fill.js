const Timeseries = require("./Timeseries.js");
const { DataFrame } = require("data-forge");
// let ts = Timeseries.blank(new Date(2017, 3, 3), new Date(2017, 4, 5, 0, 0), [
// 	"day",
// 	1
// ]);
// ts.populate(100000);
// console.log(ts.toString());
// console.log(ts.before(new Date(2017, 4, 5, 0, 0)).toString());

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
	{ date: new Date(2018, 0, 25), value: 155 },
	{ date: new Date(2018, 1, 2), value: 155 },
]);
let mm = new Timeseries(withMissing.df);
function zero() {
	withMissing.detectOutliers({ filterZeros: true });
	console.log(withMissing.toString());
	console.log(withMissing.thresholds);
	withMissing.clean(withMissing.thresholds);
	console.log(withMissing.toString());
	withMissing = Timeseries.upsample(withMissing, "value", withMissing.interval);
	console.log(withMissing.toString());
	console.log(withMissing.quality());

	withMissing.zeroReplacement();
	console.log(withMissing.toString());
	let dateFunction = date => {
		let monthMap = new Map([
			[0, 200],
			[1, 150],
			[2, 170],
			[3, 120],
			[4, 90],
			[5, 60],
			[6, 20],
			[7, 10],
			[8, 10],
			[9, 50],
			[10, 70],
			[11, 130]
		]);
		return monthMap.get(new Date(date).getMonth());
	};
	withMissing.fillData("dateFunction", { dateFunction: dateFunction });
	console.log(withMissing.toString());
	console.log(withMissing.quality());
	console.log(withMissing.df.first());
}

function name() {
	mm
	.fillMissingTimeseries({
		// start: new Date(2018, 0),
		// end: new Date(2018, 2, 12)
	})
		.removeOutliers()
		.zeroReplacement(2)
		.fillNullData("value", { overrideValue: 120 });
	console.log(mm.toString());
	console.log(mm.validMean)
	console.log(mm.validMonthlyMeanMap)
}
name();
