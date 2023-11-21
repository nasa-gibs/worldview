import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getSelectedDate } from '../../../modules/date/selectors';
import { updateCollection as updateCollectionAction } from '../../../modules/layers/actions';
import util from '../../../util/util'
import { formatDailyDate, formatSubdailyDate } from '../kiosk/tile-measurement/utils/date-util'

function UpdateCollections () {
  const dispatch = useDispatch();
  const updateCollection = (collection) => dispatch(updateCollectionAction(collection));
  const collections = useSelector((state) => state.layers.collections );
  const layers = useSelector((state) => state.layers.active.layers );
  const selectedDate = useSelector((state) => getSelectedDate(state));
  const proj = useSelector((state) => state.proj );

  const getHeaders = async (def, date) => {
    const { id, period } = def;
    const { matrixSet } = def.projections[proj.id];
    const crs = 'epsg' + proj.selected.epsg;
    const isoStringDate = util.toISOStringSeconds(util.roundTimeOneMinute(selectedDate))

    const srcs = [
      `https://gibs-a.earthdata.nasa.gov/wmts/${crs}/best/wmts.cgi?TIME=${isoStringDate}&layer=${id}&style=default&tilematrixset=${matrixSet}&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=0&TileCol=0&TileRow=0`,
      `https://gibs-b.earthdata.nasa.gov/wmts/${crs}/best/wmts.cgi?TIME=${isoStringDate}&layer=${id}&style=default&tilematrixset=${matrixSet}&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=0&TileCol=0&TileRow=0`,
      `https://gibs-c.earthdata.nasa.gov/wmts/${crs}/best/wmts.cgi?TIME=${isoStringDate}&layer=${id}&style=default&tilematrixset=${matrixSet}&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=0&TileCol=0&TileRow=0`
    ];

    for (const src of srcs) {
      try {
        const response = await fetch(src);
        if (!response.ok) {
          // If the response is not OK (e.g., 400 error), continue to the next URL
          continue;
        }

        const headers = response.headers;
        const actualId = headers.get('layer-identifier-actual');
        if (!actualId) return undefined;

        const parts = actualId.split('_');
        const type = parts[parts.length - 1];
        const version = parts[parts.length - 2];
        const formattedDate = period === 'daily' ? formatDailyDate(date) : formatSubdailyDate(date);

        if (type !== 'NRT' && type !== 'STD') return undefined;

        return { id, date: formattedDate, type, version };
      } catch (error) {
        console.error(`Error fetching from ${urlString}:`, error);
      }
    }
    // Return undefined if all srcs fail
    return undefined;
  }

  const findLayerCollections = (layers, dailyDate, subdailyDate) => {
    const wmtsLayers = layers.filter(layer => {
      if (layer.type !== 'wmts' || !layer.visible) return false;

      const date = layer.period === 'daily' ? dailyDate : subdailyDate;

      const layerInCollections = collections[layer.id];
      if (!layerInCollections) return true; // Layer not in collections, needs to be updated

      const collectionDate = layerInCollections.dates.some(d => {
        return d.date === date;
      });

      return !collectionDate; // If date exists in layer collection, don't query layer
    });
    return wmtsLayers;
  };

  const updateLayerCollections = async () => {
    console.log('updating layer collections')
    const formattedDailyDate = formatDailyDate(selectedDate);
    const formattedSubdailyDate = formatSubdailyDate(selectedDate);
    const layersToUpdate = findLayerCollections(layers, formattedDailyDate, formattedSubdailyDate);
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

  useEffect(() => {
    if (!layers.length) return;
    updateLayerCollections();
  }, [selectedDate, layers]);

  return null;
}

export default UpdateCollections;
