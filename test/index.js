const { DataFrame } = require("data-forge");
const dayjs = require("dayjs");
let values = new Array(12)
	.fill(0)
	.map((v, i) => ({ date: new Date(2010 + i, 0), value: i }));
values.push({ date: new Date(), raw: 122, value: 12, flag: ["outlier"] });
// const Timeseries = data => {
// 	// check for {date,value}
// 	return new DataFrame(data).withIndex(row => new Date(row.date).valueOf());
// };

// let df = Timeseries(values).generateSeries({
// 	flag: row => (row.value > 5 ? "outlier" : null)
// });

class Timeseries extends DataFrame {
	constructor(data) {
		let config = {
			values: data,
			index: data.map(({ date }) => new Date(date).valueOf()),
			considerAllRows: true
		};
		super(config);
	}
}

let df = new Timeseries(values);
console.log(df.toString());
console.log(df.between(new Date(2015, 0), new Date()).toString());
console.log(df.at(new Date(2015, 0).valueOf()));
