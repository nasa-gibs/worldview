#!/usr/bin/python

import json
import os
import sys

basedir = os.path.dirname(__file__)

def palettes_v03():
    index_file = open("%s/palettes/v03/index.json" % basedir)
    index = json.load(index_file)

    for item in index:
        with open("%s/palettes/v03/%s" % (basedir, item["filename"])) as fp:
            v03_meta = json.load(fp)
        v03_palettes = v03_meta["palettes"]
        for include in item["include"]:
            if "as" in include:
                palette_name = include["as"]
            else:
                palette_name = include["name"]
            product_name = include["name"]
            v03_palette = v03_palettes[product_name]["palette"]
            v03_count = len(v03_palette)
            previous_color = None
            palette = []
            use_bin_stops = False
            bin_stops = []
            for index, entry in enumerate(v03_palette):
                if previous_color != entry:
                    colors = entry.split(",");
                    palette += [{
                        "at": index / float(v03_count), 
                        "r": colors[0],
                        "g": colors[1],
                        "b": colors[2],
                        "a": colors[3]
                    }]
                    bin_stops += [index / float(v03_count)]
                    previous_color = entry
                else:
                    use_bin_stops = True
                base["palettes"][palette_name] = {
                    "id": palette_name, 
                    "source": "rendered",
                    "type": "solid",
                    "stops": palette
                }
                v03_product = v03_palettes[product_name]
                product = base["products"][product_name]
                product["min"] = v03_product["min"]
                product["max"] = v03_product["max"]
                product["units"] = v03_product["units"]
                product["rendered"] = palette_name
                product["bins"] = len(palette)
                if use_bin_stops:
                    product["stops"] = bin_stops
                product["properties"]["tileClass"] = "Worldview.Map.CanvasTile"

def palettes_stock_act():    
    with open("%s/palettes/act/index.json" % basedir) as fp:
        index = json.load(fp)
    for act in index:
        with open("%s/palettes/act/%s" % (basedir, act["input"])) as fp:
            data = fp.read()
            lut = []
            for i in xrange(0, 255 * 3, 3):
                entry = {
                    "at": str(i / 3.0 / 256.0),
                    "r": ord(data[i]),
                    "g": ord(data[i+1]),
                    "b": ord(data[i+2]),
                    "a": 255
                }
                lut += [entry]
            base["palettes"][act["id"]] = {
                "id": act["id"],
                "name": act["name"],
                "description": act["description"],
                "source": "stock",
                "stops": lut
            }
        

with open("%s/base.json" % basedir) as fp:
    base = json.load(fp)
base["palettes"] = {}

palettes_v03()
palettes_stock_act()

if len(sys.argv) >= 2 and (sys.argv[1] == "-c" or sys.argv[1] == "--compact"):
    print json.dumps(base, sort_keys=True)
else:
    print json.dumps(base, sort_keys=True,
                     indent=4, separators=(',', ': '))

 
            


            

