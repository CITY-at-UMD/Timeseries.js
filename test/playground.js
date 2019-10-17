const Timeseries = require("../dist/index");
const dayjs = require("dayjs");

let monthlyData = new Array(54).fill(0).map((x, i) => {
	let date = dayjs()
		.startOf("month")
		.subtract(i, "month");

	return {
		date,
		...(date.month() % 4 && { forecast: Math.random() * 12 }),
		value: Math.random() * 15,
		units: "kWh"
	};
});
let ndf = new Timeseries(monthlyData);
// .withIndex(row => row.date.toDate())
// .orderBy(row => row.date);
console.log(ndf.toString());
console.log(
	ndf
		.getIndex()
		.detectTypes()
		.toString()
);
console.log(ndf.getIndex().first());
console.log(
	ndf.between(dayjs(new Date(2018, 0)), dayjs(new Date(2019, 0))).toString()
);

ndf = ndf.annualIntensity();
console.log(ndf.toString());
