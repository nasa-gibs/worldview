import React from 'react';

function CompareAlertModalBody() {
  return (
    <div className="basic-modal compare-dialog">
      <h1>How to get started?</h1>
      <ul>
        <li className="compare-dialog-list-item">
          <p>
            Select the respective tab (A or B) in order to update the layers
            and date of that state.
          </p>
          <img src="images/ab-tabs.png" />
        </li>
        <li className="compare-dialog-list-item">
          <p>
            There are now two time sliders on the timeline. You can click on
            the deactivated time slider to activate that state and change the
            date.
          </p>
          <img src="images/ab-picks.png" />
        </li>
        <li className="compare-dialog-list-item">
          <p>
            There are three compare modes. You can choose different modes
            using the selection at the bottom of the layer list.
          </p>
          <img src="images/ab-modes.png" />
        </li>
      </ul>
    </div>
  );
}

export default CompareAlertModalBody;
