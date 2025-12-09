# Stage 1: Build the React Application
FROM node:20-alpine as builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Stage 2: Setup the Node.js Server
FROM node:20-alpine

WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./
RUN npm install --production

# Copy server source
COPY server/index.js ./

# Copy built frontend from Stage 1
COPY --from=builder /app/dist /app/dist

# Expose port
EXPOSE 3000

# Environment variables (Should be passed at runtime)
ENV PORT=3000

# Start command
CMD ["npm", "start"]
