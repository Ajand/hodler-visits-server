FROM node:14-slim

WORKDIR /usr/src/server

COPY package*.json ./

RUN npm install --no-progress --production

COPY ./src .

EXPOSE 4000

CMD ["npm", "start"]