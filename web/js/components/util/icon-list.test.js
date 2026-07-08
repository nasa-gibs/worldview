/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import IconList from './icon-list';

jest.mock('reactstrap', () => ({
  ListGroup: ({ className, children }) => (
    <ul data-testid="list-group" className={className}>{children}</ul>
  ),
  ListGroupItem: ({
    tag: Tag = 'div', active, disabled, id, className, href, target, onClick, children,
  }) => (
    <Tag
      data-testid="list-group-item"
      data-active={String(active)}
      data-disabled={String(disabled)}
      id={id}
      className={className}
      href={href}
      target={target}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Tag>
  ),
  Badge: ({ pill, children }) => (
    <span data-testid="badge" data-pill={String(pill)}>{children}</span>
  ),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, className }) => (
    <span data-testid="fa-icon" data-icon={icon} className={className} />
  ),
}));

const baseItem = { id: 'item1', text: 'Item One', key: 'key1' };

const renderComponent = (props = {}) => render(
  <IconList list={[baseItem]} size="medium" {...props} />,
);

describe('IconList', () => {
  describe('ListGroup wrapper', () => {
    it('renders the ListGroup', () => {
      renderComponent();
      expect(screen.getByTestId('list-group')).toBeInTheDocument();
    });

    it('applies listClass to the ListGroup', () => {
      renderComponent({ listClass: 'my-list' });
      expect(screen.getByTestId('list-group')).toHaveClass('my-list');
    });
  });

  describe('item rendering', () => {
    it('renders one ListGroupItem per non-hidden list entry', () => {
      renderComponent({ list: [baseItem, { id: 'item2', text: 'Two', key: 'key2' }] });
      expect(screen.getAllByTestId('list-group-item')).toHaveLength(2);
    });

    it('does not render hidden items', () => {
      renderComponent({ list: [{ ...baseItem, hidden: true }] });
      expect(screen.queryByTestId('list-group-item')).not.toBeInTheDocument();
    });

    it('renders item text', () => {
      renderComponent();
      expect(screen.getByText('Item One')).toBeInTheDocument();
    });

    it('sets item id from item.id', () => {
      renderComponent();
      expect(document.getElementById('item1')).toBeInTheDocument();
    });

    it('applies size class to item className', () => {
      renderComponent({ size: 'large' });
      expect(screen.getByTestId('list-group-item')).toHaveClass('large-item');
    });

    it('applies item.className alongside size class', () => {
      renderComponent({ list: [{ ...baseItem, className: 'custom-class' }] });
      expect(screen.getByTestId('list-group-item')).toHaveClass('custom-class');
    });
  });

  describe('active and disabled state', () => {
    it('marks item as active when key matches active prop', () => {
      renderComponent({ active: 'key1' });
      expect(screen.getByTestId('list-group-item')).toHaveAttribute('data-active', 'true');
    });

    it('does not mark item as active when key does not match', () => {
      renderComponent({ active: 'other' });
      expect(screen.getByTestId('list-group-item')).toHaveAttribute('data-active', 'false');
    });

    it('isActive is false when active prop is absent', () => {
      renderComponent();
      expect(screen.getByTestId('list-group-item')).toHaveAttribute('data-active', 'false');
    });

    it('isActive is false when item has no key even if active prop is set', () => {
      renderComponent({ active: 'key1', list: [{ id: 'item1', text: 'No Key' }] });
      expect(screen.getByTestId('list-group-item')).toHaveAttribute('data-active', 'false');
    });

    it('marks item as disabled when key matches disabled prop', () => {
      renderComponent({ disabled: 'key1' });
      expect(screen.getByTestId('list-group-item')).toHaveAttribute('data-disabled', 'true');
    });

    it('does not mark item as disabled when key does not match', () => {
      renderComponent({ disabled: 'other' });
      expect(screen.getByTestId('list-group-item')).toHaveAttribute('data-disabled', 'false');
    });

    it('isDisabled is false when disabled prop is absent', () => {
      renderComponent();
      expect(screen.getByTestId('list-group-item')).toHaveAttribute('data-disabled', 'false');
    });

    it('isDisabled is false when item has no key even if disabled prop is set', () => {
      renderComponent({ disabled: 'key1', list: [{ id: 'item1', text: 'No Key' }] });
      expect(screen.getByTestId('list-group-item')).toHaveAttribute('data-disabled', 'false');
    });
  });

  describe('tag — button vs anchor', () => {
    it('renders as a button when href is absent', () => {
      renderComponent();
      expect(screen.getByTestId('list-group-item').tagName).toBe('BUTTON');
    });

    it('renders as an anchor when href is provided', () => {
      renderComponent({ list: [{ ...baseItem, href: 'https://example.com' }] });
      expect(screen.getByTestId('list-group-item').tagName).toBe('A');
    });

    it('sets href attribute when provided', () => {
      renderComponent({ list: [{ ...baseItem, href: 'https://example.com' }] });
      expect(screen.getByTestId('list-group-item')).toHaveAttribute('href', 'https://example.com');
    });

    it('sets target="_blank" when href is provided', () => {
      renderComponent({ list: [{ ...baseItem, href: 'https://example.com' }] });
      expect(screen.getByTestId('list-group-item')).toHaveAttribute('target', '_blank');
    });

    it('does not set target when href is absent', () => {
      renderComponent();
      expect(screen.getByTestId('list-group-item')).not.toHaveAttribute('target');
    });
  });

  describe('onClick', () => {
    it('calls the list-level onClick with item key when clicked', () => {
      const onClick = jest.fn();
      renderComponent({ onClick });
      fireEvent.click(screen.getByTestId('list-group-item'));
      expect(onClick).toHaveBeenCalledWith('key1');
    });

    it('calls the list-level onClick with item id when key is absent', () => {
      const onClick = jest.fn();
      renderComponent({ onClick, list: [{ id: 'item1', text: 'Item' }] });
      fireEvent.click(screen.getByTestId('list-group-item'));
      expect(onClick).toHaveBeenCalledWith('item1');
    });

    it('prefers item.onClick over the list-level onClick', () => {
      const listOnClick = jest.fn();
      const itemOnClick = jest.fn();
      renderComponent({
        onClick: listOnClick,
        list: [{ ...baseItem, onClick: itemOnClick }],
      });
      fireEvent.click(screen.getByTestId('list-group-item'));
      expect(itemOnClick).toHaveBeenCalledTimes(1);
      expect(listOnClick).not.toHaveBeenCalled();
    });

    it('sets onClick to null when neither item.onClick nor list onClick is provided', () => {
      renderComponent({ onClick: undefined });
      // Clicking should not throw
      expect(() => fireEvent.click(screen.getByTestId('list-group-item'))).not.toThrow();
    });
  });

  describe('FontAwesomeIcon', () => {
    it('renders icon when iconName is provided', () => {
      renderComponent({ list: [{ ...baseItem, iconName: 'star' }] });
      expect(screen.getByTestId('fa-icon')).toBeInTheDocument();
    });

    it('does not render icon when iconName is absent', () => {
      renderComponent();
      expect(screen.queryByTestId('fa-icon')).not.toBeInTheDocument();
    });

    it('passes iconClass to the icon', () => {
      renderComponent({ list: [{ ...baseItem, iconName: 'star', iconClass: 'icon-red' }] });
      expect(screen.getByTestId('fa-icon')).toHaveClass('icon-red');
    });
  });

  describe('Badge', () => {
    it('renders badge when badge prop is provided on item', () => {
      renderComponent({ list: [{ ...baseItem, badge: '3' }] });
      expect(screen.getByTestId('badge')).toBeInTheDocument();
    });

    it('renders badge text content', () => {
      renderComponent({ list: [{ ...baseItem, badge: '42' }] });
      expect(screen.getByTestId('badge')).toHaveTextContent('42');
    });

    it('does not render badge when badge prop is absent', () => {
      renderComponent();
      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    });
  });

  describe('key resolution', () => {
    it('uses item.key as the React key (no duplicate-key warning)', () => {
      expect(() => renderComponent({
        list: [
          { id: 'a', key: 'k1', text: 'A' },
          { id: 'b', key: 'k2', text: 'B' },
        ],
      })).not.toThrow();
    });

    it('renders without error when item has neither key nor id (falls back to empty string key)', () => {
      expect(() => renderComponent({ list: [{ text: 'No key or id' }] })).not.toThrow();
    });
  });

  describe('falsy fallbacks', () => {
    it('renders without error when item has no id (id falls back to empty string)', () => {
      renderComponent({ list: [{ key: 'k1', text: 'No id' }] });
      expect(screen.getByTestId('list-group-item')).toBeInTheDocument();
    });

    it('renders without error when item has no text (text falls back to empty string)', () => {
      renderComponent({ list: [{ id: 'x', key: 'k1' }] });
      expect(screen.getByTestId('list-group-item')).toBeInTheDocument();
    });
  });
});
