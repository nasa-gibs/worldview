import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { get as lodashGet } from 'lodash';
import PropTypes from 'prop-types';
import util from '../../util/util';

const granulesBaseUrl = 'https://cmr.earthdata.nasa.gov/search/granules.json';

export default function GranuleCount (props) {
  const {
    currentExtent,
    displayDate,
    showGranuleHelpModal,
    selectedLayer,
    selectedCollection,
    selectedDate,
  } = props;

  if (!selectedCollection) return null;

  const [state, setState] = useState({
    isLoading: false,
    selectedGranules: 0,
    totalGranules: 0,
    granuleDownloadSize: 0,
  });
  const {
    isLoading, totalGranules, selectedGranules, granuleDownloadSize,
  } = state;

  const requestGranules = async (url) => {
    const granulesResponse = await fetch(url, { timeout: 5000 });
    const result = await granulesResponse.json();
    return lodashGet(result, 'feed.entry', []);
  };

  const getDownloadSize = (entries) => entries.reduce(
    (prev, curr) => (
      curr.granule_size ? prev + parseFloat(curr.granule_size, 10) : 0),
    0,
  );

  /**
   * Fetch granule data for the specified selected layer/collection
   */
  const updateGranules = async () => {
    const { southWest, northEast } = currentExtent || {};
    let newTotalGranules = 0;
    let newSelectedGranules;
    let newGranuleDownloadSize = 0;
    const { dateRanges } = selectedLayer;
    const params = {
      collection_concept_id: selectedCollection.value,
      pageSize: 500,
    };
    if (dateRanges) {
      const startDate = `${selectedDate}T00:00:00.000Z`;
      const endDate = `${selectedDate}T23:59:59.999Z`;
      params.temporal = `${startDate},${endDate}`;
    }

    const granulesRequestUrl = granulesBaseUrl + util.toQueryString(params);

    if (southWest && northEast) {
      const bboxRequestUrl = `${granulesRequestUrl}&bounding_box=${southWest},${northEast}`;
      const selectedEntries = await requestGranules(bboxRequestUrl);
      newSelectedGranules = selectedEntries.length;
      newGranuleDownloadSize = getDownloadSize(selectedEntries);
    }

    const totalEntries = await requestGranules(granulesRequestUrl);
    newTotalGranules = totalEntries.length;
    if (newGranuleDownloadSize === 0) {
      newGranuleDownloadSize = getDownloadSize(totalEntries);
    }
    setState({
      isLoading: false,
      totalGranules: newTotalGranules,
      selectedGranules: newSelectedGranules,
      granuleDownloadSize: newGranuleDownloadSize,
    });
  };

  /** Trigger granule request when extent, collection, or date changes */
  useEffect(() => {
    setState({
      isLoading: true,
      totalGranules: 0,
      selectedGranules: false,
    });
    updateGranules();
  }, [currentExtent, selectedCollection, selectedDate]);

  const granulesExist = !isLoading && totalGranules !== 0;

  const renderLoading = () => (
    <span className="loading-granule-count" />
  );

  const renderDownloadSize = () => {
    const printSize = (s) => {
      const precision = s > 9 ? 0 : 2;
      const wholeNum = Number(s).toFixed(precision);
      return Number(wholeNum).toLocaleString();
    };
    let sizeText;
    if (granuleDownloadSize > 1000) {
      sizeText = `${printSize(granuleDownloadSize / 1000)} GB`;
    } else {
      sizeText = `${printSize(granuleDownloadSize)} MB`;
    }
    return (
      <>
        { granulesExist && (
          <span className="granule-size fade-in">{`(${sizeText})`}</span>
        )}
        <span className="help-link" onClick={showGranuleHelpModal}>
          <FontAwesomeIcon icon="question-circle" />
        </span>
      </>
    );
  };

  return (
    <div className="granule-count">
      <div className="granule-count-header">
        Available granules for
        {` ${displayDate}: `}
      </div>

      <div className="granule-count-info">

        {!isLoading && (
          <>
            <span className="fade-in">
              {currentExtent && granulesExist && selectedGranules >= 0 && `${selectedGranules} of `}
              {granulesExist ? totalGranules : 'NONE'}
            </span>
          </>
        )}

        {!isLoading ? renderDownloadSize() : renderLoading()}

      </div>
    </div>
  );
}

GranuleCount.propTypes = {
  currentExtent: PropTypes.object,
  displayDate: PropTypes.string,
  selectedLayer: PropTypes.object,
  selectedDate: PropTypes.string,
  selectedCollection: PropTypes.object,
  showGranuleHelpModal: PropTypes.func,
};
