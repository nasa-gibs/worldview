import axios from 'axios';
import qs from 'qs';
import { clientId, clientSecret } from '../../keys/keys.js';

async function getSentinelHubToken() {
  const instance = axios.create({
    baseURL: 'https://services.sentinel-hub.com',
  });

  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
  };

  const body = qs.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  });

  let token;

  // All requests using this instance will have an access token automatically added
  await instance.post('/oauth/token', body, config).then((resp) => {
    token = resp.data.access_token;
  });
  return token;
}

const evalscript = `
//VERSION=3
function setup() {
  return {
    input: [{
      bands: [
        "B04",
        "B08",
        "SCL",
        "dataMask"
      ]
    }],
    mosaicking: "ORBIT",
    output: [
      {
        id: "data",
        bands: ["monthly_max_ndvi"]
      },
      {
        id: "dataMask",
        bands: 1
      }]
  }
}

function evaluatePixel(samples) {
    var max = 0;
    var hasData = 0;
    for (var i=0;i<samples.length;i++) {
      if (samples[i].dataMask == 1 && samples[i].SCL != 6 && samples[i].B04+samples[i].B08 != 0 ){
        hasData = 1
        var ndvi = (samples[i].B08 - samples[i].B04)/(samples[i].B08 + samples[i].B04);
        max = ndvi > max ? ndvi:max;
      }
    }

    return {
        data: [max],
        dataMask: [hasData]
    }
}`;

const stats_request = {
  input: {
    bounds: {
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [
              458085.878866,
              5097236.833044,
            ],
            [
              457813.834156,
              5096808.351383,
            ],
            [
              457979.897062,
              5096313.767184,
            ],
            [
              458146.639373,
              5096405.411294,
            ],
            [
              458085.878866,
              5097236.833044,
            ],
          ],
        ],
      },
      properties: {
        crs: 'http://www.opengis.net/def/crs/EPSG/0/32633',
      },
    },
    data: [
      {
        type: 'sentinel-2-l2a',
        dataFilter: {
          mosaickingOrder: 'leastCC',
        },
      },
    ],
  },
  aggregation: {
    timeRange: {
      from: '2020-01-01T00:00:00Z',
      to: '2021-01-01T00:00:00Z',
    },
    aggregationInterval: {
      of: 'P1M',
    },
    evalscript,
    resx: 10,
    resy: 10,
  },
};

const requestOptions = {
  method: 'GET',
  redirect: 'follow',
};

const sentinelHubApiUrl = 'https://services.sentinel-hub.com/api/v1/statistics';

const getSentinelHubRequestParams = (token) => ({
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(stats_request),
});

async function getSentinelHubRequestData(requestParams) {
  try {
    const response = await fetch(sentinelHubApiUrl, requestParams);
    const data = await response.json();

    return {
      ok: true,
      body: data,
    };
  } catch (error) {
    return {
      ok: false,
      error,
    };
  }
}

export { getSentinelHubToken, getSentinelHubRequestParams, getSentinelHubRequestData };
