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
  if (!active) {
    return null;
  }

  const [isCompareASelected, toggleCompareASelected] = useState(isCompareA);
  useEffect(() => {
    if (isCompareASelected !== isCompareA) {
      toggleCompareASelected(isCompareA);
    }
  }, [isCompareA]);
  useEffect(() => {
    if (isCompareASelected !== isCompareA) {
      toggleActiveCompareState();
    }
  }, [isCompareASelected]);

  const classA = isCompareASelected ? 'compare-btn-selected' : '';
  const classB = !isCompareASelected ? 'compare-btn-selected' : '';

  return (
    <div className="comparison-mobile-select-toggle">
      <div
        className={`compare-toggle-selected-btn ${classA}`}
        onClick={() => toggleCompareASelected(true)}
      >
        A
      </div>
      <div
        className={`compare-toggle-selected-btn ${classB}`}
        onClick={() => toggleCompareASelected(false)}
      >
        B
      </div>
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
