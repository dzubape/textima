FROM node as dev

WORKDIR /app/prod
COPY . .
RUN npm install -g npm@9.7.2
RUN npm i -g nodemon
RUN npm i --include=dev,prod


CMD ["npm", "run", "back-dev"]
