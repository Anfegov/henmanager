import axiosClient from "./axiosClient";

export const eggTypesApi = {
  getAll: async (activeOnly = false) => {
    const params = activeOnly ? { activeOnly: true } : {};
    return (await axiosClient.get("/egg-types", { params })).data;
  },
  getById: async (id) => (await axiosClient.get(`/egg-types/${id}`)).data,
  create: async (data) => (await axiosClient.post("/egg-types", data)).data,
  update: async (id, data) => (await axiosClient.put(`/egg-types/${id}`, data)).data,
  remove: async (id) => (await axiosClient.delete(`/egg-types/${id}`)).data,
};
