import dayjs from "dayjs";
import _ from "lodash";
import fromPairs from "lodash/fromPairs";
import toPairs from "lodash/toPairs";
const gapExists = ([duration, durationValue = 1]) => (
  pairA,
  pairB
) => {
  const startDate = pairA[0];
  const endDate = pairB[0];
  let gapSize = Math.floor(
    dayjs(endDate).diff(startDate, duration, true) /
      durationValue
  );

  if (gapSize > 0) return true;
  return false;
};
const gapExists_old = (interval, maxGap) => (pairA, pairB) => {
  const startDate = pairA[0];
  const endDate = pairB[0];
  let gapSize;
  if (interval === "quarterHour") {
    gapSize = Math.floor(
      dayjs(endDate).diff(startDate, "minutes") / 15
    );
  } else {
    gapSize = dayjs(endDate).diff(startDate, interval);
  }
  if (maxGap && maxGap > gapSize) return false;
  if (gapSize > 0) return true;
  return false;
};

const gapFillNull = ([duration, durationValue], flag) => (
  pairA,
  pairB
) => {
  const startDate = pairA[0];
  const endDate = pairB[0];
  let gapSize = Math.floor(
    dayjs(endDate).diff(startDate, duration) / durationValue
  );
  const numEntries = gapSize - 1;
  const newEntries = [];

  for (
    let entryIndex = 0;
    entryIndex < numEntries;
    ++entryIndex
  ) {
    let date = dayjs(startDate)
      .add((entryIndex + 1) * durationValue, duration)
      .toDate();
    newEntries.push([
      date.valueOf(),
      { date, value: null, ...(flag && { flag: [flag] }) }
    ]);
  }
  return newEntries;
};
const gapFillBlank = gapFillNull;

const valueFiller = (
  fillType,
  { startValue, endValue, entryIndex, numEntries },
  { overrideValue, dateFunction, date, flag }
) => {
  if (
    [
      "pad",
      "interpolate",
      "average",
      "dateFunction",
      "value"
    ].indexOf(fillType) === -1
  ) {
    throw new Error("fill Type not supported");
  }
  let value;
  if (fillType === "pad") {
    value = fromPairs(
      toPairs(startValue).map(([key, val]) => {
        return [key, startValue[key]];
      })
    );

    flag = flag ? flag : ["fill", "pad"];
  } else if (fillType === "interpolate") {
    value = fromPairs(
      toPairs(startValue).map(([key, val]) => {
        let nv =
          startValue[key] +
          (entryIndex + 1) *
            ((endValue[key] - startValue[key]) /
              (numEntries + 1));
        return [key, nv];
      })
    );

    flag = flag ? flag : ["fill", fillType];
  } else if (fillType === "average") {
    value = fromPairs(
      toPairs(startValue).map(([key, val]) => {
        let nv = (startValue[key] + endValue[key]) / numEntries;
        return [key, nv];
      })
    );

    flag = flag ? flag : ["fill", fillType];
  } else if (fillType === "dateFunction" && dateFunction) {
    value = fromPairs(
      toPairs(startValue).map(([key, val]) => {
        let nv = dateFunction(date);
        return [key, nv];
      })
    );
    flag = flag ? flag : ["fill", fillType];
  } else if (fillType === "value") {
    value = fromPairs(
      toPairs(startValue).map(([key, val]) => {
        let nv;
        if (typeof overrideValue === "number") {
          nv = overrideValue;
        } else {
          nv = overrideValue[key];
        }
        return [key, nv];
      })
    );
    flag = flag ? flag : ["fill", fillType];
  } else {
    value = fromPairs(
      toPairs(startValue).map(([key, val]) => {
        return [key, null];
      })
    );
    flag = ["fill"];
  }
  return { ...value, flag };
};

const gapFill = (
  fillType,
  [duration, durationValue],
  { overrideValue, dateFunction, flag } = {}
) => (pairA, pairB) => {
  // Fill values forward.

  const startDate = dayjs(pairA[0]);
  const endDate = dayjs(pairB[0]);
  let gapSize = Math.floor(
    dayjs(endDate).diff(startDate, duration) / durationValue
  );
  const numEntries = gapSize - 1;
  const startValue = pairA[1];
  const endValue = pairB[1];
  const newEntries = [];
  for (
    let entryIndex = 0;
    entryIndex < numEntries;
    ++entryIndex
  ) {
    let adjustment = valueFiller(
        fillType,
        { startValue, endValue, entryIndex, numEntries },
        {
          overrideValue,
          dateFunction,
          flag
        }
      ),
      date = dayjs(startDate)
        .add((entryIndex + 1) * durationValue, duration)
        .toDate();
    let e = [
      date.valueOf(),
      Object.assign({}, adjustment, { date })
    ];
    newEntries.push(e);
  }

  return newEntries;
};

export {
  gapExists,
  gapFill,
  gapFillBlank,
  gapFillNull,
  valueFiller
};
