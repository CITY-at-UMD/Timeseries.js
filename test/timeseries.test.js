const Timeseries = require("../Timeseries.js");

test("test addition", () => {
	expect(1 + 1).toBe(2);
});

let ts = new Timeseries(
	new Array(12).fill(0).map((v, i) => ({
		date: new Date(2018, i),
		raw: Math.random() * 100
	}))
);

// console.log(ts.df.toString());
console.log(ts.toArray());
