# CampusVoice Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy dependency files
COPY backend/package.json ./
RUN npm install --legacy-peer-deps

# Copy shared package
COPY shared/ ./shared/
RUN cd shared && npm install --legacy-peer-deps

# Copy source code
COPY backend/ ./

# Build TypeScript
RUN npm run build

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
