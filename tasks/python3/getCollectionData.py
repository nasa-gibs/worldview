#!/usr/bin/env python

from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
from optparse import OptionParser
from pprint import pprint as pp
from util import dict_merge
import os
import json
import sys
import requests

prog = os.path.basename(__file__)
parser = OptionParser(usage="Usage: %s <input_file>" % prog)
(options, args) = parser.parse_args()
input_file = args[0]
output_file = args[0]
cmr_collection_url = 'http://cmr.earthdata.nasa.gov/search/collections.json?concept_id='

# NOTE:  Only using these properties at this time
cmr_keys_map = {
    'title': 'title',
    'version_id': 'version',
}
cmr_data = {}
cmr_fails = {}

def process_entries(entry, keep_keys):
  new_entry = {}
  for orig_key, new_key in keep_keys.items():
    new_entry[new_key] = entry.get(orig_key)
  return new_entry

def get_cmr_data(concept_id_dict):
  concept_id = concept_id_dict["value"]
  if cmr_data.get(concept_id) is None:
    response = requests.get(cmr_collection_url + concept_id)
    entry = response.json().get('feed', {}).get('entry')
    if len(entry) == 1:
      cmr_data[concept_id] = process_entries(entry[0], cmr_keys_map)
    elif len(entry) > 1:
      print("%s: WARNING: multiple entries found for %s ", (prog, concept_id))
  concept_id_dict = dict_merge(concept_id_dict, cmr_data[concept_id])

def process_requests(wv_product_dict):
  futures = []
  with ThreadPoolExecutor() as executor:
    for layer_dict in wv_product_dict.values():
      for concept_id_dict in layer_dict.get('conceptIds', []):
        if type(concept_id_dict) is not str:
          futures.append(executor.submit(get_cmr_data, concept_id_dict))
  for f in futures:
    try:
      f.result()
    except Exception as e:
      failed_id = str(e)
      if cmr_fails.get(failed_id, None) is None:
        cmr_fails[failed_id] = True
        print("%s: WARNING: No CMR entry for collection: [%s]" % (prog, failed_id))
  print("%s: %s collections returned metadata." % (prog, len(cmr_data)))
  print("%s: %s collections did not return any metadata." % (prog, len(cmr_fails)))

#MAIN
with open(input_file, 'rt') as concept_id_map:
  wv_product_dict = json.load(concept_id_map).get('layers')
  print('%s: Fetching collection data for %s layers...' % (prog, len(wv_product_dict)))
  process_requests(wv_product_dict)

with open(output_file, "w") as fp:
  json.dump({ 'layers': wv_product_dict }, fp, indent=2, sort_keys=True)