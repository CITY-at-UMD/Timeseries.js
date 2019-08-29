const dayjs = require("dayjs");

function group(df, interval = "day", toArray = true) {
	if (["hour", "day", "month", "year"].indexOf(interval) < 0)
		throw new Error("interval type not supported");
	let dateComparison = row => dayjs(row.date).startOf(interval);
	let series = df.groupBy(dateComparison);
	if (toArray) {
		let groups = [];
		for (const g of series) {
			groups.push([dateComparison(g.first()).toDate(), g.toArray()]);
		}
		return groups;
	} else {
		return series;
	}
}
module.exports = { group };
