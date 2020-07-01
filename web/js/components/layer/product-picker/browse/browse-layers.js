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
  selectCategory as selectCategoryAction,
  toggleFeatureTab as toggleFeatureTabAction,
  toggleRecentLayersTab as toggleRecentLayersTabAction,
  clearRecentLayers as clearRecentLayersAction,
} from '../../../../modules/product-picker/actions';
import {
  recentLayerInfo,
} from '../../../../modules/product-picker/util';
import RecentLayersList from './recent-layers';

const CATEGORY_KEYS = [
  'hazards and disasters',
  'scientific',
  'featured',
  'recent',
];

function BrowseLayers (props) {
  const {
    browser,
    categoryType,
    mode,
    selectedProjection,
    width,
    recentLayers,
    selectCategory,
    toggleFeatureTab,
    toggleRecentLayersTab,
    clearRecentLayers,
  } = props;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tooltipVisible, toggleTooltip] = useState(false);

  /**
   * Update category type in which to show
   * e.g. Hazards and disasters or science disciplines
   * @param {String} key | categoryType identifier
   */
  const selectCategoryType = (key) => {
    if (key === 'featured') {
      toggleFeatureTab();
    } else if (key === 'recent') {
      toggleRecentLayersTab();
    } else {
      selectCategory(key);
    }
  };

  const renderContent = () => (categoryType === 'recent'
    ? (
      <RecentLayersList />
    )
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
    ));

  const renderDesktopTabs = () => {
    const tabClass = (sortKey) => (sortKey === 'recent'
      ? 'recent-tab layer-category-navigation'
      : 'layer-category-navigation');

    const recentTab = (sortKey) => (
      <NavLink onClick={() => selectCategoryType(sortKey)}>
        <FontAwesomeIcon icon={faClock} />
        Recent
      </NavLink>
    );

    const tab = (sortKey) => (
      <NavLink onClick={() => selectCategoryType(sortKey)}>
        {sortKey === 'scientific' ? 'Science Disciplines' : sortKey}
      </NavLink>
    );

    return (
      <Nav id="categories-nav" className="categories-nav">
        {CATEGORY_KEYS.map((sortKey) => (
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
  };

  const recentLayersHeader = () => (recentLayers.length && categoryType === 'recent'
    ? (
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
          size="sm"
          onClick={clearRecentLayers}
          title="Remove all layers from the recent list"
        >
          Clear List
        </Button>
      </div>
    )
    : null);

  const renderMobileDropdown = () => (
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
          {CATEGORY_KEYS.map((sortKey) => (
            <DropdownItem
              key={sortKey}
              className="categories-dropdown-item"
              onClick={() => selectCategoryType(sortKey)}
            >
              {sortKey}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
      {recentLayersHeader()}
    </div>
  );

  const isCategoryDisplay = mode === 'category'
      && selectedProjection === 'geographic'
      && categoryType !== 'recent';
  const showCategoryTabs = isCategoryDisplay
      || categoryType === 'featured'
      || categoryType === 'recent';

  return (
    showCategoryTabs
      ? (
        <>
          {
            browser.lessThan.medium ? renderMobileDropdown() : renderDesktopTabs()
          }
          {
            isCategoryDisplay
              ? (
                <div className="product-outter-list-case">
                  <CategoryGrid width={width} />
                </div>
              ) : renderContent()
            }
        </>
      )
      : renderContent()
  );
}

BrowseLayers.propTypes = {
  browser: PropTypes.object,
  categoryType: PropTypes.string,
  clearRecentLayers: PropTypes.func,
  mode: PropTypes.string,
  recentLayers: PropTypes.array,
  selectCategory: PropTypes.func,
  selectedProjection: PropTypes.string,
  toggleFeatureTab: PropTypes.func,
  toggleRecentLayersTab: PropTypes.func,
  width: PropTypes.number,
};

const mapDispatchToProps = (dispatch) => ({
  selectCategory: (key) => {
    dispatch(selectCategoryAction(key));
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
    categoryConfig: config.categories,
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
