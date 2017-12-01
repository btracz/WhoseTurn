FROM node:6-alpine

CMD mkdir /app
ADD . /app
WORKDIR /app

RUN npm install --production

EXPOSE 36789

ENTRYPOINT ["npm", "start"]