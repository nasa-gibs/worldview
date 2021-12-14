#!/usr/bin/env python

from util import dict_merge
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

# MAIN
parser = OptionParser(usage="Usage: %s <input_dir> <output_file>" % prog,
                      version="%s version %s" % (prog, version),
                      epilog=help_description)

(options, args) = parser.parse_args()
if len(args) != 2:
    parser.error("Invalid number of arguments")

input_dir = args[0]
output_file = args[1]

conf = {}
file_count = 0
for root, dirs, files in os.walk(input_dir):
    dirs.sort()
    for file in sorted(files):
        try:
            if not file.endswith(".json"):
              continue
            file_count += 1
            with open(os.path.join(root, file), "r", encoding="utf-8") as fp:
                data = json.load(fp)
            dict_merge(conf, data)
        except Exception as e:
            sys.stderr.write("ERROR: %s: %s\n" %
                             (os.path.join(root, file), str(e)))
            sys.exit(1)

json_options = {}
json_options["indent"] = 2
json_options["separators"] = (',', ': ')

with open(output_file, "w", encoding="utf-8") as fp:
    json.dump(conf, fp, **json_options)

print("%s: %s file(s) merged into %s" % (prog, file_count,
    os.path.basename(output_file)))
