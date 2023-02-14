import React from 'react';
import PropTypes from 'prop-types';
import HoverTooltip from './hover-tooltip';
/*
 * A checkbox component
 * @class Checkbox
 * @extends React.Component
 */
export default function Checkbox (props) {
  const {
    onCheck, checked, isRound, color, tooltipPlacement, classNames, id, name, title, label, children, disabled,
  } = props;

  const roundClassName = isRound ? 'wv-checkbox-round ' : '';
  const defaultClassName = 'wv-checkbox ';
  const checkedClassName = checked ? 'checked ' : '';
  const disabledClassName = disabled ? ' disabled' : '';
  const caseClassName = defaultClassName + roundClassName + checkedClassName + color + disabledClassName;
  const showDisabledToolTip = disabled && id && title;
  return (
    <>
      {showDisabledToolTip && (
        <HoverTooltip target={`#${id}-case`} labelText={title} placement={tooltipPlacement} />
      )}
      <div id={`${id}-case`} className={caseClassName}>
        <input
          type="checkbox"
          id={id}
          title={showDisabledToolTip ? '' : title}
          name={name}
          checked={checked}
          className={classNames}
          onChange={showDisabledToolTip ? () => null : onCheck}
          tabIndex="0"
        />
        {children}
        <label htmlFor={id}>
          <span>{label}</span>
        </label>
      </div>
    </>
  );
}
Checkbox.defaultProps = {
  checked: true,
  color: '',
  isRound: false,
  onCheck: null,
  disabled: false,
  tooltipPlacement: 'bottom',
};

Checkbox.propTypes = {
  checked: PropTypes.bool,
  children: PropTypes.node,
  classNames: PropTypes.string,
  disabled: PropTypes.bool,
  tooltipPlacement: PropTypes.string,
  color: PropTypes.string,
  id: PropTypes.string.isRequired,
  isRound: PropTypes.bool,
  label: PropTypes.string,
  name: PropTypes.string,
  onCheck: PropTypes.func,
  title: PropTypes.string,
};
