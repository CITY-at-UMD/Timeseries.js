const Timeseries = require("../dist/index");
const dayjs = require("dayjs");
const randomData = () =>
  new Array(4).fill(0).map((v, i) => ({
    date: dayjs()
      .year(2018 - i)
      .startOf("year")
      .toDate(),
    value: 2000000 + Math.random() * 1000000
  }));
let df = new Timeseries(randomData());
console.log(df.toString());
