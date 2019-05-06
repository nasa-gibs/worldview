import Tour from '../../containers/tour';
export const START = 'TOUR/START_TOUR';
export const UPDATE_SELECTED = 'TOUR/UPDATE_SELECTED_STORY';

const customModalProps = {
  backdrop: false,
  CompletelyCustomModal: Tour,
  clickableBehindModal: true
};

export const tourStartModalCustomProps = {
  isOpen: true,
  isCustom: true,
  customProps: customModalProps,
  id: 'TOUR__MODAL',
  headerText: '',
  bodyText: ''
};
