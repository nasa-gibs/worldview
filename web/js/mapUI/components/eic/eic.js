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
      const url = `https://worldview.earthdata.nasa.gov/eic/scenarios?item_type=scenario&item_id=${scenario}`;
      const response = await fetch(url, { timeout: 10000 });
      if (!response.ok) {
        throw new Error('Network response was not ok.');
      }
      const data = await response.json();
      const resolutionDate = data.resolution_date;

      if (resolutionDate === 'No valid date found') {
        console.warn('No valid date found, using EIC Legacy mode');
        setEICLegacy(true);
        return;
      }

      const dateObj = new Date(resolutionDate);
      selectDate(dateObj);
    } catch (error) {
      console.warn('Error fetching the best date, using EIC Legacy mode:', error);
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
