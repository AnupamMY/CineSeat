import axios from "axios";
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "https://test.yauvna.com/", withCredentials: true });
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = new Error(error.response?.data?.message || "Something went wrong");
    apiError.status = error.response?.status;
    apiError.validation = error.response?.data?.errors;
    return Promise.reject(apiError);
  }
);
