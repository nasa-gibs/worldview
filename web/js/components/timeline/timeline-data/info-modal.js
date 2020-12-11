import React from 'react';

const DataPanelInfoModal = () => (
  <div className="data-panel-info">
    <p>
      Layers with temporal coverage are visualized in the data panel as blue lines which represent coverage relative to the current timeline zoom level. Total layer coverage is displayed on the right.
    </p>
    <p>
      Matching coverage for layer(s) in the data panel is shown on the timeline, as highlighted by the orange arrow below. Use this matching coverage to view the best times that multiple layers have data availability.
    </p>
    <div>
      <div className="data-panel-info-item">
        <img src="images/dp-axis.png" />
      </div>
      <div className="data-panel-info-item">
        <div>
          <p>
            Toggle to include layers that are currently hidden. This will affect matching coverage on the timeline.
          </p>
          <img src="images/dp-toggle.png" />
        </div>
        <div>
          <p>
            <strong>Note:</strong>
            {' '}
            Active layers showing available coverage may not have imagery available yet (e.g., monthly layers that are processed later in the month).
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default DataPanelInfoModal;
