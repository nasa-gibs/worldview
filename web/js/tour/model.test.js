import { tourModel } from './model';

function testConfig() {
  return {
    stories: {
      test_story_01: {
        backgroundImage: 'background.png',
        backgroundImageHover: 'background-hover.png',
        description: 'A story description',
        id: 'test_story_01',
        readMoreLinks: [
          {
            link: 'https://worldview.earthdata.nasa.gov',
            title: 'NASA Worldview'
          }
        ],
        steps: [
          {
            description: 'step001.html',
            id: '001',
            stepLink: 'p=geographic&l=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,Reference_Labels,Reference_Features,Coastlines(hidden)&t=2018-08-17-T00%3A00%3A00Z&z=3&v=-150.90029967594097,27.400561971879853,-83.40029967594097,60.37712447187985',
            transition:
            {
              action: '',
              element: ''
            }
          }
        ],
        title: 'The test story title',
        type: 'wildfire'
      }
    },
    storyOrder: [
      {
        0: 'test_story_01'
      }
    ]
  };
};

test('throws exception when loading an invalid tour', () => {
  let model = tourModel(testConfig());
  let state = {
    'tr': 'test_story_01'
  };
  model.load(state);
  expect(() => tourModel(model)).toThrow();
});

test('selects tour', () => {
  let model = tourModel(testConfig());
  let listener = jest.fn();
  model.events.on('select', listener);
  model.select('arctic');
  expect(model.selected.id).toBe('test_story_01');
  expect(listener).toBeCalled();
});

test('saves state', () => {
  let model = tourModel(testConfig());
  let state = {};
  model.save(state);
  expect(state.p).toBe('test_story_01');
});

test('loads state', () => {
  let model = tourModel(testConfig());
  let state = {
    'tr': 'test_story_01'
  };
  model.load(state);
  expect(model.selected.id).toBe('test_story_01');
});
