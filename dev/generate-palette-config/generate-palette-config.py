#!/usr/bin/python

import json
import os

basedir = os.path.dirname(__file__)

products = {}
palettes = {}

def v03():
    index_file = open("%s/v03/index.json" % basedir)
    index = json.load(index_file)

    for item in index:
        with open("%s/v03/%s" % (basedir, item["filename"])) as fp:
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
            for index, entry in enumerate(v03_palette):
                if previous_color != entry:
                    palette += [
                        {"at": index / float(v03_count), "color": entry}
                    ]
                    previous_color = entry
                palettes[palette_name] = {
                    "id": palette_name, 
                    "type": "rendered",
                    "stops": palette
                }
                v03_product = v03_palettes[product_name]
                products[product_name] = {
                    "min": v03_product["min"],
                    "max": v03_product["max"],
                    "units": v03_product["units"],
                    "rendered": palette_name
                }

def act_stock():    
    with open("%s/act/index.json" % basedir) as fp:
        index = json.load(fp)
    for act in index:
        with open("act/" + act["input"]) as fp:
            data = fp.read()
            lut = []
            for i in xrange(0, 255 * 3, 3):
                colors = [str(ord(data[i])), str(ord(data[i+1])), str(ord(data[i+2]))]
                entry = {
                    "at": str(i / 3.0 / 256.0),
                    "color":  ",".join(colors) + ",255"
                }
                lut += [entry]
            palettes[act["id"]] = {
                "id": act["id"],
                "name": act["name"],
                "description": act["description"],
                "type": "stock",
                "stops": lut
            }
        
    
v03()
act_stock()

output = {
    "products": products,
    "palettes": palettes
}

print json.dumps(output, sort_keys=True,
                  indent=4, separators=(',', ': '))

 
            


            

