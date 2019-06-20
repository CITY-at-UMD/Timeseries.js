class timeseries extends DataFrame {
	constructor(ts) {
		super(ts);
	}
	setInterval() {
		this.interval = 123;
	}
	setIndex(column) {
		return new timeseries(super.setIndex(column));
	}
	range(unit = "day") {
		let start = dayjs(this.first().date);
		let end = dayjs(this.last().date);

		return end.diff(start, unit);
	}
}

let ts = new timeseries([
	{ date: new Date(2015, 0), value: 12 },
	{ date: new Date(2016, 0), value: 12 },
	{ date: new Date(2019, 0), value: 12 }
]).setIndex("date");
console.log(ts);
console.log(ts.toString());
console.log(ts.range("day"));
ts.setInterval(12);
console.log(ts.interval);
console.log(ts.toString());

let df = new DataFrame([{value:12}, {value:123}])
let t = new timeseries({date:new Date(), value:12344})
t.range('hour')