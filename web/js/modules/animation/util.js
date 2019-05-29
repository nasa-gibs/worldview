import {
  cloneDeep as lodashCloneDeep,
  get,
  round as lodashRound
} from 'lodash';
import canvg from 'canvg-browser';

export function getAnimationParameterSetup(
  parameters,
  config,
  models,
  legacyState,
  errors
) {
  const loadedModel = lodashCloneDeep(models.anim.load(legacyState, errors)); // use legacy parser
  const initialEnd = get(models, 'date.selected');
  const initialStart = get(models, 'date.selectedB');

  return {
    ab: {
      stateKey: 'legacy.anim.rangeState.state',
      initialState: 'off',
      options: {
        parse: () => {
          return get(loadedModel, 'rangeState.state') || 'off';
        },
        serialize: () => {
          return get(models, 'anim.rangeState.state') || 'off';
        }
      }
    },
    as: {
      stateKey: 'legacy.anim.rangeState.startDate',
      initialState: initialEnd,
      type: 'date',
      options: {
        parse: () => {
          return get(loadedModel, 'rangeState.startDate');
        },
        serialize: () => {
          const isAnimationActive =
            get(models, 'anim.rangeState.state') === 'on';
          return isAnimationActive
            ? get(models, 'anim.rangeState.startDate')
            : undefined;
        }
      }
    },
    ae: {
      stateKey: 'legacy.anim.rangeState.endDate',
      initialState: initialStart,
      type: 'date',
      options: {
        parse: () => {
          return get(loadedModel, 'rangeState.endDate') || undefined;
        },
        serialize: () => {
          const isAnimationActive =
            get(models, 'anim.rangeState.state') === 'on';
          return isAnimationActive
            ? get(models, 'anim.rangeState.endDate')
            : undefined;
        }
      }
    },
    av: {
      stateKey: 'legacy.anim.rangeState.speed',
      initialState: 3.0,
      type: 'number',
      options: {
        serializeNeedsGlobalState: true,
        parse: () => {
          return get(loadedModel, 'anim.rangeState.speed') || 3.0;
        },
        serialize: (currentItemState, state) => {
          const isAnimationActive =
            get(models, 'anim.rangeState.state') === 'on';
          return isAnimationActive
            ? get(models, 'anim.rangeState.speed')
            : undefined;
        }
      }
    },
    al: {
      stateKey: 'legacy.anim.rangeState.loop',
      type: 'bool',
      initialState: false,
      options: {
        setAsEmptyItem: true,
        parse: () => {
          return get(loadedModel, 'rangeState.loop');
        },
        serialize: (currentItemState, state) => {
          const isAnimationActive =
            get(models, 'anim.rangeState.state') === 'on';
          return isAnimationActive
            ? get(models, 'anim.rangeState.loop')
            : undefined;
        }
      }
    }
  };
}
export function getStampProps(
  stampWidthRatio,
  breakPoint,
  stampWidth,
  dimensions,
  width,
  height
) {
  var dateStamp = {};
  var stampHeight;
  var stampHeightByImageWidth;
  // Set Logo-stamp dimensions based upon smallest total image dimension
  if (dimensions.w < breakPoint) {
    stampHeight =
      (width * 0.7) / stampWidthRatio < 60
        ? (width * 0.7) / stampWidthRatio
        : 60;
    dateStamp.fontSize =
      dimensions.h > stampHeight * 1.5 ? lodashRound(stampHeight * 0.65) : 0;
    dateStamp.align = 'left';
    dateStamp.x = width * 0.01;
    dateStamp.y = height - (dateStamp.fontSize + height * 0.01) - 4;
  } else {
    stampWidth = width * 0.4;
    stampHeightByImageWidth = stampWidth / stampWidthRatio;
    stampHeight =
      stampHeightByImageWidth < 20
        ? 20
        : stampHeightByImageWidth > 60
          ? 60
          : stampHeightByImageWidth;
    dateStamp.fontSize =
      dimensions.h > stampHeight * 1.5 ? lodashRound(stampHeight * 0.65) : 0;
    dateStamp.y = height - (dateStamp.fontSize + height * 0.01) - 4;
    dateStamp.x = width * 0.01;
    dateStamp.align = 'left';
  }
  return { stampHeight: stampHeight, dateStamp: dateStamp };
}
export function svgToPng(svgURL, stampHeight) {
  var newImage;
  var canvasEl = document.createElement('canvas');
  var canvgOptions = {
    log: false,
    ignoreMouse: true,
    scaleHeight: stampHeight
  };
  canvg(canvasEl, svgURL, canvgOptions);
  newImage = new Image();
  newImage.src = canvasEl.toDataURL('image/png');
  newImage.width = canvasEl.width;
  newImage.height = canvasEl.height;

  return newImage;
}
