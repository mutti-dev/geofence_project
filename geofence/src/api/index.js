import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// import MapboxGL from "@maplibre/maplibre-react-native";

// Agar tum dummy ya real token use karna chahte ho:
// MapboxGL.setAccessToken("pk.test"); 



const API = axios.create({
  baseURL: "https://5a97881c2fbc.ngrok-free.app/api", // Use your local machine IP if using a device
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
