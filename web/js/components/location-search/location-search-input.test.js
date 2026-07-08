/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchBox from './location-search-input';

jest.mock('../../util/reactAutocomplete', () => {
  const React = require('react');
  return React.forwardRef(function MockAutocomplete({
    value, items, onChange, onSelect, inputProps, renderItem,
  }, ref) {
    React.useImperativeHandle(ref, () => ({
      focus: jest.fn(),
      setOpen: jest.fn(),
    }));
    return (
      <div>
        <input
          data-testid="autocomplete-input"
          {...inputProps}
          value={value}
          onChange={(e) => onChange(e, e.target.value)}
        />
        {items.map((item) => (
          <div
            key={item.text}
            data-testid="suggestion-item"
            onClick={() => onSelect(item.text, item)}
          >
            {renderItem(item, false)}
          </div>
        ))}
      </div>
    );
  });
});

jest.mock('reactstrap', () => ({
  Button: ({ children, onClick, disabled, id, className, style }) => (
    <button
      data-testid={id}
      id={id}
      className={className}
      style={style}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  ),
  UncontrolledTooltip: ({ children }) => <div>{children}</div>,
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }) => <span data-testid={`icon-${icon}`} />,
}));

const defaultProps = {
  activeAlert: false,
  clearInput: jest.fn(),
  coordinatesPending: [],
  locationSearchMobileModalOpen: false,
  inputValue: '',
  isMobile: false,
  preventInputFocus: true,
  onChange: jest.fn(),
  onCoordinateInputSelect: jest.fn(),
  onSelect: jest.fn(),
  suggestions: [],
};

describe('SearchBox', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders autocomplete input', () => {
    const { getByTestId } = render(<SearchBox {...defaultProps} />);
    expect(getByTestId('autocomplete-input')).toBeInTheDocument();
  });

  test('renders desktop placeholder text when not mobile', () => {
    const { getByPlaceholderText } = render(<SearchBox {...defaultProps} />);
    expect(getByPlaceholderText('Search for places or enter coordinates')).toBeInTheDocument();
  });

  test('renders mobile placeholder text when isMobile is true', () => {
    const { getByPlaceholderText } = render(<SearchBox {...defaultProps} isMobile />);
    expect(getByPlaceholderText('Enter place name or coordinates')).toBeInTheDocument();
  });

  test('submit button is disabled when inputValue is empty', () => {
    const { getByTestId } = render(<SearchBox {...defaultProps} />);
    expect(getByTestId('location-search-submit-button')).toBeDisabled();
  });

  test('submit button is enabled when inputValue is provided', () => {
    const { getByTestId } = render(<SearchBox {...defaultProps} inputValue="Los Angeles" />);
    expect(getByTestId('location-search-submit-button')).not.toBeDisabled();
  });

  test('does not render clear button when inputValue is empty', () => {
    const { queryByTestId } = render(<SearchBox {...defaultProps} />);
    expect(queryByTestId('location-search-clear-button')).not.toBeInTheDocument();
  });

  test('renders clear button when inputValue is provided', () => {
    const { getByTestId } = render(<SearchBox {...defaultProps} inputValue="test" />);
    expect(getByTestId('location-search-clear-button')).toBeInTheDocument();
  });

  test('calls clearInput when clear button is clicked', () => {
    const clearInput = jest.fn();
    const { getByTestId } = render(
      <SearchBox {...defaultProps} inputValue="test" clearInput={clearInput} />,
    );
    fireEvent.click(getByTestId('location-search-clear-button'));
    expect(clearInput).toHaveBeenCalledTimes(1);
  });

  test('does not render alert icon when activeAlert is false', () => {
    const { container } = render(<SearchBox {...defaultProps} />);
    expect(container.querySelector('.location-search-input-alert-icon')).not.toBeInTheDocument();
  });

  test('renders alert icon when activeAlert is true', () => {
    const { container } = render(<SearchBox {...defaultProps} activeAlert />);
    expect(container.querySelector('.location-search-input-alert-icon')).toBeInTheDocument();
  });

  test('does not call onCoordinateInputSelect on Enter key when coordinatesPending is empty', () => {
    const onCoordinateInputSelect = jest.fn();
    const { container } = render(
      <SearchBox
        {...defaultProps}
        coordinatesPending={[]}
        onCoordinateInputSelect={onCoordinateInputSelect}
      />,
    );
    const node = container.querySelector('.location-search-input-container');
    node.dispatchEvent(new KeyboardEvent('keydown', { charCode: 13, bubbles: true }));
    expect(onCoordinateInputSelect).not.toHaveBeenCalled();
  });

  test('calls onCoordinateInputSelect on submit click when coordinatesPending is non-empty', () => {
    const onCoordinateInputSelect = jest.fn();
    const { getByTestId } = render(
      <SearchBox
        {...defaultProps}
        coordinatesPending={[-118.24, 34.05]}
        onCoordinateInputSelect={onCoordinateInputSelect}
        inputValue="34.05, -118.24"
      />,
    );
    fireEvent.click(getByTestId('location-search-submit-button'));
    expect(onCoordinateInputSelect).toHaveBeenCalledTimes(1);
  });

  test('calls onSelect with first suggestion on submit when no highlighted item and suggestions exist', () => {
    const onSelect = jest.fn();
    const suggestions = [{ text: 'Los Angeles, CA', magicKey: 'key1' }];
    const { getByTestId } = render(
      <SearchBox
        {...defaultProps}
        suggestions={suggestions}
        inputValue="Los Angeles"
        onSelect={onSelect}
      />,
    );
    fireEvent.click(getByTestId('location-search-submit-button'));
    expect(onSelect).toHaveBeenCalledWith('Los Angeles, CA', suggestions[0]);
  });

  test('renders suggestion items from suggestions prop', () => {
    const suggestions = [
      { text: 'Los Angeles, CA', magicKey: 'k1' },
      { text: 'Los Angeles, TX', magicKey: 'k2' },
    ];
    const { getAllByTestId } = render(
      <SearchBox {...defaultProps} suggestions={suggestions} inputValue="Los" />,
    );
    expect(getAllByTestId('suggestion-item')).toHaveLength(2);
  });
});
