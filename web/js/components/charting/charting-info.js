import React from 'react';

function ChartingInfo(props) {
  return (
    <div className="charting-info-container">
      <div className="charting-info-text">
        <p className="charting-info">
          Click on the pencil icon to click and drag a bounding box on the map to define an Area of Interest (AOI).
        </p>

        <p className="charting-info">In Date Range mode (the default mode), select the calendar icon near the bottom of the Layers panel and increment the values in the resulting window to change their dates. To use a single date instead of a range, choose One Date at the bottom of the Layers panel.</p>

        <p className="charting-info">Select the active layer via the toggle icon on its left. Click on Request Chart & you will see additional data as you hover over points on the enlarged chart.</p>

        <p className="charting-info">Exit the charting mode by selecting Exit Charting near the botom of the Layers Panel.</p>

        <h3>NOTE:</h3>

        <p className="charting-disclaimer">Numerical analyses performed on imagery should only be used for initial basic exploratory purposes. Results from these analyses should not be used for formal scientific study since the imagery is generally of lower precision than the original data and has often had additional processing steps applied to it, e.g. projection into a different coordinate system.</p>
      </div>
    </div>
  );
}

export default ChartingInfo;

