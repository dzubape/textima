FROM node as dev

WORKDIR /app/dev
CMD ["npm", "run", "back-dev"]


FROM dev as prod

WORKDIR /app/prod
COPY . ./
RUN npm i
