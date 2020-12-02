import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import GeosearchModal from './geosearch-modal';
import {
  toggleShowGeosearch,
} from '../../modules/geosearch/actions';

class Geosearch extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inputValue: '',
      coordinatesPending: [],
    };
  }

  componentDidUpdate(prevProps) {
    const { isExpanded, isMobile, toggleShowGeosearch } = this.props;
    if (isExpanded && prevProps.isMobile !== isMobile) {
      toggleShowGeosearch();
    }
  }

  // update input value
  updateValue = (inputValue) => this.setState({ inputValue });

  // update array of pending coordinates
  updatePendingCoordinates = (coordinatesPending) => this.setState({ coordinatesPending });

  renderSearchComponent = () => {
    const {
      coordinatesPending,
      inputValue,
    } = this.state;

    return (
      <GeosearchModal
        coordinatesPending={coordinatesPending}
        inputValue={inputValue}
        updatePendingCoordinates={this.updatePendingCoordinates}
        updateValue={this.updateValue}
      />
    );
  }

  render() {
    const {
      isExpanded,
      isFeatureEnabled,
      isMobile,
      shouldCollapseFromOtherUI,
    } = this.props;
    if (!isFeatureEnabled) {
      return null;
    }

    const shouldShowComponent = isMobile || (isExpanded && !shouldCollapseFromOtherUI);
    return (
      <>
        {shouldShowComponent && this.renderSearchComponent()}
      </>
    );
  }
}

const mapStateToProps = (state) => {
  const {
    browser,
    config,
    modal,
    measure,
    animation,
    geosearch,
    ui,
  } = state;
  const { features: { geocodeSearch: { url: requestUrl } } } = config;
  const isFeatureEnabled = !!requestUrl;
  const { isActive } = measure;
  const { gifActive } = animation;
  const {
    isExpanded,
  } = geosearch;
  const { isDistractionFreeModeActive } = ui;
  const isMobile = browser.lessThan.medium;
  const snapshotModalOpen = modal.isOpen && modal.id === 'TOOLBAR_SNAPSHOT';
  // Collapse when image download, GIF, measure tool, or distraction free mode is active
  const shouldCollapseFromOtherUI = snapshotModalOpen || isActive || gifActive || isDistractionFreeModeActive;

  return {
    isExpanded,
    isFeatureEnabled,
    isMobile,
    shouldCollapseFromOtherUI,
  };
};

const mapDispatchToProps = (dispatch) => ({
  toggleShowGeosearch: () => {
    dispatch(toggleShowGeosearch());
  },
});

Geosearch.propTypes = {
  isExpanded: PropTypes.bool,
  isFeatureEnabled: PropTypes.bool,
  isMobile: PropTypes.bool,
  shouldCollapseFromOtherUI: PropTypes.bool,
  toggleShowGeosearch: PropTypes.func,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Geosearch);
