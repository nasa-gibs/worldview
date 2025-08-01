import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import googleTagManager from 'googleTagManager';
import {
  imageSizeValid,
  getDimensions,
  getTruncatedGranuleDates,
  GRANULE_LIMIT,
  snapshot,
  getDownloadUrl,
} from '../../modules/image-download/util';
import { getActivePalettes } from '../../modules/palettes/selectors';
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

// const SCALE_KEY = {
//   30: 0.125,
//   60: 0.25,
//   125: 0.5,
//   250: 1,
//   500: 2,
//   1000: 4,
//   5000: 20,
//   10000: 40,
// };

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
    url,
    markerCoordinates,
  } = props;

  const [currFileType, setFileType] = useState(fileType);
  const [currIsWorldfile, setIsWorldfile] = useState(isWorldfile);
  const [currResolution, setResolution] = useState(resolution);
  const [debugUrl, setDebugUrl] = useState('');
  const [showGranuleWarning, setShowGranuleWarning] = useState(false);
  const activePalettes = useSelector((state) => getActivePalettes(state, state.compare.activeString));

  useEffect(() => {
    const layerList = getLayers();
    const granuleDatesMap = new Map(map.getLayers().getArray().map((layer) => [layer.wv.id, layer.wv.granuleDates]));
    const layerDefs = layerList.map((def) => ({ ...def, granuleDates: granuleDatesMap.get(def.id) }));
    const isTruncated = getTruncatedGranuleDates(layerDefs, date).truncated;

    setShowGranuleWarning(isTruncated);
  }, []);

  const onDownload = async (width, height) => {
    const layerList = getLayers();
    const snapshotFormat = currFileType === 'application/vnd.google-earth.kmz' ? 'kmz' : currFileType.split('/').at(-1);
    const snapshotOptions = {
      format: snapshotFormat,
      metersPerPixel: Number(currResolution),
      pixelBbox: boundaries,
      map,
      worldfile: currIsWorldfile,
    };
    snapshot(snapshotOptions);

    const time = new Date(date.getTime());

    const granuleDatesMap = new Map(map.getLayers().getArray().map((layer) => [layer.wv.id, layer.wv.granuleDates]));
    const layerDefs = layerList.map((def) => ({ ...def, granuleDates: granuleDatesMap.get(def.id) }));
    const dlURL = getDownloadUrl(
      url,
      projection,
      layerDefs,
      lonlats,
      { width, height },
      time,
      currFileType,
      currFileType === 'application/vnd.google-earth.kmz' ? false : currIsWorldfile,
      markerCoordinates,
      activePalettes,
    );

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
      <div className="wv-re-pick-wrapper wv-image">
        <a
          id="wv-image-download-url"
          href={debugUrl}
          className="wv-image-download-url"
          download={`debugSnapshot.${currFileType.split('/').at(-1)}`}
        >
          Download Image
        </a>
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
  maxImageSize: PropTypes.string,
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
