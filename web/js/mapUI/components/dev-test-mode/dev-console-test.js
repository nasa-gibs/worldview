import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, UncontrolledTooltip } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function ConsoleTest () {
  // eslint-disable-next-line no-unused-vars
  const dispatch = useDispatch();
  const map = useSelector((state) => state.map.ui.selected);

  const consoleResponse = () => {
    console.log(map);
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
