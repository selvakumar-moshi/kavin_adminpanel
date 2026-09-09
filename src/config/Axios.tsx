import axios from "axios";

// let apiURL = "https://dev-api.supersales.co.in/api";
let apiURL = "https://localhost:7261/api";

const Super_Sales = axios.create({
  baseURL: apiURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach the auth token to every API call
Super_Sales.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle API errors
Super_Sales.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default Super_Sales;