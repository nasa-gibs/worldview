import React from 'react';
import PixelTestMode from './pixel-test-mode/dev-pixel-test';
import ConsoleTestMode from './dev-console-test';


// Use this component to test the black pixel ratio of a single image
// You will need to set the the 'tileImageTestMode' state to true in mapUI
// Remember to set it back to false when you are done testing

function DevTestModal() {
  return (
    <div id="dev-block" className="d-flex flex-column justify-content-center align-items-center">
      <PixelTestMode />
      <ConsoleTestMode />
    </div>
  );
}

export default DevTestModal;
