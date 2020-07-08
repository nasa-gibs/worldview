import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Button,
  Nav,
  NavItem,
  NavLink,
  DropdownMenu,
  Dropdown,
  DropdownItem,
  DropdownToggle,
  Tooltip,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faQuestionCircle } from '@fortawesome/free-regular-svg-icons';
import BrowseLayerList from './browse-layers-list';
import CategoryGrid from './category-grid';
import MeasurementMetadataDetail from './measurement-metadata-detail';
import {
  selectCategoryType as selectCategoryAction,
  toggleMeasurementsTab as toggleMeasurementsTabAction,
  toggleFeatureTab as toggleFeatureTabAction,
  toggleRecentLayersTab as toggleRecentLayersTabAction,
  clearRecentLayers as clearRecentLayersAction,
} from '../../../../modules/product-picker/actions';
import {
  recentLayerInfo,
} from '../../../../modules/product-picker/util';
import RecentLayersList from './recent-layers';
import safeLocalStorage from '../../../../util/local-storage';

const CATEGORIES = [
  'hazards and disasters',
  'scientific',
  'featured',
];
const GEOGRAPHIC_TAB_KEYS = [
  ...CATEGORIES,
];
const POLAR_TAB_KEYS = [
  'measurements',
];
if (safeLocalStorage.enabled) {
  GEOGRAPHIC_TAB_KEYS.push('recent');
  POLAR_TAB_KEYS.push('recent');
}

function BrowseLayers (props) {
  const {
    browser,
    categoryType,
    mode,
    width,
    recentLayers,
    selectCategoryType,
    selectedProjection,
    toggleMeasurementsTab,
    toggleFeatureTab,
    toggleRecentLayersTab,
    clearRecentLayers,
  } = props;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tooltipVisible, toggleTooltip] = useState(false);
  const categoryKeys = selectedProjection === 'geographic'
    ? GEOGRAPHIC_TAB_KEYS
    : POLAR_TAB_KEYS;

  const isCategoryDisplay = mode === 'category'
    && selectedProjection === 'geographic'
    && categoryType !== 'recent';

  /**
   * Update category type in which to show
   * e.g. Hazards and disasters or science disciplines
   * @param {String} key | categoryType identifier
   */
  const selectTab = (key) => {
    if (key === 'featured') {
      toggleFeatureTab();
    } else if (key === 'recent') {
      toggleRecentLayersTab();
    } else if (key === 'measurements') {
      toggleMeasurementsTab();
    } else if (CATEGORIES.includes(key)) {
      selectCategoryType(key);
    }
  };

  function renderContent () {
    return categoryType === 'recent'
      ? (<RecentLayersList />)
      : (
        <div className="search-layers-container browse">
          <div className="layer-list-container browse">
            <div className="product-outter-list-case">
              <BrowseLayerList />
            </div>
          </div>
          { !browser.lessThan.medium && (
          <div className="layer-detail-container layers-all browse">
            <MeasurementMetadataDetail />
          </div>
          )}
        </div>
      );
  }

  function renderDesktopTabs () {
    const tabClass = (sortKey) => (sortKey === 'recent'
      ? 'recent-tab layer-category-navigation'
      : 'layer-category-navigation');
    const recentTab = (sortKey) => (
      <NavLink onClick={() => selectTab(sortKey)}>
        <FontAwesomeIcon icon={faClock} />
        Recent
      </NavLink>
    );
    const tab = (sortKey) => (
      <NavLink onClick={() => selectTab(sortKey)}>
        {sortKey === 'scientific' ? 'Science Disciplines' : sortKey}
      </NavLink>
    );

    return (
      <Nav id="categories-nav" className="categories-nav">
        {categoryKeys.map((sortKey) => (
          <NavItem
            key={sortKey}
            className={tabClass(sortKey)}
            active={sortKey === categoryType}
          >
            {sortKey === 'recent' ? recentTab(sortKey) : tab(sortKey)}
          </NavItem>
        ))}
      </Nav>
    );
  }

  function recentLayersHeader() {
    return !(recentLayers.length && categoryType === 'recent')
      ? null
      : (
        <div className="recent-layers-mobile-header">
          <Tooltip
            className="facet-tooltip-content"
            isOpen={tooltipVisible}
            target="recent-tooltip-target"
            placement="bottom"
            toggle={() => toggleTooltip(!tooltipVisible)}
            delay={{ show: 0, hide: 300 }}
          >
            <p>{recentLayerInfo}</p>
            <p>&nbsp;</p>
            <p>Swipe to remove layers from the list.</p>
          </Tooltip>
          <FontAwesomeIcon
            id="recent-tooltip-target"
            className="recent-tooltip-icon"
            icon={faQuestionCircle}
          />
          <Button
            id="clear-recent-layers"
            size="sm"
            onClick={clearRecentLayers}
            title="Remove all layers from the recent list"
          >
            Clear List
          </Button>
        </div>
      );
  }

  function renderMobileDropdown() {
    return (
      <div className="categories-dropdown-header">
        <Dropdown
          isOpen={dropdownOpen}
          toggle={() => setDropdownOpen((prevState) => !prevState)}
          className="categories-dropdown"
        >
          <DropdownToggle caret>
            {categoryType === 'recent' && (<FontAwesomeIcon icon={faClock} />)}
            {categoryType}
          </DropdownToggle>
          <DropdownMenu className="categories-dropdown-menu">
            {categoryKeys.map((sortKey) => (
              <DropdownItem
                key={sortKey}
                className="categories-dropdown-item"
                onClick={() => selectTab(sortKey)}
              >
                {sortKey}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
        {recentLayersHeader()}
      </div>
    );
  }

  return (
    <>
      { browser.lessThan.medium ? renderMobileDropdown() : renderDesktopTabs() }
      {
        isCategoryDisplay
          ? (
            <div className="product-outter-list-case">
              <CategoryGrid width={width} />
            </div>
          ) : renderContent()
        }
    </>
  );
}

BrowseLayers.propTypes = {
  browser: PropTypes.object,
  categoryType: PropTypes.string,
  clearRecentLayers: PropTypes.func,
  mode: PropTypes.string,
  recentLayers: PropTypes.array,
  selectCategoryType: PropTypes.func,
  selectedProjection: PropTypes.string,
  toggleMeasurementsTab: PropTypes.func,
  toggleFeatureTab: PropTypes.func,
  toggleRecentLayersTab: PropTypes.func,
  width: PropTypes.number,
};

const mapDispatchToProps = (dispatch) => ({
  selectCategoryType: (key) => {
    dispatch(selectCategoryAction(key));
  },
  toggleMeasurementsTab: () => {
    dispatch(toggleMeasurementsTabAction());
  },
  toggleFeatureTab: () => {
    dispatch(toggleFeatureTabAction());
  },
  toggleRecentLayersTab: () => {
    dispatch(toggleRecentLayersTabAction());
  },
  clearRecentLayers: () => {
    dispatch(clearRecentLayersAction());
  },
});

function mapStateToProps(state, ownProps) {
  const {
    config,
    browser,
    proj,
    productPicker,
    layers,
  } = state;
  const {
    mode,
    categoryType,
    listScrollTop,
    selectedMeasurement,
    selectedMeasurementSourceIndex,
    recentLayers,
  } = productPicker;
  return {
    browser,
    mode,
    categoryType,
    measurementConfig: config.measurements,
    layerConfig: layers.layerConfig,
    listScrollTop,
    recentLayers,
    selectedProjection: proj.id,
    selectedMeasurement,
    selectedMeasurementSourceIndex,
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(BrowseLayers);
