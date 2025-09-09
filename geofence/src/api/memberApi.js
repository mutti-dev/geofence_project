import API from "./index";

export const getMyMembers = () => API.get("/members/my-members");
export const addMember = (data) => API.post("/members/add", data);
