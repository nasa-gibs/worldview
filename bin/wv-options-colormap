#!/usr/bin/env python

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

# function returns a max or
# min value from a list
def get_extreme(extreme_list, extreme):
    if(extreme == "max"):
        if "+INF" in extreme_list:
            return 'infinity'
        else:
            return max(extreme_list)
    else:
        if "-INF" in extreme_list:
            return "neg-infinity"
        else:
            return min(extreme_list)

# Adds tooltip string to selected
# indexes that need to be replace.
def apply_tooltip(tooltip, tooltip_list, index_list):
    for index in index_list:
        tooltip_list[index] = tooltip.decode("utf-8") # make unicode
    return tooltip_list

# to combines data values of corresponding
# colors
def replace_duplicates(duplicates, tooltip_list, entries):
    dup_color_list = list(set(duplicates)) #removes array duplicates
    for n, color in enumerate(dup_color_list): # loops through duplicate colors
        min_list = []
        max_list = []
        index_list = []
        for index, entry in enumerate(entries):
            if(color == entry["@rgb"]):
                # get min
                value = entry['@value'].encode('ascii','ignore')
                value = value.split(',')
                if(len(value) > 1):
                    value[0] = value[0].replace("[", "")
                    min_list += [value[0]] # adds value to min array
                    # get max
                    value[1] = value[1].replace(")", "")
                    max_list += [value[1]] # adds value to max array
                    # add index
                else:
                    min_list += [value[0]] # adds value to min array
                    max_list += [value[0]] # adds value to max array
                index_list += [index]
        # get max and min values
        max_value = get_extreme(max_list, "max")
        min_value = get_extreme(min_list, "min")
        sep = ' - '
        # handle infinity values
        if(max_value == "infinity" or min_value == "neg-infinity"):
            if(min_value == "neg-infinity"):
                tooltip = '< ' + max_value
            else:
                tooltip = '>= ' + min_value
        # zero range delta
        elif min_value == max_value:
            tooltip = min_value
        # two different none-infinity values
        # in range
        else:
            tooltip = min_value + sep + max_value

        tooltip_list =  apply_tooltip(tooltip, tooltip_list, index_list)

    return tooltip_list

def process_entries(colormap):
    entries = to_list(colormap["Entries"]["ColorMapEntry"])
    if "Legend" not in colormap:
        raise KeyError("No Legend")
    else:
        map_type = colormap["Legend"]["@type"]
    legends = to_list(colormap["Legend"]["LegendEntry"])
    colors = []
    values = []
    tooltips = []
    matches = []
    transparent_map = "true"

    for entry in entries:
        if entry["@transparent"] == "false":
            transparent_map = "false"
    if (transparent_map == "true"):
        return "transparent"
    color_format = "{0:02x}{1:02x}{2:02x}{3:02x}"
    for index, entry in enumerate(entries):
        legend = match_legend(entry, legends)
        if (legend == "false"):
            continue
        r,g,b = entry["@rgb"].split(",")
        a = 0 if entry.get("@transparent", "false") == "true" else 255
        if a == 0:
            continue
        colors += [color_format.format(int(r), int(g), int(b), a)]

        if "@tooltip" not in legend:
            raise KeyError("No tooltips in legend")
        tooltip = legend["@tooltip"]
        if (index > 0):
            if (entry["@rgb"] == entries[index-1]["@rgb"]):
                if (map_type == "continuous") or (map_type == "discrete"):
                    matches += [entry["@rgb"]]
        tooltips += [tooltip]

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
    if (len(matches) > 0 and len(tooltips) > 0):
        tooltips = replace_duplicates(matches, tooltips, entries)

    result = {
        "type": map_type,
        "entries": {
            "type": map_type,
            "colors": colors,
        },
        "legend": {
            "tooltips": tooltips,
            "colors": colors,
            "type": map_type
        }
    }
    if (map_type == "continuous") or (map_type == "discrete"):
        result["entries"]["values"] = values

    return result

def process_file(file):
    input_file = os.path.join(root, file)
    id = os.path.splitext(os.path.basename(input_file))[0]
    if id in skips:
        sys.stderr.write("%s:  WARN: [%s] %s\n" % (prog, input_file,
                "Skipping"))
        return

    with open(input_file) as fp:
        xml = fp.read()
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
    json_options["indent"] = 4
    json_options["separators"] = (',', ': ')

    output_file = os.path.join(output_dir, id + ".json")
    with open(output_file, "w") as fp:
        json.dump(data, fp, **json_options)

# Main
file_count = 0
error_count = 0

for root, dirs, files in os.walk(input_dir):
    for file in files:
        try:
            file_count += 1
            process_file(file)
        except Exception as e:
            sys.stderr.write("%s: ERROR: [%s] %s\n" % (prog, file, str(e)))
            error_count += 1

print "%s: %d error(s), %d file(s)" % (prog, error_count, file_count)

if error_count > 0:
    sys.exit(1)
