import PropTypes from 'prop-types';
import { useEffect, useEffectEvent } from 'react';
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

  useEffect(() => {
    events.on(GRANULE_HOVERED, onGranuleHover);
    events.on(GRANULE_HOVER_UPDATE, onGranuleHoverUpdate);

    return () => {
      events.off(GRANULE_HOVERED, onGranuleHover);
      events.off(GRANULE_HOVER_UPDATE, onGranuleHoverUpdate);
    };
  }, []);

  const onGranuleHover = useEffectEvent((platform, date, update) => {
    const proj = ui.selected.getView().getProjection()
      .getCode();
    if (!granuleFootprints[proj]) return;
    let geometry;
    if (platform && date) {
      geometry = getActiveGranuleFootPrints(state)[date];
    }
    granuleFootprints[proj].addFootprint(geometry, date);
  });

  const onGranuleHoverUpdate = useEffectEvent((platform, date) => {
    const proj = ui.selected.getView().getProjection()
      .getCode();
    if (!granuleFootprints[proj]) return;
    let geometry;
    if (platform && date) {
      geometry = getActiveGranuleFootPrints(state)[date];
    }
    if (!geometry) return;
    granuleFootprints[proj].updateFootprint(geometry, date);
  });

  return null;
}

const mapStateToProps = (state) => ({
  state,
});

export default connect(
  mapStateToProps,
)(GranuleHover);

GranuleHover.propTypes = {
  granuleFootprints: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  state: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  ui: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
};
