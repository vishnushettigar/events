FROM node:24-slim

# Install necessary dependencies for libsql
RUN apt-get update && apt-get install -y \
    openssl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create node user directory and set ownership early
RUN chown -R node:node /app

# Switch to node user before installing dependencies
# This ensures all files are created with correct ownership
USER node

COPY --chown=node:node package*.json ./

# Install dependencies with correct platform targeting
# Runs as node user, so files have correct ownership
RUN npm install --target_platform=linux --target_arch=arm64

COPY --chown=node:node . .

# Verify libsql binary installation
RUN ls -la node_modules/@libsql/ || echo "libsql not found"
RUN find node_modules -name "*libsql*" -type d || echo "No libsql directories found"

# Generate Prisma client
RUN npx prisma generate

# Create necessary directories (already owned by node user)
RUN mkdir -p /app/node_modules/.cache

EXPOSE 4000
CMD ["npm", "run", "dev"] 