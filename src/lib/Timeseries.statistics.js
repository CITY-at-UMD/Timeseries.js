// Source: https://www.itl.nist.gov/div898/handbook/eda/section3/eda35h3.htm
// https://vsp.pnnl.gov/help/Vsample/Rosners_Outlier_Test.htm
// https://www.itl.nist.gov/div898/handbook/prc/section1/prc16.htm
// https://www.math.ucla.edu/~tom/distributions/KolSmir2.html?
import { DataFrame } from "data-forge";
import { sampleStandardDeviation, mean as _mean, max, median as _median, medianAbsoluteDeviation, quantile } from "simple-statistics";
import { Studentt } from "distributions";
import dayjs from "dayjs";
function rval(df) {
	let values = df.deflate(row => row.x).toArray();
	let std = sampleStandardDeviation(values);
	let mean = _mean(values);
	if (std === 0) {
		let ndf = df.generateSeries({ ares: row => 0 });
		return { R: 0, std, mean, df: ndf };
	}
	let ndf = new DataFrame({
		values: values.map(x => ({ x, ares: Math.abs(x - mean) / std }))
	});
	let R = max(ndf.deflate(row => row.ares).toArray());
	return { R, df: ndf, std, mean };
}

function pValue(n, i, alpha) {
	let p = 1 - alpha / (2 * (n - i + 1));
	return p;
}
function tValue(p, degreeOfFreedom) {
	let qt = new Studentt(degreeOfFreedom);
	let t = qt.inv(p);
	return t;
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
		values: dataset.map(x => ({ x }))
	});
	let n = dataframe.getSeries("x").count();
	let newdf;
	let i = 1;
	let outliers = [];
	let trip = false;
	while (i <= k) {
		let pair = {};
		let s = Date.now();
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
		if (pair.R === 0) break;
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
	let outlierValues = outliers
		.where(row => row.Value > 0)
		.deflate(row => row.Value);
	let thresholds = {
		lower: 0,
		upper: outlierValues.count() > 0 ? outlierValues.min() : Infinity
	};
	return {
		outliers,
		thresholds,
		iterations: i
	};
}
const modz = (value, mad, median) => {
	return (0.6745 * (value - median)) / mad;
};
function modifiedZScoreTest(values) {
	let median = _median(values);
	let mad = medianAbsoluteDeviation(values);
	values = values
		.sort((a, b) => b - a)
		.filter(v => v > 0)
		.map(v => [v, modz(v, mad, median)]);
	let outliers = values.filter(([v, modz]) => Math.abs(modz) >= 3.5);
	let upper = Math.min(...[Infinity, ...outliers.map(v => v[0])]);
	// let score,
	// 	value,
	// 	threshold = Infinity,
	// 	index = 0;
	// do {
	// 	value = values[index];
	// 	score = modz(value, mad, median);
	// 	if (Math.abs(score) >= 3.5) threshold = value;
	// } while (score >= 3.5);
	return { thresholds: { upper, lower: 0 } };
}
function boxPlotTest(values) {
	let q1 = quantile(values, 0.25);
	let q3 = quantile(values, 0.75);
	let iqr = q3 - q1;
	return {
		thresholds: {
			lowerInner: q1 - 1.5 * iqr,
			upperInner: q1 - 3 * iqr,
			lowerOuter: q3 + 1.5 * iqr,
			upperOuter: q3 + 3 * iqr
		}
	};
}
function calculateOutlierThresholds(df, { k, filterZeros = true } = {}) {
	let values = df
		.where(
			row =>
				row.flag === null || row.flag === undefined || Array.isArray(row.flag)
		)
		.where(row => !isNaN(row.value) && row.value !== null)
		.getSeries("value")
		.bake();
	if (filterZeros) values = values.where(value => value > 0);
	if (!k) {
		k =
			values.count() < 1000
				? Math.floor(values.count() * 0.15)
				: Math.min(...[1000, Math.floor(values.count() * 0.02)]);
	}
	if (values.count < 5) return {};
	let { outliers, threshold } = rosnerTest(values.toArray(), k);
	return { outliers, threshold };
}

function zeroCheck(df, threshold = 2) {
	let zeroGroups = df
		.variableWindow((a, b) => {
			return a.value === b.value && a.value === 0;
		})
		.where(window => window.getIndex().count() >= threshold);
	let zeroSummary = zeroGroups
		.select(window => ({
			start: window.first().date,
			end: window.last().date,
			count: window.count()
		}))
		.inflate(); // Series -> dataframe.
	// .toArray()
	return { zeroSummary, zeroGroups };
}

function zeroReplacement(df, threshold) {
	let { zeroGroups } = zeroCheck(df, threshold);
	zeroGroups.forEach(dff => {
		dff = dff.transformSeries({
			value: value => null,
			flag: value => ["zero"]
		});
		df = DataFrame.merge([df, dff]);
	});
	return df;
}
function isOutlier(value, { lower, upper }) {
	if (value < lower || value >= upper) {
		return true;
	}
	return false;
}
function validMean(df) {
	let values = df.getSeries("value").where(value => typeof value === "number");
	return values.average();
}
function validMonthlyMeanMap(df) {
	let dateComparison = row =>
		dayjs(row.date)
			.startOf("month")
			.month();

	df = df
		.where(row => typeof row.value === "number")
		.groupBy(dateComparison)
		.select(group => ({
			month: new Date(group.first().date).getMonth(),
			value: group.deflate(row => row.value).average()
		}));
	return new Map(df.toArray().map(({ month, value }) => [month, value]));
}

function quality(df) {
	let count = df.getIndex().count();
	let valid = df
		.getSeries("flag")
		.where(
			value => value === null || (Array.isArray(value) && value.length === 0)
		)
		.count();
	let missing = df
		.getSeries("flag")
		.where(value => Array.isArray(value))
		.where(value => value.indexOf("missing") !== -1)
		.count();
	let dirty = df
		.getSeries("flag")
		.where(value => Array.isArray(value))
		.where(value => value.indexOf("clean") !== -1)
		.count();
	let zerod = df
		.getSeries("flag")
		.where(value => Array.isArray(value))
		.where(value => value.indexOf("zero") !== -1)
		.count();
	let breakdown = {
		valid: valid / count,
		missing: missing / count,
		invalid: (dirty + zerod) / count
	};
	let report = {
		accuracy: (1 - dirty / count) * 4,
		completeness: 4 * breakdown.valid,
		consistency: 4 * ((count - missing - zerod) / count)
	};
	return { breakdown, report, count };
}

export {
	rosnerTest,
	modifiedZScoreTest,
	boxPlotTest,
	calculateOutlierThresholds,
	zeroReplacement,
	isOutlier,
	validMean,
	validMonthlyMeanMap,
	quality
};
