import React, { useState } from 'react';
import { ListGroup, ListGroupItem, Spinner } from 'reactstrap';
import PropTypes from 'prop-types';
import Scrollbar from '../../util/scrollbar';
import { coverageDateFormatter } from '../../../modules/date/util';

const formatDateRanges = (dateRanges = []) => dateRanges.map(({
  startDate,
  endDate,
}) => [startDate, endDate]);

export default function DateRanges ({ layer }) {
  const [showRanges, setShowRanges] = useState(false);
  const [dateRanges, setDateRanges] = useState([]);
  const { ongoing } = layer;

  const getDateRanges = async () => {
    if (dateRanges.length) return undefined;
    if (!ongoing) return setDateRanges(formatDateRanges(layer.dateRanges));
    const worker = new Worker('js/workers/describe-domains.worker.js');
    worker.onmessage = (event) => {
      if (Array.isArray(event.data)) { // our final format is an array
        worker.terminate(); // terminate the worker
        // fallback to layer.dateRanges if no DescribeDomains data
        const data = event.data.length
          ? event.data : formatDateRanges(layer.dateRanges);
        return setDateRanges(data);
      }
      // DOMParser is not available in workers so we parse the xml on the main thread before sending
      // it back to the worker
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(event.data, 'text/xml');
      const domains = xmlDoc.querySelector('Domain')?.textContent || '';
      return worker.postMessage({ operation: 'mergeDomains', args: [domains, 0] });
    };
    worker.onerror = () => {
      worker.terminate();
      // fallback to layer.dateRanges if worker fails
      setDateRanges(formatDateRanges(layer.dateRanges));
    };
    const { startDate } = layer;
    const endDate = layer.endDate
      ? new Date(layer.endDate).toISOString()
      : new Date().toISOString(); // default to today if no end date
    const params = {
      startDate,
      endDate,
      id: layer.id,
      proj: 'EPSG:4326',
    };
    return worker.postMessage({ operation: 'requestDescribeDomains', args: [params] });
  };

  const renderListItem = () => dateRanges
    .slice(0)
    .reverse()
    .map((l) => {
      const ListItemStartDate = () => coverageDateFormatter('START-DATE', l[0], layer.period);
      const ListItemEndDate = () => coverageDateFormatter('END-DATE', l.at(-1), layer.period);

      return (
        // notranslate included below to prevent Google Translate extension from crashing the page
        <ListGroupItem key={crypto.randomUUID()} className="notranslate">
          <ListItemStartDate />
          {' - '}
          <ListItemEndDate />
        </ListGroupItem>
      );
    });

  const style = showRanges ? { display: 'block' } : { display: 'none' };

  return (
    <>
      <sup
        className="layer-date-ranges-button"
        onClick={() => {
          getDateRanges();
          setShowRanges(!showRanges);
        }}
      >
        *View Dates
      </sup>
      <div
        style={style}
        id="layer-date-range-list-wrap"
        className="layer-date-wrap"
      >
        <div>
          <p>Date Ranges:</p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {dateRanges.length === 0 && <Spinner size="sm">Loading...</Spinner>}
          </div>
        </div>
        <Scrollbar style={{ maxHeight: 400 }}>
          <ListGroup id="layer-settings-date-range-list" className="layer-date-ranges monospace">
            {renderListItem()}
          </ListGroup>
        </Scrollbar>
      </div>
    </>
  );
}

DateRanges.propTypes = {
  layer: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
};
