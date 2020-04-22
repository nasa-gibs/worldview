import React from 'react';
import PropTypes from 'prop-types';
import lodashOrderBy from 'lodash/orderBy';
import Masonry from 'react-masonry-component';
import CategoryCell from './category-cell';

/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
const CategoryGrid = (props) => {
  const {
    categories,
    measurementConfig,
    drawMeasurements,
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
          drawMeasurements={drawMeasurements}
          hasMeasurementSource={hasMeasurementSource}
        />
      ))}
    </Masonry>
  );
};

CategoryGrid.propTypes = {
  categories: PropTypes.array,
  categoryType: PropTypes.string,
  drawMeasurements: PropTypes.func,
  hasMeasurementSource: PropTypes.func,
  measurementConfig: PropTypes.object,
  width: PropTypes.number,
};

export default CategoryGrid;
