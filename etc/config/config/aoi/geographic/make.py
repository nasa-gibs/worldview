#!/usr/bin/python

import json

with open('/Users/jmcgann/Code/Aptana/worldview/src/data/geographic_ap_products.json') as infile:
    config = json.load(infile)

for cat in config:
    print cat
    newconfig = {"baselayers": [], "overlays": []}
    for item in config[cat]:
        newconfig[item["category"]] += [item["value"]]
    print newconfig

    with open(cat + ".json", "w") as outfile:
        json.dump(newconfig, outfile, indent=4, separators=(',', ': '), sort_keys=True)

                
        

