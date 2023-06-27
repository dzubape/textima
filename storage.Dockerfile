FROM python:3.10-bullseye

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

CMD ["flask", "--app", "storage.py", "--debug", "run", "--host", "0.0.0.0"]
