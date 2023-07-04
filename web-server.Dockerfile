FROM node as dev

WORKDIR /app/prod
COPY . .
RUN npm i --include=dev

CMD ["npm", "run", "back-dev"]
