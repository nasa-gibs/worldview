import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getActiveGranuleFootPrints } from '../../../modules/layers/selectors';
import { GRANULE_HOVERED, GRANULE_HOVER_UPDATE } from '../../../util/constants';
import util from '../../../util/util';

const { events } = util;

function GranuleHover(props) {
  const {
    granuleFootprints,
    state,
    ui,
  } = props;

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
    if (!geometry) return;
    granuleFootprints[proj].updateFootprint(geometry, date);
  };

  events.on(GRANULE_HOVERED, onGranuleHover);
  events.on(GRANULE_HOVER_UPDATE, onGranuleHoverUpdate);

  return null;
}

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
