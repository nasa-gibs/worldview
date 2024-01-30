import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getSelectedDate } from '../../../modules/date/selectors';
import { updateCollection as updateCollectionAction } from '../../../modules/layers/actions';
import { formatDailyDate, formatSubdailyDate } from '../kiosk/tile-measurement/utils/date-util';
import util from '../../../util/util';

function UpdateCollections () {
  const dispatch = useDispatch();
  const updateCollection = (collection) => dispatch(updateCollectionAction(collection));
  const collections = useSelector((state) => state.layers.collections);
  const layers = useSelector((state) => state.layers.active.layers);
  const selectedDate = useSelector((state) => getSelectedDate(state));
  const proj = useSelector((state) => state.proj);
  const sources = useSelector((state) => state.config.sources);
  const layerConfig = useSelector((state) => state.layers.layerConfig);

  // Finds the correct subdomain to query headers from based on the layer source and GIBS/GITC env
  const lookupLayerSource = (layerId) => {
    const { source } = layerConfig[layerId].projections[proj.id];
    const subRegex = /-{[a-z]{1}-[a-z]{1}}/i;
    const sourceDomain = sources[source].url.replace(subRegex, '-a');

    return sourceDomain;
  };

  const getHeaders = async (def, date) => {
    const { id, period } = def;
    const { matrixSet } = def.projections[proj.id];
    const isoStringDate = util.toISOStringSeconds(util.roundTimeOneMinute(selectedDate));
    const imageType = def.format === 'image/png' ? 'png' : 'jpeg';

    const sourceDomain = lookupLayerSource(id);

    const sourceUrl = `${sourceDomain}?TIME=${isoStringDate}&layer=${id}&style=default&tilematrixset=${matrixSet}&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2F${imageType}&TileMatrix=0&TileCol=0&TileRow=0`;
    try {
      const response = await fetch(sourceUrl);

      const { headers } = response;
      const actualId = headers.get('layer-identifier-actual');
      if (!actualId) return undefined;

      const parts = actualId.split('_');
      const type = parts[parts.length - 1];
      const version = parts[parts.length - 2];
      const formattedDate = period === 'daily' ? formatDailyDate(date) : formatSubdailyDate(date);

      if (type !== 'NRT' && type !== 'STD') return undefined;

      return {
        id, date: formattedDate, type, version,
      };
    } catch (error) {
      // errors will clutter console, turn this on for debugging
      // console.error(error);
    }
    // Return undefined if query fails
    return undefined;
  };

  const findLayerCollections = (layers, dailyDate, subdailyDate) => {
    const wmtsLayers = layers.filter((layer) => {
      if (layer.type !== 'wmts' || !layer.visible) return false;

      const date = layer.period === 'daily' ? dailyDate : subdailyDate;

      const layerInCollections = collections[layer.id];
      if (!layerInCollections) return true; // Layer not in collections, needs to be updated

      const collectionDate = layerInCollections.dates.some((d) => d.date === date);

      return !collectionDate; // If date exists in layer collection, don't query layer
    });
    return wmtsLayers;
  };

  const updateLayerCollections = async () => {
    const formattedDailyDate = formatDailyDate(selectedDate);
    const formattedSubdailyDate = formatSubdailyDate(selectedDate);
    const layersToUpdate = findLayerCollections(layers, formattedDailyDate, formattedSubdailyDate);
    const headerPromises = layersToUpdate.map((layer) => getHeaders(layer, selectedDate));

    try {
      const results = await Promise.all(headerPromises);
      const validCollections = results.filter((result) => result !== undefined);
      updateCollection(validCollections);
    } catch (error) {
      // errors will clutter console, turn this on for debugging
      // console.error(error);
    }
  };

  useEffect(() => {
    if (!layers.length) return;
    updateLayerCollections();
  }, [selectedDate, layers]);

  return null;
}

export default UpdateCollections;
