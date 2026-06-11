import { render, fireEvent } from '@testing-library/react';
import CompareModeOptions from './compare-mode-options';

describe('CompareModeOptions', () => {
  it('is visible when active and not mobile', () => {
    const { container } = render(
      <CompareModeOptions isActive isMobile={false} selected="swipe" onclick={() => {}} />,
    );
    const wrapper = container.querySelector('#wv-ab-mode-selection-case');
    expect(wrapper).toBeTruthy();
    expect(wrapper.style.display).toBe('block');
  });

  it('is hidden when not active', () => {
    const { container } = render(
      <CompareModeOptions isActive={false} isMobile={false} selected="swipe" onclick={() => {}} />,
    );
    expect(container.querySelector('#wv-ab-mode-selection-case').style.display).toBe('none');
  });

  it('is hidden on mobile even when active', () => {
    const { container } = render(
      <CompareModeOptions isActive isMobile selected="swipe" onclick={() => {}} />,
    );
    expect(container.querySelector('#wv-ab-mode-selection-case').style.display).toBe('none');
  });

  it('renders the title and the three comparison type buttons', () => {
    const { getByText } = render(
      <CompareModeOptions isActive isMobile={false} selected="swipe" onclick={() => {}} />,
    );
    expect(getByText('Comparison Mode')).toBeTruthy();
    expect(getByText('Swipe')).toBeTruthy();
    expect(getByText('Opacity')).toBeTruthy();
    expect(getByText('Spy')).toBeTruthy();
  });

  it('disables only the currently selected mode button', () => {
    const { getByText } = render(
      <CompareModeOptions isActive isMobile={false} selected="opacity" onclick={() => {}} />,
    );
    expect(getByText('Swipe').disabled).toBe(false);
    expect(getByText('Opacity').disabled).toBe(true);
    expect(getByText('Spy').disabled).toBe(false);
  });

  it('calls onclick with the mode when an enabled button is clicked', () => {
    const onclick = jest.fn();
    const { getByText } = render(
      <CompareModeOptions isActive isMobile={false} selected="swipe" onclick={onclick} />,
    );
    fireEvent.click(getByText('Opacity'));
    expect(onclick).toHaveBeenCalledWith('opacity');

    fireEvent.click(getByText('Spy'));
    expect(onclick).toHaveBeenCalledWith('spy');
  });

  it('calls onclick with "swipe" when the Swipe button is enabled and clicked', () => {
    const onclick = jest.fn();
    const { getByText } = render(
      <CompareModeOptions isActive isMobile={false} selected="opacity" onclick={onclick} />,
    );
    fireEvent.click(getByText('Swipe'));
    expect(onclick).toHaveBeenCalledWith('swipe');
  });
});
