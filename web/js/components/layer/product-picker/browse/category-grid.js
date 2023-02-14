import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import lodashOrderBy from 'lodash/orderBy';
import Masonry from 'react-masonry-component';
import CategoryCell from './category-cell';
import {
  showMeasurements as showMeasurementsAction,
} from '../../../../modules/product-picker/actions';
import { getCategoryConfig } from '../../../../modules/product-picker/selectors';
import {
  hasMeasurementSource as hasSourceSelector,
} from '../../../../modules/layers/selectors';

/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
function CategoryGrid(props) {
  const {
    categories,
    measurementConfig,
    showMeasurements,
    hasMeasurementSource,
    categoryType,
    width,
  } = props;
  const masonryOptions = {
    transitionDuration: '0.6s',
    columnWidth: width >= 630 ? 310 : width - 26,
    gutter: 10,
  };
  categories.forEach((item) => {
    item.sortOrder = item.placement === 'first' ? 1 : item.placement === 'last' ? 3 : 2;
  });
  const orderedCategories = lodashOrderBy(
    categories,
    ['sortOrder', 'title'],
    ['asc'],
  );
  return (
    <Masonry className="category-masonry-case" options={masonryOptions}>
      {orderedCategories.map((category) => (
        <CategoryCell
          key={category.id}
          category={category}
          categoryType={categoryType}
          measurementConfig={measurementConfig}
          drawMeasurements={showMeasurements}
          hasMeasurementSource={hasMeasurementSource}
        />
      ))}
    </Masonry>
  );
}
const mapDispatchToProps = (dispatch) => ({
  showMeasurements: (category, selectedMeasurement) => {
    dispatch(showMeasurementsAction({ category, selectedMeasurement }));
  },
});

function mapStateToProps(state) {
  const {
    proj,
    config,
    productPicker,
  } = state;
  const {
    category,
    categoryType,
    selectedMeasurement,
    selectedMeasurementSourceIndex,
  } = productPicker;
  const categoryConfig = getCategoryConfig(state);

  return {
    categories: Object.values(categoryConfig),
    categoryType,
    category,
    measurementConfig: config.measurements,
    selectedMeasurement,
    selectedMeasurementSourceIndex,
    hasMeasurementSource: (current) => hasSourceSelector(current, config, proj.id),
  };
}

CategoryGrid.propTypes = {
  categories: PropTypes.array,
  categoryType: PropTypes.string,
  showMeasurements: PropTypes.func,
  hasMeasurementSource: PropTypes.func,
  measurementConfig: PropTypes.object,
  width: PropTypes.number,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CategoryGrid);
