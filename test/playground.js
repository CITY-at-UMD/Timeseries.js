const Timeseries = require("../dist/index");
const dayjs = require("dayjs");
let data = new Array(5).fill(2015).map((year, i) => {
	return {
		date: dayjs()
			.year(year + i)
			.startOf("year")
			.toDate(),
		value: Math.random() * 100
	};
});
data.push({ date: new Date(2021, 0), forecast: 123 });
data.push({
	date: new Date(2022, 0),
	forecast: 122,
	flag: ["forecast", "fill"]
});
let df = new Timeseries(data);
let valueColumns = df
	.detectTypes()
	.where(row => row.Type === "number")
	.distinct(row => row.Column)
	.getSeries("Column")
	.toArray();
// console.log(valueColumns);
df = df.transformAll(v => v / 100);
console.log(df.toString());
