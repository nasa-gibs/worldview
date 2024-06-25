import React, { useState } from 'react';
import PropTypes from 'prop-types';
import googleTagManager from 'googleTagManager';
import {
  imageSizeValid,
  getDimensions,
  getDownloadUrl,
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

  const onDownload = (width, height) => {
    const time = new Date(date.getTime());

    const layerList = getLayers();
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
};

export default ImageDownloadPanel;
