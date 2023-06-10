import axios from 'axios';
import { saveAs } from 'file-saver';

export async function fetchWMSImage(layer, date) {
  const baseUrl = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi';
  const params = {
    version: '1.3.0',
    service: 'WMS',
    request: 'GetMap',
    format: 'image/png',
    STYLE: 'default',
    bbox: '-20037508.34,-20048966.1,20037508.34,20048966.1',
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

    // Save the file for debugging purposes
    // Make sure to remove this before going to prod!
    const file = new Blob([response.data], { type: 'image/png' });
    saveAs(file, `${layer}.png`);

    return imageSrc;
  } catch (error) {
    console.error(error);
    return null;
  }
}
