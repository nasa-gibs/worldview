
const createTextStyle = function (feature, resolution, dom) {
  const text = feature.getProperties().label;
  const offsetX = 15;
  const offsetY = 3;
  return new ol.style.Text({
    textAlign: undefined,
    textBaseline: 'bottom',
    text,
    offsetX,
    offsetY,
  });
};
// Points
function pointStyleFunction(feature, resolution) {
  return new ol.style.Style({
    image: new ol.style.Circle({
      radius: 5,
      fill: new ol.style.Fill({ color: 'rgba(255, 0, 0, 1)' }),
      stroke: new ol.style.Stroke({ color: 'black', width: 1 }),
    }),
    text: createTextStyle(feature, resolution),
  });
}
const layers = [
  { id: 'OrbitTracks_Aqua_Ascending', startDate: '2002-05-04' },
  // { id: 'OrbitTracks_Aqua_Descending', startDate: '2002-05-04' },
  // { id: 'OrbitTracks_Aura_Ascending', startDate: '2004-07-15' },
  // { id: "OrbitTracks_Aura_Descending", startDate: '2004-07-15' },
  // { id: "OrbitTracks_CYGNSS_Ascending", "startDate": "2018-12-01" },
  // { id: "OrbitTracks_CYGNSS_Descending", "startDate": "2018-12-01" },
  // { id: "OrbitTracks_Calipso_Ascending", startDate: '2006-04-28' },
  // { id: "OrbitTracks_Calipso_Descending", startDate: '2006-04-28' },
  // { id: "OrbitTracks_CloudSat_Ascending", startDate: "2006-06-06" },
  // { id: "OrbitTracks_CloudSat_Descending", startDate: "2006-06-06" },
  // { id: "OrbitTracks_GCOM-C_Ascending", startDate: "2018-10-27" },
  // { id: "OrbitTracks_GCOM-C_Descending", startDate: "2018-10-27" },
  // { id: "OrbitTracks_GCOM-W1_Ascending", startDate: "2012-05-17" },
  // { id: "OrbitTracks_GCOM-W1_Descending", startDate: "2012-05-17" },
  // { id: "OrbitTracks_GOSAT-2_Descending", startDate: "2018-12-01" },
  // { id: "OrbitTracks_GOSAT-2_Ascending", startDate: "2018-12-01" },
  // { id: "OrbitTracks_GOSAT_Descending", startDate: "2009-01-23" },
  // { id: "OrbitTracks_GOSAT_Ascending", startDate: "2009-01-23" },
  // { id: "OrbitTracks_GPM_Ascending", "startDate": "2014-02-27" },
  // { id: "OrbitTracks_GPM_Descending", "startDate": "2014-02-27" },
  // { id: "OrbitTracks_ICESAT-2_Ascending", "startDate": "2018-09-15" },
  // { id: "OrbitTracks_ICESAT-2_Descending", "startDate": "2018-09-15" },
  // { id: "OrbitTracks_ISS_Ascending", "startDate": "1998-11-20" },
  // { id: "OrbitTracks_ISS_Descending", "startDate": "1998-11-20" },
  // { id: "OrbitTracks_Landsat-7_Ascending", "startDate": "1999-04-15" },
  // { id: "OrbitTracks_Landsat-7_Descending", "startDate": "1999-04-15" },
  // { id: "OrbitTracks_Landsat-8_Ascending", "startDate": "2013-02-11" },
  // { id: "OrbitTracks_Landsat-8_Descending", "startDate": "2013-02-11" },
  // { id: "OrbitTracks_METOP-A_Ascending", "startDate": "2018-12-01" },
  // { id: "OrbitTracks_METOP-A_Descending", "startDate": "2018-12-01" },
  // { id: "OrbitTracks_METOP-B_Ascending", "startDate": "2018-12-01" },
  // { id: "OrbitTracks_METOP-B_Descending", "startDate": "2018-12-01" },
  // { id: "OrbitTracks_METOP-C_Ascending", "startDate": "2018-11-07" },
  // { id: "OrbitTracks_METOP-C_Descending", "startDate": "2018-11-07" },
  // { id: "OrbitTracks_NOAA-20_Ascending", "startDate": "2017-11-19" },
  // { id: "OrbitTracks_NOAA-20_Descending", "startDate": "2017-11-19" },
  // { id: "OrbitTracks_OCO-2_Ascending", "startDate": "2014-07-02" },
  // { id: "OrbitTracks_OCO-2_Descending", "startDate": "2014-07-02" },
  // { id: "OrbitTracks_SAOCOM1-A_Ascending", "startDate": "2018-12-01" },
  // { id: "OrbitTracks_SAOCOM1-A_Descending", "startDate": "2018-12-01" },
  // { id: "OrbitTracks_SMAP_Ascending", "startDate": "2012-05-08" },
  // { id: "OrbitTracks_SMAP_Descending", "startDate": "2012-05-08" },
  // { id: "OrbitTracks_Sentinel-1A_Ascending", "startDate": "2014-06-23" },
  // { id: "OrbitTracks_Sentinel-1A_Descending", "startDate": "2014-06-23" },
  // { id: "OrbitTracks_Sentinel-1B_Ascending", "startDate": "2016-04-25" },
  // { id: "OrbitTracks_Sentinel-1B_Descending", "startDate": "2016-04-25" },
  // { id: "OrbitTracks_Sentinel-2A_Ascending", "startDate": "2015-06-24" },
  // { id: "OrbitTracks_Sentinel-2A_Descending", "startDate": "2015-06-24" },
  // { id: "OrbitTracks_Sentinel-2B_Ascending", "startDate": "2017-03-08" },
  // { id: "OrbitTracks_Sentinel-2B_Descending", "startDate": "2017-03-08" },
  // { id: "OrbitTracks_Sentinel-5P_Ascending", "startDate": "2017-10-14" },
  // { id: "OrbitTracks_Sentinel-5P_Descending", "startDate": "2017-10-14" },
  // { id: "OrbitTracks_Suomi_NPP_Ascending", "startDate": "2011-10-28" },
  // { id: "OrbitTracks_Suomi_NPP_Descending", "startDate": "2011-10-28" },
  // { id: "OrbitTracks_Terra_Descending", "startDate": "2000-02-24" },
  // { id: "OrbitTracks_Terra_Ascending", "startDate": "2000-02-24" }
];


const tileGridSizes = [
  {
    matrixWidth: 2,
    matrixHeight: 1,
  },
  {
    matrixWidth: 3,
    matrixHeight: 2,
  },
  {
    matrixWidth: 5,
    matrixHeight: 3,
  },
  {
    matrixWidth: 10,
    matrixHeight: 5,
  },
  {
    matrixWidth: 20,
    matrixHeight: 10,
  },
  {
    matrixWidth: 40,
    matrixHeight: 20,
  },
];
const toISOStringDate = function (date) {
  return date.toISOString()
    .split('T')[0];
};
const dateAdd = function (date, interval, amount) {
  let month; let maxDay; let
    year;
  const newDate = new Date(date);
  switch (interval) {
    case 'minute':
      newDate.setUTCMinutes(newDate.getUTCMinutes() + amount);
      break;
    case 'hour':
      newDate.setUTCHours(newDate.getUTCHours() + amount);
      break;
    case 'day':
      newDate.setUTCDate(newDate.getUTCDate() + amount);
      break;
    case 'month':
      year = newDate.getUTCFullYear();
      month = newDate.getUTCMonth();
      maxDay = new Date(year, month + amount + 1, 0)
        .getUTCDate();
      if (maxDay <= date.getUTCDate()) {
        newDate.setUTCDate(maxDay);
      }
      newDate.setUTCMonth(month + amount);
      break;
    case 'year':
      newDate.setUTCFullYear(newDate.getUTCFullYear() + amount);
      break;
    default:
      throw new Error(`[dateAdd] Invalid interval: ${interval}`);
  }
  return newDate;
};
const createLayerWMS = function (layerId, date) {
  const res = [
    0.5625,
    0.28125,
    0.140625,
    0.0703125,
    0.03515625,
    0.017578125,
    0.0087890625,
    0.00439453125,
    0.002197265625,
    0.0010986328125,
    0.00054931640625,
    0.00027465820313,
  ];

  const parameters = {
    LAYERS: layerId,
    VERSION: '1.1.1',
  };
  const sourceOptions = {
    url: `https://gibs-{a-c}.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?TIME=${date}`,
    cacheSize: 4096,
    style: 'default',
    crossOrigin: 'anonymous',
    transition: 0,
    wrapX: true,
    params: parameters,
    tileGrid: new ol.tilegrid.TileGrid({
      origin: [-180, 90],
      resolutions: res,
      tileSize: [512, 512],
    }),
  };
  const layer = new ol.layer.Tile({
    preload: Infinity,
    source: new ol.source.TileWMS(sourceOptions),
  });
  return layer;
};
const createVectorLayer = function (layerId, date) {
  return new ol.layer.VectorTile({
    renderMode: 'image',
    style: pointStyleFunction,
    source: new ol.source.VectorTile({
      visible: true,
      projection: ol.proj.get('EPSG:4326'),
      url: `https://gibs-{a-c}.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi?TIME=${date}&layer=${layerId}&tilematrixset=2km&Service=WMTS&Request=GetTile&Version=1.0.0&FORMAT=application%2Fvnd.mapbox-vector-tile&TileMatrix={z}&TileCol={x}&TileRow={y}`,
      format: new ol.format.MVT(),
      tileGrid: new ol.tilegrid.WMTS({
        extent: [-180, -90, 180, 90],
        resolutions: [0.5625, 0.28125, 0.140625, 0.0703125, 0.03515625, 0.017578125],
        tileSize: [512, 512],
        sizes: tileGridSizes,
      }),
    }),
  });
};
const createCheckbox = (layerId, date, name, container) => {
  const checkbox = document.createElement('input');
  const checkboxId = `${layerId}_${date}_checkbox`;
  checkbox.type = 'checkbox';
  checkbox.name = name;
  checkbox.value = 'value';
  checkbox.checked = 'checked';
  checkbox.id = checkboxId;

  const label = document.createElement('label');
  label.htmlFor = checkboxId;
  label.appendChild(document.createTextNode(name));

  container.appendChild(checkbox);
  container.appendChild(label);
  return checkbox;
};
const createBaseLayer = function () {
  return new ol.layer.Tile({
    extent: [-180, -90, 180, 90],
    crossOrigin: 'anonymous',
    source: new ol.source.WMTS({
      url: '//uat.gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi?TIME=2020-04-27',
      layer: 'BlueMarble_NextGeneration',
      format: 'image/jpeg',
      matrixSet: '500m',
      tileGrid: new ol.tilegrid.WMTS({
        origin: [-180, 90],
        resolutions: [0.140625, 0.0703125, 0.03515625, 0.017578125, 0.0087890625, 0.00439453125, 0.002197265625],
        matrixIds: [2, 3, 4, 5, 6, 7, 8],
        tileSize: 512,
      }),
    }),
  });
};

const container = document.getElementById('map');
layers.forEach((layer, index) => {
  const layerId = layer.id;
  const { startDate } = layer;
  const div = document.createElement('div');
  const h2 = document.createElement('h2');
  const headerText = document.createTextNode(layerId);
  h2.appendChild(headerText);
  div.appendChild(h2);
  container.appendChild(div);
  const currentDate = new Date();
  let loopDate = new Date(startDate);
  let dateIndex = 0;
  while (loopDate < currentDate && dateIndex === 0) {
    dateIndex++;
    const date = toISOStringDate(loopDate);
    const subContainer = document.createElement('div');
    const h3 = document.createElement('h3');
    subContainer.appendChild(h3);
    const headerText3 = document.createTextNode(date);
    h3.appendChild(headerText3);
    div.appendChild(subContainer);
    const target = `map_' + ${index}_date_${dateIndex}`;
    const mapDiv = document.createElement('div');
    mapDiv.id = target;
    mapDiv.className = 'map';
    subContainer.appendChild(mapDiv);

    const checkboxWMS = createCheckbox(layerId, date, `WMS ${layerId} Layer`, subContainer);
    const checkboxVector = createCheckbox(layerId, date, `Vector ${layerId} Layer`, subContainer);
    const base = createBaseLayer();
    const wmsLayer = createLayerWMS(layerId, date);
    const vectorLayer = createVectorLayer(layerId, date);
    checkboxWMS.onclick = function () {
      wmsLayer.setVisible(!wmsLayer.getVisible());
    };
    checkboxVector.onclick = function () {
      vectorLayer.setVisible(!vectorLayer.getVisible());
    };

    const map = new ol.Map({
      layers: [base, vectorLayer, wmsLayer],
      target,
      view: new ol.View({
        center: [0, 0],
        maxZoom: 12,
        zoom: 1,
        extent: [-180, -90, 180, 90],
        projection: ol.proj.get('EPSG:4326'),
      }),
    });
    loopDate = dateAdd(loopDate, 'month', 12);
  }
});
