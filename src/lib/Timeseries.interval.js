import dayjs from "dayjs";

const msToInterval = ms => {
	let start = dayjs();
	let end = dayjs().add(ms);
	if (end.diff(start, "month", true) >= 11) {
		return ["year", Math.ceil(end.diff(start, "year", true))];
	} else if (end.diff(start, "day", true) >= 28) {
		return ["month", Math.ceil(end.diff(start, "month", true))];
	} else if (end.diff(start, "hour", true) >= 23) {
		return ["day", Math.ceil(end.diff(start, "day", true))];
	} else if (end.diff(start, "minute", true) >= 55) {
		return ["hour", Math.ceil(end.diff(start, "hour", true))];
	} else {
		return ["minute", end.diff(start, "minute")];
	}
};
const intervalToMS = ([unit, value]) => {
	let start = dayjs();
	let end = dayjs().add(value, unit);
	return end.diff(start);
};
function calculateInterval(df, startDate, endDate) {
	if (!startDate) startDate = df.first.date;
	if (!endDate) endDate = df.last.date;
	function computeInterval(window) {
		return window.last() - window.first();
	}
	const intervals = df
		.between(startDate, endDate)
		.getIndex()
		.window(2)
		.select(computeInterval)
		.detectValues()
		.orderBy(row => row.Frequency);

	let val = intervals.last().Value;
	return msToInterval(val);
}
export { msToInterval, intervalToMS, calculateInterval };
