import googleTagManager from './google-tag-manager';

describe('google-tag-manager module', () => {
  describe('module-level virtualPageView push', () => {
    it('pushes a virtualPageView event on import', () => {
      const entry = window.dataLayer.find((e) => e.event === 'virtualPageView');
      expect(entry).toBeDefined();
    });

    it('virtualPageView entry contains page_location', () => {
      const entry = window.dataLayer.find((e) => e.event === 'virtualPageView');
      expect(entry).toHaveProperty('page_location');
    });

    it('virtualPageView entry contains page_title', () => {
      const entry = window.dataLayer.find((e) => e.event === 'virtualPageView');
      expect(entry).toHaveProperty('page_title');
    });

    it('virtualPageView entry contains page_referrer', () => {
      const entry = window.dataLayer.find((e) => e.event === 'virtualPageView');
      expect(entry).toHaveProperty('page_referrer');
    });
  });

  describe('pushEvent()', () => {
    beforeEach(() => {
      window.dataLayer = [];
    });

    it('pushes the supplied event object onto dataLayer', () => {
      const event = { event: 'testEvent', value: 42 };
      googleTagManager.pushEvent(event);
      expect(window.dataLayer).toContainEqual(event);
    });

    it('pushes multiple events in order', () => {
      const e1 = { event: 'first' };
      const e2 = { event: 'second' };
      googleTagManager.pushEvent(e1);
      googleTagManager.pushEvent(e2);
      expect(window.dataLayer[0]).toEqual(e1);
      expect(window.dataLayer[1]).toEqual(e2);
    });

    it('does not push when dataLayer is undefined', () => {
      // Remove dataLayer from window to simulate undefined
      const saved = window.dataLayer;
      delete window.dataLayer;

      // dataLayer global is now undefined — pushEvent must not throw
      expect(() => googleTagManager.pushEvent({ event: 'x' })).not.toThrow();

      window.dataLayer = saved;
    });
  });
});
