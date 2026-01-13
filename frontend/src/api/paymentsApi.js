import axiosClient from "./axiosClient";

export const paymentsApi = {
  getHistory: async (saleId) => (await axiosClient.get(`/credits/${saleId}/payments`)).data,
  register: async (saleId, amount) =>
    (await axiosClient.put(`/credits/${saleId}/pay`, { amount })).data,
};
