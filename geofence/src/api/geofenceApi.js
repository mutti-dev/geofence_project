import api from './authApi';

const create = (payload) => api.post('/geofences', payload);
const update = (id, payload) => api.put(`/geofences/${id}`, payload);
const remove = (id) => api.delete(`/geofences/${id}`);
const list = () => api.get('/geofences/circle');

export default { create, update, remove, list };
