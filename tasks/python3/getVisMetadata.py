#!/usr/bin/env python

from concurrent.futures import ThreadPoolExecutor
from optparse import OptionParser
import os
import json
import urllib3
import certifi
http = urllib3.PoolManager(
    cert_reqs='CERT_REQUIRED',
    ca_certs=certifi.where()
  )
prog = os.path.basename(__file__)
root_dir = 'config/default/common/'

# Use config/active dir if present
if os.path.isdir('config/active'):
  root_dir = 'config/active/common/'

CONFIG_ENV = os.environ.get('CONFIG_ENV')

# If a config enviroment was passed, use the coresponding dir
if CONFIG_ENV is not None:
  root_dir = 'config/active/' + CONFIG_ENV + '/'

features_file = root_dir + 'features.json'
input_file = root_dir + 'config/wv.json/layerOrder.json'
output_file = 'build/options-build/config/wv.json/visMetadata.json'

use_keys = ['conceptIds']
layer_metadata = {}

def get_metadata(layer_id, base_url):
  response = http.request('GET', base_url + layer_id + '.json')
  if (response.status != 200):
    print('%s WARNING: No metadata config found for [%s]' % (prog, layer_id))
    return
  layer_metadata[layer_id] = json.loads(response.data.decode('utf-8'))

  # Remove any props we don't expect to use
  metadata_keys = dict(layer_metadata[layer_id]).keys()
  for key in metadata_keys:
    if key not in use_keys:
      layer_metadata[layer_id].pop(key, None)

def main(url):
  with open(input_file, 'rt') as layer_order:
    layer_ids = json.load(layer_order).get('layerOrder')
    print('%s: Pulling vis metadata for %s layers... ' % (prog, len(layer_ids)))

  futures = []
  with ThreadPoolExecutor() as executor:
    for layer in layer_ids:
      futures.append(executor.submit(get_metadata, layer, url))
  for f in futures:
    try:
      # Need to call result() on each future to catch any raised exceptions
      f.result()
    except Exception as e:
      print("%s:" % (e))

  with open(output_file, "w") as fp:
    # Format of this object will determine how this data is combined into wv.json
    json.dump({ 'layers': layer_metadata}, fp, indent=2, sort_keys=True)

#MAIN
if __name__ == "__main__":
  with open(features_file, 'rt') as features:
    metadata_config = json.load(features).get('features').get('vismetadata')
    if metadata_config is not None:
      url = metadata_config.get('url')
      main(url)
    else:
      print('%s: Visualization metadata not configured. Exiting.' % (prog))

