import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { history } from '../../main';
import update from 'immutability-helper';
import { Button } from 'reactstrap';

class GeostationaryModalBody extends React.Component {
  render() {
    const { addLayer, setTime, prepareAnimate } = this.props;

    return (
      <div className="compare-dialog">
        <p>How to get started?</p>
        <ul>

          <li className="compare-dialog-list-item">
            <img src="images/geostationary/featured.png" />
            <p>
              Our latest release includes a number of new layers for geostationary products.  These new layers
              can be found in the new &quot;Featured&quot; tab of the &quot;Add Layers&quot; menu.
            </p>
            <p>
              To jump right in, <a href="#" onClick={addLayer}>click here to add a geostationary layer</a> to the
              currently active overlays.
            </p>
          </li>

          <li className="compare-dialog-list-item">
            <p>Geostationary products are updated more frequently than others.  For example, the
                set of geostationary layers included in this release are updated in increments of 10 minutes. </p>
            <p>To take full advantage of this, the time and timescale of the timeline can now be set
                down to the hour and minute whenever any geostatinary products are in
                the current list of overlays. </p>
            <p> For an optimal experience, <a href="#" onClick={setTime}>click here to set a custom interval </a>
                to match the GOES East Red Visible layer&apos;s interval time of 10 minutes.</p>
            <img src="images/geostationary/timeline.png" />
          </li>

          <li className="compare-dialog-list-item">
            <img src="images/geostationary/animation.png" />
            <p>Of course, the animation tool has also been updated to allow adjustments down to the hours and minutes as well.
              Click the play button to see geostationary in action!
            </p>
            <Button
              className="btn-sm btn-primary"
              onClick={prepareAnimate}>Try it!
            </Button>
          </li>

        </ul>
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
  addLayer: () => {
    const paramArr = [
      'p=geographic&',
      'l=GOES-East_ABI_Band2_Red_Visible,Reference_Labels(hidden),Reference_Features(hidden),Coastlines,VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor&',
      't=2019-09-01-T20%3A00%3A41Z'
    ];
    const urlParams = paramArr.reduce((prev, curr) => prev + curr, '');
    const location = getLocation(urlParams);
    dispatch({ type: 'REDUX-LOCATION-POP-ACTION', payload: location });
  },
  setTime: () => {
    const paramArr = [
      'p=geographic&',
      'l=GOES-East_ABI_Band2_Red_Visible,Reference_Labels(hidden),Reference_Features(hidden),Coastlines,VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor&',
      't=2019-09-01-T20%3A00%3A41Z&',
      'z=5&ics=true&ici=5&icd=10&t=2019-09-01-T20%3A00%3A41Z'
    ];
    const urlParams = paramArr.reduce((prev, curr) => prev + curr, '');
    const location = getLocation(urlParams);
    dispatch({ type: 'REDUX-LOCATION-POP-ACTION', payload: location });
  },
  prepareAnimate: () => {
    const paramArr = [
      'p=geographic&',
      'l=GOES-East_ABI_Band2_Red_Visible,Reference_Labels(hidden),Reference_Features(hidden),Coastlines,VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor&',
      't=2019-09-01-T20%3A00%3A41Z&',
      'v=-86.93586254108634,22.191846804617647,-70.13996410358634,33.95161242961765&',
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
