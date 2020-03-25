import React from 'react';
import PropTypes from 'prop-types';
import { dateOverlap } from '../../../modules/layers/util';
import DateRanges from './date-ranges';
import util from '../../../util/util';
import Scrollbars from '../../util/scrollbar';

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

  configureTemporalDate(dateType, date, period) {
    return util.coverageDateFormatter(dateType, date, period);
  }

  render() {
    const { layer, screenHeight } = this.props;
    const { metaData } = this.state;
    const layerId = layer.id;
    const hasLayerDateRange = layer.dateRanges && layer.dateRanges.length > 1;
    const dateRanges = hasLayerDateRange
      ? dateOverlap(layer.period, layer.dateRanges)
      : [];
    return (
      <div id="layer-description" className="layer-description">
        {layer.startDate || layer.endDate ? (
          <div id="layer-date-range" className="layer-date-range">
            <span id={`${layerId}-startDate`} className="layer-date-start">
              {layer.startDate
                ? `Temporal coverage: ${
                  this.configureTemporalDate('START-DATE', layer.startDate, layer.period)}`
                : ''}
            </span>
            <span id={`${layerId}-endDate`} className="layer-date-end">
              {layer.startDate && layer.endDate
                ? ` - ${
                  this.configureTemporalDate('END-DATE', layer.endDate, layer.period)}`
                : layer.startDate
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
