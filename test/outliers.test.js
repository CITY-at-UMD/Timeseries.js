const dataForge = require("data-forge");
require("data-forge-fs");
const Timeseries = require("../Timeseries.js");
test("test addition", () => {
	expect(1 + 1).toBe(2);
});

let df = dataForge
	.readFileSync("./testData/88_electricity_5c848e1d2d71b6c3807a616c.csv")
	.parseCSV({ dynamicTyping: true });
let ts = new Timeseries(df);

console.log(ts.calculateOutlierThresholds({ filterZeros: true }));
