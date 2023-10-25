import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Spinner,
} from 'reactstrap';
import { selectDate as selectDateAction } from '../../../../modules/date/actions';

import './style.css';

const dateOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};
const parseGranuleTimestamp = (granule) => new Date(granule.time_start);

export default function ImagerySearch({ layer }) {
  const dispatch = useDispatch();
  const selectDate = (date) => { dispatch(selectDateAction(date)); };
  const selectedDate = useSelector((state) => state.date.selected);
  const map = useSelector((state) => state.map);
  const [granulesStatus, setGranulesStatus] = useState(undefined);
  const [granuleDates, setGranuleDates] = useState([]);

  const getOlderGranules = async (layer, refDate = selectedDate) => {
    const olderResponse = await fetch(`https://cmr.earthdata.nasa.gov/search/granules.json?collection_concept_id=${layer.collection_concept_id}&bounding_box=${map.extent.join(',')}&temporal=,${refDate.toISOString()}&sort_key=-start_date&pageSize=50`);
    const olderGranules = await olderResponse.json();
    const olderDates = olderGranules.feed.entry.map(parseGranuleTimestamp);

    return olderDates;
  };

  const getNewerGranules = async (layer, refDate = selectedDate) => {
    const newerResponse = await fetch(`https://cmr.earthdata.nasa.gov/search/granules.json?collection_concept_id=${layer.collection_concept_id}&bounding_box=${map.extent.join(',')}&temporal=${refDate.toISOString()},&sort_key=start_date&pageSize=50`);
    const newerGranules = await newerResponse.json();
    const newerDates = newerGranules.feed.entry.map(parseGranuleTimestamp);

    return newerDates;
  };

  const loadNewerDates = async (layer) => {
    setGranulesStatus('loading');
    const newerDates = await getNewerGranules(layer, granuleDates[0]);
    const dates = [...granuleDates, ...newerDates].sort((a, b) => Date.parse(b) - Date.parse(a));
    setGranuleDates(dates);
    setGranulesStatus('loaded');
  };

  const loadOlderDates = async (layer) => {
    setGranulesStatus('loading');
    const newerDates = await getOlderGranules(layer, granuleDates.at(-1));
    const dates = [...granuleDates, ...newerDates].sort((a, b) => Date.parse(b) - Date.parse(a));
    setGranuleDates(dates);
    setGranulesStatus('loaded');
  };

  const handleSelection = (date) => {
    selectDate(new Date(date));
  };

  useEffect(async () => {
    await loadOlderDates(layer);
    await loadNewerDates(layer);
  }, []);

  const handleScroll = async (e) => {
    const { scrollTop } = e.target;
    const position = e.target.scrollHeight - e.target.clientHeight;
    const scrollPercentage = scrollTop / position;

    if (scrollPercentage === 0) {
      loadNewerDates(layer);
    }

    if (scrollPercentage === 1) {
      loadOlderDates(layer);
    }
  };

  return (
    <div className="imagery-search-container">
      <p>Imagery Dates</p>
      {granulesStatus === 'loading' && <Spinner>Loading...</Spinner>}
      <ul className="lazyload-list" onScroll={handleScroll}>
        {[...new Set(granuleDates.map((date) => date.toLocaleDateString('en-US', dateOptions)))].map((date, i) => (
          <li className="lazyload-list-item" key={date} onClick={() => handleSelection(date)}>
            {date}
          </li>
        ))}
      </ul>
    </div>
  );
}
