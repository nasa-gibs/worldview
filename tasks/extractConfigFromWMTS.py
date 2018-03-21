#!/usr/bin/env python

from datetime import datetime, date, timedelta
import json
from optparse import OptionParser
import os
import sys
import urllib2 as urllib
import xmltodict
import isodate
from processTemporalLayer import process_temporal
from collections import OrderedDict

prog = os.path.basename(__file__)
base_dir = os.path.join(os.path.dirname(__file__), "..")
version = "2.0.0"
help_description = """\
Extracts configuration information from a WMTS GetCapabilities file.
"""

parser = OptionParser(usage="Usage: %s <config_file> <input_dir> <output_dir> <colormaps_dir>" % prog,
                      version="%s version %s" % (prog, version),
                      epilog=help_description)
(options, args) = parser.parse_args()

if len(args) != 4:
    parser.error("Invalid number of arguments")

config_file = args[0]
input_dir = args[1]
output_dir = args[2]
colormaps_dir = args[3]

with open(config_file) as fp:
    config = json.load(fp)

tolerant = config.get("tolerant", False)
if not "wv-options-wmts" in config:
    sys.exit(0)

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

entries = config["wv-options-wmts"]
skip = []
# Looks like this is for a list of layers needed to be skipped from the GC
if "skip" in config:
    skip = config["skip"]

total_layer_count = 0
total_warning_count = 0
total_error_count = 0

json_options = {}
json_options["indent"] = 4
json_options["separators"] = (',', ': ')

class SkipException(Exception):
    pass

def process_layer(gc_layer, wv_layers, colormaps):
    id = gc_layer["ows:Identifier"]
    if id in skip:
        print "%s: skipping" % id
        raise SkipException(id)

    wv_layers[id] = {}
    wv_layer = wv_layers[id]
    wv_layer["id"] = id
    wv_layer["type"] = "wmts"
    wv_layer["format"] = gc_layer["Format"]

    # Extract start and end dates
    if "Dimension" in gc_layer:
        dimension = gc_layer["Dimension"]
        if dimension["ows:Identifier"] == "time":
            wv_layer = process_temporal(wv_layer, dimension["Value"])
    # Extract matrix set
    matrixSet = gc_layer["TileMatrixSetLink"]["TileMatrixSet"]
    wv_layer["projections"] = {
        entry["projection"]: {
            "source": entry["source"],
            "matrixSet": matrixSet
        }
    }

    # Colormap links
    if "ows:Metadata" in gc_layer:
        if "skipPalettes" in config and id in config["skipPalettes"]:
            sys.stderr.write("%s: WARNING: Skipping palette for %s\n" % (
                prog, id))
            global total_warning_count
            total_warning_count += 1
        else:
            for item in gc_layer["ows:Metadata"]:
                if "@xlink:role" not in item:
                    raise KeyError("No xlink:role")
                schema_version = item["@xlink:role"]

                if schema_version == "http://earthdata.nasa.gov/gibs/metadata-type/colormap/1.3":
                    colormap_link = item["@xlink:href"]
                    colormap_file = os.path.basename(colormap_link)
                    colormap_id = os.path.splitext(colormap_file)[0]
                    wv_layer["palette"] = {
                        "id": colormap_id
                    }

def process_entry(entry, colormaps):
    layer_count = 0
    warning_count = 0
    error_count = 0
    wv = {
        "layers": {},
        "sources": {}
    }
    wv_matrix_sets = {}
    wv["sources"][entry["source"]] = {
        "matrixSets": wv_matrix_sets
    }

    input_file = os.path.join(input_dir, entry["from"])
    gc_id = os.path.basename(input_file)
    try:
        with open(input_file) as fp:
            xml = fp.read()
            gc = xmltodict.parse(xml)
    except Exception as e:
        if tolerant:
            sys.stderr.write("%s:   WARN: [%s] Unable to get GC: %s\n" %
                    (prog, input_file, str(e)))
            warning_count += 1
        else:
            sys.stderr.write("%s: ERROR: [%s] Unable to get GC: %s\n" %
                    (prog, input_file, str(e)))
            error_count += 1
        return [error_count, warning_count, layer_count]

    gc_contents = gc["Capabilities"]["Contents"]
    wv_layers = wv["layers"]

    if(type(gc["Capabilities"]["Contents"]["Layer"]) is OrderedDict):
        gc_layer = gc["Capabilities"]["Contents"]["Layer"]
        id = gc_layer["ows:Identifier"]
        try:
            layer_count += 1
            process_layer(gc_layer, wv_layers, colormaps)
        except SkipException as se:
            warning_count += 1
            sys.stderr.write("%s: WARNING: [%s] Skipping\n" % (prog, id))
        except Exception as e:
            error_count += 1
            sys.stderr.write("%s: ERROR: [%s:%s] %s\n" % (prog, gc_id,
                    id, str(e)))
    else:
        for gc_layer in gc_contents["Layer"]:
            id = gc_layer["ows:Identifier"]
            try:
                layer_count += 1
                process_layer(gc_layer, wv_layers, colormaps)
            except SkipException as se:
                warning_count += 1
                sys.stderr.write("%s: WARNING: [%s] Skipping\n" % (prog, id))
            except Exception as e:
                error_count += 1
                sys.stderr.write("%s: ERROR: [%s:%s] %s\n" % (prog, gc_id,
                        id, str(e)))

    def process_matrix_set(gc_matrix_set):
        id = gc_matrix_set["ows:Identifier"]
        zoom_levels = len(gc_matrix_set["TileMatrix"])
        resolutions = []
        max_resolution = entry["maxResolution"]
        for zoom in xrange(0, zoom_levels):
            resolutions = resolutions + [max_resolution / (2 ** zoom)]
        wv_matrix_sets[id] = {
            "id": id,
            "maxResolution": max_resolution,
            "resolutions": resolutions,
            "tileSize": [
                int(gc_matrix_set["TileMatrix"][0]["TileWidth"]),
                int(gc_matrix_set["TileMatrix"][0]["TileHeight"])
            ]
        }

    if(type(gc_contents["TileMatrixSet"]) is OrderedDict):
        process_matrix_set(gc_contents["TileMatrixSet"])
    else:
        for gc_matrix_set in gc_contents["TileMatrixSet"]:
            process_matrix_set(gc_matrix_set)

    output_file = os.path.join(output_dir, entry["to"])
    with open(output_file, "w") as fp:
        json.dump(wv, fp, **json_options)
    print "%s: %d error(s), %d warning(s), %d layers for %s" % (prog,
            error_count, warning_count, layer_count, entry["source"])
    return [error_count, warning_count, layer_count]


# Main
colormaps = {}
for entry in entries:
    error_count, warning_count, layer_count = process_entry(entry, colormaps)
    total_error_count += error_count
    total_warning_count += warning_count
    total_layer_count += layer_count

print "%s: %d error(s), %d warning(s), %d layers" % (prog, total_error_count,
        total_warning_count, total_layer_count)

if total_error_count > 0:
    sys.exit(1)
