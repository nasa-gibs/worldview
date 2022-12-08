from copy import deepcopy

# dict_merge from
# http://blog.impressiver.com/post/31434674390/deep-merge-multiple-python-dicts
def dict_merge(target, *args):
  # Merge multiple dicts
  if len(args) > 1:
    for obj in args:
      dict_merge(target, obj)
    return target

  # Recursively merge dicts and set non-dict values
  obj = args[0]
  if not isinstance(obj, dict):
    return obj
  for k, v in obj.items():

    if k in target and isinstance(target[k], dict):
      if 'type' in v and 'type' in target[k]:
        if v['type'] != target[k]['type']:
          return target
      dict_merge(target[k], v)
    else:
      target[k] = deepcopy(v)
  return target