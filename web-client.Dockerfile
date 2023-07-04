FROM node

WORKDIR /app/prod
COPY . .
RUN npm i

RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb -O /tmp/chrome.deb
RUN apt -f install -y /tmp/chrome.deb
# RUN apt-get -f install -y
# RUN ls /tmp -al

CMD ["npm", "run", "build-ds"]
