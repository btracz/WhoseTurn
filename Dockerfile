FROM node:8-alpine

ENV PORT 3000

CMD mkdir /app
ADD . /app
WORKDIR /app

RUN npm install --production

EXPOSE ${PORT}

USER node

VOLUME /app/data
VOLUME /app/public/images



ENTRYPOINT ["npm", "start"]