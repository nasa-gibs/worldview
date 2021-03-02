#!/usr/bin/env python

from optparse import OptionParser
import os
import json
import sys

prog = os.path.basename(__file__)
parser = OptionParser(usage="Usage: %s <input_dir> <output_dir>" % prog)
(options, args) = parser.parse_args()

category_directory = args[0]
output_dir = args[1]

category_dict = {}

for root, dirs, files in os.walk(category_directory):
    for file in files:
      file_path = os.path.join(root, file)
      with open(file_path) as category_config:
        config = json.load(category_config)
        try:
          category = list(config['categories'])[0]
          category_dict[category] = True
        except Exception as e:
          print("%s ERROR: Could not read category config. Check formatting of: %s" % (prog, file))
          sys.exit(1)

with open(output_dir + '/categoryGroupOrder.json', "w") as fp:
  json.dump({ 'categoryGroupOrder': list(category_dict) }, fp, indent=2, sort_keys=True)
  print("%s Successfully generated categoryGroupOrder.json with these categories: %s" % (prog, list(category_dict)))