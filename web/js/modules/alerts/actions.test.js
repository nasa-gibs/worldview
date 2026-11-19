import {
  enableDDVZoomAlert,
  enableDDVLocationAlert,
  disableDDVZoomAlert,
  disableDDVLocationAlert,
} from './actions';

jest.mock('./constants', () => ({
  ACTIVATE_DDV_ZOOM_ALERT: 'ACTIVATE_DDV_ZOOM_ALERT',
  ACTIVATE_DDV_LOCATION_ALERT: 'ACTIVATE_DDV_LOCATION_ALERT',
  DEACTIVATE_DDV_ZOOM_ALERT: 'DEACTIVATE_DDV_ZOOM_ALERT',
  DEACTIVATE_DDV_LOCATION_ALERT: 'DEACTIVATE_DDV_LOCATION_ALERT',
}));

describe('enableDDVZoomAlert', () => {
  it('returns an action with type ACTIVATE_DDV_ZOOM_ALERT', () => {
    const result = enableDDVZoomAlert('Zoom Alert');
    expect(result.type).toBe('ACTIVATE_DDV_ZOOM_ALERT');
  });

  it('returns an action with the provided title', () => {
    const result = enableDDVZoomAlert('Zoom Alert');
    expect(result.title).toBe('Zoom Alert');
  });

  it('returns an action with an undefined title when none is provided', () => {
    const result = enableDDVZoomAlert();
    expect(result.title).toBeUndefined();
  });

  it('returns a plain object', () => {
    const result = enableDDVZoomAlert('Zoom Alert');
    expect(typeof result).toBe('object');
    expect(typeof result.then).toBe('undefined');
  });
});

describe('enableDDVLocationAlert', () => {
  it('returns an action with type ACTIVATE_DDV_LOCATION_ALERT', () => {
    const result = enableDDVLocationAlert('Location Alert');
    expect(result.type).toBe('ACTIVATE_DDV_LOCATION_ALERT');
  });

  it('returns an action with the provided title', () => {
    const result = enableDDVLocationAlert('Location Alert');
    expect(result.title).toBe('Location Alert');
  });

  it('returns an action with an undefined title when none is provided', () => {
    const result = enableDDVLocationAlert();
    expect(result.title).toBeUndefined();
  });

  it('returns a plain object', () => {
    const result = enableDDVLocationAlert('Location Alert');
    expect(typeof result).toBe('object');
    expect(typeof result.then).toBe('undefined');
  });
});

describe('disableDDVZoomAlert', () => {
  it('returns an action with type DEACTIVATE_DDV_ZOOM_ALERT', () => {
    const result = disableDDVZoomAlert('Zoom Alert');
    expect(result.type).toBe('DEACTIVATE_DDV_ZOOM_ALERT');
  });

  it('returns an action with the provided title', () => {
    const result = disableDDVZoomAlert('Zoom Alert');
    expect(result.title).toBe('Zoom Alert');
  });

  it('returns an action with an undefined title when none is provided', () => {
    const result = disableDDVZoomAlert();
    expect(result.title).toBeUndefined();
  });

  it('returns a plain object', () => {
    const result = disableDDVZoomAlert('Zoom Alert');
    expect(typeof result).toBe('object');
    expect(typeof result.then).toBe('undefined');
  });
});

describe('disableDDVLocationAlert', () => {
  it('returns an action with type DEACTIVATE_DDV_LOCATION_ALERT', () => {
    const result = disableDDVLocationAlert('Location Alert');
    expect(result.type).toBe('DEACTIVATE_DDV_LOCATION_ALERT');
  });

  it('returns an action with the provided title', () => {
    const result = disableDDVLocationAlert('Location Alert');
    expect(result.title).toBe('Location Alert');
  });

  it('returns an action with an undefined title when none is provided', () => {
    const result = disableDDVLocationAlert();
    expect(result.title).toBeUndefined();
  });

  it('returns a plain object', () => {
    const result = disableDDVLocationAlert('Location Alert');
    expect(typeof result).toBe('object');
    expect(typeof result.then).toBe('undefined');
  });
});
