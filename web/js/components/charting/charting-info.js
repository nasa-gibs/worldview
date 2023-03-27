import React from 'react';

function ChartingInfo(props) {
  return (
    <div className="charting-info-container">
      <div className="charting-info-text">
        <p className="charting-info">
          This is a demonstration of making a request to the Sentinel Hub API, processing the data & displaying the results in a chart.
        </p>

        <p className="charting-info">This request is a STATIC request. Regardless of the layer & date active on the page this demo will ignore those values & use the same STATIC values for the data request.</p>

        <p className="charting-info">Exit the charting mode by selecting Exit Charting near the botom of the Layers Panel.</p>

        <h3>NOTE:</h3>

        <p className="charting-disclaimer">Numerical analyses performed on imagery should only be used for initial basic exploratory purposes. Results from these analyses should not be used for formal scientific study since the imagery is generally of lower precision than the original data and has often had additional processing steps applied to it, e.g. projection into a different coordinate system.</p>
      </div>
    </div>
  );
}

export default ChartingInfo;

