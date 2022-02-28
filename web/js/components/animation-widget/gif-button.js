import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UncontrolledTooltip } from 'reactstrap';
import googleTagManager from 'googleTagManager';
import {
  cloneDeep as lodashCloneDeep,
  find as lodashFind,
  filter as lodashFilter,
  get as lodashGet,
} from 'lodash';
import GifContainer from '../../containers/gif';
import {
  toggleComponentGifActive,
  changeStartAndEndDate,
} from '../../modules/animation/actions';
import { clearCustoms, refreshPalettes } from '../../modules/palettes/actions';
import { clearRotate, refreshRotation } from '../../modules/map/actions';
import {
  clearGraticule, refreshGraticule, hideLayers, showLayers,
} from '../../modules/layers/actions';
import {
  getActiveLayers,
  getAllActiveLayers,
} from '../../modules/layers/selectors';
import {
  getNonDownloadableLayers,
  getNonDownloadableLayerWarning,
  hasNonDownloadableVisibleLayer,
} from '../../modules/image-download/util';
import Notify from '../image-download/notify';
import { notificationWarnings } from '../../modules/image-download/constants';
import { onToggle, openCustomContent } from '../../modules/modal/actions';
import { hasCustomPaletteInActiveProjection } from '../../modules/palettes/util';

const maxGifFrames = 40;
let onCloseGif;

const GifButton = (props) => {
  const {
    toggleGif,
    onUpdateStartAndEndDate,
    hasCustomPalettes,
    isRotated,
    hasGraticule,
    rotation,
    activePalettes,
    numberOfFrames,
    refreshStateAfterGif,
    hasNonDownloadableLayer,
    visibleLayersForProj,
    proj,
    notify,
    isGifActive,
    zeroDates,
  } = props;

  const gifDisabled = numberOfFrames >= maxGifFrames;
  const elemExists = document.querySelector('#create-gif-button');
  const showWarning = elemExists && gifDisabled;
  const warningMessage = (
    <span>
      Too many frames were selected.
      <br />
      Please request less than 40 frames if you would like to generate a GIF.
    </span>
  );
  const labelText = 'Create an animated GIF';
  const getPromise = (bool, type, action) => {
    if (bool) {
      return notify(type, action, visibleLayersForProj);
    }
    return Promise.resolve(type);
  };

  const openGif = async () => {
    const { startDate, endDate } = zeroDates();
    if (gifDisabled) {
      return;
    }
    const nonDownloadableLayers = hasNonDownloadableLayer ? getNonDownloadableLayers(visibleLayersForProj) : null;
    const paletteStore = lodashCloneDeep(activePalettes);
    await getPromise(hasCustomPalettes, 'palette', clearCustoms, 'Notice');
    await getPromise(isRotated, 'rotate', clearRotate, 'Reset rotation');
    await getPromise(hasGraticule && proj.id === 'geographic', 'graticule', clearGraticule, 'Remove Graticule?');
    await getPromise(hasNonDownloadableLayer, 'layers', hideLayers, 'Remove Layers?');
    await onUpdateStartAndEndDate(startDate, endDate);
    googleTagManager.pushEvent({
      event: 'GIF_create_animated_button',
    });

    onCloseGif = () => {
      refreshStateAfterGif(hasCustomPalettes ? paletteStore : undefined, rotation, hasGraticule, nonDownloadableLayers);
      toggleGif();
    };
    toggleGif();
  };

  return (
    <>
      <a
        id="create-gif-button"
        aria-label={labelText}
        className={gifDisabled ? 'wv-icon-case no-drag disabled' : 'wv-icon-case no-drag'}
        onClick={openGif}
      >
        <FontAwesomeIcon
          id="wv-animation-widget-file-video-icon"
          className="wv-animation-widget-icon"
          icon="file-video"
        />
        <UncontrolledTooltip
          placement="right"
          target="create-gif-button"
        >
          {showWarning ? warningMessage : labelText}
        </UncontrolledTooltip>
      </a>
      {isGifActive && <GifContainer onClose={onCloseGif} />}
    </>
  );
};

const mapStateToProps = (state) => {
  const {
    animation, palettes, compare, map, proj,
  } = state;
  const activeLayersForProj = getAllActiveLayers(state);
  const visibleLayersForProj = lodashFilter(activeLayersForProj, 'visible');
  const activePalettes = palettes[compare.activeString];
  const hasCustomPalettes = hasCustomPaletteInActiveProjection(
    activeLayersForProj,
    activePalettes,
  );
  const activeLayers = getActiveLayers(state);
  return {
    activePalettes,
    hasCustomPalettes,
    hasGraticule: Boolean(
      lodashGet(
        lodashFind(activeLayers, { id: 'Graticule' }) || {},
        'visible',
      ),
    ),
    hasNonDownloadableLayer: hasNonDownloadableVisibleLayer(visibleLayersForProj),
    isGifActive: animation.gifActive,
    isRotated: Boolean(map.rotation !== 0),
    proj,
    rotation: map.rotation,
    visibleLayersForProj,
  };
};

const mapDispatchToProps = (dispatch) => ({
  toggleGif: () => {
    dispatch(toggleComponentGifActive());
  },
  onUpdateStartAndEndDate: (startDate, endDate) => {
    dispatch(changeStartAndEndDate(startDate, endDate));
  },
  refreshStateAfterGif: (activePalettes, rotation, isGraticule, nonDownloadableLayers) => {
    if (activePalettes) {
      dispatch(refreshPalettes(activePalettes));
    }
    if (rotation) {
      dispatch(refreshRotation(rotation));
    }
    if (isGraticule) {
      dispatch(refreshGraticule(isGraticule));
    }
    if (nonDownloadableLayers) {
      dispatch(showLayers(nonDownloadableLayers));
    }
  },
  notify: (type, action, visibleLayersForProj) => new Promise((resolve, reject, cancel) => {
    const nonDownloadableLayers = type !== 'layers' ? null : getNonDownloadableLayers(visibleLayersForProj);
    const bodyComponentProps = {
      bodyText: type !== 'layers' ? notificationWarnings[type] : getNonDownloadableLayerWarning(nonDownloadableLayers),
      cancel: () => {
        dispatch(onToggle());
      },
      accept: () => {
        dispatch(action(nonDownloadableLayers));
        dispatch(onToggle());
        resolve();
      },
    };
    dispatch(
      openCustomContent(`image_download_notify_${type}`, {
        headerText: 'Notify',
        bodyComponent: Notify,
        size: 'sm',
        modalClassName: 'notify',
        bodyComponentProps,
      }),
    );
  }),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GifButton);

GifButton.propTypes = {
  activePalettes: PropTypes.object,
  visibleLayersForProj: PropTypes.array,
  hasCustomPalettes: PropTypes.bool,
  hasGraticule: PropTypes.bool,
  hasNonDownloadableLayer: PropTypes.bool,
  isGifActive: PropTypes.bool,
  isRotated: PropTypes.bool,
  notify: PropTypes.func,
  numberOfFrames: PropTypes.number,
  onUpdateStartAndEndDate: PropTypes.func,
  proj: PropTypes.object,
  refreshStateAfterGif: PropTypes.func,
  rotation: PropTypes.number,
  toggleGif: PropTypes.func,
  zeroDates: PropTypes.func,
};
