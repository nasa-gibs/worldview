/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { isMobileOnly, isTablet } from 'react-device-detect';
import googleTagManager from 'googleTagManager';
import { Plus } from '@edsc/earthdata-react-icons/horizon-design-system/hds/ui';
import Button from '../../components/util/button';
import {
  toggleOverlayGroups as toggleOverlayGroupsAction,
} from '../../modules/layers/actions';
import Checkbox from '../../components/util/checkbox';
import SearchUiProvider from '../../components/layer/product-picker/search-ui-provider';
import { openCustomContent } from '../../modules/modal/actions';
import { stop as stopAnimationAction } from '../../modules/animation/actions';

function AddLayersContent (props) {
  const {
    groupOverlays,
    isActive,
    isEmbedModeActive,
    isAnimating,
    isMobile,
    breakpoints,
    screenWidth,
    toggleOverlayGroups,
    addLayers,
  } = props;

  const onClickAddLayers = (e) => {
    e.stopPropagation();
    addLayers(isAnimating, isMobile, breakpoints, screenWidth);
    googleTagManager.pushEvent({ event: 'add_layers' });
  };

  return isActive && !isEmbedModeActive && (
    <>
      <div className="product-buttons">
        <Button
          id="layers-add"
          aria-label="Add layers"
          className="layers-add red"
          text={(
            <>
              <Plus class="add-plus" size="10px" />
              Add Layers
            </>
          )}
          onClick={onClickAddLayers}
        />
        <div className="layers-add-container">
          <Checkbox
            id="group-overlays-checkbox"
            checked={groupOverlays}
            onCheck={toggleOverlayGroups}
            label="Group Similar Layers"
          />
        </div>
      </div>
      <hr className="product-section-break" />
    </>
  );
}

const mapStateToProps = (state, ownProps) => {
  const { compareState } = ownProps;
  const {
    embed, layers, animation, screenSize,
  } = state;
  const { isEmbedModeActive } = embed;
  const isMobile = screenSize.isMobileDevice;
  const { groupOverlays } = layers[compareState];

  return {
    isAnimating: animation.isPlaying,
    isEmbedModeActive,
    isMobile,
    breakpoints: screenSize.breakpoints,
    screenWidth: screenSize.screenWidth,
    groupOverlays,
  };
};

const mapDispatchToProps = (dispatch) => ({
  toggleOverlayGroups: () => {
    setTimeout(() => {
      dispatch(toggleOverlayGroupsAction());
    });
  },
  addLayers: (isPlaying) => {
    const modalClassName = isMobileOnly || isTablet ? 'custom-layer-dialog-mobile custom-layer-dialog light' : 'custom-layer-dialog light';
    if (isPlaying) {
      dispatch(stopAnimationAction());
    }
    dispatch(
      openCustomContent('LAYER_PICKER_COMPONENT', {
        headerText: null,
        modalClassName,
        backdrop: true,
        CompletelyCustomModal: SearchUiProvider,
        wrapClassName: '',
      }),
    );
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(AddLayersContent);

AddLayersContent.propTypes = {
  groupOverlays: PropTypes.bool,
  isActive: PropTypes.bool,
  isAnimating: PropTypes.bool,
  isEmbedModeActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  toggleOverlayGroups: PropTypes.func,
  breakpoints: PropTypes.object,
  screenWidth: PropTypes.number,
  addLayers: PropTypes.func,
};
