import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Button, Tooltip } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import SearchLayerList from '../search/search-layers-list';
import LayerMetadataDetail from '../search/layer-metadata-detail';
import {
  getRecentLayers,
  clearRecentLayers,
  recentLayerInfo,
} from '../../../../modules/product-picker/util';

function RecentLayersList(props) {
  const {
    proj,
    layerConfig,
    selectedLayer,
    smallView,
    isMobile,
  } = props;

  const byUse = (a, b) => {
    if (a.count > b.count) return -1;
    if (a.count < b.count) return 1;
    if (a.dateAdded > b.dateAdded) return 1;
    if (a.dateAdded < b.dateAdded) return -1;
  };
  const toLayerObj = ({ id }) => layerConfig[id];
  const recentLayers = getRecentLayers();
  const initialResults = recentLayers
    ? recentLayers[proj].sort(byUse).map(toLayerObj)
    : [];

  const [results, setResults] = useState(initialResults);
  const [tooltipVisible, toggleTooltip] = useState(false);

  function clearList() {
    clearRecentLayers();
    setResults([]);
  }

  // console.table(recentLayers[proj].sort(sortFn));
  return (
    <>
      {!isMobile && !!results.length && (
      <div className="recent-layers-header">
        <h2> Recently Used Layers </h2>
        <Tooltip
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
          size="lg"
          icon={faInfoCircle}
        />
        <Button size="sm" onClick={clearList}>
          Clear Recent
        </Button>
      </div>
      )}
      <div className="search-layers-container recent-layers">
        <div className="layer-list-detail-container">
          <div className="layer-list-container search">
            <SearchLayerList results={results} />
          </div>
          { !selectedLayer && smallView ? null : !!results.length && (
          <div className="layer-detail-container layers-all search">
            <LayerMetadataDetail />
          </div>
          )}
        </div>
      </div>
    </>
  );
}

RecentLayersList.propTypes = {
  proj: PropTypes.string,
  isMobile: PropTypes.bool,
  layerConfig: PropTypes.object,
  selectedLayer: PropTypes.object,
  smallView: PropTypes.bool,
};

function mapStateToProps(state, ownProps) {
  const { browser, productPicker } = state;
  const { selectedLayer, showMobileFacets } = productPicker;

  return {
    smallView: browser.screenWidth < 1024,
    isMobile: browser.lessThan.medium,
    showMobileFacets,
    selectedLayer,
    browser,
  };
}

export default connect(mapStateToProps, null)(RecentLayersList);
