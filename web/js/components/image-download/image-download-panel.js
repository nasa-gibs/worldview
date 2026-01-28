import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import googleTagManager from 'googleTagManager';
import { getActivePalettes } from '../../modules/palettes/selectors';
import {
  imageSizeValid,
  getDimensions,
  getDownloadUrl,
  getTruncatedGranuleDates,
  GRANULE_LIMIT,
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
    url,
    lonlats,
    projection,
    date,
    markerCoordinates,
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
  } = props;

  const [currFileType, setFileType] = useState(fileType);
  const [currIsWorldfile, setIsWorldfile] = useState(isWorldfile);
  const [currResolution, setResolution] = useState(resolution);
  const [debugUrl, setDebugUrl] = useState('');
  const [showGranuleWarning, setShowGranuleWarning] = useState(false);
  const activePalettes = useSelector((state) => getActivePalettes(
    state,
    state.compare.activeString,
  ));

  useEffect(() => {
    const layerList = getLayers();
    const granuleDatesMap = new Map(map.getLayers().getArray().map((layer) => [
      layer.wv.id,
      layer.wv.granuleDates,
    ]));
    const layerDefs = layerList.map((def) => ({
      ...def, granuleDates: granuleDatesMap.get(def.id),
    }));
    const isTruncated = getTruncatedGranuleDates(layerDefs, date).truncated;

    setShowGranuleWarning(isTruncated);
  }, []);

  const onDownload = (width, height) => {
    const time = new Date(date.getTime());

    const layerList = getLayers();
    const granuleDatesMap = new Map(map.getLayers().getArray().map((layer) => [
      layer.wv.id, layer.wv.granuleDates,
    ]));
    const layerDefs = layerList.map((def) => ({
      ...def, granuleDates: granuleDatesMap.get(def.id),
    }));
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

    window.open(dlURL, '_blank');
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

  const renderFileTypeSelect = () => {
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
    return false;
  };

  const renderWorldfileSelect = () => {
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
    return false;
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
  const filetypeSelect = renderFileTypeSelect();
  const worldfileSelect = renderWorldfileSelect();
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
          <p>
            Warning: A snapshot will capture a max. of
            {GRANULE_LIMIT}
            {' '}
            granules, additional
            granules are omitted.
          </p> // eslint-disable-line react/jsx-one-expression-per-line
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
  fileTypes: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  firstLabel: PropTypes.string,
  getLayers: PropTypes.func,
  isWorldfile: PropTypes.bool,
  lonlats: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  map: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  maxImageSize: PropTypes.string,
  markerCoordinates: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  onPanelChange: PropTypes.func,
  projection: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  date: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  resolution: PropTypes.string,
  resolutions: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  secondLabel: PropTypes.string,
  url: PropTypes.string,
  viewExtent: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  worldFileOptions: PropTypes.bool,
  geoLatLong: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  onLatLongChange: PropTypes.func,
};

export default ImageDownloadPanel;
