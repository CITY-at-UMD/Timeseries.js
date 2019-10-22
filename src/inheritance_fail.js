import dayjs from "dayjs";
import dataForge from "data-forge";
import { msToInterval, intervalToMS } from "./lib/Timeseries.interval";
import isEqual from "lodash/isEqual";
import has from "lodash/has";
import fromPairs from "lodash/fromPairs";
import { gapExists, gapFill, gapFillBlank } from "./lib/Timeseries.fill";
import { medianAbsoluteDeviation, quantile } from "simple-statistics";
import {
	rosnerTest,
	boxPlotTest,
	modifiedZScoreTest
} from "./lib/Timeseries.statistics";
import { annualScale, calculateChange } from "./lib/misc";
import { remove } from "jest-util/build/preRunMessage";

export default Timeseries;

function Timeseries(data) {
	data = data
		.map(({ date, ...others }) => ({ date: dayjs(date), ...others }))
		.sort((a, b) => a.date.valueOf() - b.date.valueOf());
	let config = {
		// columns: ['date', 'value', 'raw', 'flag'],
		values: data,
		index: data.map(({ date }) => date.toDate()),
		considerAllRows: true
	};
	console.log(data);
	dataForge.DataFrame.call(this, config);
}

Timeseries.prototype = Object.create(dataForge.DataFrame.prototype);
Timeseries.prototype.constructor = Timeseries;

// Getters
function getValueColumns() {
	return this.detectTypes()
		.where(row => row.Type === "number")
		.distinct(row => row.Column)
		.getSeries("Column")
		.toArray();
}

Timeseries.prototype.getValueColumns = getValueColumns;
// Chainable Methods
function removeOutliers({
	column = "value",
	lowerThreshold,
	upperThreshold
} = {}) {
	if (lowerThreshold > upperThreshold) throw new Error("thresholds invalid");
	let outlierCheck = (value, lowerThreshold, upperThreshold) =>
		value < lowerThreshold || value > upperThreshold;
	let outliers = this.where(row =>
		outlierCheck(row[column], lowerThreshold, upperThreshold)
	).generateSeries({
		raw: row => row[column],
		flag: ({ flag = [] }) => ["outlier", ...flag]
	});
	// .transformSeries({
	// 	[column]: row => null
	// });
	// console.log(outliers.toString());
	let df = Timeseries.merge([this, outliers]).setDateIndex;
	return df;
}
Timeseries.prototype.removeOutliers = removeOutliers;
Timeseries.prototype.clean = removeOutliers;
