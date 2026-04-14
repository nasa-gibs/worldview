import { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import googleTagManager from 'googleTagManager';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  imageSizeValid,
  estimateMaxImageSize,
  getDimensions,
  getTruncatedGranuleDates,
  GRANULE_LIMIT,
  snapshot,
} from '../../modules/image-download/util';
import SelectionList from '../util/selector';
import { openCustomContent } from '../../modules/modal/actions';
import ResTable from './grid';
import AlertUtil from '../util/alert';
import LatLongSelect from './lat-long-inputs';
import GlobalSelectCheckbox from './global-select';
import WaitOverlay from './wait';
import SnapshotError from './snapshot-error';
import onClickFeedback from '../../modules/feedback/util';
import initFeedback from '../../modules/feedback/actions';

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
    fileType = 'image/jpeg',
    isWorldfile = false,
    resolution = '1',
    getLayers,
    lonlats,
    projection,
    date,
    onPanelChange,
    fileTypeOptions = true,
    fileTypes,
    secondLabel = 'Format',
    worldFileOptions = true,
    datelineMessage,
    map,
    viewExtent,
    resolutions,
    firstLabel,
    geoLatLong,
    onLatLongChange,
    boundaries,
    openSnapshotErrorModal,
    feedbackIsInitiated,
    isMobile,
    sendFeedback,
  } = props;

  const [currFileType, setFileType] = useState(fileType);
  const [currIsWorldfile, setIsWorldfile] = useState(isWorldfile);
  const [currResolution, setResolution] = useState(resolution);
  const [showGranuleWarning, setShowGranuleWarning] = useState(false);
  const [maxWidth, setMaxWidth] = useState(0);
  const [maxHeight, setMaxHeight] = useState(0);
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
    const granuleDatesMap = new Map(map.getLayers().getArray()
      .map((layer) => [
        layer.wv.id,
        layer.wv.granuleDates,
      ]));
    const layerDefs = layerList.map((def) => ({
      ...def, granuleDates: granuleDatesMap.get(def.id),
    }));
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

  useEffect(() => {
    setResolution(resolution);
  }, [resolution]);

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
      onerror: openSnapshotErrorModal,
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
        await new Promise((resolve) => {
          setTimeout(resolve, 2000);
        });
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
          {currFileType === 'application/vnd.google-earth.kmz'
            ? (
              <select disabled>
                <option value={0}>No</option>
              </select>
            )
            : (
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

  const handleKeyDown = (e, feedbackIsInitiatedArg, isMobileArg) => {
    if (e.key === 'Enter') {
      return sendFeedback(feedbackIsInitiatedArg, isMobileArg);
    }
    return null;
  };

  const { crs } = projection.selected;
  const dimensions = getDimensions(map, lonlats, currResolution);
  const { height } = dimensions;
  const { width } = dimensions;
  const filetypeSelect = renderFileTypeSelect();
  const worldfileSelect = renderWorldfileSelect();
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
        />
        {showGranuleWarning && (
          <p>
            Warning: A snapshot will capture a max. of
            {GRANULE_LIMIT}
            {' '}
            granules, additional
            granules are omitted.
          </p>
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
        <hr />
        <p className="wv-snapshot-warning">
          <span className="wv-snapshot-warning-icon">
            <FontAwesomeIcon
              icon="exclamation-triangle"
              className="wv-alert-icon"
              size="1x"
              widthAuto
            />
          </span>
          This snapshot feature has been upgraded to capture anything on the map,
          including customized color palettes. If you notice any issues, please
          {' '}
          <span
            className="snapshot-feedback"
            role="link"
            tabIndex={0}
            onKeyDown={(e, feedbackIsInitiatedArg, isMobileArg) =>
              handleKeyDown(e, feedbackIsInitiatedArg, isMobileArg)}
            onClick={() => sendFeedback(feedbackIsInitiated, isMobile)}
          >
            contact us
          </span>
          .
        </p>
      </div>
    </>
  );
}

const mapStateToProps = (state) => {
  const {
    feedback, screenSize,
  } = state;
  return {
    feedbackIsInitiated: feedback.isInitiated,
    isMobile: screenSize.isMobileDevice,
  };
};

const mapDispatchToProps = (dispatch) => ({
  openSnapshotErrorModal: () => {
    dispatch(
      openCustomContent('SNAPSHOT_ERROR_MODAL', {
        headerText: 'Snapshot Error',
        backdrop: false,
        bodyComponent: SnapshotError,
        wrapClassName: 'unclickable-behind-modal',
        modalClassName: 'snapshot-error',
      }),
    );
  },
  sendFeedback: (isInitiated, isMobile) => {
    onClickFeedback(isInitiated, isMobile);
    if (!isInitiated) {
      dispatch(initFeedback());
    }
  },
});

ImageDownloadPanel.defaultProps = {
  fileType: 'image/jpeg',
  fileTypeOptions: true,
  firstLabel: 'Resolution (per pixel)',
  isWorldfile: false,
  resolution: 250,
  secondLabel: 'Format',
  worldFileOptions: true,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ImageDownloadPanel);

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
  onPanelChange: PropTypes.func,
  projection: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  date: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  resolution: PropTypes.number,
  resolutions: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  secondLabel: PropTypes.string,
  viewExtent: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  worldFileOptions: PropTypes.bool,
  geoLatLong: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  onLatLongChange: PropTypes.func,
  boundaries: PropTypes.array,
  openSnapshotErrorModal: PropTypes.func,
  feedbackIsInitiated: PropTypes.bool,
  isMobile: PropTypes.bool,
  sendFeedback: PropTypes.func,
};
