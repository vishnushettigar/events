FROM node:24-slim

# Install necessary dependencies for libsql
RUN apt-get update && apt-get install -y \
    openssl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./

# Install dependencies with correct platform targeting
RUN npm install --target_platform=linux --target_arch=arm64

COPY . .

# Verify libsql binary installation
RUN ls -la node_modules/@libsql/ || echo "libsql not found"
RUN find node_modules -name "*libsql*" -type d || echo "No libsql directories found"

# Generate Prisma client
RUN npx prisma generate

# Create necessary directories with proper permissions
RUN mkdir -p /app/node_modules/.cache && chown -R node:node /app

# Switch to node user
USER node
EXPOSE 4000
CMD ["npm", "run", "dev"] 