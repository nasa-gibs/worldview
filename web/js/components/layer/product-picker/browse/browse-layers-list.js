import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withSearch } from '@elastic/react-search-ui';
import InfiniteScroll from 'react-infinite-scroller';
import CategoryLayerRow from './category-layer-row';
import {
  hasMeasurementSource as hasSourceSelector,
} from '../../../../modules/layers/selectors';

function BrowseLayerList (props) {
  const {
    measurementConfig,
    selectedMeasurement,
    hasMeasurementSource,
    category,
    categoryConfig,
  } = props;
  const categoryToUse = category || categoryConfig.All;
  return (
    <div className="layer-picker-list-case layers-all">
      <div id={`${categoryToUse.id}-list`}>
        {
          // eslint-disable-next-line array-callback-return
          categoryToUse.measurements.map((measurement, index) => {
            const current = measurementConfig[measurement];
            const isSelected = selectedMeasurement === current.id;
            if (hasMeasurementSource(current)) {
              return (
                <CategoryLayerRow
                  key={current.id}
                  id={current.id}
                  index={index}
                  category={categoryToUse}
                  measurement={current}
                  isSelected={isSelected}
                />
              );
            }
          })
        }
      </div>
    </div>
  );
}

BrowseLayerList.propTypes = {
  category: PropTypes.object,
  categoryConfig: PropTypes.object,
  hasMeasurementSource: PropTypes.func,
  measurementConfig: PropTypes.object,
  selectedMeasurement: PropTypes.string,
};

const mapStateToProps = (state, ownProps) => {
  const {
    date,
    productPicker,
    proj,
    config,
  } = state;
  const {
    category,
    categoryType,
    selectedMeasurement,
    selectedMeasurementSourceIndex,
  } = productPicker;
  return {
    categoryConfig: config.categories[categoryType],
    measurementConfig: config.measurements,
    layerConfig: config.layers,
    category,
    selectedProjection: proj.id,
    selectedMeasurement,
    selectedMeasurementSourceIndex,
    selectedDate: date.selected,
    hasMeasurementSource: (current) => hasSourceSelector(current, config, proj.id),
  };
};

const mapDispatchToProps = (dispatch) => ({
});

export default withSearch(
  ({ results }) => ({ results }),
)(connect(
  mapStateToProps,
  mapDispatchToProps,
)(BrowseLayerList));
