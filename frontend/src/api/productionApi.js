import axiosClient from "./axiosClient";

// Backend base: /api/egg-productions
export const getProductions = (params) =>
  axiosClient.get("/egg-productions", { params });

// Backend register endpoint: /api/egg-productions/RegisterDailyProduction
export const registerProduction = (data) =>
  axiosClient.post("/egg-productions/RegisterDailyProduction", data);