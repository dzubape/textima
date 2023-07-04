FROM node as dev

WORKDIR /app/prod
COPY . .
RUN npm i

CMD ["npm", "run", "back-dev"]
