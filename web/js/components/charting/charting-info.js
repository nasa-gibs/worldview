import React from 'react';

function ChartingInfo(props) {
  return (
    <div className="charting-info-container">
      <div className="charting-info-text">
        <p className="charting-info">
          The charting feature is available for beta testing and evaluation. Please send comments and feedback to&nbsp;
          <a class="charting-feedback" href="mailto:earthdata-support@nasa.gov">earthdata-support@nasa.gov</a>
          .
        </p>
        <p className="charting-info">The Charting Tool provides the option to create a line chart for a date range showing change over time, and statistics for a single date (minimum, maximum, mean, and standard deviation) for an area of interest.</p>

        <p className="charting-info">Select the layer to be charted by clicking on the radio button to the left of the layer name.</p>

        <p className="charting-info">The default area of interest is the entire screen, click on the “Entire Screen” button to change to a bounding box area of interest selection. Click on any box at the edge or corner of the selection box to change the size and shape.</p>

        <p className="charting-info">The default date selection is a date range of the past 7 days. Click on the dates to change the date range in the Charting Mode Date Selection box. Click on the red “Generate Chart” button to generate a chart of change over time.</p>

        <p className="charting-info">To select a single date, select “One Date”. Click on the date to change the date in date selection box.  Click on the red “Generate Statistics” button to generate a list of statistics including min, max, mean, and standard deviation.</p>

        <h3>NOTE:</h3>

        <p className="charting-disclaimer">Numerical analyses performed on imagery should only be used for initial basic exploratory purposes. Results from these analyses should not be used for formal scientific study since the imagery is generally of lower precision than the original data and has often had additional processing steps applied to it, e.g. projection into a different coordinate system.</p>

      </div>
    </div>
  );
}

export default ChartingInfo;

