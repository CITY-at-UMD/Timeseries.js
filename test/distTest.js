const Timeseries = require("../dist/index");
const dayjs = require("dayjs");
const randomData = () =>
	new Array(12).fill(0).map((v, i) => ({
		date: dayjs()
			.year(2018 - i)
			.startOf("year")
			.toDate(),
		value: 2000000 + Math.random() * 1000000,
		raw: 10202
	}));
let df = new Timeseries([
	...randomData(),
	{
		date: new Date(2019, 0),
		fill: 2600000
	},
	{
		date: new Date(2020, 0),
		fill: 2600000
	}
])
	.reduceToValue(["value", "fill"])
	.clean("value", { upperThreshold: 2763677.822316481, lowerThreshold: 0 });
console.log(df.toString());
