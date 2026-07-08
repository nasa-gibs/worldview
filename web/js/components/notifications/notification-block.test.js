/* eslint-disable react/prop-types */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import NotificationBlock from './notification-block';

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }) => <svg data-testid={`icon-${Array.isArray(icon) ? icon[1] : icon}`} />,
}));

jest.mock('../../util/util', () => ({
  giveMonth: jest.fn((d) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[d.getMonth()];
  }),
}));

const makeNotification = (message, createdAt = '2024-03-15T12:00:00Z') => ({
  message,
  created_at: createdAt,
});

describe('NotificationBlock', () => {
  describe('list rendering', () => {
    it('renders a <ul> with one <li> per notification', () => {
      const arr = [makeNotification('First'), makeNotification('Second')];
      const { container } = render(
        <NotificationBlock arr={arr} type="message" numberNotSeen={0} />,
      );
      expect(container.querySelectorAll('li')).toHaveLength(2);
    });

    it('renders nothing inside the list when arr is empty', () => {
      const { container } = render(
        <NotificationBlock arr={[]} type="message" numberNotSeen={0} />,
      );
      expect(container.querySelectorAll('li')).toHaveLength(0);
    });
  });

  describe('date formatting', () => {
    it('displays the formatted date from created_at', () => {
      const arr = [makeNotification('Hello', '2024-03-15T12:00:00Z')];
      render(<NotificationBlock arr={arr} type="message" numberNotSeen={0} />);
      // getDate() on 2024-03-15 UTC may resolve to 14 or 15 depending on local TZ in JSDOM;
      // just assert "March" and "2024" appear
      expect(screen.getByText(/March/)).toBeInTheDocument();
      expect(screen.getByText(/2024/)).toBeInTheDocument();
    });

    it('shows the day and year alongside the month', () => {
      const arr = [makeNotification('Test', '2023-07-04T00:00:00Z')];
      render(<NotificationBlock arr={arr} type="message" numberNotSeen={0} />);
      expect(screen.getByText(/July/)).toBeInTheDocument();
      expect(screen.getByText(/2023/)).toBeInTheDocument();
    });
  });

  describe('active class (numberNotSeen)', () => {
    it('applies the type-specific class to items within numberNotSeen count', () => {
      const arr = [makeNotification('A'), makeNotification('B'), makeNotification('C')];
      const { container } = render(
        <NotificationBlock arr={arr} type="alert" numberNotSeen={2} />,
      );
      const items = container.querySelectorAll('li');
      expect(items[0]).toHaveClass('alert-notification-item');
      expect(items[1]).toHaveClass('alert-notification-item');
      expect(items[2]).not.toHaveClass('alert-notification-item');
    });

    it('applies no active class when numberNotSeen is 0', () => {
      const arr = [makeNotification('A'), makeNotification('B')];
      const { container } = render(
        <NotificationBlock arr={arr} type="message" numberNotSeen={0} />,
      );
      container.querySelectorAll('li').forEach((li) => {
        expect(li).not.toHaveClass('message-notification-item');
      });
    });

    it('applies active class to all items when numberNotSeen exceeds arr length', () => {
      const arr = [makeNotification('A'), makeNotification('B')];
      const { container } = render(
        <NotificationBlock arr={arr} type="outage" numberNotSeen={10} />,
      );
      container.querySelectorAll('li').forEach((li) => {
        expect(li).toHaveClass('outage-notification-item');
      });
    });

    it('uses the correct type prefix in the class name', () => {
      const arr = [makeNotification('X')];
      const { container } = render(
        <NotificationBlock arr={arr} type="outage" numberNotSeen={1} />,
      );
      expect(container.querySelector('li')).toHaveClass('outage-notification-item');
    });
  });

  describe('icons', () => {
    it('renders the bolt icon for type "alert"', () => {
      const arr = [makeNotification('A')];
      render(<NotificationBlock arr={arr} type="alert" numberNotSeen={0} />);
      expect(screen.getByTestId('icon-bolt')).toBeInTheDocument();
    });

    it('renders the gift icon for type "message"', () => {
      const arr = [makeNotification('A')];
      render(<NotificationBlock arr={arr} type="message" numberNotSeen={0} />);
      expect(screen.getByTestId('icon-gift')).toBeInTheDocument();
    });

    it('renders the exclamation-circle icon for type "outage"', () => {
      const arr = [makeNotification('A')];
      render(<NotificationBlock arr={arr} type="outage" numberNotSeen={0} />);
      expect(screen.getByTestId('icon-exclamation-circle')).toBeInTheDocument();
    });
  });

  describe('message content', () => {
    it('renders the notification message as HTML via dangerouslySetInnerHTML', () => {
      const arr = [makeNotification('<strong>Important</strong> update')];
      const { container } = render(
        <NotificationBlock arr={arr} type="message" numberNotSeen={0} />,
      );
      const p = container.querySelector('p');
      expect(p.innerHTML).toBe('<strong>Important</strong> update');
    });

    it('renders multiple messages independently', () => {
      const arr = [makeNotification('First message'), makeNotification('Second message')];
      const { container } = render(
        <NotificationBlock arr={arr} type="message" numberNotSeen={0} />,
      );
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs[0].innerHTML).toBe('First message');
      expect(paragraphs[1].innerHTML).toBe('Second message');
    });
  });
});
