import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import googleTagManager from 'googleTagManager';
import {
  imageSizeValid,
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

const MAX_DIMENSION_SIZE = 8200;
const RESOLUTION_KEY = {
  0.125: '30m',
  0.25: '60m',
  0.5: '125m',
  1: '250m',
  2: '500m',
  4: '1km',
  20: '5km',
  40: '10km',
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
    maxImageSize,
    firstLabel,
    geoLatLong,
    onLatLongChange,
    boundaries,
  } = props;

  const [currFileType, setFileType] = useState(fileType);
  const [currIsWorldfile, setIsWorldfile] = useState(isWorldfile);
  const [currResolution, setResolution] = useState(resolution);
  const [debugUrl, setDebugUrl] = useState('');
  const [showGranuleWarning, setShowGranuleWarning] = useState(false);

  useEffect(() => {
    const layerList = getLayers();
    const granuleDatesMap = new Map(map.getLayers().getArray().map((layer) => [layer.wv.id, layer.wv.granuleDates]));
    const layerDefs = layerList.map((def) => ({ ...def, granuleDates: granuleDatesMap.get(def.id) }));
    const isTruncated = getTruncatedGranuleDates(layerDefs, date).truncated;

    setShowGranuleWarning(isTruncated);
  }, []);

  const onDownload = async (width, height) => {
    const calcWidth = boundaries[2] - boundaries[0];
    const calcHeight = boundaries[3] - boundaries[1];
    const layerList = getLayers();
    const snapshotOptions = {
      format: 'image/png',
      resolution: 300,
      scale: 250,
      width: calcWidth,
      height: calcHeight,
      xOffset: boundaries[0],
      yOffset: boundaries[1],
      map,
    };
    const dlURL = await snapshot(snapshotOptions);

    const iframe = `<object type='image/png' width='${calcWidth / window.devicePixelRatio}px' height='${calcHeight / window.devicePixelRatio}px' data='${dlURL}'></object>`;
    const x = window.open();
    x.document.open();
    x.document.write(iframe);
    googleTagManager.pushEvent({
      event: 'image_download',
      layers: {
        activeCount: layerList.length,
      },
      image: {
        resolution: RESOLUTION_KEY[currResolution],
        format: currFileType,
        worldfile: currIsWorldfile,
      },
    });
    setDebugUrl(dlURL);
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
  const dimensions = getDimensions(projection.id, lonlats, currResolution);
  const { height } = dimensions;
  const { width } = dimensions;
  const filetypeSelect = _renderFileTypeSelect();
  const worldfileSelect = _renderWorldfileSelect();
  const layerList = getLayers();

  return (
    <>
      {crossesDatelineAlert()}
      <div className="wv-re-pick-wrapper wv-image">
        <div
          id="wv-image-download-url"
          style={{ display: 'none' }}
          // eslint-disable-next-line react/no-unknown-property
          url={debugUrl}
        />
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
        />
        {showGranuleWarning && (
          <p>Warning: A snapshot will capture a max. of {GRANULE_LIMIT} granules, additional granules are omitted.</p> // eslint-disable-line react/jsx-one-expression-per-line
        )}
        <ResTable
          width={width}
          height={height}
          fileSize={((width * height * 24) / 8388608).toFixed(2)}
          maxImageSize={maxImageSize}
          validSize={imageSizeValid(height, width, MAX_DIMENSION_SIZE)}
          validLayers={layerList.length > 0}
          onClick={onDownload}
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
  maxImageSize: '8200px x 8200px',
  resolution: '1',
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
  maxImageSize: PropTypes.string,
  markerCoordinates: PropTypes.array,
  onPanelChange: PropTypes.func,
  projection: PropTypes.object,
  date: PropTypes.object,
  resolution: PropTypes.string,
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
