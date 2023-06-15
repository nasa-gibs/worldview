import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { dateOverlap } from '../../../modules/layers/util';
import DateRanges from './date-ranges';
import { coverageDateFormatter } from '../../../modules/date/util';

export default function LayerInfo ({ layer, measurementDescriptionPath }) {
  const {
    dateRanges,
    endDate,
    id,
    period,
    startDate,
  } = layer;

  const [layerMetadata, setLayerMetadata] = useState();
  const [measurementMetadata, setMeasurementMetadata] = useState();

  const fetchMetadata = (path, setFn) => () => {
    let controller = new AbortController();
    (async () => {
      if (!path) {
        setFn('');
        return;
      }
      try {
        const options = { signal: controller.signal };
        const data = await fetch(`config/metadata/layers/${path}.html`, options);
        const metadataHtml = await data.text();
        controller = null;
        setFn(metadataHtml || 'No description was found for this layer.');
      } catch (e) {
        if (!controller.signal.aborted) {
          // eslint-disable-next-line no-console
          console.error(e);
        }
      }
    })();
    return () => (controller ? controller.abort() : null);
  };

  useEffect(fetchMetadata(measurementDescriptionPath, setMeasurementMetadata), [layer]);
  useEffect(fetchMetadata(layer.description, setLayerMetadata), [layer]);

  const getDateOverlapDateRanges = () => {
    const hasLayerDateRange = dateRanges && dateRanges.length > 1;
    const overlapDateRanges = hasLayerDateRange
      ? dateOverlap(period, dateRanges)
      : [];
    return hasLayerDateRange && overlapDateRanges.overlap === false;
  };

  const needDateRanges = getDateOverlapDateRanges();
  const isRange = startDate && endDate;
  const FormattedStartDate = () => coverageDateFormatter('START-DATE', startDate, period);
  const FormattedEndDate = () => coverageDateFormatter('END-DATE', endDate, period);

  return (
    <div id="layer-description" className="layer-description">
      {(startDate || endDate) && (
        <div id="layer-date-range" className="layer-date-range">
          <span id={`${id}-startDate`} className="layer-date-start">
            {startDate && (
              <>
                Temporal Coverage:
                {' '}
                <FormattedStartDate />
              </>
            )}
          </span>
          <span id={`${id}-endDate`} className="layer-date-end">
            {isRange ? (
              <>
                -
                <FormattedEndDate />
              </>
            ) : startDate && ' - Present'}
          </span>
          {needDateRanges && <DateRanges layer={layer} />}
        </div>
      )}
      {layerMetadata ? (
        <div
          id="layer-metadata"
          className="layer-metadata"
          dangerouslySetInnerHTML={{ __html: layerMetadata }}
        />
      ) : (
        <div id="layer-metadata" className="layer-metadata">
          <p>Loading Layer Description...</p>
        </div>
      )}

      {measurementMetadata && (
        <div
          className="source-metadata"
          dangerouslySetInnerHTML={{ __html: measurementMetadata }}
        />
      )}
    </div>
  );
}

LayerInfo.propTypes = {
  layer: PropTypes.object,
  measurementDescriptionPath: PropTypes.string,
};
