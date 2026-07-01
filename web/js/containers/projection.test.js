/* eslint-disable react/jsx-props-no-spreading */
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

let capturedMapState;
let capturedMapDispatch;
jest.mock('react-redux', () => ({
  connect: (mapState, mapDispatch) => {
    capturedMapState = mapState;
    capturedMapDispatch = mapDispatch;
    return (Component) => Component;
  },
}));

let capturedIconListProps;
jest.mock('../components/util/icon-list', () => (props) => {
  capturedIconListProps = props;
  return <div data-testid="icon-list" />;
});

jest.mock('googleTagManager', () => ({
  __esModule: true,
  default: { pushEvent: jest.fn() },
}));

jest.mock('../modules/projection/actions', () => ({
  __esModule: true,
  default: jest.fn((id) => ({ type: 'CHANGE_PROJECTION', id })),
}));

jest.mock('../modules/modal/actions', () => ({
  onToggle: jest.fn(() => ({ type: 'MODAL_TOGGLE' })),
}));

jest.mock('../modules/date/actions', () => ({
  changeTimeScale: jest.fn((val) => ({ type: 'CHANGE_TIME_SCALE', val })),
  selectInterval: jest.fn(() => ({ type: 'SELECT_INTERVAL' })),
  changeAutoInterval: jest.fn((val) => ({ type: 'CHANGE_AUTO_INTERVAL', val })),
}));

const ProjectionList = require('./projection').default;
const googleTagManager = require('googleTagManager').default;
const changeProjection = require('../modules/projection/actions').default;
const { onToggle } = require('../modules/modal/actions');
const {
  changeTimeScale: changeTimeScaleAction,
  changeAutoInterval: changeAutoIntervalAction,
} = require('../modules/date/actions');

const defaultProps = {
  projection: 'geographic',
  projectionArray: [],
  isMobile: false,
  layers: [],
  updateProjection: jest.fn(),
  onCloseModal: jest.fn(),
  changeTimeScale: jest.fn(),
  changeAutoInterval: jest.fn(),
};

const renderComponent = (props = {}) => render(
  <ProjectionList {...defaultProps} {...props} />,
);

beforeEach(() => {
  jest.clearAllMocks();
  capturedIconListProps = null;
});

describe('ProjectionList component', () => {
  it('renders IconList with small size on desktop', () => {
    renderComponent();
    expect(capturedIconListProps.size).toBe('small');
    expect(capturedIconListProps.active).toBe('geographic');
  });

  it('renders IconList with large size on mobile', () => {
    renderComponent({ isMobile: true });
    expect(capturedIconListProps.size).toBe('large');
  });

  it('only closes the modal when the same projection is clicked', () => {
    const updateProjection = jest.fn();
    const onCloseModal = jest.fn();
    renderComponent({ updateProjection, onCloseModal });
    capturedIconListProps.onClick('geographic');
    expect(updateProjection).not.toHaveBeenCalled();
    expect(onCloseModal).toHaveBeenCalled();
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({
      event: 'change_projection',
      projection: 'geographic',
    });
  });

  it('updates projection with daily defaults when no TEMPO layers exist', () => {
    const updateProjection = jest.fn();
    const changeTimeScale = jest.fn();
    const changeAutoInterval = jest.fn();
    renderComponent({ updateProjection, changeTimeScale, changeAutoInterval });
    capturedIconListProps.onClick('arctic');
    expect(updateProjection).toHaveBeenCalledWith('arctic');
    expect(changeAutoInterval).toHaveBeenCalledWith(false);
    expect(changeTimeScale).toHaveBeenCalledWith(3);
  });

  it('enables auto interval when visible TEMPO layers support the projection', () => {
    const changeTimeScale = jest.fn();
    const changeAutoInterval = jest.fn();
    const layers = [{
      id: 'TEMPO_NO2',
      visible: true,
      projections: { geographic: {} },
    }];
    renderComponent({
      projection: 'arctic', layers, changeTimeScale, changeAutoInterval,
    });
    capturedIconListProps.onClick('geographic');
    expect(changeAutoInterval).toHaveBeenCalledWith(true);
    expect(changeTimeScale).toHaveBeenCalledWith(4);
  });
});

describe('mapStateToProps', () => {
  const makeState = (config = {}) => ({
    config,
    models: { foo: 'bar' },
    proj: { id: 'arctic' },
    screenSize: { isMobileDevice: true },
    layers: { active: { layers: [{ id: 'x' }] } },
  });

  it('uses the default projection array when config has none', () => {
    const result = capturedMapState(makeState());
    expect(result.projectionArray).toHaveLength(3);
    expect(result.projectionArray[0].key).toBe('arctic');
    expect(result.projection).toBe('arctic');
    expect(result.isMobile).toBe(true);
    expect(result.layers).toEqual([{ id: 'x' }]);
  });

  it('builds the projection array from config.ui.projections', () => {
    const config = {
      ui: {
        projections: [
          { name: 'Custom', style: 'star', id: 'custom' },
        ],
      },
    };
    const result = capturedMapState(makeState(config));
    expect(result.projectionArray).toEqual([{
      text: 'Custom',
      iconClass: ' ui-icon icon-large',
      iconName: 'star',
      id: 'change-custom-button',
      key: 'custom',
    }]);
  });
});

describe('mapDispatchToProps', () => {
  let dispatch;
  let props;
  beforeEach(() => {
    dispatch = jest.fn();
    props = capturedMapDispatch(dispatch);
  });

  it('updateProjection dispatches changeProjection', () => {
    props.updateProjection('antarctic');
    expect(changeProjection).toHaveBeenCalledWith('antarctic');
    expect(dispatch).toHaveBeenCalledWith({ type: 'CHANGE_PROJECTION', id: 'antarctic' });
  });

  it('onCloseModal dispatches onToggle', () => {
    props.onCloseModal();
    expect(onToggle).toHaveBeenCalled();
  });

  it('changeTimeScale dispatches the time scale action', () => {
    props.changeTimeScale(3);
    expect(changeTimeScaleAction).toHaveBeenCalledWith(3);
  });

  it('changeAutoInterval dispatches the auto interval action', () => {
    props.changeAutoInterval(true);
    expect(changeAutoIntervalAction).toHaveBeenCalledWith(true);
  });
});
