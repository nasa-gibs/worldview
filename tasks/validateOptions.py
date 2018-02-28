#!/usr/bin/env python

from datetime import datetime, date, timedelta
import json
from optparse import OptionParser
import os
import sys
from processTemporalLayer import process_temporal

prog = os.path.basename(__file__)
base_dir = os.path.join(os.path.dirname(__file__), "..")
version = "1.0.0"
help_description = """\
Validates and corrects the configuration files.
"""

parser = OptionParser(usage="Usage: %s <config_json> <config_dir>" % prog,
                      version="%s version %s" % (prog, version),
                      epilog=help_description)
(options, args) = parser.parse_args()

if len(args) != 2:
    parser.error("Invalid number of arguments")

options_file = args[0]
config_dir = args[1]

error_count = 0
warning_count = 0
remove_count = 0

main_config_file = os.path.join(config_dir, "wv.json")
with open(main_config_file) as fp:
    wv = json.load(fp)
with open(options_file) as fp:
    opt = json.load(fp)

tolerant = opt.get("tolerant", False)

def fail(message):
    global error_count
    sys.stderr.write("%s: ERROR: %s\n" % (prog, message))
    error_count += 1

def error(message):
    warn(message) if tolerant else fail(message)

def warn(message):
    global warning_count
    sys.stderr.write("%s:  WARN: %s\n" % (prog, message))
    warning_count += 1

def remove_layer(wv, layer_id):
    global remove_count
    remove_count += 1
    del wv["layers"][layer_id]
    if layer_id in wv["layerOrder"]: wv["layerOrder"].remove(layer_id)

def isDateTimeFormat(input):
    try:
        datetime.strptime(input, '%Y-%m-%d %H:%M:%S')
        return True
    except ValueError:
        return False

if tolerant:
    warn("Validation enforcement disabled")

start_date = datetime.max

for layer_id in wv["layers"].keys():
    layer = wv["layers"][layer_id]
    if layer_id != layer["id"]:
        error("[%s] layer id does not match id of %s" % (layer_id, layer["id"]))
    if layer_id not in wv["layerOrder"]:
        if layer_id in opt.get("layerOrderExceptions", []):
            remove_layer(wv, layer_id)
            continue
        elif tolerant or opt.get("ignoreLayerOrder", False):
            wv["layerOrder"] += [layer_id]
        elif opt.get("warnOnUnexpectedLayer"):
            warn("[%s] Unexpected layer, not in layer order" % layer_id)
            remove_layer(wv, layer_id)
            continue
        else:
            error("[%s] Unexpected layer, not in layer order" % layer_id)
            remove_layer(wv, layer_id)
            continue
    if "projections" not in layer or len(layer["projections"]) == 0:
        error("[%s] No projections defined or not found in GC documents" %
            layer_id)
        remove_layer(wv, layer_id)
        continue
    if "type" not in layer:
        error("[" + layer_id + "] No type defined. Possible to be expecting " +
            "configuration via GC document but was not found")
        remove_layer(wv, layer_id)
        continue
    if "palette" in layer and "id" not in layer["palette"]:
        error("[%s] No palette definition" % (layer_id))
    elif "palette" in layer:
        palette_id = layer["palette"]["id"]
        if not os.path.exists(os.path.join(config_dir, "palettes",
                palette_id + ".json")):
            error("[%s] Unknown palette: %s" % (layer_id, palette_id))
            del layer["palette"]
    if "group" not in layer and opt.get("warnOnUnexpectedLayer"):
        error("[%s] Possible unexpected layer, no group defined" % layer_id)
        remove_layer(wv, layer_id)
        continue
    elif "group" not in layer:
        remove_layer(wv, layer_id)
        continue
    for proj_id in layer["projections"].keys():
        projection = layer["projections"][proj_id]
        if "matrixSet" in projection:
            source = projection["source"]
            matrix_set = projection["matrixSet"]
            if source not in wv["sources"]:
                error("[%s:%s] Invalid source: %s" %
                        (layer_id, proj_id, source))
                del layer["projections"][proj_id]
            elif "matrixSets" not in wv["sources"][source]:
                error("[%s:%s] No matrix sets for projection" %
                        (layer_id, proj_id))
                del layer["projections"][proj_id]
            elif matrix_set not in wv["sources"][source]["matrixSets"]:
                error("[%s:%s] Invalid matrix set: %s" %
                        (layer_id, proj_id, matrix_set))
                del layer["projections"][proj_id]
    if "temporal" in layer:
        warn("[%s] GC Layer temporal values overwritten by Options" % layer_id)
        layer = process_temporal(layer, layer["temporal"])
    if layer.get("inactive", False):
        pass
    else:
        if "endDate" in layer:
            del layer["endDate"]
    if "startDate" in layer:
        startTime = layer["startDate"].replace('T', ' ').replace('Z', '')
        if isDateTimeFormat(startTime):
            d = datetime.strptime(startTime, "%Y-%m-%d %H:%M:%S")
        else:
            d = datetime.strptime(layer["startDate"], "%Y-%m-%d")
        start_date = min(start_date, d)

if start_date != datetime.max:
    wv["startDate"] = start_date.strftime("%Y-%m-%d") + "T" + start_date.strftime("%H:%M:%S") + "Z";


for layer_id in wv["layerOrder"]:
    if layer_id not in wv["layers"]:
        error("[%s] In layer order but no definition" % layer_id)

startingLayers = []
for startingLayer in wv["defaults"]["startingLayers"]:
    if startingLayer["id"] not in wv["layers"]:
        error("Invalid starting layer: %s" % (startingLayer["id"]))
    else:
        startingLayers += [startingLayer]
wv["defaults"]["startingLayers"] = startingLayers
wv["buildDate"] = datetime.now().isoformat(" ")

print "%s: %d error(s), %d warning(s), %d removed" % (prog, error_count,
        warning_count, remove_count)

json_options = {}
json_options["indent"] = 4
json_options["separators"] = (',', ': ')

with open(main_config_file, "w") as fp:
    json.dump(wv, fp)

if error_count > 0:
    sys.exit(1)
