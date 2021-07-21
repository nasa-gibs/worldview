import React from 'react';
import PropTypes from 'prop-types';

/*
 * A checkbox component
 * @class Checkbox
 * @extends React.Component
 */
export default function Checkbox (props) {
  const {
    onCheck, checked, isRound, color, classNames, id, name, title, label, children,
  } = props;

  const roundClassName = isRound ? 'wv-checkbox-round ' : '';
  const defaultClassName = 'wv-checkbox ';
  const checkedClassName = checked ? 'checked ' : '';
  const caseClassName = defaultClassName + roundClassName + checkedClassName + color;

  return (
    <div className={caseClassName}>
      <input
        type="checkbox"
        id={id}
        title={title}
        name={name}
        checked={checked}
        className={classNames}
        onChange={onCheck}
        tabIndex="0"
      />
      {children}
      <label htmlFor={id}>
        <span>{label}</span>
      </label>
    </div>
  );
}
Checkbox.defaultProps = {
  checked: true,
  color: '',
  isRound: false,
  onCheck: null,
};

Checkbox.propTypes = {
  checked: PropTypes.bool,
  children: PropTypes.node,
  classNames: PropTypes.string,
  color: PropTypes.string,
  id: PropTypes.string.isRequired,
  isRound: PropTypes.bool,
  label: PropTypes.string,
  name: PropTypes.string,
  onCheck: PropTypes.func,
  title: PropTypes.string,
};
