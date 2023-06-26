def allowed_file(filename, allowed_exts):
  filename = filename.lower()
  for ext in allowed_exts:
    if filename.endswith('.' + ext.lower()):
      return True
  return False

def fit_size(src_size, dst_size):
  src_w, src_h = src_size
  dst_w, dst_h = dst_size
  k = 1.
  if dst_w < src_w or dst_h < src_h:
    k_w = dst_w / src_w
    k_h = dst_h / src_h
    k = k_h if k_h < k_w else k_w
    return round(k * src_w), round(k * src_h)
  return src_size
