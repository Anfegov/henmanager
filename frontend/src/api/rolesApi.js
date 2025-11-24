import axiosClient from "./axiosClient";

export const getRoles = () => axiosClient.get("/roles");
export const getPermissions = () => axiosClient.get("/roles/permissions");
export const createRole = (data) => axiosClient.post("/roles", data);
export const updateRole = (id, data) => axiosClient.put(`/roles/${id}`, data);
export const deleteRole = (id) => axiosClient.delete(`/roles/${id}`);
