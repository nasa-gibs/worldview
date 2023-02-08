import React from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faCalendarDay, faInfo } from '@fortawesome/free-solid-svg-icons';
import { connect } from 'react-redux';
import { DragBox, Select } from 'ol/interaction.js';
import { Fill, Stroke, Style } from 'ol/style.js';
import { any } from 'bluebird';
import { toggleChartingAOIOnOff } from '../../modules/charting/actions';
import { openCustomContent } from '../../modules/modal/actions';

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

  onAoiButtonClick = (evt, props) => {
    console.log('props');
    console.log(this.props);
    console.log('onAoiButtonClick');
    const { toggleAOI, olMap } = this.props;
    toggleAOI();

    const selectedStyle = new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.6)',
      }),
      stroke: new Stroke({
        color: 'rgba(255, 255, 255, 0.7)',
        width: 2,
      }),
    });

    // a normal select interaction to handle click
    const select = new Select({
      style (feature) {
        const color = feature.get('COLOR_BIO') || '#eeeeee';
        selectedStyle.getFill().setColor(color);
        return selectedStyle;
      },
    });
    console.log('olMap');
    console.log(olMap);
    olMap.addInteraction(select);

    // Open Modal (for now)
    // const { openModal } = this.props;
    // const isTouchDevice = evt.type === 'touchend';
    // evt.stopPropagation();
    // evt.preventDefault();
    // MEASURE_MENU_PROPS.touchDevice = isTouchDevice;
    // openModal('MEASURE_MENU', MEASURE_MENU_PROPS);
    // this.setState({
    //   isTouchDevice,
    //   showAlert: true,
    // });
    // googleTagManager.pushEvent({
    //   event: 'measure_tool_activated',
    // });
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
          <FontAwesomeIcon
            icon={faPencilAlt}
            onClick={this.onAoiButtonClick}
          />
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

const mapStateToProps = (state, ownProps) => {
  const {
    charting, map,
  } = state;

  return {
    charting, olMap: map.ui.selected,
  };
};

const mapDispatchToProps = (dispatch) => ({
  toggleAOI: () => {
    dispatch(toggleChartingAOIOnOff());
  },
  openModal: (key, customParams) => {
    dispatch(openCustomContent(key, customParams));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  null,
  { forwardRef: true },
)(ChartingModeOptions);

ChartingModeOptions.propTypes = {
  isChartingActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  aoiSelected: PropTypes.bool,
  aoiCoordinates: PropTypes.array,
  timeSpanSingleDate: PropTypes.bool,
  timeSpanStartdate: PropTypes.instanceOf(Date),
  timeSpanEndDate: PropTypes.instanceOf(Date),
  toggleAOI: PropTypes.func,
  olMap: PropTypes.object,
};

