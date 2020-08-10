const { Timeseries } = require("../../dist/index");
const dayjs = require("dayjs");

const baselineData = (referenceValue, variance, startDate, endDate) => {
	let months = dayjs(endDate).diff(startDate, "month");
	let data = new Array(months)
		.fill(0)
		.map((v, i) => {
			var date = dayjs(startDate)
				.startOf("month")
				.add(i, "month");
			let value =
				referenceValue * (Math.random() / 10 + 0.9) + variance * Math.random();
			return {
				date: date.toDate(),
				value
			};
		})
		.sort((a, b) => a.date - b.date);
	return new Timeseries(data);
};
const heatingData = (referenceValue, variance, startDate, endDate) => {
	let months = dayjs(endDate).diff(startDate, "month");
	let data = new Array(months)
		.fill(0)
		.map((v, i) => {
			let date = dayjs(startDate)
				.startOf("month")
				.add(i, "month");
			let value =
				referenceValue * (Math.random() / 10 + 0.9) +
				variance *
					(Math.random() / 10 + 0.9) *
					((Math.cos((2 * date.month() * Math.PI) / 12) + 1) / 2);
			return { date: date.toDate(), value: value + variance * Math.random() };
		})
		.sort((a, b) => a.date - b.date);
	return new Timeseries(data);
};
const coolingData = (referenceValue, variance, startDate, endDate) => {
	let months = dayjs(endDate).diff(startDate, "month");
	let data = new Array(months)
		.fill(0)
		.map((v, i) => {
			let date = dayjs(startDate)
				.startOf("month")
				.add(i, "month");
			let value =
				referenceValue * (Math.random() / 10 + 0.9) +
				variance *
					(Math.random() / 10 + 0.8) *
					((Math.cos((2 * date.month() * Math.PI) / 12 - Math.PI) + 1) / 2);
			return { date: date.toDate(), value };
		})
		.sort((a, b) => a.date - b.date);
	return new Timeseries(data);
};

let d = heatingData(100, 800, new Date(2018, 0), new Date());
console.log(d.asCSV());
