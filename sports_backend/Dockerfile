FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache openssl mysql-client
RUN npm install
COPY . .
RUN npx prisma generate
# Create necessary directories with proper permissions
RUN mkdir -p /app/node_modules/.cache && chown -R node:node /app
# Switch to node user
USER node
EXPOSE 4000
CMD ["npm", "run", "dev"] 