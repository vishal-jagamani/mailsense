# Use the latest Node.js version
FROM node:latest

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN pnpm install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

# Build the TypeScript code
RUN pnpm run build

EXPOSE 8080

CMD ["pnpm", "run", "start"]
