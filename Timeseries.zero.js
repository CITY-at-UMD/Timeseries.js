const { DataFrame } = require("data-forge");
const stats = require("simple-statistics");

const zerogrouping = (dataframe, column) => {
	// group sequential
	let df = dataframe.variableWindow((a, b) => a.value === b.value);
	console.log(df.toString());
};
module.exports = { zerogrouping };
