FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 5173

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=5173

# Start the development server using the dev script
# CMD ["npm", "run", "dev"] 
# Keep container running for debugging
# CMD ["tail", "-f", "/dev/null"] 

# Start the development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 