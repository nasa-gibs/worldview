/* eslint-disable camelcase */
import {
  transformLayerNotices,
  separateByType,
  getPriority,
  getNumberOfTypeNotSeen,
  getCount,
  addToLocalStorage,
  getLayerNoticesForLayer,
} from './util';

jest.mock('../../util/local-storage', () => ({
  __esModule: true,
  default: {
    keys: {
      NOTIFICATION_OUTAGE: 'outage',
      NOTIFICATION_ALERT: 'alert',
      NOTIFICATION_MSG: 'message',
    },
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

import safeLocalStorage from '../../util/local-storage';

const OUTAGE = 'outage';
const ALERT = 'alert';
const MSG = 'message';

const makeNotification = (type, created_at, path = '/notifications/status') => ({
  notification_type: type,
  created_at,
  path,
});

beforeEach(() => {
  jest.clearAllMocks();
  safeLocalStorage.getItem.mockReturnValue(null);
});

describe('transformLayerNotices', () => {
  it('extracts layers from path segments after index 2', () => {
    const notices = [{ path: '/layer-notice/MODIS/layer1/layer2', message: 'hello' }];
    const result = transformLayerNotices(notices);
    expect(result[0].layers).toEqual(['MODIS', 'layer1', 'layer2']);
  });

  it('returns an empty layers array when path has no segments after index 2', () => {
    const notices = [{ path: '/layer-notice', message: 'hi' }];
    const result = transformLayerNotices(notices);
    expect(result[0].layers).toEqual([]);
  });

  it('preserves all other properties on the notice', () => {
    const notices = [{ path: '/layer-notice/MODIS/layer1', message: 'test', id: 42 }];
    const result = transformLayerNotices(notices);
    expect(result[0].message).toBe('test');
    expect(result[0].id).toBe(42);
  });

  it('returns an empty array when given an empty array', () => {
    expect(transformLayerNotices([])).toEqual([]);
  });

  it('handles multiple notices', () => {
    const notices = [
      { path: '/layer-notice/MODIS/layerA', message: 'a' },
      { path: '/layer-notice/VIIRS/layerB/layerC', message: 'b' },
    ];
    const result = transformLayerNotices(notices);
    expect(result[0].layers).toEqual(['MODIS', 'layerA']);
    expect(result[1].layers).toEqual(['VIIRS', 'layerB', 'layerC']);
  });
});

describe('separateByType', () => {
  it('separates messages into the messages array', () => {
    const notifications = [makeNotification(MSG, '2023-01-01')];
    const result = separateByType(notifications);
    expect(result.messages).toHaveLength(1);
    expect(result.alerts).toHaveLength(0);
    expect(result.outages).toHaveLength(0);
  });

  it('separates alerts into the alerts array', () => {
    const notifications = [makeNotification(ALERT, '2023-01-01')];
    const result = separateByType(notifications);
    expect(result.alerts).toHaveLength(1);
    expect(result.messages).toHaveLength(0);
    expect(result.outages).toHaveLength(0);
  });

  it('separates outages into the outages array', () => {
    const notifications = [makeNotification(OUTAGE, '2023-01-01')];
    const result = separateByType(notifications);
    expect(result.outages).toHaveLength(1);
    expect(result.messages).toHaveLength(0);
    expect(result.alerts).toHaveLength(0);
  });

  it('separates layer notices from regular notifications', () => {
    const notifications = [
      makeNotification(MSG, '2023-01-01', '/layer-notice/MODIS/layer1'),
    ];
    const result = separateByType(notifications);
    expect(result.layerNotices).toHaveLength(1);
    expect(result.messages).toHaveLength(0);
  });

  it('adds layers property to layer notices', () => {
    const notifications = [
      makeNotification(MSG, '2023-01-01', '/layer-notice/MODIS/layer1'),
    ];
    const result = separateByType(notifications);
    expect(result.layerNotices[0].layers).toEqual(['MODIS', 'layer1']);
  });

  it('sorts each category by date descending', () => {
    const notifications = [
      makeNotification(MSG, '2023-01-01'),
      makeNotification(MSG, '2023-06-01'),
    ];
    const result = separateByType(notifications);
    expect(result.messages[0].created_at).toBe('2023-06-01');
    expect(result.messages[1].created_at).toBe('2023-01-01');
  });

  it('handles mixed types in one array', () => {
    const notifications = [
      makeNotification(MSG, '2023-01-01'),
      makeNotification(ALERT, '2023-02-01'),
      makeNotification(OUTAGE, '2023-03-01'),
      makeNotification(MSG, '2023-01-01', '/layer-notice/MODIS/layer1'),
    ];
    const result = separateByType(notifications);
    expect(result.messages).toHaveLength(1);
    expect(result.alerts).toHaveLength(1);
    expect(result.outages).toHaveLength(1);
    expect(result.layerNotices).toHaveLength(1);
  });

  it('returns empty arrays when given an empty array', () => {
    const result = separateByType([]);
    expect(result.messages).toEqual([]);
    expect(result.alerts).toEqual([]);
    expect(result.outages).toEqual([]);
    expect(result.layerNotices).toEqual([]);
  });

  it('ignores notifications with unrecognized types', () => {
    const notifications = [makeNotification('unknown_type', '2023-01-01')];
    const result = separateByType(notifications);
    expect(result.messages).toHaveLength(0);
    expect(result.alerts).toHaveLength(0);
    expect(result.outages).toHaveLength(0);
  });
});

describe('getPriority', () => {
  it('returns empty string when no notifications are present', () => {
    const result = getPriority({ messages: [], alerts: [], outages: [] });
    expect(result).toBe('');
  });

  it('returns message type when only an unseen message is present', () => {
    safeLocalStorage.getItem.mockReturnValue(null);
    const sorted = {
      messages: [makeNotification(MSG, '2023-01-01')],
      alerts: [],
      outages: [],
    };
    expect(getPriority(sorted)).toBe(MSG);
  });

  it('returns alert type when an unseen alert is present (overrides message)', () => {
    safeLocalStorage.getItem.mockReturnValue(null);
    const sorted = {
      messages: [makeNotification(MSG, '2023-01-01')],
      alerts: [makeNotification(ALERT, '2023-01-01')],
      outages: [],
    };
    expect(getPriority(sorted)).toBe(ALERT);
  });

  it('returns outage type when an unseen outage is present (highest priority)', () => {
    safeLocalStorage.getItem.mockReturnValue(null);
    const sorted = {
      messages: [makeNotification(MSG, '2023-01-01')],
      alerts: [makeNotification(ALERT, '2023-01-01')],
      outages: [makeNotification(OUTAGE, '2023-01-01')],
    };
    expect(getPriority(sorted)).toBe(OUTAGE);
  });

  it('returns empty string when the most recent notification has already been seen', () => {
    safeLocalStorage.getItem.mockReturnValue('2023-12-31');
    const sorted = {
      messages: [],
      alerts: [],
      outages: [makeNotification(OUTAGE, '2023-01-01')],
    };
    expect(getPriority(sorted)).toBe('');
  });

  it('returns outage when outage is newer than what is stored', () => {
    safeLocalStorage.getItem.mockReturnValue('2022-01-01');
    const sorted = {
      messages: [],
      alerts: [],
      outages: [makeNotification(OUTAGE, '2023-06-01')],
    };
    expect(getPriority(sorted)).toBe(OUTAGE);
  });

  it('returns alert when alert is unseen and outage is already seen', () => {
    safeLocalStorage.getItem.mockImplementation((key) => {
      if (key === OUTAGE) return '2023-12-31';
      return null;
    });
    const sorted = {
      messages: [],
      alerts: [makeNotification(ALERT, '2023-01-01')],
      outages: [makeNotification(OUTAGE, '2023-01-01')],
    };
    expect(getPriority(sorted)).toBe(ALERT);
  });
});

describe('getNumberOfTypeNotSeen', () => {
  it('returns the full array length when no storage item exists', () => {
    safeLocalStorage.getItem.mockReturnValue(null);
    const items = [
      { created_at: '2023-06-01' },
      { created_at: '2023-05-01' },
      { created_at: '2023-04-01' },
    ];
    expect(getNumberOfTypeNotSeen(OUTAGE, items)).toBe(3);
  });

  it('returns 0 when all notifications have been seen', () => {
    safeLocalStorage.getItem.mockReturnValue('2023-12-31');
    const items = [
      { created_at: '2023-06-01' },
      { created_at: '2023-05-01' },
    ];
    expect(getNumberOfTypeNotSeen(OUTAGE, items)).toBe(0);
  });

  it('returns correct count when some are newer than the stored date', () => {
    safeLocalStorage.getItem.mockReturnValue('2023-04-15');
    const items = [
      { created_at: '2023-06-01' },
      { created_at: '2023-05-01' },
      { created_at: '2023-03-01' },
    ];
    expect(getNumberOfTypeNotSeen(OUTAGE, items)).toBe(2);
  });

  it('returns 0 when array is empty and no storage item', () => {
    safeLocalStorage.getItem.mockReturnValue(null);
    expect(getNumberOfTypeNotSeen(OUTAGE, [])).toBe(0);
  });

  it('returns 0 when array is empty and storage item exists', () => {
    safeLocalStorage.getItem.mockReturnValue('2023-01-01');
    expect(getNumberOfTypeNotSeen(OUTAGE, [])).toBe(0);
  });

  it('stops counting at the first seen item', () => {
    safeLocalStorage.getItem.mockReturnValue('2023-04-15');
    const items = [
      { created_at: '2023-06-01' },
      { created_at: '2023-03-01' },
      { created_at: '2023-02-01' },
    ];
    expect(getNumberOfTypeNotSeen(OUTAGE, items)).toBe(1);
  });
});

describe('getCount', () => {
  it('returns the sum of messages, alerts, and outages', () => {
    const notifications = {
      messages: [{ id: 1 }, { id: 2 }],
      alerts: [{ id: 3 }],
      outages: [{ id: 4 }, { id: 5 }, { id: 6 }],
    };
    expect(getCount(notifications)).toBe(6);
  });

  it('returns 0 when all arrays are empty', () => {
    expect(getCount({ messages: [], alerts: [], outages: [] })).toBe(0);
  });

  it('does not count layerNotices', () => {
    const notifications = {
      messages: [{ id: 1 }],
      alerts: [],
      outages: [],
      layerNotices: [{ id: 2 }, { id: 3 }],
    };
    expect(getCount(notifications)).toBe(1);
  });

  it('returns correct count with only messages', () => {
    expect(getCount({ messages: [{ id: 1 }, { id: 2 }], alerts: [], outages: [] })).toBe(2);
  });

  it('returns correct count with only alerts', () => {
    expect(getCount({ messages: [], alerts: [{ id: 1 }], outages: [] })).toBe(1);
  });

  it('returns correct count with only outages', () => {
    expect(getCount({ messages: [], alerts: [], outages: [{ id: 1 }, { id: 2 }] })).toBe(2);
  });
});

describe('addToLocalStorage', () => {
  it('stores message, outage, and alert created_at values', () => {
    addToLocalStorage({
      messages: [{ created_at: '2023-01-01' }],
      outages: [{ created_at: '2023-02-01' }],
      alerts: [{ created_at: '2023-03-01' }],
    });
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith(OUTAGE, '2023-02-01');
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith(ALERT, '2023-03-01');
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith(MSG, '2023-01-01');
  });

  it('does not call setItem for outage when outages array is empty', () => {
    addToLocalStorage({
      messages: [{ created_at: '2023-01-01' }],
      outages: [],
      alerts: [],
    });
    expect(safeLocalStorage.setItem).not.toHaveBeenCalledWith(OUTAGE, expect.anything());
  });

  it('does not call setItem when all arrays are empty', () => {
    addToLocalStorage({
      messages: [],
      outages: [],
      alerts: [],
    });
    expect(safeLocalStorage.setItem).not.toHaveBeenCalled();
  });

  it('does not call setItem for message when messages array is empty', () => {
    addToLocalStorage({
      messages: [],
      outages: [{ created_at: '2023-01-01' }],
      alerts: [],
    });
    expect(safeLocalStorage.setItem).not.toHaveBeenCalledWith(MSG, expect.anything());
  });

  it('only stores the first item from each array', () => {
    addToLocalStorage({
      messages: [{ created_at: '2023-06-01' }, { created_at: '2023-01-01' }],
      outages: [{ created_at: '2023-05-01' }, { created_at: '2023-02-01' }],
      alerts: [{ created_at: '2023-04-01' }, { created_at: '2023-03-01' }],
    });
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith(MSG, '2023-06-01');
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith(OUTAGE, '2023-05-01');
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith(ALERT, '2023-04-01');
    expect(safeLocalStorage.setItem).not.toHaveBeenCalledWith(MSG, '2023-01-01');
  });
});

describe('getLayerNoticesForLayer', () => {
  const buildNotifications = (layerNotices) => ({ object: { layerNotices } });

  it('returns an empty string when no layer notices match the layer', () => {
    const notifications = buildNotifications([
      { layers: ['layer2'], message: 'Notice for layer2' },
    ]);
    expect(getLayerNoticesForLayer('layer1', notifications)).toBe('');
  });

  it('returns formatted HTML for a matching layer notice', () => {
    const notifications = buildNotifications([
      { layers: ['layer1'], message: 'Notice A' },
    ]);
    expect(getLayerNoticesForLayer('layer1', notifications)).toBe('  <div>Notice A</div>');
  });

  it('concatenates multiple matching notices', () => {
    const notifications = buildNotifications([
      { layers: ['layer1'], message: 'Notice A' },
      { layers: ['layer1'], message: 'Notice B' },
    ]);
    const result = getLayerNoticesForLayer('layer1', notifications);
    expect(result).toBe('  <div>Notice A</div>  <div>Notice B</div>');
  });

  it('filters out non-matching layer notices', () => {
    const notifications = buildNotifications([
      { layers: ['layer1'], message: 'Notice A' },
      { layers: ['layer2'], message: 'Notice B' },
    ]);
    const result = getLayerNoticesForLayer('layer1', notifications);
    expect(result).toBe('  <div>Notice A</div>');
  });

  it('returns empty string when layerNotices is an empty array', () => {
    const notifications = buildNotifications([]);
    expect(getLayerNoticesForLayer('layer1', notifications)).toBe('');
  });

  it('returns empty string when layerNotices is null or undefined', () => {
    const notifications = buildNotifications(null);
    expect(getLayerNoticesForLayer('layer1', notifications)).toBe('');
  });
});
