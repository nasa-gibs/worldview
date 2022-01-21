import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withSearch } from '@elastic/react-search-ui';
import CategoryLayerRow from './category-layer-row';
import {
  hasMeasurementSource as hasSourceSelector,
} from '../../../../modules/layers/selectors';
import { getSelectedDate } from '../../../../modules/date/selectors';
import { getCategoryConfig } from '../../../../modules/product-picker/selectors';

function BrowseLayerList (props) {
  const {
    measurementConfig,
    selectedMeasurement,
    hasMeasurementSource,
    category,
  } = props;
  return (
    <div className="layer-picker-list-case layers-all">
      <div id={`${category.id}-list`}>
        {
          // eslint-disable-next-line array-callback-return
          category.measurements.map((measurement, index) => {
            const current = measurementConfig[measurement];
            const isSelected = selectedMeasurement === current.id;
            if (hasMeasurementSource(current)) {
              return (
                <CategoryLayerRow
                  key={current.id}
                  id={current.id}
                  index={index}
                  category={category}
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
  hasMeasurementSource: PropTypes.func,
  measurementConfig: PropTypes.object,
  selectedMeasurement: PropTypes.string,
};

const mapStateToProps = (state) => {
  const {
    productPicker,
    proj,
    config,
  } = state;
  const {
    category,
    selectedMeasurement,
    selectedMeasurementSourceIndex,
  } = productPicker;
  const categoryConfig = getCategoryConfig(state);

  return {
    measurementConfig: config.measurements,
    layerConfig: config.layers,
    category: category || categoryConfig.All,
    selectedProjection: proj.id,
    selectedMeasurement,
    selectedMeasurementSourceIndex,
    selectedDate: getSelectedDate(state),
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
