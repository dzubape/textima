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

WORKDIR /app/dev
CMD ["flask", "--app", "storage.py", "--debug", "run", "--host", "0.0.0.0"]


FROM dev as prod

WORKDIR /app/prod
COPY . ./

CMD ["flask", "--app", "storage.py", "run", "--host", "0.0.0.0"]

