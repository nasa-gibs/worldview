import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getActiveGranuleFootPrints } from '../../../modules/layers/selectors';
import { GRANULE_HOVERED, GRANULE_HOVER_UPDATE } from '../../../util/constants';
import util from '../../../util/util';

const { events } = util;

const GranuleHover = (props) => {
  const {
    granuleFootprints,
    state,
    ui,
  } = props;

  const [granuleHover, setGranuleHover] = useState({});
  const [granuleHoverUpdate, setGranuleHoverUpdate] = useState({});

  const onGranuleHover = (platform, date, update) => {
    const proj = ui.selected.getView().getProjection().getCode();
    if (!granuleFootprints[proj]) return;
    let geometry;
    if (platform && date) {
      geometry = getActiveGranuleFootPrints(state)[date];
    }
    granuleFootprints[proj].addFootprint(geometry, date);
  };

  const onGranuleHoverUpdate = (platform, date) => {
    const proj = ui.selected.getView().getProjection().getCode();
    if (!granuleFootprints[proj]) return;
    let geometry;
    if (platform && date) {
      geometry = getActiveGranuleFootPrints(state)[date];
    }
    granuleFootprints[proj].updateFootprint(geometry, date);
  };

  events.on(GRANULE_HOVERED, setGranuleHover);
  events.on(GRANULE_HOVER_UPDATE, setGranuleHoverUpdate);

  useEffect(() => {
    if (!ui.selected) return;
    onGranuleHover(granuleHover);
  }, [granuleHover]);

  useEffect(() => {
    if (!ui.selected) return;
    onGranuleHoverUpdate(granuleHoverUpdate);
  }, [granuleHoverUpdate]);

  return null;
};

const mapStateToProps = (state) => ({
  state,
});

export default connect(
  mapStateToProps,
)(GranuleHover);

GranuleHover.propTypes = {
  granuleFootprints: PropTypes.object,
  setGranuleFootprints: PropTypes.func,
  state: PropTypes.object,
  ui: PropTypes.object,
};
