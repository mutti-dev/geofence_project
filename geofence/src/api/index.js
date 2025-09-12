import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_URL } from "../utils/constants";





const API = axios.create({
  baseURL: API_URL, // Use your local machine IP if using a device
  headers: {
    "Content-Type": "application/json",
  },
});


// Add token interceptor
API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});



export default API;
