import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getActiveGranuleFootPrints } from '../../modules/layers/selectors';
import { GRANULE_HOVERED, GRANULE_HOVER_UPDATE } from '../../util/constants';
import util from '../../util/util';

const { events } = util;

const GranuleHover = (props) => {
  const {
    state,
    granuleFootprintz,
    setGranuleFootprintz,
    ui,
  } = props;

  const onGranuleHover = (platform, date, update) => {
    if(!ui.proj) return;
    const proj = ui.selected.getView().getProjection().getCode();
    let geometry;
    if (platform && date) {
      geometry = getActiveGranuleFootPrints(state)[date];
    }
    const granuleFootprintzCopy = granuleFootprintz
    granuleFootprintzCopy[proj].addFootprint(geometry, date);
    setGranuleFootprintz(granuleFootprintzCopy);
  };

  const onGranuleHoverUpdate = (platform, date) => {
    if(!ui.proj) return;
    const proj = ui.selected.getView().getProjection().getCode();
    let geometry;
    if (platform && date) {
      geometry = getActiveGranuleFootPrints(state)[date];
    }
    const granuleFootprintzCopy = granuleFootprintz
    granuleFootprintzCopy[proj].updateFootprint(geometry, date);
    setGranuleFootprintz(granuleFootprintzCopy);
  };

  const buttonStyle = {
    zIndex: "999"
  }

  const testFunction = () => {
    console.log(granuleFootprintz)
  }

  events.on(GRANULE_HOVERED, onGranuleHover);
  events.on(GRANULE_HOVER_UPDATE, onGranuleHoverUpdate);

  return (
    <div className="d-flex justify-content-center">
      <button style={buttonStyle} className="btn btn-success" onClick={testFunction}>UHHHHHHHHHH</button>
    </div>
  );

}

const mapStateToProps = (state) => {
  return {
    state,
  }
}

export default connect(
  mapStateToProps,
)(GranuleHover);

GranuleHover.propTypes = {
  state: PropTypes.object
}