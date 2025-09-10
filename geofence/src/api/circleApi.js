import api from './authApi'; // assuming same axios instance

const createCircle = (name) => api.post('/circles/create', { name });
const generateCode = () => api.post('/circles/generate-code');
const joinByCode = (code) => api.post('/circles/join', { code });
const getAll = () => api.get('/circles/all');

export default { createCircle, generateCode, joinByCode, getAll };
