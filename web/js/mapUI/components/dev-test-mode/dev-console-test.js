import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, UncontrolledTooltip } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getSelectedDate } from '../../../modules/date/selectors';

function ConsoleTest () {
  // eslint-disable-next-line no-unused-vars
  const dispatch = useDispatch();
  const map = useSelector((state) => state.map.ui.selected );
  const layers = useSelector((state) => state.layers.active.layers );
  const selectedDate = useSelector((state) => getSelectedDate(state));

  const urlString =  'https://gibs-b.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi?TIME=2023-11-13T00:00:00Z&layer=MODIS_Combined_L4_LAI_4Day&style=default&tilematrixset=500m&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=0&TileCol=0&TileRow=0'

  const wmtsRequest = async (layer, date) => {

  }


  const consoleResponse = async () => {
    const layer = layers[0];
    console.log(selectedDate)
  };


  return (
    <div className="d-flex flex-column justify-content-center align-items-center w-100 mt-3">
      <div className="d-flex flex-row justify-content-center align-items-center">
        <h5 className="h5 fw-bold d-inline-block me-1">Console Test Mode</h5>
        <span><FontAwesomeIcon id="console-test-info-icon" icon="info-circle" className="pb-2" /></span>
        <UncontrolledTooltip
          id="console-test-tooltip"
          target="console-test-info-icon"
          placement="right"
        >
          Console any response. See the ConsoleTest component
        </UncontrolledTooltip>
      </div>
      <span className="border-top border-white-50 mb-2 w-100" />
      <Button
        style={{ backgroundColor: '#d54e21' }}
        onClick={consoleResponse}
      >
        Console test
      </Button>
    </div>
  );
}

export default ConsoleTest;
