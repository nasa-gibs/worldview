import React from 'react';
import PixelTestMode from './pixel-test-mode/dev-pixel-test';
import ConsoleTestMode from './dev-console-test';
import PresetConsoleCommands from './dev-preset-console-commands';
import FindOrbitTracksTestMode from './find-orbit-tracks-mode/dev-find-orbit-tracks-mode';

function DevTestModal() {
  return (
    <div id="dev-block" className="d-flex flex-column justify-content-center align-items-center">
      <ConsoleTestMode />
      <PresetConsoleCommands />
      <PixelTestMode />
      <FindOrbitTracksTestMode />
    </div>
  );
}

export default DevTestModal;
