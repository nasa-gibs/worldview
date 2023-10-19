import { useEffect, useState } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { triggerTodayButton as triggerTodayButtonAction } from '../../../modules/date/actions';

function AutoImageryUpdate() {
  const autoUpdateInterval = useSelector((state) => state.date.autoUpdateInterval);

  const dispatch = useDispatch();
  const triggerTodayButton = () => { dispatch(triggerTodayButtonAction()); };

  const timeMap = {'10 Seconds': 10000, '10 Minutes': 600000};

  useEffect(() => {
    if (autoUpdateInterval !== 'OFF') {
      const interval = timeMap[autoUpdateInterval];
      // Create an interval to dispatch the action every 2 minutes (120000 milliseconds)
      const intervalId = setInterval(triggerTodayButton, interval);
      triggerTodayButton();
      console.log('TRIGGERING TODAY BUTTON')

      // Clear the interval when the component is unmounted
      return () => clearInterval(intervalId);
    }
  }, [autoUpdateInterval]);
}

export default AutoImageryUpdate;