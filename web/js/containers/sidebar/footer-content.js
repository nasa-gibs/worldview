import React from 'react';
import PropTypes from 'prop-types';
import googleTagManager from 'googleTagManager';
import { connect } from 'react-redux';
import Button from '../../components/util/button';
import Checkbox from '../../components/util/checkbox';
import ModeSelection from '../../components/sidebar/mode-selection';
import { toggleCompareOnOff, changeMode } from '../../modules/compare/actions';
import SearchUiProvider from '../../components/layer/product-picker/search-ui-provider';
import { openCustomContent } from '../../modules/modal/actions';
import { stop as stopAnimationAction } from '../../modules/animation/actions';

const FooterContent = (props) => {
  const {
    isCompareActive,
    compareMode,
    isMobile,
    isPlaying,
    activeTab,
    changeCompareMode,
    addLayers,
    toggleCompare,
    compareFeature,
    stopAnimation,
  } = props;
  const compareBtnText = !isCompareActive
    ? `Start Comparison${isMobile ? ' Mode' : ''}`
    : `Exit Comparison${isMobile ? ' Mode' : ''}`;
    return (activeTab === 'layers') ? (
      <footer>
        <ModeSelection
          isActive={isCompareActive}
          isMobile={isMobile}
          selected={compareMode}
          onclick={changeCompareMode}
        />
        <div className="product-buttons">
          <Button
            id="layers-add"
            aria-label="Add layers"
            className="layers-add red"
            text="+ Add Layers"
            onClick={(e) => {
              e.stopPropagation();
              if (isPlaying) {
                stopAnimation();
              }
              addLayers();
              googleTagManager.pushEvent({
                event: 'add_layers',
              });
            }}
          />
          <Button
            id="compare-toggle-button"
            aria-label={compareBtnText}
            className="compare-toggle-button"
            style={!compareFeature ? { display: 'none' } : null}
            onClick={(e) => {
              e.stopPropagation();
              toggleCompare();
              googleTagManager.pushEvent({
                event: 'comparison_mode',
              });
            }}
            text={compareBtnText}
          />
        </div>
      </footer>
    ) : null;
};

const mapDispatchToProps = (dispatch) => ({
  toggleCompare: () => {
    dispatch(toggleCompareOnOff());
  },
  changeCompareMode: (str) => {
    dispatch(changeMode(str));
  },
  addLayers: () => {
    dispatch(
      openCustomContent('LAYER_PICKER_COMPONENT', {
        headerText: null,
        modalClassName: 'custom-layer-dialog light',
        backdrop: true,
        CompletelyCustomModal: SearchUiProvider,
        wrapClassName: '',
      }),
    );
  },
  stopAnimation: () => {
    dispatch(stopAnimationAction());
  },
});

const mapStateToProps = (state) => {
  const {
    animation, config, compare, browser,
  } = state;
  const { isPlaying } = animation;

  return {
    isMobile: browser.lessThan.medium,
    isPlaying,
    compareFeature: config.features.compare,
    isCompareActive: compare.active,
    compareMode: compare.mode,
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(FooterContent);

FooterContent.propTypes = {
  activeTab: PropTypes.string,
  addLayers: PropTypes.func,
  changeCompareMode: PropTypes.func,
  compareFeature: PropTypes.bool,
  compareMode: PropTypes.string,
  isCompareActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  isPlaying: PropTypes.bool,
  showAll: PropTypes.bool,
  stopAnimation: PropTypes.func,
  toggleCompare: PropTypes.func,
};
