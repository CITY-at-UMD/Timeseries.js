const Timeseries = require("../dist/index");
// const { DataFrame } = require("data-forge");
// let ts = Timeseries.blank(new Date(2017, 3, 3), new Date(2017, 4, 5, 0, 0), [
// 	"day",
// 	1
// ]);
// ts.populate(100000);
// console.log(ts.toString());
// console.log(ts.before(new Date(2017, 4, 5, 0, 0)).toString());
let data = [
  {
    "electricity-Grid": 100254000,
    "electricity-CHP": 146285269,
    "ng-Other": 664776,
    steam: 731492000,
    chw: 22320695,
    "energy-Source": 2403403673.356407,
    date: "2015-01-01T05:00:00.000Z"
  },
  {
    "electricity-Grid": 80203200,
    "electricity-CHP": 117028215.2,
    "ng-Other": 664776,
    steam: 731492000,
    chw: 22320695,
    "energy-Source": 2403403673.356407,
    date: "2020-01-01T05:00:00.000Z"
  }
];
let df = new Timeseries(data);
console.log(df.toString())
let ndf = df.fill(['year', 1], 'interpolate')
console.log(ndf.toString())