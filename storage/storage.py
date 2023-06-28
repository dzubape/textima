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
    _s._fp = None
    _s._id = id
    _s._in_width = in_width
    _s._in_height = in_height
    _s._color_no = color_no
    _s._layer_no = layer_no
    _s._storage_filepath = Path() / '..' / 'storage' / f'{id}.h5'
    _s._sample_no = sample_no
    _s._pos = 0
    Dataset.storage_list[_s._id] = _s
    return


  @staticmethod
  def getStorage(
    id: str,
  ):
    return Dataset.storage_list.get(id, None)


  def id(_s):
    return _s._id


  def open(_s):
    max_text_len = 9
    if _s._storage_filepath.exists():
      _s._fp = h5py.File(_s._storage_filepath, 'r+')
    else:
      _s._fp = h5py.File(_s._storage_filepath, 'w')
      # _s._fp.create_dataset('label', (_s._sample_no, max_text_len), dtype=np.uint8)
      _s._fp.create_dataset('X', (_s._sample_no, _s._color_no, _s._in_height, _s._in_width), dtype=np.uint8)
      _s._fp.create_dataset('Y', (_s._sample_no, _s._layer_no, _s._in_height, _s._in_width), dtype=np.uint8)
      _s._fp.attrs['written_no'] = 0
      if _s._init_ds:
        _s._init_ds()
    _s._pos = _s._fp.attrs['written_no']
    return


  def close(_s):
    _s._fp.attrs['written_no'] = _s._pos
    _s._fp.close()


  def append(_s,
    label: str,
    filepath: str=None,
    data: np.ndarray | Image.Image=None,
  ):
    assert not(filepath and data), 'append using <filepath> or bitmap <data>'

    if not (filepath is None):
      img = Image.open(filepath)
      np_img = np.asarray(img)[:, :, :_s._color_no]
    else:
      np_img = data

    np_in = np_img[:_s._in_height].transpose(2, 0, 1)
    _s._fp['X'][_s._pos] = np_in

    np_out = np_img[_s._in_height:]
    np_out = np_out[:, :, :1]
    np_out = np_out.reshape(_s._layer_no, _s._in_height, _s._in_width)
    np_out = np_out.transpose(2, 0, 1)
    _s._fp['Y'][_s._pos] = np_out

    _s._fp['label'][_s._pos] = np.frombuffer(label.encode('ascii'))

    _s._pos += 1

    return _s._pos


  def isOpen(_s):
    return _s._fp is not None


  def __getitem__(_s, key):
    assert _s.isOpen(), 'need open storage explicitly'
    # if not _s.isOpen():
    #   _s.open()
    return _s._fp[key]


  def __len__(_s):
    return _s._sample_no


  def seek(_s, idx):
    assert idx < _s._sample_no
    _s._pos = idx + 1
    return


  def filling(_s):
    return _s._pos


  def isFilled(_s):
    return _s._pos == _s._sample_no


class PlateDataset(Dataset):
  abc = '0123456789ABCEHKMOPTY'
  label_max_len = 9

  def __init__(_s, id=None, sample_no=10):
    super().__init__(
      id or f'plates-{sample_no}pcs',
      in_width=256,
      in_height=128,
      color_no=3,
      layer_no=len(PlateDataset.abc),
      sample_no=sample_no,
    )
    return


  def _init_ds(_s):
    _s._fp.create_dataset('label', (_s._sample_no, PlateDataset.label_max_len), dtype=np.uint8)


  def append(_s,
    label: str,
    symbols: str,
    filepath: str=None,
    data: np.ndarray | Image.Image=None,
  ):
    assert not(filepath and data), 'append using <filepath> or bitmap <data>'

    label = label.upper()
    # symbols = set(c for c in label)

    if filepath is not None:
      img = Image.open(filepath)
      print(f'img.size: {img.size}')
      np_img = np.asarray(img)[:, :, :_s._color_no]
    else:
      np_img = data

    np_in = np_img[:_s._in_height].transpose(2, 0, 1)
    _s._fp['X'][_s._pos] = np_in

    log.debug('>>This is dev')

    np_out = np_img[_s._in_height:] # crop
    log.debug(f'{np_out.shape = }')
    np_out = np_out[:, :, :1] # single channel
    np_out = np_out.reshape(len(symbols), _s._in_height, _s._in_width) # slicing to separate symbol maps
    # np_out = np_out.transpose(0, 3, 1, 2) # replacing channel from the last pos to the first

    np_out_sparse = np.zeros((_s._layer_no, _s._in_height, _s._in_width), dtype=np.uint8)
    for i, c in enumerate(symbols):
      j = PlateDataset.abc.find(c)
      np_out_sparse[j] = 255 - np_out[i]

    _s._fp['Y'][_s._pos] = np_out_sparse

    np_label = np.frombuffer(bytes(label, 'ascii'), dtype=np.uint8).copy()
    np_label.resize(9)
    _s._fp['label'][_s._pos] = np_label

    _s._pos += 1

    return _s._pos


@app.route('/ping', methods=['GET'])
def ping():
  return respOk('pong')


@app.route('/image', methods=['POST'])
def image_add():
  param = lambda k, dv=None, type=str: request.args.get(k, dv, type=type)

  ds_id = param('ds', None, str)
  sample_no = param('sample_no', 10, int)
  next_idx = param('next', None, int)
  label = param('label', None, str)
  symbols = param('symbols', None, str)

  log.debug(f'{ds_id = }')
  log.debug(f'{sample_no = }')
  log.debug(f'{next_idx = }')
  log.debug(f'{label = }')
  log.debug(f'{symbols = }')

  if ds_id is not None:
    ds = PlateDataset.getStorage(ds_id)

  if ds_id is None or ds is None:
    ds = PlateDataset(sample_no=sample_no)

  if not ds.isOpen():
    ds.open()

  if next_idx is not None:
    ds.seek(next_idx)

  ds_id = ds.id()

  if ds.isFilled():
    return respError(
      f'Storage <{ds_id}> is already overfilled',
      error='overfilled',
      filled=1,
      filling=len(ds),
    )

  if len(request.files) == 0:
    return respError(
      'No images in request',
      error='no_images',
    )

  for file_id in request.files:
    log.debug(f'file_id: {file_id}')

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
      ds.append(
        label=label,
        symbols=symbols,
        filepath=tmp_filepath,
      )

    filling = ds.filling()
    filled = ds.isFilled()

    if filled:
      ds.close()

  return respOk(
    ds=ds_id,
    filled=1 if filled else 0,
    filling=int(filling),
  )


@app.route('/close', methods=['POST'])
def close_ds():
  if 'ds' not in request.args:
    return respError('param <ds> is not set')

  ds_id = request.args.get('ds')
  ds = Dataset.getStorage(ds_id)
  if ds is None:
    return respError(f'Dataset having id={ds_id} is not open')

  if ds.isOpen():
    ds.close()
  else:
    return respError(
      'Storage is already closed',
      error='not_open',
    )

  return respOk()
