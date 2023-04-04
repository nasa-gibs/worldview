import React from 'react';

function LayerCoverageInfoModal() {
  return (
    <div className="layer-coverage-info">
      <header>
        <p>
          Temporal availability of active time-varying layers is shown as a set of striped horizontal blue lines in the panel. The total temporal coverage of the layers is shown on the far right.
        </p>
        <p>
          Time-varying layers that have matching temporal coverage are shown in the timeline (bottom of screen) as a solid blue line, making it easier to determine when multiple layers have temporally coincident imagery.
        </p>
      </header>
      <div className="layer-coverage-info-item-container">
        <section className="layer-coverage-info-item-left">
          <img src="images/lc-axis.png" />
        </section>
        <section className="layer-coverage-info-item-right">
          <div>
            <p>
              Including layers that are hidden may affect the display of the timeline’s solid blue overlapping coverage line as it will take into account the dates of those layers, too.
            </p>
            <img src="images/lc-toggle.png" />
          </div>
          <div>
            <p>
              <strong>Note:</strong>
              {' '}
              Note: Active layers showing available temporal coverage may not have imagery available yet (e.g., monthly layers that are processed later in the month).
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default LayerCoverageInfoModal;
