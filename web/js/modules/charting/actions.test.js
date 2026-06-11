import {
  toggleChartingModeOnOff,
  toggleChartingAOIOnOff,
  updateRequestInProgressAction,
  updateModalOpenAction,
  toggleAOISelected,
  updateChartingDateSelection,
  updateChartingAOICoordinates,
  changeChartingStartDate,
  changeChartingEndDate,
  updateActiveChartingLayerAction,
} from './actions';

jest.mock('./constants', () => ({
  TOGGLE_ON_OFF: 'TOGGLE_ON_OFF',
  TOGGLE_AOI_ON_OFF: 'TOGGLE_AOI_ON_OFF',
  UPDATE_AOI_COORDINATES: 'UPDATE_AOI_COORDINATES',
  TOGGLE_AOI_SELECTED_ON_OFF: 'TOGGLE_AOI_SELECTED_ON_OFF',
  TOGGLE_REQUEST_IN_PROGRESS: 'TOGGLE_REQUEST_IN_PROGRESS',
  TOGGLE_MODAL_OPEN: 'TOGGLE_MODAL_OPEN',
  UPDATE_CHARTING_DATE_SELECTION: 'UPDATE_CHARTING_DATE_SELECTION',
  UPDATE_START_DATE: 'UPDATE_START_DATE',
  UPDATE_END_DATE: 'UPDATE_END_DATE',
  UPDATE_ACTIVE_CHART: 'UPDATE_ACTIVE_CHART',
}));

describe('toggleChartingModeOnOff', () => {
  it('dispatches TOGGLE_ON_OFF', () => {
    const dispatch = jest.fn();
    toggleChartingModeOnOff()(dispatch);
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_ON_OFF' });
  });

  it('dispatches exactly once', () => {
    const dispatch = jest.fn();
    toggleChartingModeOnOff()(dispatch);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});

describe('toggleChartingAOIOnOff', () => {
  it('dispatches TOGGLE_AOI_ON_OFF', () => {
    const dispatch = jest.fn();
    toggleChartingAOIOnOff()(dispatch);
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_AOI_ON_OFF' });
  });

  it('dispatches exactly once', () => {
    const dispatch = jest.fn();
    toggleChartingAOIOnOff()(dispatch);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});

describe('updateRequestInProgressAction', () => {
  it('dispatches TOGGLE_REQUEST_IN_PROGRESS with a true status', () => {
    const dispatch = jest.fn();
    updateRequestInProgressAction(true)(dispatch);
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_REQUEST_IN_PROGRESS', status: true });
  });

  it('dispatches TOGGLE_REQUEST_IN_PROGRESS with a false status', () => {
    const dispatch = jest.fn();
    updateRequestInProgressAction(false)(dispatch);
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_REQUEST_IN_PROGRESS', status: false });
  });

  it('dispatches exactly once', () => {
    const dispatch = jest.fn();
    updateRequestInProgressAction(true)(dispatch);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});

describe('updateModalOpenAction', () => {
  it('dispatches TOGGLE_MODAL_OPEN with a true status', () => {
    const dispatch = jest.fn();
    updateModalOpenAction(true)(dispatch);
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_MODAL_OPEN', status: true });
  });

  it('dispatches TOGGLE_MODAL_OPEN with a false status', () => {
    const dispatch = jest.fn();
    updateModalOpenAction(false)(dispatch);
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_MODAL_OPEN', status: false });
  });

  it('dispatches exactly once', () => {
    const dispatch = jest.fn();
    updateModalOpenAction(false)(dispatch);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});

describe('toggleAOISelected', () => {
  it('dispatches TOGGLE_AOI_SELECTED_ON_OFF with a provided action', () => {
    const dispatch = jest.fn();
    toggleAOISelected('some-action')(dispatch);
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_AOI_SELECTED_ON_OFF', action: 'some-action' });
  });

  it('dispatches TOGGLE_AOI_SELECTED_ON_OFF with null when no action is provided', () => {
    const dispatch = jest.fn();
    toggleAOISelected()(dispatch);
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_AOI_SELECTED_ON_OFF', action: null });
  });

  it('dispatches TOGGLE_AOI_SELECTED_ON_OFF with an explicit null action', () => {
    const dispatch = jest.fn();
    toggleAOISelected(null)(dispatch);
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_AOI_SELECTED_ON_OFF', action: null });
  });

  it('dispatches exactly once', () => {
    const dispatch = jest.fn();
    toggleAOISelected('some-action')(dispatch);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});

describe('updateChartingDateSelection', () => {
  it('dispatches UPDATE_CHARTING_DATE_SELECTION with the buttonClicked value', () => {
    const dispatch = jest.fn();
    updateChartingDateSelection('start')(dispatch);
    expect(dispatch).toHaveBeenCalledWith({ type: 'UPDATE_CHARTING_DATE_SELECTION', buttonClicked: 'start' });
  });

  it('dispatches UPDATE_CHARTING_DATE_SELECTION with an alternate buttonClicked value', () => {
    const dispatch = jest.fn();
    updateChartingDateSelection('end')(dispatch);
    expect(dispatch).toHaveBeenCalledWith({ type: 'UPDATE_CHARTING_DATE_SELECTION', buttonClicked: 'end' });
  });

  it('dispatches exactly once', () => {
    const dispatch = jest.fn();
    updateChartingDateSelection('start')(dispatch);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});

describe('updateChartingAOICoordinates', () => {
  it('dispatches UPDATE_AOI_COORDINATES with the given extent', () => {
    const dispatch = jest.fn();
    const extent = [-180, -90, 180, 90];
    updateChartingAOICoordinates(extent)(dispatch);
    expect(dispatch).toHaveBeenCalledWith({ type: 'UPDATE_AOI_COORDINATES', extent });
  });

  it('dispatches with an extent of null', () => {
    const dispatch = jest.fn();
    updateChartingAOICoordinates(null)(dispatch);
    expect(dispatch).toHaveBeenCalledWith({ type: 'UPDATE_AOI_COORDINATES', extent: null });
  });

  it('dispatches exactly once', () => {
    const dispatch = jest.fn();
    updateChartingAOICoordinates([0, 0, 1, 1])(dispatch);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});

describe('changeChartingStartDate', () => {
  it('dispatches UPDATE_START_DATE with the given date', () => {
    const dispatch = jest.fn();
    const date = new Date('2024-01-01');
    changeChartingStartDate(date)(dispatch);
    expect(dispatch).toHaveBeenCalledWith({ type: 'UPDATE_START_DATE', date });
  });

  it('dispatches UPDATE_START_DATE with a string date', () => {
    const dispatch = jest.fn();
    changeChartingStartDate('2024-01-01')(dispatch);
    expect(dispatch).toHaveBeenCalledWith({ type: 'UPDATE_START_DATE', date: '2024-01-01' });
  });

  it('dispatches exactly once', () => {
    const dispatch = jest.fn();
    changeChartingStartDate(new Date())(dispatch);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});

describe('changeChartingEndDate', () => {
  it('dispatches UPDATE_END_DATE with the given date', () => {
    const dispatch = jest.fn();
    const date = new Date('2024-12-31');
    changeChartingEndDate(date)(dispatch);
    expect(dispatch).toHaveBeenCalledWith({ type: 'UPDATE_END_DATE', date });
  });

  it('dispatches UPDATE_END_DATE with a string date', () => {
    const dispatch = jest.fn();
    changeChartingEndDate('2024-12-31')(dispatch);
    expect(dispatch).toHaveBeenCalledWith({ type: 'UPDATE_END_DATE', date: '2024-12-31' });
  });

  it('dispatches exactly once', () => {
    const dispatch = jest.fn();
    changeChartingEndDate(new Date())(dispatch);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});

describe('updateActiveChartingLayerAction', () => {
  it('dispatches UPDATE_ACTIVE_CHART with the given layerId', () => {
    const dispatch = jest.fn();
    updateActiveChartingLayerAction('layer-123')(dispatch);
    expect(dispatch).toHaveBeenCalledWith({ type: 'UPDATE_ACTIVE_CHART', layerId: 'layer-123' });
  });

  it('dispatches UPDATE_ACTIVE_CHART with a null layerId', () => {
    const dispatch = jest.fn();
    updateActiveChartingLayerAction(null)(dispatch);
    expect(dispatch).toHaveBeenCalledWith({ type: 'UPDATE_ACTIVE_CHART', layerId: null });
  });

  it('dispatches exactly once', () => {
    const dispatch = jest.fn();
    updateActiveChartingLayerAction('layer-123')(dispatch);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});
