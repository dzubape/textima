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
    color_no: int, # RGB | Grayscale
    layer_no: int, # class layers
    sample_no: int=1000,
  ):
    _s.__fp = None
    _s.__id = id
    _s.__in_width = in_width
    _s.__in_height = in_height
    _s.__color_no = color_no
    _s.__layer_no = layer_no
    _s.__storage_filepath = Path() / f'{id}.h5'
    _s.__sample_no = sample_no
    _s.__pos = None
    Dataset.storage_list[_s.__id] = _s
    return


  @staticmethod
  def getStorage(
    id: str,
  ):
    return Dataset.storage_list.get(id, None)


  def open(_s):
    max_text_len = 9
    if _s.__storage_filepath.exists():
      _s.__fp = h5py.File(_s.__storage_filepath, 'w')
    else:
      _s.__fp = h5py.File(_s.__storage_filepath, 'w')
      _s.__fp.create_dataset('label', (_s.__sample_no, max_text_len), dtype=np.uint8)
      _s.__fp.create_dataset('X', (_s.__sample_no, _s.__color_no, _s.__input_width, _s.__input_height), dtype=np.uint8)
      _s.__fp.create_dataset('Y', (_s.__sample_no, _s.__layer_no, _s.__input_width, _s.__input_height), dtype=np.uint8)
      _s.__fp.attrs['written_no'] = 0
    _s.__pos = _s.__fp.attrs['written_no']
    return


  def close(_s):
    _s.__fp.attrs['written_no'] = _s.__pos
    Dataset.storage_list[_s.__id]


  def append(_s,
    label: str,
    filepath: str=None,
    data: np.ndarray | Image.Image=None,
  ):
    assert not(filepath and data), 'append using <filepath> or bitmap <data>'

    if not (filepath is None):
      img = Image.open(filepath)
      np_img = np.asarray(img)[:, :, :_s.__color_no]
    else:
      np_img = data

    np_in = np_img[:_s.__in_height].transpose(2, 0, 1)
    _s.__fp['X'][_s.__pos] = np_in

    np_out = np_img[_s.__in_height:]
    np_out = np_out[:, :, :1]
    np_out = np_out.reshape(_s.__layer_no, _s.__in_height, _s.__in_width)
    np_out = np_out.transpose(2, 0, 1)
    _s.__fp['Y'][_s.__pos] = np_out

    _s.__fp['label'][_s.__pos] = np.frombuffer(label.encode('ascii'))

    _s.__pos += 1

    return _s.__pos


  def isOpen(_s):
    return _s.__fp is not None


  def __getitem__(_s, key):
    assert _s.isOpen(), 'need open storage explicitly'
    # if not _s.isOpen():
    #   _s.open()
    return _s.__fp[key]


  def __len__(_s):
    return _s.__sample_no


  def seek(_s, idx):
    assert idx < _s.__sample_no
    _s.__pos = idx + 1
    return


  def filling(_s):
    return _s.__pos


  def isFilled(_s):
    return _s.__pos == _s.__sample_no


class PlateDataset(Dataset):
  abc = '0123456789ABCEHKMOPTY'

  def __init__(_s, sample_no=10):
    super().__init__(
      id or f'plates-{sample_no}pcs',
      in_width=316,
      in_height=158,
      color_no=3,
      layer_no=len(PlateDataset.abc),
      sample_no=sample_no,
    )
    return


  def append(_s,
    label: str,
    filepath: str=None,
    data: np.ndarray | Image.Image=None,
  ):
    assert not(filepath and data), 'append using <filepath> or bitmap <data>'

    if not (filepath is None):
      img = Image.open(filepath)
      np_img = np.asarray(img)[:, :, :_s.__color_no]
    else:
      np_img = data

    np_in = np_img[:_s.__in_height].transpose(2, 0, 1)
    _s.__fp['X'][_s.__pos] = np_in

    np_out = np_img[_s.__in_height:]
    np_out = np_out[:, :, :1]
    np_out = np_out.reshape(_s.__layer_no, _s.__in_height, _s.__in_width)
    np_out = np_out.transpose(2, 0, 1)
    _s.__fp['Y'][_s.__pos] = np_out

    _s.__fp['label'][_s.__pos] = np.frombuffer(label.encode('ascii'))

    _s.__pos += 1

    return _s.__pos

@app.route('/ping', methods=['GET'])
def ping():
  return respOk('pong')


@app.route('/image', methods=['POST'])
def image_add():
  param = lambda k, dv, type: request.args.get(k, dv, type=type)

  ds_id = param('ds', None, str),
  sample_no = param('sample_no', 10, int),
  next_idx = param('next', None, int),

  if ds_id is not None:
    ds = PlateDataset.getStorage(ds_id)

  if ds_id is None or ds is None:
    ds = PlateDataset(sample_no)

  ds.open()
  if next_idx is not None:
    ds.seek(next_idx)

  if ds.isFilled():
    return respError(
      f'Storage <{ds_id}> is already overfilled',
      error='overfilled',
      filled=True,
      filling=len(ds),
    )

  if len(request.files) == 0:
    return respError(
      'No images in request',
      error='no_images',
    )

  for file_id in request.files:
    uploaded_file = request.files[file_id]

    if not allowed_file(uploaded_file.filename, ['jpg', 'png']):
      log.debug(f'not allowed file <{uploaded_file.filename}>')
      return respError(
        f'Not allowed file extension {uploaded_file.filename}',
        error='not_allowed_file',
      )

    with TemporaryDirectory() as tmp_dir:
      tmp_filepath = os.path.join(tmp_dir, file_id)
      uploaded_file.save(tmp_filepath)
      ds.append(filepath=tmp_filepath)

    filling = ds.filling()
    filled = ds.isFilled()

    if filled:
      ds.close()

  return respOk(
    filled=filled,
    filling=filling,
  )


@app.route('/close', methods=['POST'])
def close_ds():
  if 'ds' not in request.args:
    return respError('param <ds> is not set')

  ds_id = request.args.get('ds')
  ds = Dataset.getStorage(ds_id)
  if ds is None:
    return respError(f'Dataset having id={ds_id} is not open')

  ds.close()
  return respOk()
