# Base stage
FROM node:20-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./
EXPOSE 5173

# Development stage (Vite dev server)
FROM base AS development
RUN npm install --legacy-peer-deps
COPY . .
CMD ["npm", "run", "dev", "--", "--host"]

# Build stage for production
FROM base AS build
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Production stage served by Nginx
FROM nginx:alpine AS production
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
