#!/usr/bin/env python

from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
from optparse import OptionParser
from pprint import pprint as pp
from util import dict_merge
import os
import json
import sys
import urllib3
import certifi
http = urllib3.PoolManager(
    cert_reqs='CERT_REQUIRED',
    ca_certs=certifi.where()
  )
prog = os.path.basename(__file__)
cmr_data = {}
cmr_umm_data = {}
cmr_collection_url = 'http://cmr.earthdata.nasa.gov/search/collections.json?concept_id='
cmr_umm_collection_url = 'http://cmr.earthdata.nasa.gov/search/collections.umm_json?concept_id='

# Commenting out most keys for now since we aren't using this data yet
cmr_keys_map = {
    'id': 'conceptId',
    # 'title': 'title',
    'processing_level_id': 'processingLevelId',
    'archive_center': 'archiveCenter',
    'data_center': 'dataCenter',
    # 'organizations': 'organizations',
    # 'score': 'score'
}
cmr_umm_keys_map = {
    # 'ScienceKeywords': 'scienceKeywords',
    'AncillaryKeywords': 'ancillaryKeywords',
    # 'TemporalExtents': 'temporalExtents',
    # 'ProcessingLevel': 'processingLevel',
    'Version': 'version',
    # 'Projects': 'projects',
    # 'Platforms': 'platforms',
    # 'DataCenters': 'dataCenters'
  }

parser = OptionParser(usage="Usage: %s <input_file> <output_file>" % prog)
(options, args) = parser.parse_args()
input_file = args[0]
output_file = args[1]


def process_entries(entry, keep_keys):
  new_entry = {}
  for origKey, newKey in keep_keys.items():
    new_entry[newKey] = entry.get(origKey)
  return new_entry


def get_cmr_data(wv_id, concept_id):
  response = http.request('GET', cmr_collection_url + concept_id)
  data = json.loads(response.data.decode('utf-8'))
  entry = data.get('feed', {}).get('entry')
  if len(entry) is 1:
    cmr_entry_dict = process_entries(entry[0], cmr_keys_map)
    cmr_data[wv_id].update(cmr_entry_dict)
  elif len(entry) > 1:
    print("%s: WARNING: multiple entries found for %s:%s ", (prog, wv_id, concept_id))


def get_cmr_umm_data(wv_id, concept_id):
  response = http.request('GET', cmr_umm_collection_url + concept_id)
  data = json.loads(response.data.decode('utf-8'))
  items = data.get('items', [])
  if len(items) is 1:
    entry = items[0].get('umm', {})
    cmr_entry_dict = process_entries(entry, cmr_umm_keys_map)
    cmr_umm_data[wv_id].update(cmr_entry_dict)
  elif len(items) > 1:
    print("%s: WARNING: multiple entries found for %s:%s ", (prog, wv_id, concept_id))


def process_requests(wv_product_dict):
  for key in wv_product_dict:
    cmr_data[key] = {}
    cmr_umm_data[key] = {}

  futures = []
  with ThreadPoolExecutor() as executor:
    for wv_id, c_id in wv_product_dict.items():
      futures.append(executor.submit(get_cmr_data, wv_id, c_id))
      futures.append(executor.submit(get_cmr_umm_data, wv_id, c_id))
  for f in futures:
    try:
      f.result()
    except Exception as e:
      print(e)

  collection_data = dict_merge(cmr_data, cmr_umm_data)
  no_data_count = 0
  for value in collection_data.values():
    if len(value.keys()) < 1:
      # TODO eventually should probably delete empty dict entries.
      # For now, may be useful to see which products are not returning metadata
      no_data_count += 1

  success_count = len(collection_data) - no_data_count
  print("%s: %s collections returned metadata." % (prog, success_count))
  print("%s: %s collections did not reutrn any metadata." % (prog, no_data_count))
  return collection_data


#MAIN
with open(input_file, 'rt') as concept_id_map:
  wv_product_dict = json.load(concept_id_map)
  print('%s: Fetching collection data for %s items...' % (prog, len(wv_product_dict)))

collection_data = process_requests(wv_product_dict)

with open(output_file, "w") as fp:
  json.dump({ 'collections': collection_data }, fp)