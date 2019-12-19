const fetch = require("node-fetch");

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
	let df = new Timeseries(data);
	fs.writeFileSync(
		"../data/OSI/peopco_3years.csv",
		df
			.transformSeries({
				date: v => v.toISOString()
			})
			.toCSV()
	);
	console.log(df.getInterval());
	let rs = df.upsample(["minute", 5], "interpolate");
	console.log(rs.head(5).toString());
}
async function testFetch() {
	fetch(
		"https://odw.fm.umd.edu/PIVision/ExportData/GetExportData?requestId=72b5157e-c803-4693-85ad-200631ca4c53&StartTime=-1d&EndTime=12/1/2019&tz=America/New_York&fileType=csv",
		{
			credentials: "include",
			headers: {
				accept: "application/json, text/plain, */*",
				"accept-language": "en-US,en;q=0.9",
				"cache-control": "no-cache",
				pragma: "no-cache",
				requestverificationtoken:
					"Urqse-InavXyU544NTvYwkJWdfLWmUtrceK8QdEyR2DdyHBkQYQPP17vvBBTCu8TUSc-E6KUhPPQqZf-H5lkmk710gAHYkX1OERsUk9LguM1:GWsm6UfEy__yhLJgFwORvdHQxN8hS87GBBDCUkr7w4-JiKNVStGIwUm4M5QlFgyAam0ULGxGL0R17lu6o6iGF2YZ3PE0CpIkvgnJoYt8OnEbdI4kdvqkWFbJbixA24CK0",
				"sec-fetch-mode": "cors",
				"sec-fetch-site": "same-origin",
				"x-requested-with": "XMLHttpRequest"
			},
			referrerPolicy: "no-referrer",
			body: null,
			method: "GET",
			mode: "cors"
		}
	)
		.then(response => {
			const reader = response.body.getReader();
			return new ReadableStream({
				start(controller) {
					return pump();
					function pump() {
						return reader.read().then(({ done, value }) => {
							// When no more data needs to be consumed, close the stream
							if (done) {
								controller.close();
								return;
							}
							// Enqueue the next data chunk into our target stream
							controller.enqueue(value);
							return pump();
						});
					}
				}
			});
		})
		.then(stream => new Response(stream))
		.then(response => response.blob())
		.then(blob => console.log(blob))
		.catch(err => console.error(err));
}
testFetch();
