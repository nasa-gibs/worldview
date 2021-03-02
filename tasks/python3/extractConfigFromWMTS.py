#!/usr/bin/env python

from datetime import datetime, date, timedelta
import json
from optparse import OptionParser
import os
import sys
import xmltodict
import isodate
from processTemporalLayer import process_temporal
from collections import OrderedDict

prog = os.path.basename(__file__)
base_dir = os.path.join(os.path.dirname(__file__), "..")
version = "2.0.0"
help_description = """\
Extracts configuration information from a WMTS GetCapabilities file, converts the XML to JSON
"""

parser = OptionParser(usage="Usage: %s <config_file> <input_dir> <output_dir>" % prog,
                      version="%s version %s" % (prog, version),
                      epilog=help_description)
(options, args) = parser.parse_args()

if len(args) != 3:
    parser.error("Invalid number of arguments")

config_file = args[0]
input_dir = args[1]
output_dir = args[2]

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
json_options["indent"] = 2
json_options["separators"] = (',', ': ')

class SkipException(Exception):
    pass

def process_layer(gc_layer, wv_layers):
    ident = gc_layer["ows:Identifier"]
    if ident in skip:
        print("%s: skipping" % ident)
        raise SkipException(ident)

    wv_layers[ident] = {}
    wv_layer = wv_layers[ident]
    wv_layer["id"] = ident
    wv_layer["type"] = "wmts"
    wv_layer["format"] = gc_layer["Format"]

    # Extract start and end dates
    if "Dimension" in gc_layer:
        dimension = gc_layer["Dimension"]
        if dimension["ows:Identifier"] == "Time":
            wv_layer = process_temporal(wv_layer, dimension["Value"])
    # Extract matrix set
    matrixSetLink = gc_layer["TileMatrixSetLink"]
    matrixSet = matrixSetLink["TileMatrixSet"]

    wv_layer["projections"] = {
        entry["projection"]: {
            "source": entry["source"],
            "matrixSet": matrixSet,
        }
    }

    if "TileMatrixSetLimits" in matrixSetLink and matrixSetLink["TileMatrixSetLimits"] is not None:
        matrixSetLimits = matrixSetLink["TileMatrixSetLimits"]["TileMatrixLimits"]
        mappedSetLimits = []
        for setLimit in matrixSetLimits:
            mappedSetLimits.append({
                "tileMatrix": setLimit["TileMatrix"],
                "minTileRow": int(setLimit["MinTileRow"]),
                "maxTileRow": int(setLimit["MaxTileRow"]),
                "minTileCol": int(setLimit["MinTileCol"]),
                "maxTileCol": int(setLimit["MaxTileCol"]),
            })
        wv_layer["projections"][entry["projection"]]["matrixSetLimits"] = mappedSetLimits;

    # Vector data links
    if "ows:Metadata" in gc_layer and gc_layer["ows:Metadata"] is not None:
        for item in gc_layer["ows:Metadata"]:
            if "@xlink:role" not in item:
                raise KeyError("No xlink:role")
            schema_version = item["@xlink:role"]

            if schema_version == "http://earthdata.nasa.gov/gibs/metadata-type/layer/1.0":
                vector_data_link = item["@xlink:href"]
                vector_data_file = os.path.basename(vector_data_link)
                vector_data_id = os.path.splitext(vector_data_file)[0]
                wv_layer["vectorData"] = {
                    "id": vector_data_id
                }

    # Colormap links
    if "ows:Metadata" in gc_layer and gc_layer["ows:Metadata"] is not None:
        if "skipPalettes" in config and ident in config["skipPalettes"]:
            sys.stderr.write("%s: WARNING: Skipping palette for %s\n" % (
                prog, ident))
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
                elif schema_version == "http://earthdata.nasa.gov/gibs/metadata-type/mapbox-gl-style/1.0":
                    vectorstyle_link = item["@xlink:href"]
                    vectorstyle_file = os.path.basename(vectorstyle_link)
                    vectorstyle_id = os.path.splitext(vectorstyle_file)[0]
                    wv_layer["vectorStyle"] = {
                        "id": vectorstyle_id
                    }

def process_entry(entry):
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

    if gc_contents is None or "Layer" not in gc_contents:
        error_count += 1
        sys.stderr.write("%s: ERROR: [%s] %s\n" % (prog, gc_id, "No layers"))
        return [error_count, warning_count, layer_count]

    if(type(gc["Capabilities"]["Contents"]["Layer"]) is OrderedDict):
        gc_layer = gc["Capabilities"]["Contents"]["Layer"]
        ident = gc_layer["ows:Identifier"]
        try:
            layer_count += 1
            process_layer(gc_layer, wv_layers)
        except SkipException as se:
            warning_count += 1
            sys.stderr.write("%s: WARNING: [%s] Skipping\n" % (prog, ident))
        except Exception as e:
            error_count += 1
            sys.stderr.write("%s: ERROR: [%s:%s] %s\n" % (prog, gc_id,
                    ident, str(e)))
    else:
        for gc_layer in gc_contents["Layer"]:
            ident = gc_layer["ows:Identifier"]
            try:
                layer_count += 1
                process_layer(gc_layer, wv_layers)
            except SkipException as se:
                warning_count += 1
                sys.stderr.write("%s: WARNING: [%s] Skipping\n" % (prog, id))
            except Exception as e:
                error_count += 1
                sys.stderr.write("%s: ERROR: [%s:%s] %s\n" % (prog, gc_id,
                        ident, str(e)))

    def process_matrix_set(gc_matrix_set):
        tileMatrixArr = gc_matrix_set["TileMatrix"]
        ident = gc_matrix_set["ows:Identifier"]
        zoom_levels = len(tileMatrixArr)
        resolutions = []
        formattedTileMatrixArr = []
        max_resolution = entry["maxResolution"]
        for zoom in range(0, zoom_levels):
            resolutions = resolutions + [max_resolution / (2 ** zoom)]

        # We are assuming that width/heights are the same for every matrix and excluding
        # the "TileWidth", "TileHeight" properties here
        for tileMatrix in tileMatrixArr:
            formattedTileMatrixArr.append({
                "matrixWidth": int(tileMatrix["MatrixWidth"]),
                "matrixHeight": int(tileMatrix["MatrixHeight"]),
            })

        wv_matrix_sets[ident] = {
            "id": ident,
            "maxResolution": max_resolution,
            "resolutions": resolutions,
            "tileSize": [
                int(tileMatrixArr[0]["TileWidth"]),
                int(tileMatrixArr[0]["TileHeight"])
            ],
            "tileMatrices": formattedTileMatrixArr
        }

    if(type(gc_contents["TileMatrixSet"]) is OrderedDict):
        process_matrix_set(gc_contents["TileMatrixSet"])
    else:
        for gc_matrix_set in gc_contents["TileMatrixSet"]:
            process_matrix_set(gc_matrix_set)

    output_file = os.path.join(output_dir, entry["to"])
    with open(output_file, "w") as fp:
        json.dump(wv, fp, **json_options)
    print("%s: %d error(s), %d warning(s), %d layers for %s" % (prog,
            error_count, warning_count, layer_count, entry["source"]))
    return [error_count, warning_count, layer_count]


# Main
for entry in entries:
    error_count, warning_count, layer_count = process_entry(entry)
    total_error_count += error_count
    total_warning_count += warning_count
    total_layer_count += layer_count

print("%s: %d error(s), %d warning(s), %d layers" % (prog, total_error_count,
    total_warning_count, total_layer_count))

if total_error_count > 0:
    sys.exit(1)
