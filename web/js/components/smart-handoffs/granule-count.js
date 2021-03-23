import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { get as lodashGet } from 'lodash';
import PropTypes from 'prop-types';
import util from '../../util/util';

export default function GranuleCount (props) {
  const {
    currentExtent,
    displayDate,
    showGranuleHelpModal,
    selectedLayer,
    selectedCollection,
    selectedDate,
    showBoundingBox,
  } = props;

  const [isLoading, setLoading] = useState(false);
  const [selectedGranules, setSelectedGranules] = useState(0);
  const [totalGranules, setTotalGranules] = useState(0);

  const updateGranules = async () => {
    const { southWest, northEast } = currentExtent;
    if (!selectedLayer) return;

    const { dateRanges } = selectedLayer;
    const params = {
      include_granule_counts: true,
      concept_id: selectedCollection.value,
    };

    if (dateRanges) {
      const startDate = `${selectedDate}T00:00:00.000Z`;
      const endDate = `${selectedDate}T23:59:59.999Z`;
      params.temporal = `${startDate},${endDate}`;
    }

    let granuleRequestUrl = `https://cmr.earthdata.nasa.gov/search/collections.json${util.toQueryString(params)}`;

    if (!totalGranules) {
      // Gets the total amount of granules that the layer has
      const totalGranuleResponse = await fetch(granuleRequestUrl, { timeout: 5000 });
      const totalResult = await totalGranuleResponse.json();
      const newTotalGranules = lodashGet(totalResult, 'feed.entry[0].granule_count', 0);
      setTotalGranules(newTotalGranules);
    }

    // Gets the total subset of granules that are within the defining bounding box
    if (showBoundingBox && southWest && northEast) {
      granuleRequestUrl += `&bounding_box=${southWest},${northEast}`;
      const selectedGranulesResponse = await fetch(granuleRequestUrl, { timeout: 5000 });
      const selectedResult = await selectedGranulesResponse.json();
      const newSelectedGranules = lodashGet(selectedResult, 'feed.entry[0].granule_count', 0);
      setSelectedGranules(newSelectedGranules);
    }
    setLoading(false);
  };

  /**
   * Fetch granule data for the specified selected layer/collection
   */
  useEffect(() => {
    setTotalGranules(0);
    setLoading(true);
    updateGranules();
  }, [currentExtent, selectedCollection, displayDate]);

  return !selectedCollection ? null : (
    <div className="granule-count">
      <h1>
        Available granules for
        {` ${displayDate}: `}

        { !isLoading && totalGranules === 0 && (
        <span className="fade-in constant-width">NONE</span>
        )}

        { !isLoading && totalGranules !== 0 && (
        <span className="fade-in constant-width">
          {showBoundingBox && `${selectedGranules} of `}
          {totalGranules}
        </span>
        )}

        { isLoading && (
        <span className="loading-granule-count fade-in constant-width" />
        )}
        <span className="help-link" onClick={showGranuleHelpModal}>
          <FontAwesomeIcon icon="question-circle" />
        </span>
      </h1>
    </div>
  );
}

GranuleCount.propTypes = {
  currentExtent: PropTypes.object,
  displayDate: PropTypes.string,
  selectedLayer: PropTypes.object,
  selectedDate: PropTypes.string,
  selectedCollection: PropTypes.object,
  showBoundingBox: PropTypes.bool,
  showGranuleHelpModal: PropTypes.func,
};
