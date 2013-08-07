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
import json
import os
from optparse import OptionParser
import sys
from xml.dom.minidom import parseString
import xml.parsers.expat

prog = os.path.basename(__file__)
basedir = os.path.dirname(__file__)
version = "1.0.1"
help_description = """\
Given an index file of VRT color tables, converts them into JSON palettes
suitable for Worldview. Also updates existing product JSON files to include 
the number of color bins and bin stops as needed.
"""

default_index = os.path.join(basedir, "vrt", "index.json")
default_vrt_dir = os.path.join(basedir, "vrt")
default_layers_dir = os.path.join(basedir, "config", "layers")
 
parser = OptionParser(usage="Usage: %s [options] <output_dir>" % prog,
                      version="%s version %s" % (prog, version),
                      epilog=help_description)
parser.add_option("-i", "--index", default=default_index,
                  help="use this as the index file instead of %s" % 
                  default_index)
parser.add_option("-l", "--layers-dir", default=default_layers_dir,
                  help="use this as the layers directory instead of %s" %
                  default_layers_dir)
parser.add_option("-v", "--verbose", action="store_true",
                  help="print tasks that are being performed")
parser.add_option("--vrt-dir", default=default_vrt_dir,
                  help="use this as the base directory for VRT files "
                  "instead of %s" % default_vrt_dir)

(options, args) = parser.parse_args()

if len(args) != 1:
    parser.error("Invalid number of arguments")
output_dir = args[0]

def notify(message):
    if options.verbose:
        print "%s: %s" % (prog, message)

def error(message):
    sys.stderr.write("%s: ERROR: %s\n" % (prog, message))
    
def fatal(message):
    error(message)
    sys.exit(1)

def readColorTableValuesFromVrt(vrtFilename):
    # Open file
    notify("Reading VRT: " + vrtFilename)
    vrtFile = open(vrtFilename, 'r')
    vrtData = vrtFile.read()
    vrtFile.close()
    
    # Carefully try to load XML into a DOM
    try:
        dom = parseString(vrtData)
    except xml.parsers.expat.ExpatError:
        # This is a hack to catch cases where (MODIS) VRTs aren't 
        # properly-structured XML
        vrtData = "<ColorTable>\n" + vrtData + "\n</ColorTable>"
        dom = parseString(vrtData)
        
    ctEntries = dom.getElementsByTagName('Entry')
    if len(ctEntries) != 256:
        error(vrtFilename + 
              " does not contain 256 palette entries; skipping. "
              "(It contains " + len(ctEntries) + " entries)")
        return []


    # Initialize palette array to 256 items
    paletteEntries = [{}] * 256

    # Read each entry into a [256, 4] array
    for i in xrange(0, 256):

        # Get/check idx value
        idx = int(ctEntries[i].attributes["idx"].value)
        if (idx < 0) or (idx > 255):
            error("index is out of range ("+idx+")")
            return []

        # Save palette entries
        redVal = int(ctEntries[i].attributes["c1"].value)
        greenVal = int(ctEntries[i].attributes["c2"].value)
        blueVal = int(ctEntries[i].attributes["c3"].value)
        alphaVal = int(ctEntries[i].attributes["c4"].value)
        paletteEntries[idx] = {
            "r": redVal,
            "g": greenVal,
            "b": blueVal,
            "a": alphaVal,
        }
    #end for all palette entries

    return paletteEntries

#end readColorTableValuesFromVrt

def main():
    # Parse input args
    productList = []

    if not os.path.exists(options.index):
        fatal("Index file %s does not exist" % options.index)
    if not os.path.exists(output_dir):
        fatal("Output directory %s does not exist" % output_dir)
    if not os.path.exists(options.layers_dir):
        fatal("Layers directory %s does not exist" % options.layers_dir)

    notify("Index file: %s" % options.index)
    notify("VRT base directory: %s" % options.vrt_dir)
    notify("Output directory: %s" % output_dir)
    notify("Layers directory: %s" % options.layers_dir)

    with open(options.index) as fp:
        index = json.load(fp)

    return_code = 0
    
    for vrt_meta in index:
        # Retrieve product info for current iteration
        vrt_filename = os.path.join(options.vrt_dir, vrt_meta["filename"])

        # Construct full path to VRT and verify that it exists
        if not os.path.isfile(vrt_filename):
            error("%s does not exist; skipping" % vrt_filename)
            continue 

        # Read color table values
        colorTableVals = readColorTableValuesFromVrt(vrt_filename)

        if (len(colorTableVals) < 1):
            error("no color table found for %s; skipping" % vrt_filename)
            continue

        previous_color = ""
        bins = vrt_meta["maxIndex"] - vrt_meta["minIndex"] + 1
        bin_stops = []
        use_bin_stops = False
        color_stops = []

        # Only output "valid" range of palette indices
        for i in xrange(vrt_meta["minIndex"], vrt_meta["maxIndex"] + 1):
            bin = i - vrt_meta["minIndex"]
            entry = colorTableVals[i]
            this_color = ",".join([str(entry["r"]), str(entry["b"]), 
                                   str(entry["g"]), str(entry["a"])])
            if this_color != previous_color:
                previous_color = this_color
                entry["at"] = float(bin) / bins
                bin_stops += [entry["at"]]
                color_stops += [entry]
            else:
                # If the bins are likely to not be evenly spaced out 
                # (e.g., previous color repeats), color stop definitions
                # will need to be added to the product config
                use_bin_stops = True

        palette_file_name = os.path.join(output_dir, 
                                         "%s.json" % vrt_meta["id"])
        notify("Writing palette: %s" % palette_file_name)
        with open(palette_file_name, "w") as fp:
            palette = {
                "id": vrt_meta["id"],
                "source": "rendered",
                "stops": color_stops,
                #"type": "solid",
            }
            json.dump(palette, fp, sort_keys=True, indent=4,
                      separators=(',', ': '))

        # Product configurations needs to be updated to include the
        # the number of bins, bin stops if necessary, and the name
        # of the color palette it is rendered in.        
        for layer_id in vrt_meta["layers"]:
            layer_file_name = os.path.join(options.layers_dir,
                                             "%s.json" % layer_id)
            if not os.path.exists(layer_file_name):
                error("No such layer configuration: %s" % layer_file_name)
                continue

            notify("Modifying layer %s" % layer_file_name)
            try:
                with open(layer_file_name) as fp:
                    layer = json.load(fp)
            except Exception as e:
                sys.stderr.write("%s: Unable to load %s\n%s" %
                                 (prog, layer_file_name, str(e)))
                return_code = 1
                
            layer["bins"] = len(bin_stops)
            layer["rendered"] = vrt_meta["id"]
            if use_bin_stops:
                layer["stops"] = bin_stops
            else:
                # Delete any existing definitions just in case
                if "stops" in layer:
                    del layer["stops"]

            with open(layer_file_name, "w") as fp:
                json.dump(layer, fp, sort_keys=True, indent=4,
                          separators=(',', ': '))
    sys.exit(return_code)
#end main

if __name__ == "__main__":
    main()
