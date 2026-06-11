import combineModels from './combine-models';

jest.mock('./util/util', () => ({
  events: 'mockEvents',
}));

jest.mock('./map/model', () => jest.fn(() => 'mockMapModel'));

import mapModel from './map/model';

describe('combineModels', () => {
  const config = { foo: 'bar' };

  it('returns a models object', () => {
    const models = combineModels(config);
    expect(models).toBeDefined();
  });

  it('includes wv.events from util', () => {
    const models = combineModels(config);
    expect(models.wv.events).toBe('mockEvents');
  });

  it('includes map model', () => {
    const models = combineModels(config);
    expect(models.map).toBe('mockMapModel');
  });

  it('calls mapModel with models and config', () => {
    combineModels(config);
    expect(mapModel).toHaveBeenCalledWith(
      expect.objectContaining({ wv: { events: 'mockEvents' } }),
      config,
    );
  });

  it('passes models reference containing wv to mapModel', () => {
    combineModels(config);
    expect(mapModel.mock.calls[0][0].wv).toEqual({ events: 'mockEvents' });
  });

  it('passes config to mapModel', () => {
    combineModels(config);
    expect(mapModel.mock.calls[0][1]).toBe(config);
  });
});
