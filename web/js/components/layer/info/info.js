import React from 'react';
import PropTypes from 'prop-types';
import { dateOverlap } from '../../../modules/layers/util';
import { getFutureLayerEndDate, isFutureLayer } from '../../../modules/layers/selectors';
import DateRanges from './date-ranges';
import util from '../../../util/util';
import Scrollbars from '../../util/scrollbar';

function configureTemporalDate(dateType, date, period) {
  return util.coverageDateFormatter(dateType, date, period);
}

class LayerInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      metaData: null,
    };
    this.getSourceMetadata(props.layer);
  }

  getSourceMetadata(layer) {
    if (layer.description) {
      util
        .get(`config/metadata/layers/${layer.description}.html`)
        .then((data) => {
          if (!data) {
            data = 'There is no description provided for this layer.';
          }
          this.setState({ metaData: data });
        })
        .catch((error) => {
          console.warn(error);
          this.setState({
            metaData: 'There was an error loading metadata for this layer.',
          });
        });
    }
  }


  render() {
    const { layer, screenHeight } = this.props;
    const { metaData } = this.state;
    const {
      dateRanges,
      endDate,
      id,
      period,
      startDate,
    } = layer;
    const hasLayerDateRange = dateRanges && dateRanges.length > 1
      ? dateOverlap(period, dateRanges)
      : [];

    const layerStartDate = startDate;
    let layerEndDate = endDate;
    if (isFutureLayer(layer)) {
      const futureDate = getFutureLayerEndDate(layer);
      layerEndDate = futureDate ? futureDate.toISOString() : endDate;
    }
    return (
      <div id="layer-description" className="layer-description">
        {layerStartDate || layerEndDate ? (
          <div id="layer-date-range" className="layer-date-range">
            <span id={`${id}-startDate`} className="layer-date-start">
              {layerStartDate
                ? `Temporal coverage: ${
                  configureTemporalDate('START-DATE', layerStartDate, period)}`
                : ''}
            </span>
            <span id={`${id}-endDate`} className="layer-date-end">
              {layerStartDate && layerEndDate
                ? ` - ${
                  configureTemporalDate('END-DATE', layerEndDate, period)}`
                : layerStartDate
                  ? ' - Present'
                  : ''}
            </span>

            {hasLayerDateRange && dateRanges.overlap === false ? (
              <DateRanges layer={layer} dateRanges={dateRanges} screenHeight={screenHeight} />
            )
              : ''}
          </div>
        )
          : ''}
        {metaData ? (
          <Scrollbars style={{ maxHeight: `${screenHeight - 200}px` }}>
            <div
              id="layer-metadata"
              className="layer-metadata"
              dangerouslySetInnerHTML={{ __html: metaData }}
            />
          </Scrollbars>

        ) : (
          <div id="layer-metadata" className="layer-metadata">
            <p>Loading MetaData...</p>
          </div>
        )}
      </div>
    );
  }
}
export default LayerInfo;

LayerInfo.propTypes = {
  layer: PropTypes.object,
  screenHeight: PropTypes.number,
};
