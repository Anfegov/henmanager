import axiosClient from "./axiosClient";

export const paymentsApi = {
  getBySale: async (saleId) => (await axiosClient.get(`/sales/${saleId}/payments`)).data,
  create: async (saleId, payload) =>
    (await axiosClient.post(`/sales/${saleId}/payments`, payload)).data,
};
