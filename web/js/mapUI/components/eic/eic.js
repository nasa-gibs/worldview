import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectDate as selectDateAction } from '../../../modules/date/actions';
import {
  setEICLegacy as setEICLegacyAction,
} from '../../../modules/ui/actions';

function EIC() {
  const dispatch = useDispatch();
  const selectDate = (date) => { dispatch(selectDateAction(date)); };
  const setEICLegacy = (isLegacy) => { dispatch(setEICLegacyAction(isLegacy)); };

  const eic = useSelector((state) => state.ui.eic);
  const eicLegacy = useSelector((state) => state.ui.eicLegacy);
  const scenario = useSelector((state) => state.ui.scenario);

  const requestBestDate = async () => {
    try {
      const url = `https://0k5r4dvbbk.execute-api.us-east-1.amazonaws.com/dev/scenarios?item_type=scenario&item_id=${scenario}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok.');
      }
      const data = await response.json();
      const resolutionDate = data.resolution_date;

      if (resolutionDate === 'No valid date found') {
        console.error('No valid date found, using EIC Legacy mode');
        setEICLegacy(true);
        return;
      }

      const dateObj = new Date(resolutionDate);
      console.log(data);
      selectDate(dateObj);
    } catch (error) {
      console.error('Error fetching the best date, using EIC Legacy mode:', error);
      setEICLegacy(true);
    }
  };

  useEffect(() => {
    if (scenario !== '' && eicLegacy === false && eic === 'si') {
      requestBestDate();
    }
  }, []);

  return null;
}

export default EIC;
