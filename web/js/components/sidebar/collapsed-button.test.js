/* eslint-disable react/prop-types */
import { render, fireEvent } from '@testing-library/react';
import CollapsedButton from './collapsed-button';

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: (props) => <span data-testid={`fa-${props.icon}`} className={props.className} />,
}));

describe('CollapsedButton', () => {
  it('renders the expand button with the correct aria-label', () => {
    const { getByLabelText } = render(<CollapsedButton numberOfLayers={3} onclick={() => {}} />);
    expect(getByLabelText('Expand sidebar')).toBeTruthy();
  });

  it('renders desktop layout with "N Layers" text and a caret icon', () => {
    const { getByText, getByTestId, container } = render(
      <CollapsedButton isMobile={false} numberOfLayers={5} onclick={() => {}} />,
    );
    expect(getByText('5 Layers')).toBeTruthy();
    expect(getByTestId('fa-caret-down')).toBeTruthy();
    expect(getByTestId('fa-layer-group')).toBeTruthy();
    expect(container.querySelector('.sidebar-expand')).toBeTruthy();
    expect(container.querySelector('.sidebar-expand.mobile')).toBeNull();
  });

  it('renders mobile layout with just the count and no caret icon', () => {
    const { getByText, queryByTestId, container } = render(
      <CollapsedButton isMobile numberOfLayers={7} onclick={() => {}} />,
    );
    expect(getByText('7')).toBeTruthy();
    expect(queryByTestId('fa-caret-down')).toBeNull();
    expect(container.querySelector('.sidebar-expand.mobile')).toBeTruthy();
  });

  it('calls onclick when the button is clicked', () => {
    const onclick = jest.fn();
    const { getByLabelText } = render(
      <CollapsedButton isMobile={false} numberOfLayers={2} onclick={onclick} />,
    );
    fireEvent.click(getByLabelText('Expand sidebar'));
    expect(onclick).toHaveBeenCalledTimes(1);
  });
});
