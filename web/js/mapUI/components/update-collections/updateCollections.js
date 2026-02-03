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
  const mapLayersLength = map?.getAllLayers()?.length || 0;

  // Finds the correct subdomain to query headers from based on the layer source and GIBS/GITC env
  const lookupLayerSource = (layerId) => {
    const { source } = layerConfig[layerId].projections[proj.id];
    const subRegex = /-{[a-z]{1}-[a-z]{1}}/i;
    const sourceDomain = sources[source].url.replace(subRegex, '-a');

    return sourceDomain;
  };

  const getHeaders = async (def, date, signal, baseUrl) => {
    if (def.layergroup === 'Reference') throw new Error('Reference layers do not require header fetching'); // Don't query static layers
    const { id, period } = def;
    const { matrixSet } = def.projections[proj.id];
    if (period === 'subdaily') selectedDate.setSeconds?.(59); // ensure seconds are set to 59 for subdaily layers
    const isoStringDate = util.toISOStringSeconds(util.roundTimeOneMinute(selectedDate));

    const sourceDomain = lookupLayerSource(id);

    const timeUrl = baseUrl || `${sourceDomain}?TIME=${isoStringDate}`;

    const sourceUrl = `${timeUrl}&layer=${id}&style=default&tilematrixset=${matrixSet}&Service=WMTS&Request=GetTile&Version=1.0.0&Format=${encodeURIComponent(def.format)}&TileMatrix=0&TileCol=0&TileRow=0`;
    try {
      const response = await fetch(sourceUrl, { method: 'HEAD', signal }); // HEAD request to only fetch headers (faster than the previous GET request) and pass in abort signal

      const { headers } = response;
      const actualId = headers.get('layer-identifier-actual');
      if (!actualId) throw new Error(`No layer-identifier-actual header found for ${id} on ${sourceUrl}`); // reject the promise if no actualId found

      const parts = actualId.split('_');
      const type = parts.at(-1);
      const version = parts.at(-2);
      const formattedDate = period === 'daily' ? formatDailyDate(date) : formatSubdailyDate(date);

      if (type !== 'NRT' && type !== 'STD') throw new Error(`Invalid imagery type ${type} for ${id} on ${sourceUrl}`); // reject the promise if not NRT or STD

      return {
        id, date: formattedDate, type, version, projection: proj.id,
      };
    } catch (error) {
      return Promise.reject(new Error(`Error fetching headers for ${id} on ${sourceUrl}: ${error.message}`));
    }
  };

  const findLayerCollections = (dailyDate, subdailyDate, forceUpdate) => {
    const layersToUpdate = layers.filter((layer) => {
      const layerTypeEnabled = layer.type !== 'wmts' && layer.type !== 'granule';
      if (layer.layergroup === 'Reference' || layerTypeEnabled || !layer.visible) return false; // Reference and non-wmts/granule layers don't need collections, skip invisible layers

      const date = layer.period === 'daily' ? dailyDate : subdailyDate;

      const layerInCollections = collections[layer.id];
      if (!layerInCollections) return true; // Layer not in collections, needs to be updated

      const collectionDate = layerInCollections.dates
        .some((d) => d.date === date && d.projection === proj.id);

       // If date exists in layer collection, don't query layer
      return !collectionDate || forceUpdate;
    });
    return layersToUpdate;
  };

  const getAllHeaders = (defs) => {
    const headerRequests = defs.map(async (def) => {
      const abortController = new AbortController();
      const { signal } = abortController;
      const requestSelectedDateHeaders = () => getHeaders(def, selectedDate, signal);
      if (def.type !== 'granule') return requestSelectedDateHeaders(); // non-granule layers only need one header request
      const layerGroup = map?.getLayers()?.getArray()?.find((l) => l?.wv?.id === def.id);
      if (!layerGroup) return requestSelectedDateHeaders(); // if we can't find the layer in the map, just do a single request
      const granuleLayerArray = layerGroup.getLayersArray() || [];
      // granule layers don't necessarily use the selected date, rather they create one layer for each granule and each has their own date
      const granuleHeaders = granuleLayerArray.map(async (layer) => {
        const urls = layer.getSource?.()?.getUrls?.() || [];
        const urlRequests = urls.map(async (url) => getHeaders(def, selectedDate, signal, url)); // each layer has multiple urls to try
        const firstResponse = await Promise.any(urlRequests); // we just want the first response that works and only fail if they all fail
        return firstResponse;
      });

      const firstGranuleHeaderResponse = await Promise.any(granuleHeaders); // Right now we don't handle the possibility of multiple imagery versions in granule layers, so just return the first valid response
      abortController.abort(); // abort any other requests once promise.any settles

      return firstGranuleHeaderResponse;
    });

    return headerRequests;
  };

  const updateLayerCollections = async (forceUpdate = false) => {
    const formattedDailyDate = formatDailyDate(selectedDate);
    const formattedSubdailyDate = formatSubdailyDate(selectedDate);
    const layersToUpdate = findLayerCollections(
      formattedDailyDate,
      formattedSubdailyDate,
      forceUpdate,
    );
    const headerPromises = getAllHeaders(layersToUpdate);

    try {
      const results = await Promise.allSettled(headerPromises); // perform all header requests and wait for them to settle
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
  }, [projId, mapLayersLength]);

  return null;
}

export default UpdateCollections;
