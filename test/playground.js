const Timeseries = require("../dist/index");
const { DataFrame } = require("data-forge");
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
console.log(ndf.toString());

ndf = ndf.annualIntensity();
console.log(ndf.toString());
