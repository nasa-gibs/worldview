import React from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faCalendarDay, faInfo } from '@fortawesome/free-solid-svg-icons';

class ChartingModeOptions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: props.selected,
    };
  }

  UNSAFE_componentWillReceiveProps(newProp) {
    const { selected } = this.state;
    if (selected !== newProp.selected) {
      this.setState({ selected: newProp.selected });
    }
  }

  render() {
    const {
      isChartingActive,
      isMobile,
      aoiSelected,
      aoiCoordinates,
      timeSpanSingleDate,
      timeSpanStartdate,
      timeSpanEndDate,
    } = this.props;
    // console.log(`isChartingActive: ${isChartingActive}`);
    // console.log(`aoiSelected: ${aoiSelected}`);
    // console.log(`aoiCoordinates: ${aoiCoordinates}`);
    // console.log(`timeSpanSingleDate: ${timeSpanSingleDate}`);
    // console.log(`timeSpanStartdate: ${timeSpanStartdate}`);
    // console.log(`timeSpanEndDate: ${timeSpanEndDate}`);
    let aoiTextPrompt = 'Select Area of Interest';
    if (aoiSelected) {
      aoiTextPrompt = 'Area of Interest Selected';
    }
    return (
      <div
        id="wv-charting-mode-container"
        className="wv-charting-mode-container"
        style={{ display: isChartingActive && !isMobile ? 'block' : 'none' }}
      >
        <div className="charting-aoi-container">
          <h3>{aoiTextPrompt}</h3>
          <FontAwesomeIcon icon={faPencilAlt} />
        </div>
        <div className="charting-timespan-container">
          <h3>Time Span:</h3>
          <ButtonGroup size="sm">
            <Button
              id="charting-single-date-button"
              className="charting-button charting-single-date-button"
            >
              One Date
            </Button>
            <Button
              id="charting-date-range-button"
              className="compare-button compare-swipe-button"
            >
              Date Range
            </Button>
          </ButtonGroup>
        </div>
        <div className="charting-date-container">
          <div className="charting-start-date">Start Date</div>
          <div className="charting-end-date">End Date</div>
          <FontAwesomeIcon icon={faCalendarDay} />
          <FontAwesomeIcon icon={faInfo} />
        </div>
      </div>
    );
  }
}
ChartingModeOptions.propTypes = {
  isChartingActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  aoiSelected: PropTypes.bool,
  aoiCoordinates: PropTypes.array,
  timeSpanSingleDate: PropTypes.bool,
  timeSpanStartdate: PropTypes.instanceOf(Date),
  timeSpanEndDate: PropTypes.instanceOf(Date),
};

export default ChartingModeOptions;
