#!/usr/bin/env python

from util import dict_merge
from copy import deepcopy
from optparse import OptionParser
import os
import sys
import json

prog = os.path.basename(__file__)
base_dir = os.path.join(os.path.dirname(__file__), "..")
version = "2.0.0"
help_description = """\
Concatenates all configuration items a directory into one configuration file.
"""

def wmts_dict_merge(target, *args):
  # Merge multiple dicts
  # Recursively merge dicts and set non-dict values
  obj = args[0]['layers']
  conf = args[1]['layers']

  if not isinstance(obj, dict):
    return obj
  for k, v in obj.items():
    if k in conf and isinstance(conf[k], dict):
      foundSourceMisMatch = False
      if 'projections' in v and 'projections' in conf[k]:
        conf_projections = conf[k]['projections']
        for projectionKey, projection in v['projections'].items():
          source = projection['source']
          if projectionKey in conf_projections:
            if 'source' in conf_projections[projectionKey]:
              if source != conf_projections[projectionKey]['source']:
                foundSourceMisMatch = True
                continue
      if foundSourceMisMatch:
        continue
      if k in target and isinstance(target[k], dict):
          dict_merge(target[k], v, conf[k])
      else:
          target[k] = dict_merge(v, conf[k])
  return target

# MAIN
parser = OptionParser(usage="Usage: %s <input_dir> <output_file>" % prog,
                      version="%s version %s" % (prog, version),
                      epilog=help_description)

(options, args) = parser.parse_args()
if len(args) != 2:
    parser.error("Invalid number of arguments")
input_dir = args[0]
output_file = args[1]
new_conf = {}
new_conf["layers"] = {}
new_conf["sources"] = {}

with open(output_file, "r", encoding="utf-8") as fp:
  output_data = json.load(fp)
file_count = 0
for file in os.listdir(input_dir):
  try:
      if not file.endswith(".json"):
        continue
      file_count += 1
      with open(os.path.join(input_dir, file), "r", encoding="utf-8") as fp:
          data = json.load(fp)
      new_conf['layers'] = wmts_dict_merge(new_conf['layers'], data, output_data)
      new_conf["sources"] = dict_merge(new_conf["sources"], data['sources'], output_data['sources'])
  except Exception as e:
      sys.stderr.write("ERROR: %s: %s\n" %
                        (os.path.join(input_dir, file), str(e)))
      sys.exit(1)
new_conf = dict_merge(new_conf, output_data)
json_options = {}
json_options["indent"] = 2
json_options["separators"] = (',', ': ')

with open(output_file, "w", encoding="utf-8") as fp:
    json.dump(new_conf, fp, **json_options)

print("%s: %s file(s) merged into %s" % (prog, file_count,
    os.path.basename(output_file)))
