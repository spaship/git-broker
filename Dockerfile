FROM node:18-alpine3.16 AS build

ARG USERGROUP

RUN addgroup allusers && adduser -S -G allusers $USERGROUP
RUN mkdir /.npm
RUN mkdir /.npm/_cacache

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production
COPY . .

RUN chown -R $USERGROUP:allusers .
RUN chown -R $USERGROUP:allusers ~/.npm
RUN chown -R $USERGROUP:allusers /.npm
RUN chmod -R 777 .

EXPOSE 9191

USER $USERGROUP

CMD ["npm", "run", "start"]