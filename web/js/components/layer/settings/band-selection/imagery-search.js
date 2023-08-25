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

export default function ImagerySearch({ layer }) {
  const dispatch = useDispatch();
  const selectDate = (date) => { dispatch(selectDateAction(date)); };
  const selectedDate = useSelector((state) => state.date.selected);
  const map = useSelector((state) => state.map);
  const [granulesStatus, setGranulesStatus] = useState(undefined);
  const [granuleDates, setGranuleDates] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = () => setDropdownOpen(!dropdownOpen);

  const parseGranuleTimestamp = (granule) => new Date(granule.time_start).toDateString();

  const searchForImagery = async (layer) => {
    setGranulesStatus('loading');
    const olderResponse = await fetch(`https://cmr.earthdata.nasa.gov/search/granules.json?collection_concept_id=${layer.collection_concept_id}&bounding_box=${map.extent.join(',')}&temporal=,${selectedDate.toISOString()}&sort_key=-start_date&pageSize=20`);
    const olderGranules = await olderResponse.json();
    const newerResponse = await fetch(`https://cmr.earthdata.nasa.gov/search/granules.json?collection_concept_id=${layer.collection_concept_id}&bounding_box=${map.extent.join(',')}&temporal=${selectedDate.toISOString()},&sort_key=-start_date&pageSize=20`);
    const newerGranules = await newerResponse.json();
    setGranulesStatus('loaded');
    const olderDates = olderGranules.feed.entry.map(parseGranuleTimestamp);
    const newerDates = newerGranules.feed.entry.map(parseGranuleTimestamp);
    const dates = [...new Set([...olderDates, ...newerDates])];
    setGranuleDates(dates);
  };

  const handleSelection = (date) => {
    selectDate(new Date(date));
    setDropdownOpen(false);
  };

  return (
    <div className="imagery-search-container">
      <div className="customize-bands-button-container">
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
            <Dropdown isOpen={dropdownOpen} toggle={toggle} size="sm">
              <DropdownToggle style={{ backgroundColor: '#d54e21' }} caret>
                Select Date
              </DropdownToggle>
              <DropdownMenu style={{ transform: 'translate3d(-30px, 0px, 0px)' }}>
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
