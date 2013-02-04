#!/usr/bin/python

import json

if __name__ == "__main__":
    
    with open("index.json") as fp:
        index = json.load(fp)

    palettes = []
    
    for act in index:
        with open("act/" + act["input"]) as fp:
            data = fp.read()
            lut = []
            for i in xrange(0, 255 * 3, 3):
                entry = {
                    "at": str(i / 3.0 / 256.0),
                    "r":  ord(data[i]),
                    "g":  ord(data[i+1]),
                    "b":  ord(data[i+2]),
                }
                lut += [entry]
            palettes += [{
                "id": act["id"],
                "name": act["name"],
                "stops": lut
            }]
    
    with open("../../data/palettes", "w") as fp:
        json.dump(palettes, fp, sort_keys=True,
                  indent=4, separators=(',', ': '))
