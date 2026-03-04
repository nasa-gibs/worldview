// eslint-disable-next-line import/no-extraneous-dependencies
import axios from 'axios';
import { saveAs } from 'file-saver';

export default async function fetchWMSImage(layer, date, extent, testMode) {
  const baseUrl = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi';
  const boundingBox = `${extent[0]},${extent[1]},${extent[2]},${extent[3]}`;
  const fullExtentBBox = '-20037508.34,-20048966.1,20037508.34,20048966.1';
  let bbox;
  // when we are zoomed out too far, the bounding box will include NaN
  if (boundingBox.includes('NaN')) {
    bbox = fullExtentBBox;
  } else {
    bbox = boundingBox;
  }

  const params = {
    version: '1.3.0',
    service: 'WMS',
    request: 'GetMap',
    format: 'image/jpeg',
    STYLE: 'default',
    bbox,
    CRS: 'EPSG:3857',
    HEIGHT: '256',
    WIDTH: '256',
    TIME: date,
    layers: layer,
  };

  try {
    const response = await axios.get(baseUrl, { params, responseType: 'arraybuffer' });

    // Convert the response data to a Blob which can be used as image src
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const imageSrc = URL.createObjectURL(blob);

    // Save the file for debugging purposes in test mode
    // This should open image in a seperate tab in the browser, may have to allow popups
    if (testMode) {
      const file = new Blob([response.data], { type: 'image/jpeg' });
      saveAs(file, `${layer}.jpeg`);
    }

    return imageSrc;
  } catch (error) {
    console.error(error);
    return null;
  }
}
