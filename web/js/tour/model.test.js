import { tourModel } from './model';

function testConfig() {
  return {
    stories: {
      test_story_01: {
        id: 'test_story_01'
      }
    },
    storyOrder: [
      {
        0: 'test_story_01'
      }
    ]
  };
};

test('selects tour', () => {
  let model = tourModel(testConfig());
  let listener = jest.fn();
  model.events.on('select', listener);
  model.select('test_story_01');
  expect(model.selected.id).toBe('test_story_01');
  expect(listener).toBeCalled();
});

test('saves state', () => {
  let model = tourModel(testConfig());
  let state = {};
  model.toggle();
  model.select('test_story_01');
  model.save(state);
  expect(state.tr).toBe('test_story_01');
});

test('loads state', () => {
  let model = tourModel(testConfig());
  let state = {
    'tr': 'test_story_01'
  };
  model.load(state);
  expect(model.selected.id).toBe('test_story_01');
});
