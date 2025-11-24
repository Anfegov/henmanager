import axiosClient from "./axiosClient";

export const getMonthlyProfit = (year, month) =>
  axiosClient.get("/reports/monthly-profit", { params: { year, month } });
