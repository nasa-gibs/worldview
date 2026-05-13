import setScreenInfo from './actions';
import { SET_SCREEN_INFO } from './constants';

jest.mock('react-device-detect', () => ({
  isMobileOnly: false,
  isTablet: false,
}));

const reactDeviceDetect = require('react-device-detect');

describe('setScreenInfo', () => {
  beforeEach(() => {
    reactDeviceDetect.isMobileOnly = false;
    reactDeviceDetect.isTablet = false;
  });

  it('returns the correct action type', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });

    const result = setScreenInfo();
    expect(result.type).toBe(SET_SCREEN_INFO);
  });

  it('returns correct screenWidth and screenHeight from window', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 });

    const result = setScreenInfo();
    expect(result.screenWidth).toBe(1280);
    expect(result.screenHeight).toBe(800);
  });

  it('sets isMobileDevice to true when screenWidth < 768', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 });

    const result = setScreenInfo();
    expect(result.isMobileDevice).toBe(true);
  });

  it('sets isMobileDevice to false when screenWidth >= 768 and no mobile flags', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });

    const result = setScreenInfo();
    expect(result.isMobileDevice).toBe(false);
  });

  it('sets isMobileDevice to true when isMobileOnly is true', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });
    reactDeviceDetect.isMobileOnly = true;

    const result = setScreenInfo();
    expect(result.isMobileDevice).toBe(true);
  });

  it('sets isMobileDevice to true when isTablet is true', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });
    reactDeviceDetect.isTablet = true;

    const result = setScreenInfo();
    expect(result.isMobileDevice).toBe(true);
  });

  it('sets orientation to portrait when screenHeight > screenWidth', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 });

    const result = setScreenInfo();
    expect(result.orientation).toBe('portrait');
  });

  it('sets orientation to landscape when screenWidth >= screenHeight', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });

    const result = setScreenInfo();
    expect(result.orientation).toBe('landscape');
  });

  it('sets orientation to landscape when screenWidth equals screenHeight', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });

    const result = setScreenInfo();
    expect(result.orientation).toBe('landscape');
  });

  it('sets isMobilePhone from isMobileOnly', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });
    reactDeviceDetect.isMobileOnly = true;

    const result = setScreenInfo();
    expect(result.isMobilePhone).toBe(true);
  });

  it('sets isMobilePhone to false when isMobileOnly is false', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });

    const result = setScreenInfo();
    expect(result.isMobilePhone).toBe(false);
  });

  it('sets isMobileTablet from isTablet', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });
    reactDeviceDetect.isTablet = true;

    const result = setScreenInfo();
    expect(result.isMobileTablet).toBe(true);
  });

  it('sets isMobileTablet to false when isTablet is false', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });

    const result = setScreenInfo();
    expect(result.isMobileTablet).toBe(false);
  });

  it('returns the full action shape', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });

    const result = setScreenInfo();
    expect(result).toEqual({
      type: SET_SCREEN_INFO,
      screenHeight: 768,
      screenWidth: 1024,
      isMobileDevice: false,
      orientation: 'landscape',
      isMobilePhone: false,
      isMobileTablet: false,
    });
  });
});
