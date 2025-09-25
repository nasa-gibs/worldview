import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import googleTagManager from 'googleTagManager';
import {
  imageSizeValid,
  estimateMaxImageSize,
  getDimensions,
  getTruncatedGranuleDates,
  GRANULE_LIMIT,
  snapshot,
} from '../../modules/image-download/util';
import SelectionList from '../util/selector';
import ResTable from './grid';
import AlertUtil from '../util/alert';
import LatLongSelect from './lat-long-inputs';
import GlobalSelectCheckbox from './global-select';
import WaitOverlay from './wait';

const RESOLUTION_KEY = {
  0.075: '7.5cm',
  0.3: '30cm',
  30: '30m',
  60: '60m',
  125: '125m',
  250: '250m',
  500: '500m',
  1_000: '1km',
  5_000: '5km',
  10_000: '10km',
};

function ImageDownloadPanel(props) {
  const {
    fileType,
    isWorldfile,
    resolution,
    getLayers,
    lonlats,
    projection,
    date,
    onPanelChange,
    fileTypeOptions,
    fileTypes,
    secondLabel,
    worldFileOptions,
    datelineMessage,
    map,
    viewExtent,
    resolutions,
    firstLabel,
    geoLatLong,
    onLatLongChange,
    boundaries,
  } = props;

  const [currFileType, setFileType] = useState(fileType);
  const [currIsWorldfile, setIsWorldfile] = useState(isWorldfile);
  const [currResolution, setResolution] = useState(resolution);
  const [showGranuleWarning, setShowGranuleWarning] = useState(false);
  const [maxWidth, setMaxWidth] = useState(0);
  const [maxHeight, setMaxHeight] = useState(0);
  const [globalSelected, setGlobalSelected] = useState(false);
  const [isSnapshotInProgress, setIsSnapshotInProgress] = useState(false);
  const [snapshotStatus, setSnapshotStatus] = useState('');
  const abortControllerRef = useRef(null);

  const onCancelSnapshot = () => {
    abortControllerRef.current?.abort();
    setIsSnapshotInProgress(false);
    setSnapshotStatus('');
  };

  useEffect(() => {
    const divElem = document.querySelector('body');
    const resizeHandler = async () => {
      const { height, width } = await estimateMaxImageSize(map, Number(currResolution));
      setMaxHeight(height);
      setMaxWidth(width);
    };
    const layerList = getLayers();
    const granuleDatesMap = new Map(map.getLayers().getArray().map((layer) => [layer.wv.id, layer.wv.granuleDates]));
    const layerDefs = layerList.map((def) => ({ ...def, granuleDates: granuleDatesMap.get(def.id) }));
    const isTruncated = getTruncatedGranuleDates(layerDefs, date).truncated;
    const resizeObserver = new ResizeObserver(resizeHandler);
    resizeObserver.observe(divElem);
    resizeHandler();

    setShowGranuleWarning(isTruncated);

    return () => {
      resizeObserver.unobserve(divElem);
      // Clean up any ongoing snapshot operation when component unmounts
      onCancelSnapshot();
    };
  }, []);

  const onDownload = async () => {
    const layerList = getLayers();
    const snapshotFormat = currFileType === 'application/vnd.google-earth.kmz' ? 'kmz' : currFileType.split('/').at(-1);

    // Create abort controller for this snapshot operation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setIsSnapshotInProgress(true);
    setSnapshotStatus('Preparing snapshot...');

    const snapshotOptions = {
      format: snapshotFormat,
      metersPerPixel: Number(currResolution),
      pixelBbox: boundaries,
      map,
      worldfile: currIsWorldfile,
      abortSignal: abortController.signal,
      filename: `snapshot-${date.toISOString()}`,
      projection,
    };

    const timeout = setTimeout(onCancelSnapshot, 180_000);
    try {
      setSnapshotStatus('Creating snapshot...');
      const startTime = Date.now();
      await snapshot(snapshotOptions);
      const endTime = Date.now();
      setSnapshotStatus('Download complete!');

      googleTagManager.pushEvent({
        event: 'image_download',
        layers: {
          activeCount: layerList.length,
        },
        duration: endTime - startTime,
        image: {
          resolution: RESOLUTION_KEY[currResolution],
          format: currFileType,
          worldfile: currIsWorldfile,
        },
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Snapshot operation was cancelled by user');
      } else {
        throw new Error('Snapshot operation failed', { cause: error });
      }
    } finally {
      // Add a delay to show the 'Download complete!' message before clearing UI
      if (snapshotStatus === 'Download complete!') {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      clearTimeout(timeout);
      setIsSnapshotInProgress(false);
      setSnapshotStatus('');
      abortControllerRef.current = null;
    }
  };

  const handleChange = (type, value) => {
    let valueIn = value;
    if (type === 'resolution') {
      setResolution(valueIn);
    } else if (type === 'worldfile') {
      valueIn = Boolean(Number(value));
      setIsWorldfile(valueIn);
    } else {
      setFileType(valueIn);
    }
    onPanelChange(type, valueIn);
  };

  const _renderFileTypeSelect = () => {
    if (fileTypeOptions) {
      return (
        <div className="wv-image-header">
          <SelectionList
            id="wv-image-format"
            optionName="filetype"
            value={currFileType}
            optionArray={fileTypes}
            onChange={handleChange}
          />
          {secondLabel}
        </div>
      );
    }
  };

  const _renderWorldfileSelect = () => {
    if (worldFileOptions) {
      const value = currIsWorldfile ? 1 : 0;
      return (
        <div className="wv-image-header">
          {currFileType === 'application/vnd.google-earth.kmz' ? (
            <select disabled>
              <option value={0}>No</option>
            </select>
          ) : (
            <select
              id="wv-image-worldfile"
              value={value}
              onChange={(e) => handleChange('worldfile', e.target.value)}
            >
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          )}
          Worldfile (.zip)
        </div>
      );
    }
  };

  const crossesDatelineAlert = () => datelineMessage && (
    <AlertUtil
      id="snapshot-dateline-alert"
      isOpen
      title="Crosses Dateline Alert"
      message={datelineMessage}
    />
  );

  const { crs } = projection.selected;
  // console.log({ currResolution }); // eslint-disable-line no-console
  const dimensions = getDimensions(map, lonlats, currResolution);
  const { height } = dimensions;
  const { width } = dimensions;
  const filetypeSelect = _renderFileTypeSelect();
  const worldfileSelect = _renderWorldfileSelect();
  const layerList = getLayers();

  return (
    <>
      {crossesDatelineAlert()}
      {isSnapshotInProgress && (
        <WaitOverlay
          statusText={snapshotStatus || 'Creating snapshot...'}
          onCancel={onCancelSnapshot}
        />
      )}
      <div className="wv-re-pick-wrapper wv-image">
        <div className="wv-image-header">
          <SelectionList
            id="wv-image-resolution"
            optionArray={resolutions}
            value={currResolution}
            optionName="resolution"
            onChange={handleChange}
          />
          {firstLabel}
        </div>
        {filetypeSelect}
        {worldfileSelect}
        <LatLongSelect
          viewExtent={viewExtent}
          geoLatLong={projection.id === 'geographic' ? lonlats : geoLatLong}
          onLatLongChange={onLatLongChange}
          crs={crs}
        />
        <GlobalSelectCheckbox
          viewExtent={viewExtent}
          geoLatLong={geoLatLong}
          onLatLongChange={onLatLongChange}
          proj={projection.id}
          map={map}
          handleChange={(event) => setGlobalSelected(event.target.checked)}
        />
        {showGranuleWarning && (
          <p>Warning: A snapshot will capture a max. of {GRANULE_LIMIT} granules, additional granules are omitted.</p> // eslint-disable-line react/jsx-one-expression-per-line
        )}
        <ResTable
          width={width}
          height={height}
          fileSize={((width * height * 24) / 8388608).toFixed(2)}
          maxImageSize={`${maxWidth}px x ${maxHeight}px`}
          validSize={imageSizeValid({
            maxHeight,
            maxWidth,
            map,
            resolution: Number(currResolution),
            pixelBbox: boundaries,
          })}
          validLayers={layerList.length > 0}
          onClick={onDownload}
          isSnapshotInProgress={isSnapshotInProgress}
        />
      </div>
    </>
  );
}

ImageDownloadPanel.defaultProps = {
  fileType: 'image/jpeg',
  fileTypeOptions: true,
  firstLabel: 'Resolution (per pixel)',
  isWorldfile: false,
  resolution: 250,
  secondLabel: 'Format',
  worldFileOptions: true,
};

ImageDownloadPanel.propTypes = {
  datelineMessage: PropTypes.string,
  fileType: PropTypes.string,
  fileTypeOptions: PropTypes.bool,
  fileTypes: PropTypes.object,
  firstLabel: PropTypes.string,
  getLayers: PropTypes.func,
  isWorldfile: PropTypes.bool,
  lonlats: PropTypes.array,
  map: PropTypes.object,
  markerCoordinates: PropTypes.array,
  onPanelChange: PropTypes.func,
  projection: PropTypes.object,
  date: PropTypes.object,
  resolution: PropTypes.number,
  resolutions: PropTypes.object,
  secondLabel: PropTypes.string,
  url: PropTypes.string,
  viewExtent: PropTypes.array,
  worldFileOptions: PropTypes.bool,
  geoLatLong: PropTypes.array,
  onLatLongChange: PropTypes.func,
  boundaries: PropTypes.array,
};

export default ImageDownloadPanel;
