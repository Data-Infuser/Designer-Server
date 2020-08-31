FROM node:12

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY ./build .

EXPOSE 9092

CMD [ "node", "./src/index.js" ]


