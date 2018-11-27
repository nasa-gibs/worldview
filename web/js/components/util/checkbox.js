import React from 'react';
import PropTypes from 'prop-types';

/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
export class Checkbox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      checked: props.checked
    };
  }
  componentWillReceiveProps(nextProps) {
    if (this.state.checked !== nextProps.checked) {
      this.setState({
        checked: nextProps.checked
      });
    }
  }
  onClick(e) {
    const { onClick } = this.props;
    if (onClick) {
      e.stopPropagation();
      onClick(e);
    }
  }
  handleChange(e) {
    const { onCheck } = this.props;
    const boo = !this.state.checked;
    this.setState({
      checked: boo
    });
    if (onCheck) onCheck(boo);
  }
  render() {
    const { checked } = this.state;
    const { isRound, color, classNames, id, name, title, label } = this.props;
    const roundClassName = isRound ? 'wv-checkbox-round ' : '';
    const defaultClassName = 'wv-checkbox ';
    const checkedClassName = checked ? 'checked ' : '';
    const caseClassName =
      defaultClassName + roundClassName + checkedClassName + color;

    return (
      <div className={caseClassName} onClick={this.onClick.bind(this)}>
        <input
          type="checkbox"
          id={id}
          title={title}
          name={name}
          checked={checked}
          className={classNames}
          onChange={this.handleChange.bind(this)}
        />
        <label htmlFor={id}>{label}</label>
      </div>
    );
  }
}
Checkbox.defaultProps = {
  checked: true,
  onCheck: null,
  isRound: false,
  color: ''
};

Checkbox.propTypes = {
  onCheck: PropTypes.func,
  id: PropTypes.string,
  checked: PropTypes.bool,
  classNames: PropTypes.string,
  title: PropTypes.string,
  name: PropTypes.string,
  label: PropTypes.string,
  onClick: PropTypes.func,
  isRound: PropTypes.bool,
  color: PropTypes.string
};
