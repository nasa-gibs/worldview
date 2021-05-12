#!/usr/bin/env python

from jsonschema import Draft7Validator
from optparse import OptionParser
import os
import re
import json
import glob


prog = os.path.basename(__file__)
parser = OptionParser(usage="Usage: %s <input_directory> <schema_file>" % prog)
(options, args) = parser.parse_args()
input_directory = args[0]
schema_file = args[1]

layerConfigFiles = []
invalidJsonFiles = []

print('%s: Validating layer configs...' % (prog))

layerConfigSchema = json.load(open(schema_file))

files = glob.glob(input_directory + '/**/*.json', recursive=True)

for file_path in files:
  configJson = json.load(open(file_path))
  # Validate against the JSON schema
  val = Draft7Validator(layerConfigSchema)
  errors = sorted(val.iter_errors(configJson), key=lambda e: e.path)
  split_path = file_path.split('/')
  name_index = len(split_path) - 1
  file_name = split_path[name_index]
  if len(errors):
    invalidJsonFiles.append(file_name)

  for err in errors:
    print('%s: ERROR: %s' % (prog, file_name))
    print('%s: %s' % (prog, err.message))

if len(invalidJsonFiles) > 0:
  print('%s: FAILED: %s layer configs failed validation.' % (prog, len(invalidJsonFiles)))
else:
  print('%s: PASSED: All layer configs passed validation!' % (prog))


