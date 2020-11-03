import React from 'react';
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
import { getActiveLayers } from '../../../../modules/layers/selectors';
import RenderSplitLayerTitle from '../renderSplitTitle';
import getSelectedDate from '../../../../modules/date/selectors';
import { getLayerNoticesForLayer } from '../../../../modules/notifications/util';
import util from '../../../../util/util';

/**
 * A single layer search result row
 * @class LayerRow
 * @extends React.Component
 */
class SearchLayerRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showDeleteIcon: false,
    };
    this.toggleEnabled = this.toggleEnabled.bind(this);
    this.toggleShowMetadata = this.toggleShowMetadata.bind(this);
    this.ref = React.createRef();
  }

  componentDidMount() {
    const { layer, selectedLayer } = this.props;
    if (selectedLayer && selectedLayer.id === layer.id) {
      this.ref.current.scrollIntoView(true);
    }
  }

  /**
   * Toggle layer checked state
   * @method toggleEnabled
   * @return {void}
   */
  toggleEnabled() {
    const {
      isEnabled, addLayer, removeLayer, layer,
    } = this.props;
    if (isEnabled) removeLayer(layer.id);
    if (!isEnabled) addLayer(layer.id);
  }

  /**
   * Show metadata for this layer
   * @method showMetadata
   * @param {e} event
   * @return {void}
   */
  toggleShowMetadata() {
    const {
      layer,
      showLayerMetadata,
      selectedLayer,
      scrollIntoView,
    } = this.props;

    if (!(selectedLayer && layer.id === selectedLayer.id)) {
      if (!selectedLayer && scrollIntoView) {
        // Make sure item doesn't get obscured by the detail view
        // only at small and x-small views
        setTimeout(() => {
          this.ref.current.scrollIntoView(true);
        }, 250);
      }
      showLayerMetadata(layer.id);
    } else {
      // Allow click to deselect on mobile
      showLayerMetadata(null);
    }
  }

  toggleDeleteIcon(show) {
    const { isMobile } = this.props;
    if (!isMobile) {
      this.setState({ showDeleteIcon: show });
    }
  }

  render() {
    const {
      isEnabled,
      isMobile,
      layer,
      selectedLayer,
      categoryType,
      clearSingleRecentLayer,
      layerNotices,
    } = this.props;
    const { showDeleteIcon } = this.state;
    const { id } = layer;
    const encodedId = util.encodeId(id);
    const isMetadataShowing = selectedLayer && id === selectedLayer.id;
    const rowClass = isMetadataShowing
      ? 'search-row layers-all-layer selected'
      : 'search-row layers-all-layer';
    const checkboxClass = isEnabled ? 'wv-checkbox checked' : 'wv-checkbox';
    const recentLayerMode = categoryType === 'recent';
    const headerClassName = layerNotices
      ? 'layers-all-header notice'
      : 'layers-all-header';

    return (
      <div
        id={`${encodedId}-search-row`}
        className={rowClass}
        ref={this.ref}
        onMouseEnter={() => this.toggleDeleteIcon(true)}
        onMouseLeave={() => this.toggleDeleteIcon(false)}
      >
        <div className={checkboxClass}>
          <input
            type="checkbox"
            id={`${encodedId}-checkbox`}
            name={`${encodedId}-checkbox`}
            checked={isEnabled}
            onChange={this.toggleEnabled}
          />
        </div>
        {layerNotices && (
          <div className="layer-notice-wrapper">
            <FontAwesomeIcon
              id={`${encodedId}-notice-info`}
              className="layer-notice-icon"
              icon="exclamation-triangle"
            />
            <UncontrolledTooltip
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
        <div className={headerClassName} onClick={this.toggleShowMetadata}>
          <RenderSplitLayerTitle layer={layer} />
          {recentLayerMode && showDeleteIcon && (
            <Button
              className="recent-layer-delete"
              color="danger"
              title="Remove from recent layers list."
              onClick={(e) => clearSingleRecentLayer(e, layer)}
            >
              <FontAwesomeIcon icon="trash" />
            </Button>
          )}
        </div>
      </div>
    );
  }
}
SearchLayerRow.propTypes = {
  addLayer: PropTypes.func,
  categoryType: PropTypes.string,
  clearSingleRecentLayer: PropTypes.func,
  isEnabled: PropTypes.bool,
  isMobile: PropTypes.bool,
  layer: PropTypes.object,
  layerNotices: PropTypes.string,
  removeLayer: PropTypes.func,
  scrollIntoView: PropTypes.bool,
  selectedLayer: PropTypes.object,
  showLayerMetadata: PropTypes.func,
};

const mapStateToProps = (state, ownProps) => {
  const { productPicker, browser, notifications } = state;
  const activeLayerMap = getActiveLayers(state);
  const { categoryType, selectedLayer } = productPicker;
  return {
    scrollIntoView: browser.screenWidth < 1024,
    isEnabled: !!activeLayerMap[ownProps.layer.id],
    isMobile: browser.lessThan.medium,
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
