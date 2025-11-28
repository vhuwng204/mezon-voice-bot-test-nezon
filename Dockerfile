# Use Node.js version 20 as the base image
FROM node:20

# Install build dependencies for native modules (better-sqlite3, etc.)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (this will rebuild native modules for Linux)
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Verify build output
RUN ls -la dist/ && \
    echo "=== Looking for main.js ===" && \
    find dist -name "main.js" -type f

# Run the application
CMD ["node", "dist/main.js"]
