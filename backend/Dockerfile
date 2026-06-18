# Base stage
FROM node:20-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./
EXPOSE 5000

# Development stage (runs nodemon with mounted volume)
FROM base AS development
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production
RUN npm ci --omit=dev
COPY . .
ENV NODE_ENV=production
CMD ["node", "src/server.js"]
