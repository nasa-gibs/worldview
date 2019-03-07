import util from '../../util/util';
import { get } from 'lodash';

export function getDateParameterSetup(
  parameters,
  config,
  models,
  legacyState,
  errors
) {
  const initialState = models.date.selected;
  const modelLoaded = models.date.load(legacyState, errors);
  const bInit = util.dateAdd(initialState, 'day', -7);
  return {
    t: {
      stateKey: 'legacy.date.selected',
      initialState: initialState,
      type: 'date',
      options: {
        serializeNeedsGlobalState: true,
        setAsEmptyItem: true,
        serialize: (currentItemState, state) => {
          // intense hacking!
          // just a temporary crutch
          const isActive = get(state, 'legacy.compare.active');
          const isCompareA = get(models, 'compare.isCompareA');
          const dateB = get(models, 'date.selectedB');
          if (!currentItemState) currentItemState = initialState;
          return !isActive && !isCompareA
            ? serializeDate(dateB)
            : initialState === currentItemState
              ? undefined
              : serializeDate(currentItemState);
        },
        parse: () => {
          return modelLoaded.selected;
        }
      }
    },
    t1: {
      stateKey: 'legacy.date.selectedB',
      initialState: bInit,
      type: 'date',
      options: {
        serializeNeedsGlobalState: true,
        serialize: (currentItemState, state) => {
          const isActive = get(state, 'legacy.compare.active');
          if (!isActive) return undefined;
          if (!currentItemState) currentItemState = bInit;
          return serializeDate(currentItemState || bInit);
        },
        parse: () => {
          return modelLoaded.selectedB || bInit;
        }
      }
    },
    z: {
      stateKey: 'legacy.date.selectedZoom',
      initialState: 3,
      type: 'number',
      options: {
        parse: () => modelLoaded.selectedZoom,
        serialize: () => {
          return models.date.selectedZoom.toString();
        }
      }
    }
  };
}
export function serializeDate(date) {
  return (
    date.toISOString().split('T')[0] +
    '-' +
    'T' +
    date
      .toISOString()
      .split('T')[1]
      .slice(0, -5) +
    'Z'
  );
}
//   return {
//     stateKey: stateKey,
//     initialState: initialState,
//     type: 'date',
//     options: {
//       serialize: date => {
//         if (!date) date = initialState;
//         return serializeDate(date);
//       },
//       parse: str => {
//         return parseDate(str, initialState);
//       }
//     }
//   };
// export function getDateParameterSetup(parameters) {
//   const nowInital = util.now();
//   const now = parseNow(parameters.now);
//   return {
//     t: getPermalinkManagementObject(now, 'legacy.date.selected'),
//     t1: getPermalinkManagementObject(
//       util.dateAdd(now, 'day', -7),
//       'legacy.date.selectedB'
//     ),
//     now: {
//       stateKey: 'legacy.date.now',
//       initialState: nowInital,
//       type: 'date',
//       options: {
//         serialize: serializeDate,
//         parse: parseNow
//       }
//     }
//   };
// }
// export function getPermalinkManagementObject(initialState, stateKey) {
//   return {
//     stateKey: stateKey,
//     initialState: initialState,
//     type: 'date',
//     options: {
//       serialize: date => {
//         if (!date) date = initialState;
//         return serializeDate(date);
//       },
//       parse: str => {
//         return parseDate(str, initialState);
//       }
//     }
//   };
// }

// export function parseNow(date) {
//   try {
//     const now = util.parseDateUTC(date);
//     util.now = function() {
//       return new Date(now.getTime());
//     };
//     return util.now();
//   } catch (error) {
//     util.warn('Invalid now: ' + date + error);
//     return util.now();
//   }
// }
// export function parseDate(str, initialState) {
//   try {
//     return util.parseDateUTC(str);
//   } catch (error) {
//     util.warn('Invalid date:' + str + error);
//     return initialState;
//   }
// }
