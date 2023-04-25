FROM node:18-alpine3.16 AS build

RUN addgroup -S puzzgroup && adduser -S -G puzzgroup puzzuser
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production
COPY . .

RUN chown -R puzzuser:puzzgroup /app
USER puzzuser

EXPOSE 3001

CMD ["node", "index.js"]