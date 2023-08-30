import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Button,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Spinner,
} from 'reactstrap';
import { selectDate as selectDateAction } from '../../../../modules/date/actions';

const dateOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};
const parseGranuleTimestamp = (granule) => new Date(granule.time_start).toLocaleDateString('en-US', dateOptions);

export default function ImagerySearch({ layer }) {
  const dispatch = useDispatch();
  const selectDate = (date) => { dispatch(selectDateAction(date)); };
  const selectedDate = useSelector((state) => state.date.selected);
  const map = useSelector((state) => state.map);
  const [granulesStatus, setGranulesStatus] = useState(undefined);
  const [granuleDates, setGranuleDates] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [lastSelectedDate, setLastSelectedDate] = useState(undefined);
  const toggle = () => setDropdownOpen(!dropdownOpen);

  const searchForImagery = async (layer) => {
    setGranulesStatus('loading');
    const olderResponse = await fetch(`https://cmr.earthdata.nasa.gov/search/granules.json?collection_concept_id=${layer.collection_concept_id}&bounding_box=${map.extent.join(',')}&temporal=,${selectedDate.toISOString()}&sort_key=-start_date&pageSize=25`);
    const olderGranules = await olderResponse.json();
    const newerResponse = await fetch(`https://cmr.earthdata.nasa.gov/search/granules.json?collection_concept_id=${layer.collection_concept_id}&bounding_box=${map.extent.join(',')}&temporal=${selectedDate.toISOString()},&sort_key=start_date&pageSize=25`);
    const newerGranules = await newerResponse.json();
    setGranulesStatus('loaded');
    const olderDates = olderGranules.feed.entry.map(parseGranuleTimestamp);
    const newerDates = newerGranules.feed.entry.map(parseGranuleTimestamp);
    const dates = [...new Set([...olderDates, ...newerDates])].sort((a, b) => Date.parse(b) - Date.parse(a));
    setGranuleDates(dates);
    setLastSelectedDate(undefined);
  };

  const handleSelection = (date) => {
    selectDate(new Date(date));
    setDropdownOpen(false);
    setLastSelectedDate(date);
  };

  return (
    <div className="imagery-search-container">
      <div style={{ paddingBottom: '3px' }}>
        <Button
          id="search-for-imagery"
          aria-label="Search for Imagery"
          className="wv-button red"
          onClick={() => searchForImagery(layer)}
        >
          <span className="button-text">
            Search for Imagery
          </span>
        </Button>
      </div>
      {
        granulesStatus === 'loaded'
          ? (
            <Dropdown className="wv-button red" isOpen={dropdownOpen} toggle={toggle}>
              <DropdownToggle style={{ backgroundColor: '#d54e21' }} caret>
                {lastSelectedDate || 'Select Date'}
              </DropdownToggle>
              <DropdownMenu style={{ fontFamily: 'monospace', transform: 'translate3d(-30px, 0px, 0px)' }}>
                {granuleDates.map((date) => (
                  <DropdownItem key={date} onClick={() => handleSelection(date)}>
                    {date}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          )
          : granulesStatus && <Spinner>Loading...</Spinner>
      }
    </div>
  );
}
