import axiosClient from "./axiosClient";

export const getSupplies = (params) =>
  axiosClient.get("/supplies", { params });

export const registerSupply = (data) =>
  axiosClient.post("/supplies", data);

export const updateSupply = (id, data) =>
  axiosClient.put(`/supplies/${id}`, data);

export const deleteSupply = (id) =>
  axiosClient.delete(`/supplies/${id}`);
