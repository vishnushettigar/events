# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Create node_modules directory with proper permissions
RUN mkdir -p /app/node_modules/.vite && chown -R node:node /app

# Switch to node user
USER node

# Expose port
EXPOSE 5173

# Start the application with host flag to allow external access
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 