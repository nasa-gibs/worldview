import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Button, Tooltip } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import SearchLayerList from '../search/search-layers-list';
import LayerMetadataDetail from '../search/layer-metadata-detail';
import {
  recentLayerInfo,
} from '../../../../modules/product-picker/util';
import {
  clearRecentLayers as clearRecentLayersAction,
} from '../../../../modules/product-picker/actions';

function RecentLayersList(props) {
  const {
    clearRecentLayers,
    selectedLayer,
    smallView,
    isMobile,
    recentLayers,
  } = props;

  const [tooltipVisible, toggleTooltip] = useState(false);

  return (
    <>
      {!isMobile && !!recentLayers.length && (
      <div className="recent-layers-header">
        <h2> Recently Used Layers </h2>
        <Tooltip
          id="center-align-tooltip"
          className="facet-tooltip-content"
          isOpen={tooltipVisible}
          target="recent-layer-tooltip-target"
          placement="bottom"
          toggle={() => toggleTooltip(!tooltipVisible)}
          delay={{ show: 0, hide: 300 }}
        >
          <p>{recentLayerInfo}</p>
        </Tooltip>
        <FontAwesomeIcon
          id="recent-layer-tooltip-target"
          className="tooltip-icon"
          size="lg"
          icon="question-circle"
          widthAuto
        />
        <Button id="clear-recent-layers" size="sm" onClick={clearRecentLayers}>
          Clear List
        </Button>
      </div>
      )}
      <div className="search-layers-container recent-layers">
        <div className="layer-list-detail-container">
          <div className="layer-list-container search">
            <SearchLayerList results={recentLayers} />
          </div>
          { !selectedLayer && smallView ? null : !!recentLayers.length && (
          <div className="layer-detail-container layers-all search">
            <LayerMetadataDetail layer={selectedLayer} />
          </div>
          )}
        </div>
      </div>
    </>
  );
}

RecentLayersList.propTypes = {
  clearRecentLayers: PropTypes.func,
  isMobile: PropTypes.bool,
  selectedLayer: PropTypes.object,
  smallView: PropTypes.bool,
  recentLayers: PropTypes.array,
};

const mapStateToProps = (state) => {
  const { screenSize, productPicker } = state;
  const {
    selectedLayer,
    showMobileFacets,
    recentLayers,
  } = productPicker;

  return {
    screenSize,
    smallView: window.innerWidth < 1024,
    isMobile: screenSize.isMobileDevice,
    showMobileFacets,
    selectedLayer,
    recentLayers,
  };
};

const mapDispatchToProps = (dispatch) => ({
  clearRecentLayers: () => {
    dispatch(clearRecentLayersAction());
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(RecentLayersList);
