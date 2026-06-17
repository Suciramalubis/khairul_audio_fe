import axios from "axios";

const api = axios.create({
  baseURL: "http://3.26.144.68/api", // sesuaikan backend kamu
});

export default api;
