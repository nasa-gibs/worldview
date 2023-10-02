import React from 'react';
import { useSelector } from 'react-redux';
import { Button, UncontrolledTooltip } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { transformExtent } from 'ol/proj';
import { getActiveLayers } from '../../../modules/layers/selectors';

function PresetConsoleCommands () {
  const {
    map,
    activeLayers,
    parameters,
  } = useSelector((state) => ({
    map: state.map.ui.selected,
    activeLayers: getActiveLayers(state, state.compare.activeString).map((layer) => layer),
    parameters: state.parameters,
  }));

  const getZoom = () => {
    const zoom = map.getView().getZoom();
    console.log(zoom);
  };

  const getVisibleExtent = () => {
    const extent = map.getView().calculateExtent(map.getSize());
    console.log('------ESPG:4326------');
    console.table(extent);
    const extentLonLat = transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
    console.log('------ESPG:3857------');
    console.table(extentLonLat);
  };

  const returnActiveLayers = () => {
    console.log(activeLayers);
  };

  const getParameters = () => {
    console.log(parameters);
  };


  return (
    <div className="d-flex flex-column justify-content-center align-items-center w-100 mt-3">
      <div className="d-flex flex-row justify-content-center align-items-center">
        <h5 className="h5 fw-bold d-inline-block me-1">Preset Console Commands</h5>
        <span><FontAwesomeIcon id="console-test-info-icon" icon="info-circle" className="pb-2" /></span>
        <UncontrolledTooltip
          id="console-test-tooltip"
          target="console-test-info-icon"
          placement="right"
        >
          Print preset commands to the console.
        </UncontrolledTooltip>
      </div>
      <span className="border-top border-white-50 mb-2 w-100" />
      <div className="d-flex flex-wrap justify-content-between">
        <Button
          className="mb-3"
          style={{ backgroundColor: '#d54e21', width: '48%' }}
          onClick={getZoom}
        >
          Get Zoom
        </Button>
        <Button
          className="mb-3"
          style={{ backgroundColor: '#d54e21', width: '48%' }}
          onClick={getVisibleExtent}
        >
          Get Visible Extent
        </Button>
        <Button
          style={{ backgroundColor: '#d54e21', width: '48%' }}
          onClick={returnActiveLayers}
        >
          Get Active Layers
        </Button>
        <Button
          style={{ backgroundColor: '#d54e21', width: '48%' }}
          onClick={getParameters}
        >
          Get Parameters
        </Button>
      </div>
    </div>
  );
}

export default PresetConsoleCommands;
