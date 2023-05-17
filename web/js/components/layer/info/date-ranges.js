import React from 'react';
import PropTypes from 'prop-types';
import { ListGroup, ListGroupItem } from 'reactstrap';
import Scrollbar from '../../util/scrollbar';
import { coverageDateFormatter } from '../../../modules/date/util';

export default class DateRanges extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showRanges: false,
    };
  }

  renderListItem = (layer) => layer.dateRanges
    .slice(0)
    .reverse()
    .map((l) => {
      const ListItemStartDate = () => coverageDateFormatter('START-DATE', l.startDate, layer.period);
      const ListItemEndDate = () => coverageDateFormatter('END-DATE', l.endDate, layer.period);

      return (
        <ListGroupItem key={`${l.startDate} - ${l.endDate}`}>
          <ListItemStartDate />
          {' - '}
          <ListItemEndDate />
        </ListGroupItem>
      );
    });

  render() {
    const { layer } = this.props;
    const { showRanges } = this.state;
    const style = showRanges ? { display: 'block' } : { display: 'none' };
    const listItems = this.renderListItem(layer);

    return (
      <>
        <sup
          className="layer-date-ranges-button"
          onClick={() => {
            this.setState({ showRanges: !showRanges });
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
          </div>
          <Scrollbar style={{ maxHeight: 400 }}>
            <ListGroup id="layer-settings-date-range-list" className="layer-date-ranges monospace">
              {listItems}
            </ListGroup>
          </Scrollbar>
        </div>
      </>
    );
  }
}

DateRanges.propTypes = {
  layer: PropTypes.object,
};
