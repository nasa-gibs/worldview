import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { isEmpty as lodashIsEmpty, get as lodashGet } from 'lodash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PaletteLegend from '../../components/sidebar/paletteLegend';
import {
  getPalette as getPaletteSelector,
  getPaletteLegends,
} from '../../modules/palettes/selectors';
import { requestPalette as requestPaletteAction } from '../../modules/palettes/actions';
import { getOrbitTrackTitle } from '../../modules/layers/util';

function OrbitTrack(props) {
  const {
    trackLayer,
    paletteLegends,
    getPalette,
    renderedPalette,
    requestPalette,
    isLoading,
    isDistractionFreeModeActive,
    isMobile,
    parentLayer,
    hasPalette,
  } = props;

  const containerClasses = `wv-orbit-track ${!trackLayer.visible ? 'not-visible' : ''}`;
  const [palette, setPalette] = useState();
  const satelliteName = trackLayer.title.split(' - ')[0];

  useEffect(() => {
    if (hasPalette && !isLoading && !renderedPalette) {
      requestPalette(trackLayer.id);
      return;
    }
    setPalette((
      <PaletteLegend
        layer={trackLayer}
        parentLayer={parentLayer}
        getPalette={getPalette}
        paletteLegends={paletteLegends}
        isDistractionFreeModeActive={isDistractionFreeModeActive}
        isMobile={isMobile}
      />
    ));
  }, [renderedPalette]);

  return (
    <div className={containerClasses}>
      {palette}
      <FontAwesomeIcon icon="satellite" />
      <span className="wv-orbit-track-label">
        {`${getOrbitTrackTitle(trackLayer)} (${satelliteName})`}
      </span>
    </div>
  );
}

OrbitTrack.propTypes = {
  getPalette: PropTypes.func,
  hasPalette: PropTypes.bool,
  isLoading: PropTypes.bool,
  isDistractionFreeModeActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  paletteLegends: PropTypes.array,
  parentLayer: PropTypes.object,
  renderedPalette: PropTypes.object,
  requestPalette: PropTypes.func,
  trackLayer: PropTypes.object,
};

function mapStateToProps(state, ownProps) {
  const {
    trackLayer,
    compareState,
  } = ownProps;
  const {
    palettes, config, ui, screenSize,
  } = state;
  const { isDistractionFreeModeActive } = ui;
  const renderedPalettes = palettes.rendered;
  const hasPalette = !lodashIsEmpty(trackLayer.palette);
  const paletteName = lodashGet(config, `layers['${trackLayer.id}'].palette.id`);
  const paletteLegends = hasPalette && renderedPalettes[paletteName]
    ? getPaletteLegends(trackLayer.id, compareState, state)
    : [];
  const isCustomPalette = hasPalette && palettes.custom[trackLayer.id];

  return {
    trackLayer,
    paletteLegends,
    isCustomPalette,
    isLoading: palettes.isLoading[paletteName],
    renderedPalette: renderedPalettes[paletteName],
    isMobile: screenSize.isMobileDevice,
    isDistractionFreeModeActive,
    hasPalette,
    getPalette: (layerId, index) => getPaletteSelector(trackLayer.id, index, compareState, state),
  };
}

const mapDispatchToProps = (dispatch) => ({
  requestPalette: (id) => {
    dispatch(requestPaletteAction(id));
  },
});
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(OrbitTrack);
