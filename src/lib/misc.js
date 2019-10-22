import dayjs from "dayjs";
export const annualScale = (start, end) =>
	365 / dayjs(end).diff(dayjs(start), "day");
export const calculateChange = (baseline, value) =>
	(value - baseline) / baseline;
