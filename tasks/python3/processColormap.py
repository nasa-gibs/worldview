#!/usr/bin/env python

from concurrent.futures import ProcessPoolExecutor
from optparse import OptionParser
import os
import re
import sys
import json
import xmltodict

prog = os.path.basename(__file__)
base_dir = os.path.join(os.path.dirname(__file__), "..")
version = "3.0.0"
help_description = """\
Converts colormaps to JSON files
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
skips = config.get("skipPalettes", [])

def to_list(v):
    return v if isinstance(v, list) else [v]

def match_legend(entry, legends):
    try:
        matched = "false"
        for legend in legends:
            if "@id" not in legend:
                raise KeyError("No legend IDs")
            if legend["@id"] == entry["@ref"]:
                matched = legend
        return matched
    except ValueError as e:
        raise ValueError("Invalid reference: %s" % entry["@ref"])

def process_entries(colormap):
    entries = to_list(colormap["Entries"]["ColorMapEntry"])

    transparent_map = "true"

    for entry in entries:
        if entry["@transparent"] == "false":
            transparent_map = "false"
    if (transparent_map == "true"):
        return "transparent"

    if "Legend" not in colormap:
        raise KeyError("No Legend")
    else:
        map_type = colormap["Legend"]["@type"]
    legends = to_list(colormap["Legend"]["LegendEntry"])
    colors = []
    values = []
    ticks = []
    tooltips = []
    legend_colors = []
    refs_list = []
    ref_skip_list = []
    color_format = "{0:02x}{1:02x}{2:02x}{3:02x}"
    for index, entry in enumerate(entries):
        legend = match_legend(entry, legends)
        if (legend == "false"):
            ref_skip_list += [entry['@ref']]
            continue
        r,g,b = entry["@rgb"].split(",")
        a = 0 if entry.get("@transparent", "false") == "true" else 255
        if a == 0:
            ref_skip_list += [entry['@ref']]
            continue
        if "@ref" not in entry:
            raise KeyError("No ref in legend")
        refs_list += [entry['@ref']]
        colors += [color_format.format(int(r), int(g), int(b), a)]
        if (map_type == "continuous") or (map_type == "discrete"):
            items = re.sub(r"[\(\)\[\]]", "", entry["@value"]).split(",")
            try:
                new_items = []
                for item in items:
                    v = float(item)
                    if v == float("inf"):
                        v = sys.float_info.max
                    if v == float("-inf"):
                        v = sys.float_info.min
                    new_items += [v]
                values += [new_items]
            except ValueError as e:
                raise ValueError("Invalid value: %s" % entry["@value"])
    skip_index = 0
    id_list = []
    for index, entry in enumerate(legends):
        if entry['@id'] in ref_skip_list:
            skip_index = skip_index + 1
            continue
        r,g,b = entry["@rgb"].split(",")
        legend_colors += [color_format.format(int(r), int(g), int(b), 255)]
        if "@tooltip" not in entry:
            raise KeyError("No tooltips in legend")
        tooltips += [entry["@tooltip"]]
        if "@id" not in entry:
            raise KeyError("No id in legend")
        id_list += [entry['@id']]
        if "@showTick" in entry:
           ticks += [index - skip_index]

    result = {
        "type": map_type,
        "entries": {
            "type": map_type,
            "colors": colors,
            "refs": refs_list
        },
        "legend": {
            "colors": legend_colors,
            "type": map_type,
            "tooltips": tooltips,
            "ticks": ticks,
            "refs": id_list
        }
    }
    if (map_type == "continuous") or (map_type == "discrete"):
        result["entries"]["values"] = values

    return result

def read_file(file):
    id = os.path.splitext(os.path.basename(file))[0]
    if id in skips:
        sys.stderr.write("%s:  WARN: [%s] %s\n" % (prog, file), "Skipping")
        return
    with open(file) as fp:
        xml = fp.read()
    return (id, xml)

def process_file(id, xml):
    document = xmltodict.parse(xml)
    colormaps = to_list(document["ColorMaps"]["ColorMap"])
    maps = []
    for colormap in colormaps:
        result = process_entries(colormap)
        if result == "transparent":
            continue
        result["title"] = colormap["@title"]
        result["entries"]["title"] = colormap["@title"]
        result["legend"]["title"] = colormap["@title"]
        result["legend"]["id"] = id + "_" + str(len(maps)) + "_legend"
        if "@minLabel" in colormap["Legend"]:
            result["legend"]["minLabel"] = colormap["Legend"]["@minLabel"]
        if "@maxLabel" in colormap["Legend"]:
            result["legend"]["maxLabel"] = colormap["Legend"]["@maxLabel"]
        if "@units" in colormap:
            result["legend"]["units"] = colormap["@units"]
        maps += [result]

    data = {
        "id": id,
        "maps": maps
    }
    json_options = {}
    json_options["indent"] = 2
    json_options["separators"] = (',', ': ')

    output_file = os.path.join(output_dir, id + ".json")
    # print('I YIELD M\'LORD!!!', id)
    with open(output_file, "w") as fp:
        json.dump(data, fp, **json_options)

# Main
file_count = 0
error_count = 0
futures = []

with ProcessPoolExecutor() as readExecutor:
    for root, dirs, files in os.walk(input_dir):
        for file in files:
            input_file = os.path.join(root, file)
            futures.append(readExecutor.submit(read_file, input_file))
with ProcessPoolExecutor() as writeExecutor:
    for future in futures:
        try:
            file_count += 1
            (id, xml) = future.result()
            writeExecutor.submit(process_file, id, xml)
        except Exception as e:
            sys.stderr.write("%s: ERROR: %s\n" % (prog, str(e)))
            error_count += 1

print("%s: %d error(s), %d file(s)" % (prog, error_count, file_count))

if error_count > 0:
    sys.exit(1)
