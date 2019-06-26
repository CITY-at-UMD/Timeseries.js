const dayjs = require("dayjs");

const msToInterval = ms => {
  let start = dayjs(new Date(0));
  let end = dayjs(new Date(ms));
  if (end.diff(start, "year", true) >= 1) {
    return ["year", end.diff(start, "year")];
  } else if (end.diff(start, "month", true) >= 1) {
    return ["month", end.diff(start, "month")];
  } else if (end.diff(start, "day", true) >= 1) {
    return ["day", end.diff(start, "day")];
  } else if (end.diff(start, "hour", true) >= 1) {
    return ["hour", end.diff(start, "hour")];
  } else {
    return ["minute", end.diff(start, "minute")];
  }
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
module.exports = { msToInterval, calculateInterval };
