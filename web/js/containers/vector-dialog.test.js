/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

let capturedMapState;
jest.mock('react-redux', () => ({
  connect: (mapState, mapDispatch) => {
    capturedMapState = mapState;
    return (Component) => Component;
  },
}));

jest.mock('../components/util/scrollbar', () => (props) => (
  <div data-testid="scrollbars">{props.children}</div>
));

let capturedTableProps;
jest.mock('../components/vector-metadata/table', () => (props) => {
  capturedTableProps = props;
  return <div data-testid="vector-meta-table" />;
});

const VectorDialog = require('./vector-dialog').default;

const vectorMetaObject = {
  layerA: [
    { id: 'vector_layer_a', title: 'Layer A', subTitle: 'Sub A' },
    { id: 'vector_layer_a2', title: 'Layer A', subTitle: 'Sub A' },
  ],
  layerB: [
    { id: 'vector_layer_b', title: 'A very long layer title that exceeds limits' },
  ],
};

const defaultProps = {
  vectorMetaObject,
  modalHeight: 500,
  dialogKey: 1,
  toggleWithClose: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  capturedTableProps = null;
});

describe('VectorDialog (non-AERONET)', () => {
  it('renders nav items for each vector meta key with counts', () => {
    const { container } = render(<VectorDialog {...defaultProps} />);
    const navItems = container.querySelectorAll('.vector-meta-nav-item');
    expect(navItems).toHaveLength(2);
    expect(navItems[0].textContent).toContain('Layer A [2]');
  });

  it('truncates long titles to 20 characters with ellipsis', () => {
    const { container } = render(<VectorDialog {...defaultProps} />);
    const navItems = container.querySelectorAll('.vector-meta-nav-item');
    expect(navItems[1].textContent).toContain('A very long layer ti... [1]');
  });

  it('passes the active meta array to VectorMetaTable', () => {
    render(<VectorDialog {...defaultProps} />);
    expect(capturedTableProps.metaArray).toBe(vectorMetaObject.layerA);
    expect(capturedTableProps.title).toBe('layerA');
    expect(capturedTableProps.id).toBe(1);
  });

  it('switches tabs when a nav link is clicked', () => {
    const { container } = render(<VectorDialog {...defaultProps} />);
    const navLinks = container.querySelectorAll('.nav-link');
    fireEvent.click(navLinks[1]);
    expect(capturedTableProps.metaArray).toBe(vectorMetaObject.layerB);
    expect(capturedTableProps.title).toBe('layerB');
  });

  it('does not update state when clicking the already-active tab', () => {
    const { container } = render(<VectorDialog {...defaultProps} />);
    const navLinks = container.querySelectorAll('.nav-link');
    fireEvent.click(navLinks[0]);
    expect(capturedTableProps.metaArray).toBe(vectorMetaObject.layerA);
  });

  it('invokes toggleWithClose from the close button', () => {
    const toggleWithClose = jest.fn();
    const { container } = render(
      <VectorDialog {...defaultProps} toggleWithClose={toggleWithClose} />,
    );
    fireEvent.click(container.querySelector('.vector-close-btn'));
    expect(toggleWithClose).toHaveBeenCalled();
  });
});

describe('VectorDialog (AERONET)', () => {
  const aeronetActive = {
    site: [{
      id: 'AERONET_SITE_AOD',
      title: 'Aeronet Site',
      features: {
        name: 'Test_Site',
        coordinates: [10.5, -20.25],
        active: true,
        value: 0.5,
        date: new Date('2021-06-01T12:00:00Z'),
      },
    }],
  };

  it('renders site info with recent reading when active', () => {
    const { container, getByText } = render(
      <VectorDialog {...defaultProps} vectorMetaObject={aeronetActive} />,
    );
    expect(getByText('Test_Site')).toBeInTheDocument();
    expect(getByText('Site is online')).toBeInTheDocument();
    expect(getByText('Most recent reading: 0.5')).toBeInTheDocument();
    expect(getByText('View More Data')).toBeInTheDocument();
    expect(container.textContent).toContain('(10.5, -20.25)');
  });

  it('renders offline message without readings when inactive', () => {
    const aeronetInactive = {
      site: [{
        ...aeronetActive.site[0],
        features: { ...aeronetActive.site[0].features, active: false },
      }],
    };
    const { getByText, queryByText } = render(
      <VectorDialog {...defaultProps} vectorMetaObject={aeronetInactive} />,
    );
    expect(getByText('Site is currently offline')).toBeInTheDocument();
    expect(queryByText(/Most recent reading/)).toBeNull();
  });

  it('closes via the AERONET close button', () => {
    const toggleWithClose = jest.fn();
    const { container } = render(
      <VectorDialog
        {...defaultProps}
        vectorMetaObject={aeronetActive}
        toggleWithClose={toggleWithClose}
      />,
    );
    fireEvent.click(container.querySelector('.vector-close-btn'));
    expect(toggleWithClose).toHaveBeenCalled();
  });
});

describe('mapStateToProps', () => {
  it('returns an empty object', () => {
    expect(capturedMapState({ anything: true })).toEqual({});
  });
});
