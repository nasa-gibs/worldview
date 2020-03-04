import React from 'react';
import PropTypes from 'prop-types';

/*
 *
 * @class Selector
 * @extends React.Component
 */
export default class Selector extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      value: props.value,
    };
  }

  handleChange(event) {
    this.props.onChange(this.props.optionName, event.target.value);
  }

  render() {
    return (
      <select
        value={this.props.value}
        id={this.props.id}
        onChange={this.handleChange.bind(this)}
      >
        {this.props.optionArray.values.map((dataEl, i) => (
          <option key={`${dataEl.value}-${i}`} value={dataEl.value}>
            {dataEl.text}
          </option>
        ))}
      </select>
    );
  }
}

Selector.propTypes = {
  id: PropTypes.string,
  onChange: PropTypes.func,
  optionArray: PropTypes.object,
  optionName: PropTypes.string,
  value: PropTypes.string,
};
