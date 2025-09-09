import crypto from 'crypto';

export const isInsideGeofence = (lat1, lng1, lat2, lng2, radius) => {
  const distance = Math.sqrt(Math.pow(lat1-lat2,2) + Math.pow(lng1-lng2,2));
  return distance <= radius;
};

const generateCode = (hours = 2) => {
  const code = crypto.randomBytes(3).toString('hex').toUpperCase();
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  return { code, expiresAt };
};

export default generateCode;
