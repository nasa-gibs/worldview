/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Selector from './selector';

const defaultOptions = {
  values: [
    { value: 'opt1', text: 'Option 1' },
    { value: 'opt2', text: 'Option 2' },
    { value: 'opt3', text: 'Option 3' },
  ],
};

const defaultProps = {
  id: 'test-selector',
  onChange: jest.fn(),
  optionName: 'myOption',
  optionArray: defaultOptions,
  value: 'opt1',
};

const renderComponent = (props = {}) => render(
  <Selector {...defaultProps} {...props} />,
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Selector', () => {
  describe('rendering', () => {
    it('renders a select element', () => {
      renderComponent();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('applies the id prop to the select element', () => {
      renderComponent({ id: 'my-select' });
      expect(document.getElementById('my-select')).toBeInTheDocument();
    });

    it('sets the select value to the value prop', () => {
      renderComponent({ value: 'opt2' });
      expect(screen.getByRole('combobox')).toHaveValue('opt2');
    });

    it('renders the correct number of options', () => {
      renderComponent();
      expect(screen.getAllByRole('option')).toHaveLength(3);
    });

    it('renders each option with the correct value attribute', () => {
      renderComponent();
      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveValue('opt1');
      expect(options[1]).toHaveValue('opt2');
      expect(options[2]).toHaveValue('opt3');
    });

    it('renders each option with the correct display text', () => {
      renderComponent();
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('renders with a single option', () => {
      renderComponent({
        optionArray: { values: [{ value: 'only', text: 'Only One' }] },
        value: 'only',
      });
      expect(screen.getAllByRole('option')).toHaveLength(1);
      expect(screen.getByText('Only One')).toBeInTheDocument();
    });

    it('renders with an empty options list', () => {
      renderComponent({ optionArray: { values: [] } });
      expect(screen.queryAllByRole('option')).toHaveLength(0);
    });
  });

  describe('onChange handler', () => {
    it('calls onChange with optionName and the selected value when changed', () => {
      const onChange = jest.fn();
      renderComponent({ onChange, optionName: 'myOption', value: 'opt1' });
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'opt2' } });
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('myOption', 'opt2');
    });

    it('passes the correct optionName from props', () => {
      const onChange = jest.fn();
      renderComponent({ onChange, optionName: 'differentOption' });
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'opt3' } });
      expect(onChange).toHaveBeenCalledWith('differentOption', 'opt3');
    });

    it('calls onChange each time the value changes', () => {
      const onChange = jest.fn();
      renderComponent({ onChange });
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'opt2' } });
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'opt3' } });
      expect(onChange).toHaveBeenCalledTimes(2);
    });
  });
});
