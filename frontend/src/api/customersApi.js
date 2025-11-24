import axiosClient from "./axiosClient";

export const customersApi = {
  getAll: async () => (await axiosClient.get("/customers")).data,
  getById: async (id) => (await axiosClient.get(`/customers/${id}`)).data,
  create: async (payload) => (await axiosClient.post("/customers", payload)).data,
  update: async (id, payload) => (await axiosClient.put(`/customers/${id}`, payload)).data,
  remove: async (id) => (await axiosClient.delete(`/customers/${id}`)).data,
};
