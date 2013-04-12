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
version = "1.2.1"
help_description = """\
Concatenates all configuration items a directory into one configuration file. 
"""

default_config_dir = os.path.join(basedir, "config")

parser = OptionParser(usage="Usage: %s [options]" % prog,
                      version="%s version %s" % (prog, version),
                      epilog=help_description)
parser.add_option("-c", "--config-dir", default=default_config_dir,
                  help="use this configuration directory instead of "
                       "%s" % default_config_dir)
parser.add_option("-m", "--minify", action="store_true",
                  help="minify the output instead of pretty printing")
parser.add_option("-o", "--output", default=None, 
                  help="use this output file instead of printing to "
                       "standard out")
parser.add_option("-v", "--verbose", action="store_true",
                  help="prints files being collected to standard error")
                  
(options, args) = parser.parse_args()
if len(args) != 0:
    parser.error("Invalid number of arguments")

def notify(message):
    if options.verbose:
        print "%s: %s" % (prog, message)

def error(message):
    sys.stderr.write("%s: ERROR: %s\n" % (prog, message))
    
def fatal(message):
    error(message)
    sys.exit(1)

config = {}
                  
for root, dirs, files in os.walk(options.config_dir):
    this_dir = os.path.basename(root)
    if this_dir == "config":
        current = config
    else:
        current = config[this_dir]

    for dir in dirs:
        current[dir] = {}
    for file in files:
        if os.path.splitext(file)[1] != ".json":
            continue
        notify("Reading: %s/%s\n" % (root, file))
        id = os.path.splitext(file)[0]
        filename = os.path.join(root, file)
        try:
            with open(filename) as fp:
                item = json.load(fp)
                current[id] = item
        except Exception as e:
            sys.stderr.write("%s: Unable to read %s: %s\n" % (prog, filename,
                                                              str(e)))

json_options = {
    "sort_keys": True
}
if not options.minify:
    json_options["indent"] = 4
    json_options["separators"] = (',', ': ')

output = sys.stdout
if options.output:
    output = open(options.output, "w")

json.dump(config, output, **json_options)
if options.output:
    output.close()


