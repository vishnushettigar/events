FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache openssl mysql-client
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 4000
CMD ["npm", "run", "dev"] 