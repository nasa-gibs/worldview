import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getActiveGranuleFootPrints } from '../../modules/layers/selectors';
import { GRANULE_HOVERED, GRANULE_HOVER_UPDATE } from '../../util/constants';
import util from '../../util/util';

const { events } = util;

const GranuleHover = (props) => {
  const {
    granuleFootprints,
    setGranuleFootprints,
    state,
    ui,
  } = props;

  const onGranuleHover = (platform, date, update) => {
    if (!ui.proj) return;
    const proj = ui.selected.getView().getProjection().getCode();
    let geometry;
    if (platform && date) {
      geometry = getActiveGranuleFootPrints(state)[date];
    }
    const granuleFootprintsCopy = granuleFootprints;
    granuleFootprintsCopy[proj].addFootprint(geometry, date);
    setGranuleFootprints(granuleFootprintsCopy);
  };

  const onGranuleHoverUpdate = (platform, date) => {
    if (!ui.proj) return;
    const proj = ui.selected.getView().getProjection().getCode();
    let geometry;
    if (platform && date) {
      geometry = getActiveGranuleFootPrints(state)[date];
    }
    const granuleFootprintsCopy = granuleFootprints;
    granuleFootprintsCopy[proj].updateFootprint(geometry, date);
    setGranuleFootprints(granuleFootprintsCopy);
  };

  events.on(GRANULE_HOVERED, onGranuleHover);
  events.on(GRANULE_HOVER_UPDATE, onGranuleHoverUpdate);

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
