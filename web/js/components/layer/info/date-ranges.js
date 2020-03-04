import React from 'react';
import PropTypes from 'prop-types';
import { ListGroup, ListGroupItem } from 'reactstrap';
import util from '../../../util/util';
import Scrollbar from '../../util/scrollbar';
import { dateOverlap } from '../../../modules/layers/util';

export class DateRanges extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showRanges: false,
    };
  }

  renderListItem(layer) {
    return layer.dateRanges
      .slice(0)
      .reverse()
      .map((l) => {
        let listItemStartDate;
        let listItemEndDate;

        if (l.startDate) {
          listItemStartDate = util.coverageDateFormatter('START-DATE', l.startDate, layer.period);
        }

        if (l.endDate) {
          listItemEndDate = util.coverageDateFormatter('END-DATE', l.endDate, layer.period);
        }

        return (
          <ListGroupItem key={`${l.startDate} - ${l.endDate}`}>
            {`${listItemStartDate} - ${listItemEndDate}`}
          </ListGroupItem>
        );
      });
  }

  render() {
    const { layer, screenHeight } = this.props;
    const { showRanges } = this.state;
    const style = showRanges ? { display: 'block' } : { display: 'none' };

    let listItems;

    if (layer.dateRanges && layer.dateRanges.length > 1) {
      const dateRanges = dateOverlap(layer.period, layer.dateRanges);
      if (dateRanges.overlap === false) {
        listItems = this.renderListItem(layer);
      }
    }

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
          <Scrollbar style={{ maxHeight: `${screenHeight - 400}px` }}>
            <ListGroup className="layer-date-ranges" id="layer-settings-date-range-list">
              {listItems}
            </ListGroup>
          </Scrollbar>
        </div>
      </>
    );
  }
}

DateRanges.propTypes = {
  dateRanges: PropTypes.object,
  layer: PropTypes.object,
  screenHeight: PropTypes.number,
};
