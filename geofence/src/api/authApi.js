import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "./index";


export const registerApi = async (name, email, password, role = "member", circleName, inviteCode) => {
  console.log("Calling registerApi with:", { name, email, password, role, circleName, inviteCode });
  try {
    const { data } = await API.post("/auth/register", { name, email, password, role, circleName, inviteCode });
    console.log("Register API Response:", data);
    return data;
  } catch (error) {
    console.error("Register API Error:", error.message, error.response?.data);
    return { error: error.response?.data?.message || "Register failed" };
  }
};

export const loginApi = async (email, password) => {
  try {
    const { data } = await API.post("/auth/login", { email, password });
    return data;
  } catch (error) {
    return { error: error.response?.data?.message || "Login failed" };
  }
};
