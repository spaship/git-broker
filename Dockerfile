FROM node:20

RUN addgroup puzzgroup && adduser --ingroup puzzgroup puzzuser
WORKDIR /app
RUN chmod -R 777 /app

# https://www.google.com/linuxrepositories/
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN echo 'deb http://dl.google.com/linux/chrome/deb/ stable main' >> /etc/apt/sources.list

RUN apt-get update && apt-get install --no-install-recommends -y google-chrome-stable



COPY package*.json ./
RUN npm ci --only=production
COPY . .

RUN chown -R puzzuser:puzzgroup /app
USER puzzuser

EXPOSE 9191

CMD ["npm", "run", "start"]