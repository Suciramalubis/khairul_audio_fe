import axios from "axios";

const api = axios.create({
  baseURL: "/api", // sesuaikan backend kamu
});

export default api;
