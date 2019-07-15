const Timeseries = require('../TimeSeries.js')
const dataForge = require("data-forge");
require("data-forge-fs");

let df = dataForge
  .readFileSync("../testData/88_electricity_5c848e1d2d71b6c3807a616c.csv")
  .parseCSV({ dynamicTyping: true });
console.time('object')
let ts = new Timeseries(df);
// console.log(ts.df.toString())
// console.log(ts.df.getSeries('value').max())
console.log(ts.length)
console.log(ts.interval)
let filled = Timeseries.upsample(ts,  'value', ts.interval)
console.log(filled.length);
console.log(filled.df.toString())
console.timeEnd('object')


// let b = Timeseries.blank(
//   new Date("Thu Jan 01 2015 00:00:00 GMT-0500 (Eastern Standard Time)"),
//   new Date(" Fri Feb 08 2019 00:00:00 GMT-0500 (Eastern Standard Time)"),
//   ["minute", 15]
// );
// console.log(b)