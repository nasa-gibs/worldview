import React, { useState, useEffect, useRef } from 'react';
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
  const listRef = useRef(null);
  const startRef = useRef(null);
  const endRef = useRef(null);
  const dispatch = useDispatch();
  const selectDate = (date) => { dispatch(selectDateAction(date)); };
  const selectedDate = useSelector((state) => state.date.selected);
  const map = useSelector((state) => state.map);
  const [granulesStartStatus, setGranulesStartStatus] = useState(undefined);
  const [granulesEndStatus, setGranulesEndStatus] = useState(undefined);
  const [olderGranuleDates, setOlderGranuleDates] = useState([]);
  const [newerGranuleDates, setNewerGranuleDates] = useState([]);

  const getOlderGranules = async (layer, refDate = selectedDate, page = 1) => {
    console.log(page);
    const olderResponse = await fetch(`https://cmr.earthdata.nasa.gov/search/granules.json?collection_concept_id=${layer.collection_concept_id}&bounding_box=${map.extent.join(',')}&temporal=,${refDate.toISOString()}&sort_key=-start_date&pageSize=25&page_num=${page}`);
    const olderGranules = await olderResponse.json();
    const olderDates = olderGranules.feed.entry.map(parseGranuleTimestamp);

    return olderDates;
  };

  const getNewerGranules = async (layer, refDate = selectedDate, page = 25) => {
    console.log(page);
    const newerResponse = await fetch(`https://cmr.earthdata.nasa.gov/search/granules.json?collection_concept_id=${layer.collection_concept_id}&bounding_box=${map.extent.join(',')}&temporal=${refDate.toISOString()},&sort_key=start_date&pageSize=25&page_num=${page}`);
    const newerGranules = await newerResponse.json();
    const newerDates = newerGranules.feed.entry.map(parseGranuleTimestamp);

    return newerDates;
  };

  const loadNewerDates = async (layer, page = 1) => {
    setGranulesStartStatus('loading');
    const newerDates = await getNewerGranules(layer, newerGranuleDates[0], page);
    const dates = [...newerGranuleDates, ...newerDates].sort((a, b) => Date.parse(b) - Date.parse(a));
    setNewerGranuleDates(dates);
    setGranulesStartStatus('loaded');
  };

  const loadOlderDates = async (layer, page = 1) => {
    setGranulesEndStatus('loading');
    const olderDates = await getOlderGranules(layer, olderGranuleDates.at(-1), page);
    const dates = [...olderGranuleDates, ...olderDates].sort((a, b) => Date.parse(b) - Date.parse(a));
    setOlderGranuleDates(dates);
    setGranulesEndStatus('loaded');
  };

  const handleSelection = (date) => {
    selectDate(new Date(date));
  };

  useEffect(async () => {
    // await loadOlderDates(layer);
    // await loadNewerDates(layer);
    let i = 0;
    while (listRef.current.scrollHeight <= listRef.current.clientHeight) {
      console.log(listRef.current.scrollHeight, listRef.current.clientHeight);
      i++;
      loadOlderDates(layer, i);
      await loadNewerDates(layer, i);
    }
    console.log(listRef.current.scrollHeight, listRef.current.clientHeight);
    listRef.current.scrollTop = listRef.current.scrollHeight / 2;
  }, []);
  
  const renderDates = () => {
    const granuleDates = [...olderGranuleDates, ...newerGranuleDates].sort((a, b) => Date.parse(b) - Date.parse(a));
    const renderedDates = [...new Set(granuleDates.map((date) => date.toLocaleDateString('en-US', dateOptions)))].map((date, i) => (
      <li className="lazyload-list-item" key={date} onClick={() => handleSelection(date)}>
        {date}
      </li>
    ));
    return renderedDates;
  };

  const handleScroll = (e) => {
    const { scrollTop } = e.target;
    const position = e.target.scrollHeight - e.target.clientHeight;
    const scrollPercentage = scrollTop / position;

    if (scrollPercentage <= 0.1) {
      loadNewerDates(layer);
    }

    if (scrollPercentage >= 0.9) {
      loadOlderDates(layer);
    }
  };

  return (
    <div className="imagery-search-container">
      <p>Imagery Dates</p>
      <ul ref={listRef} className="lazyload-list" onScroll={handleScroll}>
        <div ref={startRef} className="imagery-search-spinner">
          {granulesStartStatus === 'loading' && <Spinner size="sm">Loading...</Spinner>}
        </div>
        {renderDates()}
        <div ref={endRef} className="imagery-search-spinner">
          {granulesEndStatus === 'loading' && <Spinner size="sm">Loading...</Spinner>}
        </div>
      </ul>
    </div>
  );
}
