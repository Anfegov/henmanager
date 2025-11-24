import axiosClient from "./axiosClient";

export const creditsApi = {
  getCustomersInDebt: async () => (await axiosClient.get("/credits/customers")).data,
  getCustomerDebt: async (id) => (await axiosClient.get(`/credits/customers/${id}`)).data,
  getSummary: async () => (await axiosClient.get("/credits/summary")).data,
};
