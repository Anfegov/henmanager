import axiosClient from "./axiosClient";

export const getBatches = () => axiosClient.get("/batches");
export const getBatchById = (id) => axiosClient.get(`/batches/${id}`);
export const createBatch = (data) => axiosClient.post("/batches", data);
export const updateBatch = (id, data) => axiosClient.put(`/batches/${id}`, data);
export const closeBatch = (id) => axiosClient.put(`/batches/${id}/close`);
