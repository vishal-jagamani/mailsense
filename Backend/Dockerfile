# Use a specific Node.js version (Alpine for smaller size)
FROM node:20-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /usr/src/app

# Copy dependency files first
COPY package*.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy rest of the app
COPY . .

# Build TypeScript code
RUN pnpm run build

# Expose app port
EXPOSE 8080

# Start app
CMD ["pnpm", "run", "start"]
