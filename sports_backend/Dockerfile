FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN apk add --no-cache mysql-client
RUN npx prisma generate
EXPOSE 4000
CMD ["npm", "run", "dev"] 