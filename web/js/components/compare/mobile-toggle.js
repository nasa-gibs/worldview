import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { toggleActiveCompareState as toggleActiveCompareStateAction } from '../../modules/compare/actions';

function MobileComparisonToggle (props) {
  const {
    active,
    isCompareA,
    toggleActiveCompareState,
  } = props;

  const [isCompareASelected, setCompareASelected] = useState(isCompareA);
  useEffect(() => {
    if (isCompareASelected !== isCompareA) {
      setCompareASelected(isCompareA);
    }
  }, [isCompareA]);

  if (isCompareASelected !== isCompareA) {
    toggleActiveCompareState();
  }

  if (!active) {
    return null;
  }

  const handleClick = (evt) => {
    if (evt.target.id === 'compare-toggle-selected-A') {
      setCompareASelected(true);
    } else {
      setCompareASelected(false);
    }
  };

  const classA = isCompareASelected ? 'compare-btn-selected' : '';
  const classB = !isCompareASelected ? 'compare-btn-selected' : '';

  return (
    <div className="comparison-mobile-select-toggle">
      <button
        type="button"
        id="compare-toggle-selected-A"
        className={`compare-toggle-selected-btn ${classA}`}
        onClick={handleClick}
      >
        A
      </button>
      <button
        type="button"
        id="compare-toggle-selected-B"
        className={`compare-toggle-selected-btn ${classB}`}
        onClick={handleClick}
      >
        B
      </button>
    </div>
  );
}

const mapStateToProps = (state) => {
  const { compare } = state;
  const { active, isCompareA } = compare;
  return {
    active,
    isCompareA,
  };
};

const mapDispatchToProps = (dispatch) => ({
  toggleActiveCompareState: () => {
    dispatch(toggleActiveCompareStateAction());
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MobileComparisonToggle);

MobileComparisonToggle.propTypes = {
  active: PropTypes.bool.isRequired,
  isCompareA: PropTypes.bool.isRequired,
  toggleActiveCompareState: PropTypes.func.isRequired,
};
