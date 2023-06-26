FROM python:3.10-bullseye

ENV DEBIAN_FRONTEND noninteractive

RUN sudo apt update

RUN sudo apt install -y \
  python-pip3

RUN pip3 install \
  flask \
  pillow \
  numpy \
  h5py \
  && echo "...pip3 deps successfully installed..."
