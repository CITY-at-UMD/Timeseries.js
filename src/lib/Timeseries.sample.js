import { gapExists, gapFill } from "./Timeseries.fill";

function resample(df, interval = ["day", 1], {fillType}) {
	// if (!(dataframe instanceof DataFrame)) dataframe = new Timeseries(dataframe);
	// if (dataframe instanceof Timeseries) dataframe = dataframe.df;
	if (["minute", "hour", "day", "month", "year"].indexOf(interval[0]) < 0) {
		throw new Error("interval type not supported");
	}
	let filled = df
		.fillGaps(gapExists(interval), gapFill(fillType, interval, options))
		.withIndex(row => row.date.valueOf());
	// .bake();
	return filled;
}
export { resample };
