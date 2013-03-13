#!/usr/bin/python
#
# NASA Worldview
# 
# This code was originally developed at NASA/Goddard Space Flight Center for
# the Earth Science Data and Information System (ESDIS) project. 
#
# Copyright (C) 2013 United States Government as represented by the 
# Administrator of the National Aeronautics and Space Administration.
# All Rights Reserved.
#
import os
from optparse import OptionParser
import sys
import json

prog = os.path.basename(__file__)
basedir = os.path.dirname(__file__)
version = "1.0.0"
help_description = """\
Concatenates all configuration items in the config directory into one
configuration file written to standard out.
"""

parser = OptionParser(usage="Usage: %s [options]" % prog,
                      version="%s version %s" % (prog, version),
                      epilog=help_description)
parser.add_option("-m", "--minify", action="store_true",
                  help="minify the output instead of pretty printing")
parser.add_option("-v", "--verbose", action="store_true",
                  help="prints files being collected to standard error")

(options, args) = parser.parse_args()
if len(args) != 0:
    parser.error("Invalid number of arguments")

config = {}

for root, dirs, files in os.walk("%s/config" % basedir):
    this_dir = os.path.basename(root)
    if this_dir == "config":
        current = config
    else:
        current = config[this_dir]

    for dir in dirs:
        current[dir] = {}
    for file in files:
        if options.verbose:
            sys.stderr.write("%s/%s\n" % (root, file))
        id = os.path.splitext(file)[0]
        with open(os.path.join(root, file)) as fp:
            item = json.load(fp)
        current[id] = item

json_options = {
    "sort_keys": True
}
if not options.minify:
    json_options["indent"] = 4
    json_options["separators"] = (',', ': ')

print json.dumps(config, **json_options)


