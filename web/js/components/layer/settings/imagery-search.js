import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Spinner,
} from 'reactstrap';
import { selectDate as selectDateAction } from '../../../modules/date/actions';

const dateOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};
const parseGranuleTimestamp = (granule) => new Date(granule.time_start);
const maxExtent = [-180, -90, 180, 90];
const headers = { 'Client-Id': 'Worldview' };

export default function ImagerySearch({ layer }) {
  const listRef = useRef(null);
  const startRef = useRef(null);
  const endRef = useRef(null);
  const dispatch = useDispatch();
  const selectDate = (date) => { dispatch(selectDateAction(date)); };
  const date = useSelector((state) => state.date);
  const compare = useSelector((state) => state.compare);
  const map = useSelector((state) => state.map);
  const [granulesStartStatus, setGranulesStartStatus] = useState(undefined);
  const [granulesEndStatus, setGranulesEndStatus] = useState(undefined);
  const [olderGranuleDates, setOlderGranuleDates] = useState([]);
  const [newerGranuleDates, setNewerGranuleDates] = useState([]);
  const [page, setPage] = useState(1);

  let selectedDate = date.selected;

  if (compare.active && !compare.isCompareA) {
    selectedDate = date.selectedB;
  }

  const conceptID = layer?.conceptIds?.[0]?.value || layer?.collectionConceptID;

  const getSmallerExtent = () => {
    // clamp extent to maximum extent allowed by the CMR api
    const extent = map.extent.map((coord, i) => {
      const condition = i <= 1 ? coord > maxExtent[i] : coord < maxExtent[i];
      if (condition) {
        return coord;
      }
      return maxExtent[i];
    });
    const xDiff = Math.abs(extent[0] - extent[2]);
    const yDiff = Math.abs(extent[1] - extent[3]);
    // Reduce width by 40% and height by 20%, to show only centered data
    const smallerExtent = [
      extent[0] + (xDiff * 0.2),
      extent[1] + (yDiff * 0.1),
      extent[2] - (xDiff * 0.2),
      extent[3] - (yDiff * 0.1),
    ];
    return smallerExtent;
  };

  const getOlderGranules = async (layer, refDate = selectedDate, pageNum = 1) => {
    const smallerExtent = getSmallerExtent();
    try {
      const olderUrl = `https://cmr.earthdata.nasa.gov/search/granules.json?collection_concept_id=${conceptID}&bounding_box=${smallerExtent.join(',')}&temporal=,${refDate.toISOString()}&sort_key=-start_date&pageSize=25&page_num=${pageNum}`;
      const olderResponse = await fetch(olderUrl, { headers });
      const olderGranules = await olderResponse.json();
      const olderDates = olderGranules.feed.entry.map(parseGranuleTimestamp);

      return olderDates;
    } catch (e) {
      return [];
    }
  };

  const getNewerGranules = async (layer, refDate = selectedDate, pageNum = 1) => {
    const smallerExtent = getSmallerExtent();
    try {
      const newerUrl = `https://cmr.earthdata.nasa.gov/search/granules.json?collection_concept_id=${conceptID}&bounding_box=${smallerExtent.join(',')}&temporal=${refDate.toISOString()},&sort_key=start_date&pageSize=25&page_num=${pageNum}`;
      const newerResponse = await fetch(newerUrl, { headers });
      const newerGranules = await newerResponse.json();
      const newerDates = newerGranules.feed.entry.map(parseGranuleTimestamp);

      return newerDates;
    } catch (e) {
      return [];
    }
  };

  const loadNewerDates = async (layer, pageNum = 1) => {
    setGranulesStartStatus('loading');
    const newerDates = await getNewerGranules(layer, newerGranuleDates[0], pageNum);
    const dates = [...newerGranuleDates, ...newerDates].sort((a, b) => Date.parse(b) - Date.parse(a));
    setNewerGranuleDates(dates);
    setGranulesStartStatus('loaded');
  };

  const loadOlderDates = async (layer, pageNum = 1) => {
    setGranulesEndStatus('loading');
    const olderDates = await getOlderGranules(layer, olderGranuleDates.at(-1), pageNum);
    const dates = [...olderGranuleDates, ...olderDates].sort((a, b) => Date.parse(b) - Date.parse(a));
    setOlderGranuleDates(dates);
    setGranulesEndStatus('loaded');
  };

  const handleSelection = (date) => {
    selectDate(new Date(date));
  };

  useEffect(() => {
    const asyncFunc = async () => {
      if (listRef.current.scrollHeight <= listRef.current.clientHeight) {
        await Promise.allSettled([loadOlderDates(layer, page), loadNewerDates(layer, page)]);
        setPage(page + 1);
      } else {
        listRef.current.scrollTop = listRef.current.scrollHeight / 2;
      }
    };
    asyncFunc();
  }, [page]);

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
      <p className="lazyload-title">Available Imagery Dates</p>
      <ul ref={listRef} className="lazyload-list" onScroll={handleScroll}>
        <li ref={startRef} className="imagery-search-spinner">
          {granulesStartStatus === 'loading' && <Spinner size="sm">Loading...</Spinner>}
        </li>
        {renderDates()}
        <li ref={endRef} className="imagery-search-spinner">
          {granulesEndStatus === 'loading' && <Spinner size="sm">Loading...</Spinner>}
        </li>
      </ul>
      <hr />
    </div>
  );
}
