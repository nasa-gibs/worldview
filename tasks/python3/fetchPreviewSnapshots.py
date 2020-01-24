from concurrent.futures import ThreadPoolExecutor
import requests
import json
import os
import shutil

snapshotsUrl = 'https://wvs.earthdata.nasa.gov/api/v1/snapshot?'
param_dict = {
  'base': {
    'REQUEST': 'GetSnapshot',
    'FORMAT': 'image/jpeg',
  },
  'geographic': {
    'BBOX': '-90,-180,90,180',
    'CRS': 'EPSG:4326',
    'WIDTH': '1024',
    'HEIGHT': '512',
    'AUTOSCALE': 'TRUE'
  },
  'arctic': {
    'BBOX': '-4195000,-4195000,4195000,4195000',
    'CRS': 'EPSG:3413',
    'WIDTH': '512',
    'HEIGHT': '512',
    'AUTOSCALE': 'FALSE'
  },
  'antarctic': {
    'BBOX': '-4195000,-4195000,4195000,4195000',
    'CRS': 'EPSG:3031',
    'WIDTH': '512',
    'HEIGHT': '512',
    'AUTOSCALE': 'FALSE'
  }
}

shutil.rmtree('./web/images/layers/previews/')
os.makedirs('./web/images/layers/previews/geographic')
os.makedirs('./web/images/layers/previews/arctic')
os.makedirs('./web/images/layers/previews/antarctic')

def get_snapshots(layer):
  for projection in layer['projections'].keys():
    print('Downloading preview from WVS for: ', layer['id'] + ':' + projection)
    fileName = './web/images/layers/previews/' + projection + '/' + layer['id'] + '.jpg'
    params = { **param_dict['base'], **param_dict[projection] }
    params['LAYERS'] = layer['id'] + ',Coastlines'

    # if (layer.get('group') is 'overlays'):
    #   params['LAYERS'] += ',BlueMarble_NextGeneration(opacity=0.50)'

    if (layer.get('dateRanges')):
      last_range_idx = len(layer['dateRanges']) - 1
      params['TIME'] = layer['dateRanges'][last_range_idx]['startDate']
      #TODO - add one day to date

    try:
      with open(fileName, 'xb') as imageFile:
        image_req = requests.get(snapshotsUrl, params=params)
        print('    Result: ', image_req.status_code, image_req.url)
        imageFile.write(image_req.content)
        imageFile.close()
    except Exception as e:
      print(e)


with open('./build/options/config/wv.json', 'rt') as wv_json:
  wv_json_dict = json.load(wv_json)
  layers = wv_json_dict['layers']


futures = []
with ThreadPoolExecutor() as executor:
  for layer in layers.values():
    futures.append(executor.submit(get_snapshots, layer))

for f in futures:
  try:
    f.result()
  except Exception as e:
    print(e)