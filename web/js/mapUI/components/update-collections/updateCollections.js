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
  const projId = useSelector((state) => state.proj.id);
  const map = useSelector((state) => state.map?.ui?.selected);
  const mapLayers = map?.getAllLayers() || [];

  // Finds the correct subdomain to query headers from based on the layer source and GIBS/GITC env
  const lookupLayerSource = (layerId) => {
    const { source } = layerConfig[layerId].projections[proj.id];
    const subRegex = /-{[a-z]{1}-[a-z]{1}}/i;
    const sourceDomain = sources[source].url.replace(subRegex, '-a');

    return sourceDomain;
  };

  const getHeaders = async (def, date, baseUrl) => {
    if (def.layergroup === 'Reference') return; // Don't query static layers
    const { id, period } = def;
    const { matrixSet } = def.projections[proj.id];
    selectedDate.setSeconds?.(59);
    const isoStringDate = util.toISOStringSeconds(util.roundTimeOneMinute(selectedDate));

    const sourceDomain = lookupLayerSource(id);

    const timeUrl = baseUrl || `${sourceDomain}?TIME=${isoStringDate}`;

    const sourceUrl = `${timeUrl}&layer=${id}&style=default&tilematrixset=${matrixSet}&Service=WMTS&Request=GetTile&Version=1.0.0&Format=${encodeURIComponent(def.format)}&TileMatrix=0&TileCol=0&TileRow=0`;
    try {
      const response = await fetch(sourceUrl, { method: 'HEAD' });

      const { headers } = response;
      const actualId = headers.get('layer-identifier-actual');
      if (!actualId) return undefined;

      const parts = actualId.split('_');
      const type = parts.at(-1);
      const version = parts.at(-2);
      const formattedDate = period === 'daily' ? formatDailyDate(date) : formatSubdailyDate(date);

      if (type !== 'NRT' && type !== 'STD') return undefined;

      return {
        id, date: formattedDate, type, version, projection: proj.id,
      };
    } catch (error) {
      // errors will clutter console, turn this on for debugging
      // console.error(error);
      throw new Error(`Error fetching headers for ${id} on ${sourceUrl}: ${error.message}`);
    }
  };

  const findLayerCollections = (dailyDate, subdailyDate, forceUpdate) => {
    const wmtsLayers = layers.filter((layer) => {
      const layerTypeEnabled = layer.type !== 'wmts' && layer.type !== 'granule';
      if (layerTypeEnabled || !layer.visible) return false;

      const date = layer.period === 'daily' ? dailyDate : subdailyDate;

      const layerInCollections = collections[layer.id];
      if (!layerInCollections) return true; // Layer not in collections, needs to be updated

      const collectionDate = layerInCollections.dates.some((d) => d.date === date && d.projection === proj.id);

      return !collectionDate || forceUpdate; // If date exists in layer collection, don't query layer
    });
    return wmtsLayers;
  };

  const getAllHeaders = (defs) => {
    const headerRequests = defs.flatMap(async (def) => { // flatMap to handle layers which may constain multiple layers
      const selectedDateRequest = await getHeaders(def, selectedDate);
      if (def.type !== 'granule') return selectedDateRequest; // non-granule layers only need one header request
      const layerGroup = map.getLayers()?.getArray()?.find((l) => l?.wv?.id === def.id);
      if (!layerGroup) return selectedDateRequest; // if we can't find the layer in the map, just do a single request
      const granuleLayerArray = layerGroup.getLayersArray() || [];
      // granule layers don't necessarily use the selected date, rather they create one layer for each granule and each has their own date
      const granuleHeaders = granuleLayerArray.map(async (layer) => {
        const source = layer.getSource();
        if (!source?.getUrls) return null;
        const urls = source.getUrls();
        if (!urls?.length) return null;
        const urlRequests = urls.map(async (url) => getHeaders(def, selectedDate, url));
        const firstResponse = await Promise.any(urlRequests); // we just want the first response that works and only fail if they all fail
        return firstResponse;
      });

      const firstGranuleHeaderResponse = await Promise.any(granuleHeaders); // Right now we don't handle the possibility of multiple imagery versions in granule layers, so just return the first valid response

      return firstGranuleHeaderResponse;
    });

    return headerRequests;
  };

  const updateLayerCollections = async (forceUpdate = false) => {
    const formattedDailyDate = formatDailyDate(selectedDate);
    const formattedSubdailyDate = formatSubdailyDate(selectedDate);
    const layersToUpdate = findLayerCollections(formattedDailyDate, formattedSubdailyDate, forceUpdate);
    const headerPromises = getAllHeaders(layersToUpdate);

    try {
      const results = await Promise.allSettled(headerPromises);
      const validCollections = results.filter(({ status, value }) => status === 'fulfilled' && value).map(({ value }) => value);
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

  useEffect(() => {
    if (!layers.length) return;
    updateLayerCollections(true);
  }, [projId, mapLayers.length]);

  return null;
}

export default UpdateCollections;
