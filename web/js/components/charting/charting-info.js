import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import onClickFeedback from '../../modules/feedback/util';
import initFeedback from '../../modules/feedback/actions';

function ChartingInfo(props) {
  const {
    sendFeedback,
    feedbackIsInitiated,
    isMobile,
  } = props;
  return (
    <div className="charting-info-container">
      <div className="charting-info-text">
        <p className="charting-info">
          The charting feature is available for beta testing and evaluation.&nbsp;
          <span class="charting-feedback" onClick={() => sendFeedback(feedbackIsInitiated, isMobile)}>Please send comments and feedback to us.</span>
        </p>
        <p className="charting-info">The Charting Tool provides the option to create a line chart for a date range showing change over time, and statistics for a single date (median, mean, minimum, maximum, and standard deviation) for an area of interest.</p>

        <p className="charting-info">To create a time-series chart, select the layer to be charted by clicking on the radio button to the left of the layer name.</p>

        <p className="charting-info">Select your area of interest by adjusting the area selection box, editing the bounding box coordinates in “Edit Coordinates” or checking the “Entire Screen” checkbox.</p>

        <p className="charting-info">Click on the dates to change the date range in the “Charting Mode Date Selection” box. Click on the red “Generate Chart” button to generate a chart of change over time. (As part of this beta feature release, the number of plotted data points may be reduced if it exceeds 31 points).</p>

        <p className="charting-info">To select a single date, select “One Date”. Click on the date to change the date in date selection box. Click on the red “Generate Statistics” button to generate a list of statistics including median, mean, minimum, maximum, and standard deviation.</p>

        <p className="charting-disclaimer">NOTE: Numerical analyses performed on imagery should only be used for initial basic exploratory purposes. Results from these analyses should not be used for formal scientific study since the imagery is generally of lower precision than the original data and has often had additional processing steps applied to it, e.g. projection into a different coordinate system.</p>

      </div>
    </div>
  );
}

const mapStateToProps = (state) => {
  const {
    feedback, screenSize,
  } = state;
  return {
    feedbackIsInitiated: feedback.isInitiated,
    isMobile: screenSize.isMobileDevice,
  };
};

const mapDispatchToProps = (dispatch) => ({
  sendFeedback: (isInitiated, isMobile) => {
    onClickFeedback(isInitiated, isMobile);
    if (!isInitiated) {
      dispatch(initFeedback());
    }
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ChartingInfo);

ChartingInfo.propTypes = {
  feedbackIsInitiated: PropTypes.bool,
  sendFeedback: PropTypes.func,
  isMobile: PropTypes.bool,
};
