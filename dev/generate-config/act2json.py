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
Using act/index.json, this converts ACT (Adobe Color Table) files into
paletttes suitable for Worldview. Each color table is written out to
the config/palettes directory.
""" 

parser = OptionParser(usage="Usage: %s [options]" % prog,
                      version="%s version %s" % (prog, version),
                      epilog=help_description)
parser.add_option("-v", "--verbose", action="store_true",
                  help="prints information about tasks being performed")

(options, args) = parser.parse_args()

if len(args) != 0:
    parser.error("Invalid number of arguments")

index_file = "%s/act/index.json" % basedir
with open(index_file) as fp:
    index = json.load(fp)

for act in index:
    act_file = "%s/act/%s" % (basedir, act["input"])
    if options.verbose:
        print "from %s" % act_file
    with open(act_file) as fp:
        data = fp.read()
    stops = []
    for i in xrange(0, 255 * 3, 3):
        entry = {
            "at": str(i / 3.0 / 256.0),
            "r": ord(data[i]),
            "g": ord(data[i+1]),
            "b": ord(data[i+2]),
            "a": 255
        }
        stops += [entry]
    palette = {
        "id": act["id"],
        "name": act["name"],
        "description": act["description"],
        "source": "stock",
        "stops": stops
    }
    palette_file = "%s/config/palettes/%s.json" % (basedir, act["id"])
    if options.verbose:
        print "to   %s\n" % palette_file
    with open(palette_file, "w") as fp:
        json.dump(palette, fp, sort_keys=True, indent=4, 
                  separators=(',', ': '))


