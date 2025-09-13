# 1. Use Node.js v20 official alpine image (lightweight)
FROM node:20.15.1-alpine

# 2. Set working directory inside container
WORKDIR /usr/src/app

# 3. Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# 4. Install dependencies
RUN npm install --production

# 5. Copy rest of the project files
COPY . .

# 6. Expose your app port (default 3000)
EXPOSE 3000

# 7. Start the app
CMD ["npm", "start"]
