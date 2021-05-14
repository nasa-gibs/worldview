// import googleTagManager from 'googleTagManager';

// import { TOGGLE_EMBED_MODE } from './constants';
// import { CLOSE as CLOSE_MODAL } from '../modal/constants';

// export default function toggleDistractionFreeMode() {
//   return (dispatch, getState) => {
//     const { modal, ui } = getState();
//     const { isDistractionFreeModeActive } = ui;
//     const modalIsOpen = modal.isOpen;
//     if (!isDistractionFreeModeActive) {
//       googleTagManager.pushEvent({
//         event: 'init_distraction_free_mode',
//       });
//     }
//     dispatch({
//       type: TOGGLE_EMBED_MODE,
//       isDistractionFreeModeActive: !isDistractionFreeModeActive,
//     });
//     if (!isDistractionFreeModeActive && modalIsOpen) {
//       dispatch({ type: CLOSE_MODAL });
//     }
//   };
// }
