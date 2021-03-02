#!/usr/bin/env python

from concurrent.futures import ThreadPoolExecutor
from optparse import OptionParser
from collections import OrderedDict
import os
import sys
import json
import urllib3
import urllib3.contrib.pyopenssl
import xmltodict
import traceback
import certifi

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
remote_count = 0
error_count = 0
warning_count = 0

urllib3.contrib.pyopenssl.inject_into_urllib3()
http = urllib3.PoolManager(
    cert_reqs='CERT_REQUIRED',
    ca_certs=certifi.where()
)

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

with open(config_file) as fp:
    config = json.load(fp)

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
            sys.stderr.write("%s:    WARN: Skipping palette for %s\n" %
                             prog, ident)
            global warning_count
            warning_count += 1
        elif layer["ows:Metadata"] is not None:
            for item in layer["ows:Metadata"]:
                schema_version = item["@xlink:role"]
                if schema_version == "http://earthdata.nasa.gov/gibs/metadata-type/colormap/1.3":
                    colormap_link = item["@xlink:href"]
                    #colormap_link = layer["ows:Metadata"]["@xlink:href"]
                    colormap_file = os.path.basename(colormap_link)
                    colormap_id = os.path.splitext(colormap_file)[0]
                    colormaps[colormap_id] = colormap_link

                elif schema_version == "http://earthdata.nasa.gov/gibs/metadata-type/mapbox-gl-style/1.0":
                    vector_style_link = item["@xlink:href"]
                    vector_style_file = os.path.basename(vector_style_link)
                    vector_style_id = os.path.splitext(vector_style_file)[0]
                    vectorstyles[vector_style_id] = vector_style_link

def process_remote(entry):
    url = entry["from"]
    print("%s: %s" % (prog, url))
    response = http.request('GET', url)
    contents = response.data
    output_file = os.path.join(output_dir, entry["to"])

    # Write GetCapabilities responses to XML files
    with open(output_file, "w") as fp:
        fp.write(contents.decode('utf-8'))
    gc = xmltodict.parse(contents)

    # Find all colormaps and vectorstyles in GetCapabilities responses and store them in memory
    if gc["Capabilities"]["Contents"] is None:
        print(('error: %s: no layers' % url))
        return

    try:
        if(type(gc["Capabilities"]["Contents"]["Layer"]) is OrderedDict):
            process_layer(gc["Capabilities"]["Contents"]["Layer"])
            process_vector_data(gc["Capabilities"]["Contents"]["Layer"])
        else:
            for layer in gc["Capabilities"]["Contents"]["Layer"]:
                process_layer(layer)
                process_vector_data(layer)

    except Exception as e:
        print(('error: %s: %s' % (url, str(e))))
        print((str(traceback.format_exc())))

# Fetch a single colormap and write to file
def process_single_colormap(link):
    try:
        response = http.request("GET", link)
        contents = response.data
        output_file = os.path.join(colormaps_dir, os.path.basename(link))
        with open(output_file, "w") as fp:
            fp.write(contents.decode('utf-8'))
    except Exception as e:
        sys.stderr.write("%s:   WARN: Unable to fetch %s: %s\n" %
            (prog, link, str(e)))
        global warning_count
        warning_count += 1

# Fetch every colormap from the API and write response to file system
def process_colormaps():
    print("%s: Fetching %d colormaps..." % (prog, len(colormaps)))
    sys.stdout.flush()
    if not os.path.exists(colormaps_dir):
        os.makedirs(colormaps_dir)
    with ThreadPoolExecutor() as executor:
        for link in colormaps.values():
            executor.submit(process_single_colormap, link)

# Fetch every vectorstyle from the API and write response to file system
def process_vectorstyles():
    print("%s: Fetching %d vectorstyles" % (prog, len(vectorstyles)))
    sys.stdout.flush()
    if not os.path.exists(vectorstyles_dir):
        os.makedirs(vectorstyles_dir)
    for link in list(vectorstyles.values()):
        try:
            response = http.request("GET", link)
            contents = response.data
            if link.endswith('.json'):
                output_file = os.path.join(vectorstyles_dir, os.path.basename(link))
            with open(output_file, "w") as fp:
                fp.write(contents.decode('utf-8'))
        except Exception as e:
            sys.stderr.write("%s:   WARN: Unable to fetch %s: %s" %
                (prog, link, str(e)))
            global warning_count
            warning_count += 1

# Fetch every vectordata from the API and write response to file system
def process_vectordata():
    print("%s: Fetching %d vectordata" % (prog, len(vectordata)))
    sys.stdout.flush()
    if not os.path.exists(vectordata_dir):
        os.makedirs(vectordata_dir)
    for link in list(vectordata.values()):
        try:
            response = http.request("GET", link)
            contents = response.data
            if link.endswith('.json'):
                output_file = os.path.join(vectordata_dir, os.path.basename(link))
            with open(output_file, "w") as fp:
                fp.write(contents.decode('utf-8'))
        except Exception as e:
            sys.stderr.write("%s:   WARN: Unable to fetch %s: %s" %
                (prog, link, str(e)))
            global warning_count
            warning_count += 1

futures = []
tolerant = config.get("tolerant", False)
if __name__ == "__main__":
    if "wv-options-fetch" in config:
        with ThreadPoolExecutor() as executor:
            for entry in config["wv-options-fetch"]:
                futures.append(executor.submit(process_remote, entry))
        for future in futures:
            try:
                remote_count += 1
                future.result()
            except Exception as e:
                if tolerant:
                    warning_count += 1
                    sys.stderr.write("%s:   WARN: %s\n" % (prog, str(e)))
                else:
                    error_count += 1
                    sys.stderr.write("%s: ERROR: %s\n" % (prog, str(e)))
        if colormaps:
            process_colormaps()
        if vectorstyles:
            process_vectorstyles()
        if vectordata:
            process_vectordata()

print("%s: %d error(s), %d remote(s)" % (prog, error_count, remote_count))

if error_count > 0:
    sys.exit(1)
