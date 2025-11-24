import axiosClient from "./axiosClient";

export const getSupplies = (params) =>
  axiosClient.get("/supplies", { params });

export const registerSupply = (data) =>
  axiosClient.post("/supplies", data);
