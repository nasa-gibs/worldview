import React from 'react';
import PropTypes from 'prop-types';
import Category from './category';
import lodashOrderBy from 'lodash/orderBy';
import Masonry from 'react-masonry-component';

/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
class CategoryList extends React.Component {
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
      columnWidth: width >= 630 ? 310 : width - 26,
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
          <Category
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

CategoryList.propTypes = {
  categories: PropTypes.array,
  measurementConfig: PropTypes.object,
  drawMeasurements: PropTypes.func,
  hasMeasurementSource: PropTypes.func,
  categoryType: PropTypes.string,
  width: PropTypes.number
};

export default CategoryList;
