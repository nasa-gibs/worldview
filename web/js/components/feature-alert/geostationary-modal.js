import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { history } from '../../main';
import update from 'immutability-helper';
import {
  Button
} from 'reactstrap';

class GeostationaryModalBody extends React.Component {
  render() {
    const { prepareAnimate } = this.props;

    return (
      <div className="compare-dialog">
        <p>
            Our latest release includes a number of new layers for geostationary products.  These new layers
            can be found in the new &quot;Featured&quot; tab of the &quot;Add Layers&quot; menu.
        </p>
        <p>
          Geostationary products are updated more frequently than others.  For example, the
          set of geostationary layers included in this release are updated in increments of 10 minutes.
        </p>
        <p>
            To take full advantage of this, the time (and timescale) of the timeline can now be set
            down to the hour and minute whenever any geostatinary products are in
            the current list of overlays.
        </p>
        <p> For an optimal experience, try setting the timeline interval time to a custom interval of 10 minutes.</p>
        <p>
            Of course, the animation tool has also been updated to allow adjustments down to the hours and minutes as well.
            Click below to setup an animation to see geostationary in action!
        </p>
        <Button
          className="btn-lg btn-primary mx-auto w-100"
          onClick={prepareAnimate}>Try it!
        </Button>
      </div>
    );
  }
}

const getLocation = (search) => {
  search = search.split('/?').pop();
  const location = update(history.location, {
    search: { $set: search }
  });
  return location;
};

const mapDispatchToProps = (dispatch) => ({
  prepareAnimate: () => {
    const paramArr = [
      'p=geographic&',
      'l=Reference_Labels,Reference_Features(hidden),Coastlines(hidden),GOES-East_ABI_Band2_Red_Visible,VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor&',
      't=2019-09-01-T20%3A00%3A41Z&',
      'v=-84.25409131402579,21.881949559541848,-69.48846631402579,30.213980809541848&',
      'z=5&ics=true&ici=5&icd=10&t=2019-09-01-T20%3A00%3A41Z&',
      'ab=on&as=2019-09-01-T16%3A00%3A00Z&ae=2019-09-01-T21%3A00%3A00Z&al=true'
    ];
    const urlParams = paramArr.reduce((prev, curr) => prev + curr, '');
    const location = getLocation(urlParams);
    dispatch({ type: 'REDUX-LOCATION-POP-ACTION', payload: location });
  }
});

export default connect(
  null,
  mapDispatchToProps
)(GeostationaryModalBody);

GeostationaryModalBody.propTypes = {
  addLayer: PropTypes.func,
  openProducts: PropTypes.func,
  prepareAnimate: PropTypes.func,
  setTime: PropTypes.func
};
