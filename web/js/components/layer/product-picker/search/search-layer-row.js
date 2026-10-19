import { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, UncontrolledTooltip } from 'reactstrap';
import {
  addLayer as addLayerAction,
  removeLayer as removeLayerAction,
} from '../../../../modules/layers/actions';
import {
  clearSingleRecentLayer as clearSingleRecentLayerAction,
} from '../../../../modules/product-picker/actions';
import { getActiveLayersMap } from '../../../../modules/layers/selectors';
import RenderSplitLayerTitle from '../renderSplitTitle';
import { getSelectedDate } from '../../../../modules/date/selectors';
import { getLayerNoticesForLayer } from '../../../../modules/notifications/util';
import util from '../../../../util/util';
import { JOYRIDE_INCREMENT } from '../../../../util/constants';

const { events } = util;

/**
 * A single layer search result row
 */
function SearchLayerRow(props) {
  const {
    layer,
    selectedLayer,
    isEnabled,
    addLayer,
    removeLayer,
    showLayerMetadata,
    scrollIntoView,
    isMobile,
    categoryType,
    clearSingleRecentLayer,
    layerNotices,
  } = props;

  const [showDeleteIcon, setShowDeleteIcon] = useState(false);

  const thisRef = useRef();

  useEffect(() => {
    if (selectedLayer && selectedLayer.id === layer.id) {
      thisRef.current.scrollIntoView(true);
    }
  }, []);

  function onRowClick() {
    toggleShowMetadata();
    setTimeout(() => {
      events.trigger(JOYRIDE_INCREMENT);
    });
  }

  /**
   * Toggle layer checked state
   * @method toggleEnabled
   * @return {void}
   */
  function toggleEnabled() {
    if (isEnabled) removeLayer(layer.id);
    if (!isEnabled) addLayer(layer.id);
  }

  /**
   * Show metadata for this layer
   * @method showMetadata
   * @param {e} event
   * @return {void}
   */
  function toggleShowMetadata() {
    if (!(selectedLayer && layer.id === selectedLayer.id)) {
      if (!selectedLayer && scrollIntoView) {
        // Make sure item doesn't get obscured by the detail view
        // only at small and x-small views
        setTimeout(() => {
          thisRef.current.scrollIntoView(true);
        }, 250);
      }
      showLayerMetadata(layer.id);
    } else {
      // Allow click to deselect on mobile
      showLayerMetadata(null);
    }
  }

  function toggleDeleteIcon(show) {
    if (!isMobile) {
      setShowDeleteIcon(show);
    }
  }

  const { id, analysis } = layer;
  const encodedId = util.encodeId(id);
  const isMetadataShowing = selectedLayer && id === selectedLayer.id;
  const chartableLayer = analysis?.includes('Chartable (Raster-based)');
  const rowClass = isMetadataShowing
    ? 'search-row layers-all-layer selected'
    : 'search-row layers-all-layer';
  const checkboxClass = isEnabled ? 'wv-checkbox checked' : 'wv-checkbox';
  const recentLayerMode = categoryType === 'recent';
  const headerClassName = layerNotices || chartableLayer
    ? 'layers-all-header notice'
    : 'layers-all-header';

  return (
    <div
      id={`${encodedId}-search-row`}
      className={rowClass}
      ref={thisRef}
      onMouseEnter={() => toggleDeleteIcon(true)}
      onMouseLeave={() => toggleDeleteIcon(false)}
    >
      <div className={checkboxClass + (!isMetadataShowing ? ' gray' : '')}>
        <input
          type="checkbox"
          id={`${encodedId}-checkbox`}
          name={`${encodedId}-checkbox`}
          checked={isEnabled}
          onChange={toggleEnabled}
        />
        {isEnabled && (
          <svg
            stroke="currentColor"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            strokeWidth="0"
            width="15px"
            height="15px"
            viewBox="0 0 20 20"
            role="img"
            className="check"
          >
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="M17.707 5.707 8 15.414 2.293 9.707l1.414-1.414L8 12.586l8.293-8.293z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
      {(chartableLayer || layerNotices) && (
        <div className="layer-notices">
          {chartableLayer && (
            <div className="layer-notice-wrapper">
              <i
                id={`${encodedId}-chartable-info`}
                className="layer-notice-icon chartable-icon"
              />
              <UncontrolledTooltip
                id="center-align-tooltip"
                className="zot-tooltip"
                placement="top"
                target={`${encodedId}-chartable-info`}
                trigger="hover"
                autohide={isMobile}
                delay={isMobile ? { show: 300, hide: 300 } : { show: 50, hide: 300 }}
              >
                <div dangerouslySetInnerHTML={{ __html: 'Create time series charts or get statistics for this layer' }} />
              </UncontrolledTooltip>
            </div>
          )}
          {layerNotices && (
            <div className="layer-notice-wrapper">
              <FontAwesomeIcon
                id={`${encodedId}-notice-info`}
                className="layer-notice-icon"
                icon="exclamation-triangle"
                widthAuto
              />
              <UncontrolledTooltip
                id="center-align-tooltip"
                className="zot-tooltip"
                placement="top"
                target={`${encodedId}-notice-info`}
                trigger="hover"
                autohide={isMobile}
                delay={isMobile ? { show: 300, hide: 300 } : { show: 50, hide: 300 }}
              >
                <div dangerouslySetInnerHTML={{ __html: layerNotices }} />
              </UncontrolledTooltip>
            </div>
          )}
        </div>
      )}
      <button type="button" className={headerClassName} onClick={onRowClick}>
        <RenderSplitLayerTitle layer={layer} />
        {recentLayerMode && showDeleteIcon && (
          <Button
            className="recent-layer-delete"
            color="danger"
            title="Remove from recent layers list."
            onClick={(e) => clearSingleRecentLayer(e, layer)}
          >
            <FontAwesomeIcon icon="trash" widthAuto />
          </Button>
        )}
      </button>
    </div>
  );
}
SearchLayerRow.propTypes = {
  addLayer: PropTypes.func,
  categoryType: PropTypes.string,
  clearSingleRecentLayer: PropTypes.func,
  isEnabled: PropTypes.bool,
  isMobile: PropTypes.bool,
  layer: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  layerNotices: PropTypes.string,
  removeLayer: PropTypes.func,
  scrollIntoView: PropTypes.bool,
  selectedLayer: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  showLayerMetadata: PropTypes.func,
};

const mapStateToProps = (state, ownProps) => {
  const { productPicker, notifications, screenSize } = state;
  const activeLayerMap = getActiveLayersMap(state);
  const { categoryType, selectedLayer } = productPicker;
  return {
    scrollIntoView: screenSize.screenWidth < 1024,
    isEnabled: !!activeLayerMap[ownProps.layer.id],
    isMobile: screenSize.isMobileDevice,
    layerNotices: getLayerNoticesForLayer(ownProps.layer.id, notifications),
    selectedDate: getSelectedDate(state),
    selectedLayer,
    categoryType,
  };
};

const mapDispatchToProps = (dispatch) => ({
  addLayer: (id) => {
    dispatch(addLayerAction(id));
  },
  removeLayer: (id) => {
    dispatch(removeLayerAction(id));
  },
  clearSingleRecentLayer: (e, layer) => {
    e.stopPropagation();
    dispatch(clearSingleRecentLayerAction(layer));
  },
});
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SearchLayerRow);
