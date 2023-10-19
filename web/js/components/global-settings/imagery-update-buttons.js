import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, ButtonGroup, UncontrolledTooltip } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { triggerTodayButton as triggerTodayButtonAction, setAutoUpdateInterval as setAutoUpdateIntervalAction} from '../../modules/date/actions';

function ImageryUpdateButtons () {
  const dispatch = useDispatch();
  const triggerTodayButton = () => { dispatch(triggerTodayButtonAction()); };
  const setAutoUpdateInterval = (interval) => { dispatch(setAutoUpdateIntervalAction(interval)); };

  const imageryUpdateInterval = useSelector((state) => state.date.autoUpdateInterval);
  const imageryUpdateButtonOptions = ['OFF', '10 Seconds', '10 Minutes'];
  const labelText = 'Automatically update time at specified interval.';

  return (
    <div className="settings-component">
      <h3 className="wv-header">
        Auto Imagery Update Interval
        {' '}
        <span><FontAwesomeIcon id="coordinate-format-buttons-info-icon" icon="info-circle" /></span>
        <UncontrolledTooltip
          id="coordinate-setting-tooltip"
          target="coordinate-format-buttons-info-icon"
          placement="right"
        >
          {labelText}
        </UncontrolledTooltip>
      </h3>
      <ButtonGroup>
        {imageryUpdateButtonOptions.map((option, i) => (
          <Button
            key={`${option}-button`}
            aria-label={`Set ${option} Format`}
            outline
            className="setting-button"
            active={option === imageryUpdateInterval}
            onClick={() => setAutoUpdateInterval(option)}
            id={`${option}-btn`}
          >
            {option}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  )

}

export default ImageryUpdateButtons;