const { Timeseries } = require("../dist/index");
const dayjs = require("dayjs");
const fs = require("fs");
const dataForge = require("data-forge");
require("data-forge-fs");
async function testCSVvsDataDiff() {
	let json = fs.readFileSync("../data/OSI/diffForData2.json", "utf-8");
	json = JSON.parse(json);
	let csv = fs.readFileSync("../data/OSI/New Display (2).csv", "utf-8");
	console.log(json);
	let yScale = v =>
		(v / 100) *
			(json[0].Traces[0].ValueScaleLimits[1] -
				json[0].Traces[0].ValueScaleLimits[0]) +
		json[0].Traces[0].ValueScaleLimits[0];

	let xScale = v => {
		const start = dayjs(json[json.length - 1].StartTime);
		const end = dayjs(json[json.length - 1].EndTime);
		const diff = end.diff(start, "millisecond");
		return start.add((diff * v) / 100, "ms").toDate();
	};
	let data = json[0].Traces[0].LineSegments.map(seg =>
		seg
			.split(" ")
			.map(v => v.split(","))
			// .map(([x, y]) => ({ date: xScale(Number(x)), value: Number(y) }));
			.map(([x, y]) => ({ date: xScale(Number(x)), value: yScale(Number(y)) }))
	).reduce((a, b) => a.concat(b));
	console.log(data);
	let df = new Timeseries(data);
	// console.log(df.toString());
	console.log(df.dropSeries("date").summarize());
	console.log(df.getSeries("value").max());
	console.log(df.getSeries("value").min());

	let csvDF = new Timeseries(
		dataForge
			.fromCSV(csv)
			.parseFloats("Value")
			.parseDates("Time")
			.dropSeries("Data Source")
			.renameSeries({ Time: "date", Value: "value" })
	);

	// console.log(csvDF.toString());
	console.log(csvDF.dropSeries("date").summarize());
	console.log(csvDF.getSeries("value").max());
	console.log(csvDF.getSeries("value").min());
}
async function analysis() {
	let json = fs.readFileSync("../data/OSI/peopco_3years.json", "utf-8");
	json = JSON.parse(json);

	console.log(json);
	let yScale = v =>
		(v / 100) *
			(json[0].Traces[0].ValueScaleLimits[1] -
				json[0].Traces[0].ValueScaleLimits[0]) +
		json[0].Traces[0].ValueScaleLimits[0];

	let xScale = v => {
		const start = dayjs(json[json.length - 1].StartTime);
		const end = dayjs(json[json.length - 1].EndTime);
		const diff = end.diff(start, "millisecond");
		return start.add((diff * v) / 100, "ms").toDate();
	};
	let data = json[0].Traces[0].LineSegments.map(seg =>
		seg
			.split(" ")
			.map(v => v.split(","))
			// .map(([x, y]) => ({ date: xScale(Number(x)), value: Number(y) }));
			.map(([x, y]) => ({ date: xScale(Number(x)), value: yScale(Number(y)) }))
	).reduce((a, b) => a.concat(b));
	console.log(data);
	let df = new Timeseries(data);
	// console.log(df.toString());
	console.log(df.dropSeries("date").summarize());
	console.log(df.getSeries("value").max());
	console.log(df.getSeries("value").min());
	let monthly = df.downsample(["month", 1]);
	console.log(monthly.toString());
}
analysis();
