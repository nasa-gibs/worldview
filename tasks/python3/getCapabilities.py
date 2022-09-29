#!/usr/bin/env python

from concurrent.futures import ThreadPoolExecutor
from optparse import OptionParser
from collections import OrderedDict
import os
import sys
import json
import xmltodict
import traceback
import httpx
import asyncio

prog = os.path.basename(__file__)
base_dir = os.path.join(os.path.dirname(__file__), "..")
version = "1.0.0"
help_description = """\
Pulls GetCapabilities XML and linked metadata from configured locations
"""

parser = OptionParser(usage="Usage: %s <config> <output_dir>" % prog,
                      version="%s version %s" % (prog, version),
                      epilog=help_description)

(options, args) = parser.parse_args()
if len(args) != 2:
    parser.error("Invalid number of arguments")

config_file = args[0]
output_dir = args[1]
colormaps = {}
vectorstyles = {}
vectordata = {}
colormaps_dir = os.path.join(output_dir, "colormaps")
vectorstyles_dir = os.path.join(output_dir, "vectorstyles")
vectordata_dir = os.path.join(output_dir, "vectordata")
error_count = 0
warning_count = 0

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

with open(config_file, "r", encoding="utf-8") as fp:
    config = json.load(fp)

def handle_exception(e, link):
    sys.stderr.write("\n %s:  WARN: Unable to fetch %s %s" % (prog, link, str(e)))
    global warning_count
    warning_count += 1

def process_vector_data(layer):
    if "ows:Metadata" in layer and layer["ows:Metadata"] is not None:
        for item in layer["ows:Metadata"]:
            schema_version = item["@xlink:role"]
            if schema_version == "http://earthdata.nasa.gov/gibs/metadata-type/layer/1.0":
                vector_data_link = item["@xlink:href"]
                vector_data_file = os.path.basename(vector_data_link)
                vector_data_id = os.path.splitext(vector_data_file)[0]
                vectordata[vector_data_id] = vector_data_link

def process_layer(layer):
    ident = layer["ows:Identifier"]
    if "ows:Metadata" in layer:
        if ident in config.get("skipPalettes", []):
            sys.stderr.write("%s: WARN: Skipping palette for %s\n" % prog, ident)
            global warning_count
            warning_count += 1
        elif layer["ows:Metadata"] is not None:
            for item in layer["ows:Metadata"]:
                schema_version = item["@xlink:role"]
                if schema_version == "http://earthdata.nasa.gov/gibs/metadata-type/colormap/1.3":
                    colormap_link = item["@xlink:href"]
                    colormap_file = os.path.basename(colormap_link)
                    colormap_id = os.path.splitext(colormap_file)[0]
                    colormaps[colormap_id] = colormap_link

                elif schema_version == "http://earthdata.nasa.gov/gibs/metadata-type/mapbox-gl-style/1.0":
                    vector_style_link = item["@xlink:href"]
                    vector_style_file = os.path.basename(vector_style_link)
                    vector_style_id = os.path.splitext(vector_style_file)[0]
                    vectorstyles[vector_style_id] = vector_style_link

async def process_remote(client, entry):
    try:
        url = entry["from"]
        print("%s: %s" % (prog, url))
        response = await client.get(url)
        contents = response.text
        output_file = os.path.join(output_dir, entry["to"])

        # Write GetCapabilities responses to XML files
        with open(output_file, "w", encoding="utf-8") as fp:
            fp.write(contents)
        gc = xmltodict.parse(contents)

        # Find all colormaps and vectorstyles in GetCapabilities responses and store them in memory
        if gc["Capabilities"]["Contents"] is None:
            print(('error: %s: no layers' % url))
            return

        layers = gc["Capabilities"]["Contents"]["Layer"]


        if(type(layers) is OrderedDict):
            process_layer(layers)
            process_vector_data(layers)
        else:
            [process_layer(layer) for layer in layers]
            [process_vector_data(layer) for layer in layers]

    except Exception as e:
        print(('ERROR: %s: %s' % (url, str(e))))
        print((str(traceback.format_exc())))

async def process_metadata(client, link, dir, ext):
    try:
        response = await client.get(link)
        contents = response.text
        if link.endswith(ext):
            output_file = os.path.join(dir, os.path.basename(link))
            with open(output_file, "w", encoding="utf-8") as fp:
                fp.write(contents)
    except Exception as e:
        handle_exception(e, link)

async def gather_process(type, typeStr, client, dir, ext):
    print("%s: Fetching %d %s" % (prog, len(type), typeStr))
    sys.stdout.flush()
    if not os.path.exists(dir):
        os.makedirs(dir)
    await asyncio.gather(*[process_metadata(client, link, dir, ext) for link in list(type.values())])

async def main():
    if "wv-options-fetch" in config:
        limits = httpx.Limits(max_keepalive_connections=10, max_connections=10)
        async with httpx.AsyncClient(limits=limits) as client:
            await asyncio.gather(*[process_remote(client, entry) for entry in config["wv-options-fetch"]])
            if colormaps:
                await gather_process(colormaps, 'colormaps', client, colormaps_dir, '.xml')
            if vectorstyles:
                await gather_process(vectorstyles, 'vectorstyles', client, vectorstyles_dir, '.json')
            if vectordata:
                await gather_process(vectordata, 'vectordata', client, vectordata_dir, '.json')

asyncio.run(main())

print("%s: %d error(s)" % (prog, error_count))

if error_count > 0:
    sys.exit(1)
