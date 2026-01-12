import axiosClient from "./axiosClient";

// Backend base: /api/egg-productions
export const getProductions = (params) =>
  axiosClient.get("/egg-productions", { params });

// Backend register endpoint: /api/egg-productions/RegisterDailyProduction
export const registerProduction = (data) =>
  axiosClient.post("/egg-productions/RegisterDailyProduction", data);

export const updateProduction = (id, data) =>
  axiosClient.put(`/egg-productions/${id}`, data);

export const deleteProduction = (id) =>
  axiosClient.delete(`/egg-productions/${id}`);