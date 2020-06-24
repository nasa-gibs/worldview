import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Nav,
  NavItem,
  NavLink,
} from 'reactstrap';
import BrowseLayerList from './browse-layers-list';
import CategoryGrid from './category-grid';
import MeasurementMetadataDetail from './measurement-metadata-detail';
import {
  selectCategory as selectCategoryAction,
  toggleFeatureTab as toggleFeatureTabAction,
  toggleRecentLayersTab as toggleRecentLayersTabAction,
} from '../../../../modules/product-picker/actions';
import RecentLayersList from './recent-layers';

/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
class BrowseLayers extends React.Component {
  constructor(props) {
    super(props);

    this.selectCategoryType = this.selectCategoryType.bind(this);
  }

  /**
   * Update category type in which to show
   * e.g. Hazards and disasters or science disciplines
   * @param {String} key | categoryType identifier
   */
  selectCategoryType(key) {
    const {
      selectCategory,
      toggleFeatureTab,
      toggleRecentLayersTab,
    } = this.props;
    if (key === 'featured') {
      toggleFeatureTab();
    } else if (key === 'recent') {
      toggleRecentLayersTab();
    } else {
      selectCategory(key);
    }
  }

  renderLayerList() {
    const { browser } = this.props;
    return (
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

  render() {
    const {
      selectedProjection,
      width,
      categoryType,
      mode,
      layerConfig,
    } = this.props;
    const isCategoryDisplay = mode === 'category'
      && selectedProjection === 'geographic'
      && categoryType !== 'recent';
    const showCategoryTabs = isCategoryDisplay
    || categoryType === 'featured'
    || categoryType === 'recent';
    const categoryKeys = [
      'hazards and disasters',
      'scientific',
      'featured',
      'recent',
    ];

    return (
      showCategoryTabs
        ? (
          <>
            <Nav id="categories-nav" className="categories-nav">
              {categoryKeys.map((sortKey) => (
                <NavItem
                  key={sortKey}
                  className="layer-category-navigation"
                  active={sortKey === categoryType}
                >
                  <NavLink onClick={() => this.selectCategoryType(sortKey)}>
                    {sortKey === 'scientific' ? 'Science Disciplines' : sortKey}
                  </NavLink>
                </NavItem>
              ))}
            </Nav>


            {// eslint-disable-next-line no-nested-ternary
            isCategoryDisplay ? (
              <div className="product-outter-list-case">
                <CategoryGrid width={width} />
              </div>
            ) : categoryType === 'recent'
              ? (
                <RecentLayersList proj={selectedProjection} layerConfig={layerConfig} />
              )
              : this.renderLayerList()
            }
          </>
        )
        : this.renderLayerList()
    );
  }
}

BrowseLayers.propTypes = {
  browser: PropTypes.object,
  categoryType: PropTypes.string,
  layerConfig: PropTypes.object,
  mode: PropTypes.string,
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
  } = productPicker;

  return {
    browser,
    mode,
    categoryType,
    categoryConfig: config.categories,
    measurementConfig: config.measurements,
    layerConfig: layers.layerConfig,
    listScrollTop,
    selectedProjection: proj.id,
    selectedMeasurement,
    selectedMeasurementSourceIndex,
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(BrowseLayers);
