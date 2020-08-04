FROM node:12

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

RUN npm install typescript -g 
RUN npm install ts-node -g 

COPY . .

EXPOSE 3000

CMD [ "ts-node", "./src/index.ts" ]


