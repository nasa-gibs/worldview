#!/usr/bin/env python

from optparse import OptionParser
import os
import json
import httpx
import asyncio

prog = os.path.basename(__file__)
parser = OptionParser(usage="Usage: %s <config> <output_dir>" % prog)
(options, args) = parser.parse_args()
prog = os.path.basename(__file__)

features_file = args[0]
input_file = args[1]
output_file = args[2]

# NOTE:  Only using these properties at this time
use_keys = ['conceptIds', 'dataCenter', 'daynight', 'orbitTracks', 'orbitDirection']
layer_metadata = {}
daacMap = {}

def get_daac(metadata):
  if metadata.get('conceptIds', None) is None:
    return metadata
  for collection in metadata.get("conceptIds"):
    origDataCenter = collection.get("dataCenter", None)
    dataCenter = daacMap.get(origDataCenter, None)
    collection.pop('dataCenter', None)
    if dataCenter is  None:
      continue
    if metadata.get("dataCenter", None) is None:
      metadata["dataCenter"] = [dataCenter]
    elif dataCenter not in metadata["dataCenter"]:
      metadata["dataCenter"].append(dataCenter)
  return metadata

async def get_metadata(client, layer_id, base_url):
  try:
    response = await client.get(base_url + layer_id + '.json')
    metadata = response.json()
    layer_metadata[layer_id] = get_daac(metadata)

    # Remove any props we don't expect to use
    metadata_keys = dict(layer_metadata[layer_id]).keys()
    for key in metadata_keys:
      if key not in use_keys:
        layer_metadata[layer_id].pop(key, None)
  except Exception as e:
    print('%s WARNING: Failed to retrieve metadata config for [%s]' % (prog, layer_id))

async def main(url):
  with open(input_file, 'rt', encoding="utf-8") as layer_order:
    layer_ids = json.load(layer_order).get('layerOrder')
    print('%s: Pulling vis metadata for %s layers... ' % (prog, len(layer_ids)))

  async with httpx.AsyncClient() as client:
    await asyncio.gather(*[get_metadata(client, layer, url) for layer in layer_ids])
    with open(output_file, "w", encoding="utf-8") as fp:
      # Format of this object will determine how this data is combined into wv.json
      json.dump({ 'layers': layer_metadata}, fp, indent=2, sort_keys=True)

#MAIN
if __name__ == "__main__":
  with open(features_file, 'rt', encoding="utf-8") as features:
    metadata_config = json.load(features).get('features').get('vismetadata')
    if metadata_config is not None:
      url = metadata_config.get('url')
      daacMap = metadata_config.get('daacMap', {})
      asyncio.run(main(url))
    else:
      print('%s: Visualization metadata not configured. Exiting.' % (prog))

