import React from 'react';
import PropTypes from 'prop-types';

/*
 * A checkbox component
 * @class Checkbox
 * @extends React.Component
 */
export default class Checkbox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      checked: props.checked,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { checked } = this.state;
    if (checked !== nextProps.checked) {
      this.setState({
        checked: nextProps.checked,
      });
    }
  }

  handleClick(e) {
    const { onClick } = this.props;
    if (onClick) {
      e.stopPropagation();
      onClick(e);
    }
  }

  handleChange(e) {
    this.setState((prevState) => {
      const { onCheck } = this.props;
      const checked = !prevState.checked;
      if (onCheck) onCheck(checked);
      return { checked };
    });
  }

  render() {
    const { checked } = this.state;
    const {
      isRound, color, classNames, id, name, title, label, children,
    } = this.props;
    const roundClassName = isRound ? 'wv-checkbox-round ' : '';
    const defaultClassName = 'wv-checkbox ';
    const checkedClassName = checked ? 'checked ' : '';
    const caseClassName = defaultClassName + roundClassName + checkedClassName + color;

    return (
      <div
        className={caseClassName}
        onClick={this.handleClick}
      >
        <input
          type="checkbox"
          id={id}
          title={title}
          name={name}
          checked={checked}
          className={classNames}
          onChange={this.handleChange}
        />
        {children}
        <label htmlFor={id}>
          <span>{label}</span>
        </label>
      </div>
    );
  }
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
  onClick: PropTypes.func,
  title: PropTypes.string,
};
