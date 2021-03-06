import { DataFrame } from "data-forge";
// require("data-forge-fs");
import {
  gapExists,
  gapFillBlank,
  valueFiller
} from "./Timeseries.fill";
import { calculateInterval } from "./Timeseries.interval";
import {
  calculateOutlierThresholds,
  isOutlier,
  validMean,
  validMonthlyMeanMap,
  zeroReplacement
} from "./Timeseries.statistics";

function processTimeseries(ts, { zeroThreshold = 96 } = {}) {
  let df = new DataFrame(ts)
    .generateSeries({
      flag: row => []
    })
    .withIndex(row => new Date(row.date).valueOf());
  const interval = calculateInterval(df);
  df = df.fillGaps(
    gapExists(interval),
    gapFillBlank(interval, "missing")
  );
  let { outliers, threshold } = calculateOutlierThresholds(df);
  let data = df.toArray().map(({ date, value, flag }) => {
    let out = isOutlier(value, threshold);
    return {
      date,
      value,
      flag,
      ...(out && {
        value: undefined,
        flag: ["clean"],
        raw: value
      })
    };
  });
  df = new DataFrame(data).withIndex(row =>
    new Date(row.date).valueOf()
  );
  df = zeroReplacement(df, zeroThreshold);
  const mean = validMean(df);
  const monthly = validMonthlyMeanMap(df);
  // fill data
  df = new DataFrame(
    df.toArray().map(row => {
      if (row.value === null || row.value === undefined) {
        let { value, flag } = valueFiller(
          "dateFunction",
          {},
          {
            dateFunction: date => {
              return (
                monthly.get(new Date(date).getMonth()) || mean
              );
            },
            date: row.date
          }
        );
        return {
          ...row,
          value,
          flag: [...flag, ...(row.flag || [])]
        };
      } else {
        return row;
      }
    })
  ).withIndex(row => new Date(row.date).valueOf());
  return { df, threshold, mean, monthly };
}

export { processTimeseries };
