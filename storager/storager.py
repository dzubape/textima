#!/usr/bin/python3

import os
import sys
import logging
from pathlib import Path

import numpy as np
import h5py

log = logging.getLogger()
log.setLevel(logging.DEBUG)

logHandler = logging.StreamHandler(sys.stderr)
logHandler.setLevel(logging.DEBUG)
logFormatter = logging.Formatter('[%(asctime)s] %(message)s')
logHandler.setFormatter(logFormatter)
log.addHandler(logHandler)

from flask import (
  Flask,
  request,
  session,
  send_file,
  abort,
)

from utils import (
  allowed_file,
  fit_size,
)

from PIL import Image
from tempfile import TemporaryDirectory

def respStatus(status, status_code, **data):
  return {
    'status': status,
    'status_code': status_code,
    } | data, status_code


def respError(*info, **data):
  status_code = 400
  if len(info) > 0:
    data['msg'] = info[0]
  if len(info) > 1:
    status_code = info[1]
  return respStatus('error', status_code, **data)


def respOk(*info, **data):
  status_code = 200
  if len(info) > 0:
    data['msg'] = info[0]
  if len(info) > 1:
    status_code = info[1]
  return respStatus('ok', status_code, **data)


app = Flask(__name__)

class Dataset:
  storage_list = {}

  def __init__(_s,
    id: str,
    in_width: int,
    in_height: int,
    color_no: int,
    layer_no: int,
  ):
    _s.__id = id
    _s.__in_width = in_width
    _s.__in_height = in_height
    _s.__color_no = color_no
    _s.__layer_no = layer_no
    _s.__storage_filepath = Path() / f'{id}.h5'
    Dataset.storage_list[_s.__id] = _s
    return

  @staticmethod
  def getStorage(id: str, sample_no: int=1000):
    in_width = 256
    in_height = 256
    color_no = 3 # RGB
    layer_no = 3 # spot, axes, sizes

    if id in Dataset.storage_list:
      ds = Dataset.storage_list[id]
    else:
      ds = Dataset(
        id,
        in_width,
        in_height,
        color_no,
        layer_no,
      )
    return ds

  def open(_s):
    if _s.__storage_filepath.exists():
      _s.__fp = h5py.File(_s.__storage_filepath, 'w')
    else:
      _s.__fp = h5py.File(_s.__storage_filepath, 'w')
      _s.__fp.create_dataset('X', (_s.__sample_no, _s.__color_no, _s.__input_width, _s.__input_height), dtype=np.uint8)
      _s.__fp.create_dataset('Y', (_s.__sample_no, _s.__layer_no, _s.__input_width, _s.__input_height), dtype=np.uint8)
    return

  def close(_s):
    Dataset.storage_list[_s.__id]


@app.route('/image', methods=['POST'])
def image_add():
  if len(request.files) == 0:
    return respError(f'no images attached')

  imgs = []
  for file_id in request.files:
    uploaded_file = request.files[file_id]
    if not allowed_file(uploaded_file.filename, ['jpg', 'png']):
      log.debug(f'not allowed file <{uploaded_file.filename}>')
      return respError(f'not allowed ext. {uploaded_file.filename}')


    with TemporaryDirectory() as tmp_dir:
      tmp_filepath = os.path.join(tmp_dir, filename)
      uploaded_file.save(tmp_filepath)
      src_img = Image.open(tmp_filepath)



      src_img.save(dst_filepath)
      src_img.convert("RGB").resize(size=fit_size(src_img.size, (256, 256))).save(thumb_filepath, 'JPEG', quality=95)

    # imgs.append(dst_filepath)
    imgs.append(img_uuid)

  if len(imgs) == 0:
    return respError('no image has been added')

  return respOk(imgs=imgs)


@app.route('/pdf', methods=['POST'])
def pdf_add():
  if not 'user_id' in session:
    return respError('Pls login')
  user_id = session['user_id']

  if len(request.files) == 0:
    return respError(f'no pdf attached')

  db = db_connect()
  cursor = db.cursor()

  imgs = []
  for file_id in request.files:
    uploaded_file = request.files[file_id]
    if not allowed_file(uploaded_file.filename, ['pdf']):
      log.debug(f'not allowed file <{uploaded_file.filename}>')
      return respError(f'not allowed ext. {uploaded_file.filename}')

    cursor.execute('''--sql
INSERT INTO "datasheet"("is_pdf", "owner_id")
VALUES (TRUE, %(owner_id)s) RETURNING "id", "uuid";
    ''', {
      'owner_id': user_id,
    })
    datasheet_id, datasheet_uuid =  cursor.fetchone()
    db.commit()

    os.makedirs(PDF_DIR, exist_ok=True)
    thumb_dir = os.path.join(IMG_DIR, 'thumb')
    os.makedirs(thumb_dir, exist_ok=True)

    pdf_filepath = os.path.join(PDF_DIR, datasheet_uuid + '.pdf')
    uploaded_file.save(pdf_filepath)

    with TemporaryDirectory() as tmp_dir:
      images = convert_from_path(pdf_filepath, output_folder=tmp_dir, paths_only=True)
      for tmp_filepath in images:
        cursor.execute('''--sql
INSERT INTO "img"("datasheet_id") VALUES (%(datasheet_id)s) RETURNING "uuid";
        ''', {
          'datasheet_id': datasheet_id,
        })
        img_uuid, =  cursor.fetchone()
        db.commit()

        src_img = Image.open(tmp_filepath)

        filename = img_uuid + '.png'
        dst_filepath = os.path.join(IMG_DIR, filename)
        thumbname = img_uuid + '.jpg'
        thumb_filepath = os.path.join(thumb_dir, thumbname)

        src_img.save(dst_filepath)
        src_img.convert("RGB").resize(size=fit_size(src_img.size, (256, 256))).save(thumb_filepath, 'JPEG', quality=95)

        # imgs.append(dst_filepath)
        imgs.append(img_uuid)

  if len(imgs) == 0:
    return respError('no image has been added')

  return respOk(imgs=imgs)
