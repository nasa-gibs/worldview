import React from 'react';

const DataPanelInfoModal = () => (
  <div className="data-panel-info">
    <header>
      <p>
        Temporal coverage of activated time-varying layers are shown in the layer coverage panel as striped blue lines in relation to the current timeline zoom level. The total temporal coverage dates are shown on the right.
      </p>
      <p>
        Time-varying layers that are temporally coincident/have matching temporal coverage are shown in the timeline as a solid blue line, making it easier to find out when multiple layers have concurrent imagery available.
      </p>
    </header>
    <div className="data-panel-info-item-container">
      <section className="data-panel-info-item-left">
        <img src="images/dp-axis.png" />
      </section>
      <section className="data-panel-info-item-right">
        <div>
          <p>
            The “Include Hidden Layers” toggle will display hidden layers in the layer coverage panel and may affect the display of the matching coverage solid blue line.
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
      </section>
    </div>
  </div>
);

export default DataPanelInfoModal;
