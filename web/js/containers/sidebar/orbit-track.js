import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { isEmpty as lodashIsEmpty, get as lodashGet } from 'lodash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSatellite } from '@fortawesome/free-solid-svg-icons';
import PaletteLegend from '../../components/sidebar/paletteLegend';
import {
  getPalette,
  getPaletteLegends,
} from '../../modules/palettes/selectors';
import { requestPalette } from '../../modules/palettes/actions';
import { getOrbitTrackTitle } from '../../modules/layers/util';


class OrbitTrack extends React.Component {
  getPaletteLegend = () => {
    const {
      trackLayer,
      paletteLegends,
      getPalette,
      renderedPalette,
      requestPalette,
      isLoading,
      isMobile,
      parentLayer,
    } = this.props;
    if (!lodashIsEmpty(renderedPalette)) {
      return (
        <PaletteLegend
          layer={trackLayer}
          parentLayer={parentLayer}
          getPalette={getPalette}
          paletteLegends={paletteLegends}
          isMobile={isMobile}
        />
      );
    } if (!isLoading) {
      requestPalette(trackLayer.id);
    }
  }

  render() {
    const { trackLayer, hasPalette } = this.props;
    const containerClasses = `wv-orbit-track ${!trackLayer.visible ? 'not-visible' : ''}`;

    return (
      <div className={containerClasses}>
        {hasPalette ? this.getPaletteLegend() : ''}
        <FontAwesomeIcon icon={faSatellite} />
        <span className="wv-orbit-track-label">
          {getOrbitTrackTitle(trackLayer)}
        </span>
      </div>
    );
  }
}

OrbitTrack.propTypes = {
  getPalette: PropTypes.func,
  hasPalette: PropTypes.bool,
  isLoading: PropTypes.bool,
  isMobile: PropTypes.bool,
  palette: PropTypes.object,
  paletteLegends: PropTypes.array,
  parentLayer: PropTypes.object,
  renderedPalette: PropTypes.object,
  requestPalette: PropTypes.func,
  trackLayer: PropTypes.object,
};

function mapStateToProps(state, ownProps) {
  const {
    trackLayer,
    layerGroupName,
  } = ownProps;
  const { palettes, config } = state;
  const renderedPalettes = palettes.rendered;
  const hasPalette = !lodashIsEmpty(trackLayer.palette);
  const paletteName = lodashGet(config, `layers['${trackLayer.id}'].palette.id`);
  const paletteLegends = hasPalette && renderedPalettes[paletteName]
    ? getPaletteLegends(trackLayer.id, layerGroupName, state)
    : [];
  const isCustomPalette = hasPalette && palettes.custom[trackLayer.id];

  return {
    trackLayer,
    paletteLegends,
    isCustomPalette,
    isLoading: palettes.isLoading[paletteName],
    renderedPalette: renderedPalettes[paletteName],
    layerGroupName,
    isMobile: state.browser.lessThan.medium,
    hasPalette,
    getPalette: (layerId, index) => getPalette(trackLayer.id, index, layerGroupName, state),
  };
}

const mapDispatchToProps = (dispatch) => ({
  requestPalette: (id) => {
    dispatch(requestPalette(id));
  },
});
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(OrbitTrack);
