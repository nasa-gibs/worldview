import React from 'react';

function ChartingInfo(props) {
  return (
    <div className="charting-info-container">
      <div className="charting-info-text">
        Nam odio est, congue a cursus sed, feugiat et ipsum. Nam vehicula velit at massa tincidunt luctus. Mauris vitae lacus lacus. Fusce ac vestibulum magna, non pharetra sem. Phasellus faucibus nibh id accumsan aliquet. In interdum ultricies ligula non semper. Nullam ut mi et nibh sagittis ultricies. Suspendisse vitae enim pulvinar, sollicitudin tortor non, pellentesque dui. Ut efficitur, arcu et sagittis ullamcorper, est dolor fringilla dolor, ut condimentum quam mauris sed sapien. Maecenas convallis felis eget fermentum egestas. Ut volutpat, enim vitae auctor lacinia, enim purus semper sapien, non hendrerit velit quam sit amet orci. Nulla non purus rutrum, elementum lectus at, sagittis sem. Aliquam id tellus ac neque bibendum scelerisque et in lacus. Mauris a lectus turpis. Curabitur in libero ac mauris dapibus egestas a vel dui. Phasellus tristique nec mi id dapibus.
        <br />
        <br />
        <strong>NOTE:</strong>
        {' '}
        Numerical analyses performed on imagery should only be used for initial basic exploratory purposes. Results from these analyses should not be used for formal scientific study since the imagery is generally of lower precision than the original data and has often had additional processing steps applied to it, e.g. projection into a different coordinate system.
      </div>
    </div>
  );
}

export default ChartingInfo;

