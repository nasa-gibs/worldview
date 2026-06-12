/* eslint-disable react/jsx-props-no-spreading */
import { render, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MobileDatePicker from './mobile-date-picker';
import { getDisplayDate, getISODateFormatted } from './date-util';

let mockDatePickerProps = {};

jest.mock('../../util/react-mobile-datepicker', () => function MockDatePicker(props) {
  mockDatePickerProps = props;
  return <div data-testid="mock-datepicker" />;
});

jest.mock('./date-util', () => ({
  getDisplayDate: jest.fn(() => 'MOCK_DISPLAY_DATE'),
  getISODateFormatted: jest.fn(() => 'MOCK_ISO_DATE'),
}));

jest.mock('../../modules/date/constants', () => ({
  MONTH_STRING_ARRAY: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
}));

const defaultProps = {
  date: '2020-06-15T12:00:00Z',
  isEmbedModeActive: false,
  startDateLimit: '2000-01-01T00:00:00Z',
  endDateLimit: '2021-12-31T00:00:00Z',
  onDateChange: jest.fn(),
  hasSubdailyLayers: false,
};

const renderComponent = (props = {}) => render(
  <MobileDatePicker {...defaultProps} {...props} />,
);

beforeEach(() => {
  mockDatePickerProps = {};
  jest.clearAllMocks();
});

afterEach(() => {
  document.querySelectorAll('.Modal-Portal').forEach((el) => el.remove());
});

describe('MobileDatePicker', () => {
  describe('initial render', () => {
    it('renders the date select button', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.mobile-date-picker-select-btn')).toBeInTheDocument();
    });

    it('displays the result of getDisplayDate(date, hasSubdailyLayers) in the button', () => {
      const { container } = renderComponent();
      expect(getDisplayDate).toHaveBeenCalledWith(defaultProps.date, false);
      expect(container.querySelector('.mobile-date-picker-select-btn-text').textContent).toBe('MOCK_DISPLAY_DATE');
    });

    it('calls getDisplayDate with hasSubdailyLayers=true when prop is true', () => {
      renderComponent({ hasSubdailyLayers: true });
      expect(getDisplayDate).toHaveBeenCalledWith(defaultProps.date, true);
    });

    it('does not render the datepicker modal on initial render', () => {
      renderComponent();
      expect(document.body.querySelector('.datepicker-modal')).not.toBeInTheDocument();
    });
  });

  describe('handleClickDateButton', () => {
    it('opens the datepicker modal when isEmbedModeActive=false', () => {
      const { container } = renderComponent({ isEmbedModeActive: false });
      act(() => {
        fireEvent.click(container.querySelector('.mobile-date-picker-select-btn'));
      });
      expect(document.body.querySelector('.datepicker-modal')).toBeInTheDocument();
    });

    it('does not open the picker when isEmbedModeActive=true', () => {
      const { container } = renderComponent({ isEmbedModeActive: true });
      act(() => {
        fireEvent.click(container.querySelector('.mobile-date-picker-select-btn'));
      });
      expect(document.body.querySelector('.datepicker-modal')).not.toBeInTheDocument();
    });

    it('appends a Modal-Portal element to document.body', () => {
      const { container } = renderComponent();
      act(() => {
        fireEvent.click(container.querySelector('.mobile-date-picker-select-btn'));
      });
      expect(document.body.querySelector('.Modal-Portal')).toBeInTheDocument();
    });

    it('does not create duplicate Modal-Portal elements when button clicked twice', () => {
      const { container } = renderComponent();
      const btn = container.querySelector('.mobile-date-picker-select-btn');
      act(() => { fireEvent.click(btn); });
      act(() => { fireEvent.click(btn); });
      expect(document.body.querySelectorAll('.Modal-Portal')).toHaveLength(1);
    });
  });

  describe('handleCancel', () => {
    const openPicker = (container) => {
      act(() => {
        fireEvent.click(container.querySelector('.mobile-date-picker-select-btn'));
      });
    };

    it('closes the datepicker modal', () => {
      const { container } = renderComponent();
      openPicker(container);
      act(() => { mockDatePickerProps.onCancel(); });
      expect(document.body.querySelector('.datepicker-modal')).not.toBeInTheDocument();
    });

    it('removes the Modal-Portal from body', () => {
      const { container } = renderComponent();
      openPicker(container);
      act(() => { mockDatePickerProps.onCancel(); });
      expect(document.body.querySelector('.Modal-Portal')).not.toBeInTheDocument();
    });
  });

  describe('handleChange', () => {
    it('updates the DatePicker value prop when onChange is called', () => {
      const { container } = renderComponent();
      act(() => {
        fireEvent.click(container.querySelector('.mobile-date-picker-select-btn'));
      });
      const newDate = new Date('2020-07-01T00:00:00Z');
      act(() => { mockDatePickerProps.onChange(newDate); });
      expect(mockDatePickerProps.value).toEqual(newDate);
    });
  });

  describe('handleSelect', () => {
    const openPicker = (container) => {
      act(() => {
        fireEvent.click(container.querySelector('.mobile-date-picker-select-btn'));
      });
    };

    it('closes the datepicker modal on select', () => {
      const { container } = renderComponent();
      openPicker(container);
      act(() => { mockDatePickerProps.onSelect(new Date('2020-07-01T00:00:00Z')); });
      expect(document.body.querySelector('.datepicker-modal')).not.toBeInTheDocument();
    });

    it('removes the Modal-Portal from body on select', () => {
      const { container } = renderComponent();
      openPicker(container);
      act(() => { mockDatePickerProps.onSelect(new Date('2020-07-01T00:00:00Z')); });
      expect(document.body.querySelector('.Modal-Portal')).not.toBeInTheDocument();
    });

    it('calls onDateChange with the result of getISODateFormatted', () => {
      const onDateChange = jest.fn();
      const { container } = renderComponent({ onDateChange });
      openPicker(container);
      act(() => { mockDatePickerProps.onSelect(new Date('2020-07-01T00:00:00Z')); });
      expect(onDateChange).toHaveBeenCalledWith('MOCK_ISO_DATE');
    });

    it('calls getISODateFormatted with a Date object (local-converted)', () => {
      const { container } = renderComponent();
      openPicker(container);
      act(() => { mockDatePickerProps.onSelect(new Date('2020-07-01T00:00:00Z')); });
      expect(getISODateFormatted).toHaveBeenCalledWith(expect.any(Date));
    });
  });

  describe('handleBackdropClick', () => {
    const openPicker = (container) => {
      act(() => {
        fireEvent.click(container.querySelector('.mobile-date-picker-select-btn'));
      });
    };

    it('closes the modal when clicking directly on the backdrop (target === currentTarget)', () => {
      const { container } = renderComponent();
      openPicker(container);
      const modal = document.body.querySelector('.datepicker-modal');
      act(() => { fireEvent.click(modal); });
      expect(document.body.querySelector('.datepicker-modal')).not.toBeInTheDocument();
    });

    it('keeps the modal open when clicking a child element (target !== currentTarget)', () => {
      const { container } = renderComponent();
      openPicker(container);
      const child = document.body.querySelector('[data-testid="mock-datepicker"]');
      act(() => { fireEvent.click(child); });
      expect(document.body.querySelector('.datepicker-modal')).toBeInTheDocument();
    });
  });

  describe('hasSubdailyLayers — dateConfig selection', () => {
    const openPicker = (container) => {
      act(() => {
        fireEvent.click(container.querySelector('.mobile-date-picker-select-btn'));
      });
    };

    it('passes defaultDateConfig (no hour/minute) when hasSubdailyLayers=false', () => {
      const { container } = renderComponent({ hasSubdailyLayers: false });
      openPicker(container);
      expect(mockDatePickerProps.dateConfig).not.toHaveProperty('hour');
      expect(mockDatePickerProps.dateConfig).not.toHaveProperty('minute');
      expect(mockDatePickerProps.dateConfig).toHaveProperty('year');
      expect(mockDatePickerProps.dateConfig).toHaveProperty('month');
      expect(mockDatePickerProps.dateConfig).toHaveProperty('date');
    });

    it('passes subDailyDateConfig (with hour and minute) when hasSubdailyLayers=true', () => {
      const { container } = renderComponent({ hasSubdailyLayers: true });
      openPicker(container);
      expect(mockDatePickerProps.dateConfig).toHaveProperty('hour');
      expect(mockDatePickerProps.dateConfig).toHaveProperty('minute');
    });

    it('month.format in dateConfig uses MONTH_STRING_ARRAY indexed by getMonth()', () => {
      const { container } = renderComponent({ hasSubdailyLayers: false });
      openPicker(container);
      const janDate = new Date(2020, 0, 1);
      const junDate = new Date(2020, 5, 1);
      expect(mockDatePickerProps.dateConfig.month.format(janDate)).toBe('JAN');
      expect(mockDatePickerProps.dateConfig.month.format(junDate)).toBe('JUN');
    });
  });

  describe('DatePicker static props', () => {
    const openPicker = (container) => {
      act(() => {
        fireEvent.click(container.querySelector('.mobile-date-picker-select-btn'));
      });
    };

    it('passes isOpen=true, min, max, value as Date instances', () => {
      const { container } = renderComponent();
      openPicker(container);
      expect(mockDatePickerProps.isOpen).toBe(true);
      expect(mockDatePickerProps.min).toBeInstanceOf(Date);
      expect(mockDatePickerProps.max).toBeInstanceOf(Date);
      expect(mockDatePickerProps.value).toBeInstanceOf(Date);
    });

    it('passes confirmText="OK" and cancelText="CANCEL"', () => {
      const { container } = renderComponent();
      openPicker(container);
      expect(mockDatePickerProps.confirmText).toBe('OK');
      expect(mockDatePickerProps.cancelText).toBe('CANCEL');
    });

    it('passes theme="android-dark"', () => {
      const { container } = renderComponent();
      openPicker(container);
      expect(mockDatePickerProps.theme).toBe('android-dark');
    });

    it('passes customHeader containing a datepicker-header div', () => {
      const { container } = renderComponent();
      openPicker(container);
      expect(mockDatePickerProps.customHeader.props.className).toBe('datepicker-header');
    });
  });

  describe('useEffect — reinitializes dates on endDateLimit or date change', () => {
    it('updates max when endDateLimit prop changes', () => {
      const { container, rerender } = renderComponent();
      act(() => {
        fireEvent.click(container.querySelector('.mobile-date-picker-select-btn'));
      });
      const originalMax = mockDatePickerProps.max;

      act(() => {
        rerender(<MobileDatePicker {...defaultProps} endDateLimit="2025-12-31T00:00:00Z" />);
      });
      expect(mockDatePickerProps.max.getTime()).not.toBe(originalMax.getTime());
    });

    it('updates time when date prop changes', () => {
      const { container, rerender } = renderComponent();
      act(() => {
        fireEvent.click(container.querySelector('.mobile-date-picker-select-btn'));
      });
      const originalValue = mockDatePickerProps.value.getTime();

      act(() => {
        rerender(<MobileDatePicker {...defaultProps} date="2021-01-01T00:00:00Z" />);
      });
      expect(mockDatePickerProps.value.getTime()).not.toBe(originalValue);
    });
  });

  describe('cleanup useEffect — portal removed on unmount', () => {
    it('removes Modal-Portal from body when component unmounts after opening', () => {
      const { container, unmount } = renderComponent();
      act(() => {
        fireEvent.click(container.querySelector('.mobile-date-picker-select-btn'));
      });
      expect(document.body.querySelector('.Modal-Portal')).toBeInTheDocument();
      act(() => { unmount(); });
      expect(document.body.querySelector('.Modal-Portal')).not.toBeInTheDocument();
    });

    it('unmounts cleanly when the picker was never opened (no portal to remove)', () => {
      const { unmount } = renderComponent();
      expect(() => act(() => { unmount(); })).not.toThrow();
    });
  });
});
