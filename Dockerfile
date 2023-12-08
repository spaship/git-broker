FROM node:20.2.0-alpine3.16 AS build

RUN addgroup -S puzzgroup && adduser -S -G puzzgroup puzzuser
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production
COPY . .

# Set the CHROME_PATH environment variable
ENV CHROME_PATH /path/to/chrome

RUN chown -R puzzuser:puzzgroup /app
USER puzzuser

EXPOSE 9191

CMD ["npm", "run", "start"]