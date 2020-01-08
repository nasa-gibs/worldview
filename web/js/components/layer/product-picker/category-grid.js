import React from 'react';
import PropTypes from 'prop-types';
import CategoryCell from './category-cell';
import lodashOrderBy from 'lodash/orderBy';
import Masonry from 'react-masonry-component';

/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
class CategoryGrid extends React.Component {
  render() {
    const {
      categories,
      measurementConfig,
      drawMeasurements,
      hasMeasurementSource,
      categoryType,
      width
    } = this.props;
    const masonryOptions = {
      transitionDuration: '0.6s',
      columnWidth: 310,
      gutter: 10
    };
    categories.map(item => {
      item.sortOrder =
        item.placement === 'first' ? 1 : item.placement === 'last' ? 3 : 2;
    });
    const orderedCategories = lodashOrderBy(
      categories,
      ['sortOrder', 'title'],
      ['asc']
    );
    return (
      <Masonry className="category-masonry-case" options={masonryOptions}>
        {orderedCategories.map(category => (
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
  }
}

CategoryGrid.propTypes = {
  categories: PropTypes.array,
  categoryType: PropTypes.string,
  drawMeasurements: PropTypes.func,
  hasMeasurementSource: PropTypes.func,
  measurementConfig: PropTypes.object,
  width: PropTypes.number
};

export default CategoryGrid;
