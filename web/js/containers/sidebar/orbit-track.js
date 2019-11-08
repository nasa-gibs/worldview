import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import PaletteLegend from '../../components/sidebar/paletteLegend';
import { isEmpty as lodashIsEmpty, get as lodashGet } from 'lodash';
import {
  getPalette,
  getPaletteLegends
} from '../../modules/palettes/selectors';
import { requestPalette } from '../../modules/palettes/actions';
import { toggleVisibility } from '../../modules/layers/actions';

class OrbitTrack extends React.Component {
  getPaletteLegend = () => {
    const {
      trackLayer,
      paletteLegends,
      checkerBoardPattern,
      getPalette,
      renderedPalette,
      requestPalette,
      isLoading,
      isMobile
    } = this.props;
    if (!lodashIsEmpty(renderedPalette)) {
      return (
        <PaletteLegend
          layer={trackLayer}
          getPalette={getPalette}
          paletteLegends={paletteLegends}
          checkerBoardPattern={checkerBoardPattern}
          isMobile={isMobile}
        />
      );
    } else if (!isLoading) {
      requestPalette(trackLayer.id);
    }
  }

  render() {
    const {
      trackLayer,
      toggleVisibility,
      hasPalette
    } = this.props;

    const { id, visible, daynight, track } = trackLayer;
    const iconClass = !visible ? 'fa fa-eye-slash' : 'fa fa-eye';
    const containerClasses = 'wv-orbit-track ' + (!visible ? 'not-visible' : '');
    const buttonClasses = 'wv-orbit-track-vis-toggle ' + (!visible ? 'not-visible' : '');

    return (
      <div className={containerClasses}>
        <button
          className={buttonClasses}
          onClick={() => toggleVisibility(id, !visible)}
        >
          <i className={iconClass} />
        </button>

        {hasPalette ? this.getPaletteLegend() : ''}

        <span className='wv-orbit-track-label'>
          {track + ' / ' + daynight}
        </span>
      </div>
    );
  }
}

OrbitTrack.propTypes = {
  checkerBoardPattern: PropTypes.object,
  getPalette: PropTypes.func,
  hasPalette: PropTypes.bool,
  isLoading: PropTypes.bool,
  isMobile: PropTypes.bool,
  palette: PropTypes.object,
  paletteLegends: PropTypes.array,
  renderedPalette: PropTypes.object,
  requestPalette: PropTypes.func,
  toggleVisibility: PropTypes.func,
  trackLayer: PropTypes.object
};

function mapStateToProps(state, ownProps) {
  const {
    trackLayer,
    layerGroupName
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
    getPalette: (layerId, index) => {
      return getPalette(trackLayer.id, index, layerGroupName, state);
    }
  };
}

const mapDispatchToProps = dispatch => ({
  toggleVisibility: (id, isVisible) => {
    dispatch(toggleVisibility(id, isVisible));
  },
  requestPalette: (id) => {
    dispatch(requestPalette(id));
  }
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(OrbitTrack);
