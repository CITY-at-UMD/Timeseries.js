// Source: https://www.itl.nist.gov/div898/handbook/eda/section3/eda35h3.htm
const { DataFrame } = require("data-forge");
const stats = require("simple-statistics");
var { Studentt } = require("distributions");

function rval(df) {
	let values = df.getSeries("x").toArray();
	let std = stats.sampleStandardDeviation(values);
	let xbar = stats.mean(values);
	let ndf = df.generateSeries({ ares: row => Math.abs(row.x - xbar) / std });
	let R = ndf.getSeries("ares").max();
	return { R, df: ndf, std, mean: xbar };
}

function pValue(n, i, alpha) {
	let p = 1 - alpha / (2 * (n - i + 1));
	return p;
}
function tValue(p, degreeOfFreedom) {
	let qt = new Studentt(degreeOfFreedom);
	return qt.inv(p);
}
//
function lambdaTest(n, i, alpha) {
	let p = pValue(n, i, alpha);
	let df = n - i - 1;
	let t = tValue(p, df);
	let lambda =
		(t * (n - i)) / Math.sqrt((n - i - 1 + Math.pow(t, 2)) * (n - i + 1));
	return { lambda, p, t };
}
function rosnerTest(dataset = [], k = 10, alpha = 0.05) {
	let dataframe = new DataFrame({
		values: dataset.map((x, index) => ({ x, index }))
	});

	let n = dataframe.getSeries("x").count();
	let newdf;
	let i = 1;
	let outliers = [];
	let trip = false;
	while (i <= k) {
		let pair = {};
		if (i === 1) {
			let { R, df, mean, std } = rval(dataframe);
			newdf = df.where(row => row.ares !== R);
			pair = Object.assign({}, pair, {
				mean,
				std,
				Value: df
					.where(row => row.ares === R)
					.getSeries("x")
					.first(),
				R
			});
		} else {
			let { R, df, mean, std } = rval(newdf);
			newdf = df.where(row => row.ares !== R);
			pair = Object.assign({}, pair, {
				mean,
				std,
				Value: df
					.where(row => row.ares === R)
					.getSeries("x")
					.first(),
				R
			});
		}
		let { lambda, p, t } = lambdaTest(n, i, alpha);
		pair = Object.assign({}, pair, { lambda });
		outliers.push(pair);
		if (trip && pair.R > pair.lambda) trip = false;
		if (pair.R < pair.lambda) {
			if (trip) {
				break;
			} else {
				trip = true;
			}
		}
		i++;
	}
	outliers = new DataFrame(outliers)
		.generateSeries({
			outlier: row => row.R > row.lambda
		})
		.takeWhile(row => row.outlier);

	return {
		outliers,
		threshold: {
			min: 0,
			max: outliers.getSeries("Value").min()
		}
	};
}
module.exports = { rosnerTest };
