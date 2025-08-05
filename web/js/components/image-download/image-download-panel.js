import React, { useState, useEffect } from 'react';
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

const RESOLUTION_KEY = {
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

  useEffect(() => {
    const divElem = document.querySelector('body > div');
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

    return () => resizeObserver.unobserve(divElem);
  }, []);

  const onDownload = async () => {
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
