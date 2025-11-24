import axiosClient from "./axiosClient";

export const salesApi = {
  getAll: async (params) => (await axiosClient.get("/sales", { params })).data,
  register: async (data) => (await axiosClient.post("/sales", data)).data,
  getPendingCredits: async (params) => (await axiosClient.get("/sales/credits", { params })).data,
  cancelCredit: async (id) => (await axiosClient.put(`/sales/${id}/cancel`)).data,
  getPayments: async (id) => (await axiosClient.get(`/sales/${id}/payments`)).data,
  addPayment: async (id, data) => (await axiosClient.post(`/sales/${id}/payments`, data)).data,
};

// backward compatible named exports
export const getSales = (params) => axiosClient.get("/sales", { params });
export const registerSale = (data) => axiosClient.post("/sales", data);
