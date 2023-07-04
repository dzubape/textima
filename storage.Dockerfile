FROM python:3.10-bullseye as dev

ENV DEBIAN_FRONTEND noninteractive

RUN apt update

RUN apt install -y \
  python3-pip

RUN pip3 install \
  flask \
  pillow \
  numpy \
  h5py \
  && echo "...pip3 deps successfully installed..."


WORKDIR /app/prod
COPY . .

ARG STORAGE_SERVER_PORT
ENV STORAGE_SERVER_PORT ${STORAGE_SERVER_PORT}

RUN echo "STORAGE_SERVER_PORT: ${STORAGE_SERVER_PORT}"

# CMD ["flask", "--app", "storage.py", "--debug", "run", "--host", "0.0.0.0", "--port", "${STORAGE_SERVER_PORT}"]
# CMD echo "STORAGE_SERVER_PORT: ${STORAGE_SERVER_PORT}"

CMD flask --app storage.py --debug run --host 0.0.0.0 --port ${STORAGE_SERVER_PORT}
