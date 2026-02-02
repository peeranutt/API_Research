FROM --platform=linux/amd64 node:18-alpine as build-stage

WORKDIR /app

COPY . .

RUN npm install --production

EXPOSE 4000

CMD ["node", "server.js"]
