import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, UncontrolledTooltip } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getSelectedDate } from '../../../modules/date/selectors';
import { updateCollection as updateCollectionAction } from '../../../modules/layers/actions';
import util from '../../../util/util'

function formatDateString(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Adding 1 because getMonth() returns 0-11
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function ConsoleTest () {
  // eslint-disable-next-line no-unused-vars
  const dispatch = useDispatch();
  const updateCollection = (collection) => dispatch(updateCollectionAction(collection));
  const map = useSelector((state) => state.map.ui.selected );
  const collections = useSelector((state) => state.layers.collections );
  const layers = useSelector((state) => state.layers.active.layers );
  const selectedDate = useSelector((state) => getSelectedDate(state));
  const proj = useSelector((state) => state.proj );
  const config = useSelector((state) => state.config );

  const sampleCollectionsUpdate = [ { id: 'MODIS_Combined_L4_FPAR_4Day', date: '2023-09-28', type: 'STD', version: 'v6.1' } ];

  const getHeaders = async (def, date) => {
    const { id } = def;

    // EX: GIBS:geographic, 500m
    const { source: layerSource, matrixSet: layerMatrixSet } = def.projections[proj.id];
    // EX: Array of Matrix Sets for source, https://gibs-{a-c}.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi
    const {matrixSets: configMatrixSets, url} = config.sources[layerSource];
    // A Matrix Set object containing id, maxResolution, resolutions array, tileMatricies array, tileSize array
    const configMatrixSet = configMatrixSets[layerMatrixSet];
    const { tileMatrices, resolutions, tileSize } = configMatrixSet;

    const crs = 'epsg' + proj.selected.epsg;
    const isoStringDate = util.toISOStringSeconds(util.roundTimeOneMinute(selectedDate))

    const urlString = `https://gibs-b.earthdata.nasa.gov/wmts/${crs}/best/wmts.cgi?TIME=${isoStringDate}&layer=${id}&style=default&tilematrixset=${layerMatrixSet}&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=0&TileCol=0&TileRow=0`

    console.log('urlString', urlString)

    const response = await fetch(urlString);
    const headers = response.headers;
    const actualId = headers.get('layer-identifier-actual');

    if (!actualId) return undefined;

    const parts = actualId.split('_');
    const type = parts[parts.length - 1];
    const version = parts[parts.length - 2];
    const formattedDate = formatDateString(date);

    if (type !== 'NRT' && type !== 'STD') return undefined;

    return { id: id, date: formattedDate, type, version };
  }

  const findLayerCollections = (layers, date) => {
    const wmtsLayers = layers.filter(layer => {
      if (layer.type !== 'wmts') return false;

      const layerInCollections = collections[layer.id];
      if (!layerInCollections) return true; // Layer not in collections, needs to be updated

      const collectionDate = layerInCollections.dates.some(d => {
        return d.date === date;
      });

      return !collectionDate; // If date exists, don't include the layer
    });

    return wmtsLayers;
  };



  const consoleResponse = async () => {
    const formattedDate = formatDateString(selectedDate);
    const layersToUpdate = findLayerCollections(layers, formattedDate);
    const headerPromises = layersToUpdate.map(layer => getHeaders(layer, selectedDate));

    try {
      const results = await Promise.all(headerPromises);
      const validCollections = results.filter(result => result !== undefined);
      console.log('validCollections', validCollections);
      updateCollection(validCollections);
    } catch (error) {
      console.log('error', error);
    }
  };


  return (
    <div className="d-flex flex-column justify-content-center align-items-center w-100 mt-3">
      <div className="d-flex flex-row justify-content-center align-items-center">
        <h5 className="h5 fw-bold d-inline-block me-1">Console Test Mode</h5>
        <span><FontAwesomeIcon id="console-test-info-icon" icon="info-circle" className="pb-2" /></span>
        <UncontrolledTooltip
          id="console-test-tooltip"
          target="console-test-info-icon"
          placement="right"
        >
          Console any response. See the ConsoleTest component
        </UncontrolledTooltip>
      </div>
      <span className="border-top border-white-50 mb-2 w-100" />
      <Button
        style={{ backgroundColor: '#d54e21' }}
        onClick={consoleResponse}
      >
        Console test
      </Button>
    </div>
  );
}

export default ConsoleTest;
