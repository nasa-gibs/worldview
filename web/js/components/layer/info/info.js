import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { dateOverlap } from '../../../modules/layers/util';
import DateRanges from './date-ranges';
import util from '../../../util/util';

function configureTemporalDate(dateType, date, period) {
  return util.coverageDateFormatter(dateType, date, period);
}

export default function LayerInfo ({ layer, screenHeight }) {
  const {
    dateRanges,
    endDate,
    id,
    period,
    startDate,
  } = layer;

  const [metadata, setMetadata] = useState();

  useEffect(() => {
    getSourceMetadata(layer);
  }, [layer]);

  const getSourceMetadata = async () => {
    if (layer.description) {
      const data = await util.get(`config/metadata/layers/${layer.description}.html`);
      setMetadata(data || 'No description was found for this layer.');
    }
  };

  const getDateOverlapDateRanges = () => {
    const hasLayerDateRange = dateRanges && dateRanges.length > 1;
    const overlapDateRanges = hasLayerDateRange
      ? dateOverlap(period, dateRanges)
      : [];
    return hasLayerDateRange && overlapDateRanges.overlap === false;
  };


  const needDateRanges = getDateOverlapDateRanges();

  return (
    <div id="layer-description" className="layer-description">
      {startDate || endDate ? (
        <div id="layer-date-range" className="layer-date-range">
          <span id={`${id}-startDate`} className="layer-date-start">
            {startDate
              ? `Temporal coverage: ${
                configureTemporalDate('START-DATE', startDate, period)}`
              : ''}
          </span>
          <span id={`${id}-endDate`} className="layer-date-end">
            {startDate && endDate
              ? ` - ${
                configureTemporalDate('END-DATE', endDate, period)}`
              : startDate
                ? ' - Present'
                : ''}
          </span>
          {needDateRanges
              && <DateRanges layer={layer} screenHeight={screenHeight} />}
        </div>
      )
        : ''}
      {metadata ? (
        <div
          id="layer-metadata"
          className="layer-metadata"
          dangerouslySetInnerHTML={{ __html: metadata }}
        />

      ) : (
        <div id="layer-metadata" className="layer-metadata">
          <p>Loading MetaData...</p>
        </div>
      )}
    </div>
  );
}

LayerInfo.propTypes = {
  layer: PropTypes.object,
  screenHeight: PropTypes.number,
};
