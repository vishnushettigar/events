# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Create node user directory and set ownership early
RUN chown -R node:node /app

# Switch to node user before installing dependencies
# This ensures all files are created with correct ownership
USER node

# Copy package files
COPY --chown=node:node package*.json ./

# Install dependencies (runs as node user, so files have correct ownership)
RUN npm install

# Create vite cache directory
RUN mkdir -p /app/node_modules/.vite

# Copy the rest of the application
COPY --chown=node:node . .

# Expose port
EXPOSE 5173

# Start the application with host flag to allow external access
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 