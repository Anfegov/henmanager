import axiosClient from "./axiosClient";

export function login(data) {
  return axiosClient.post("/auth/login", data);
}
