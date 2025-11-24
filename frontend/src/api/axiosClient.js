import axios from "axios";

const axiosClient = axios.create({
  // Prefer env, but default to docker/microservice port 5001
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api"
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;