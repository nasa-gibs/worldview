import React from 'react';

const GranuleAlertModalBody = () => (
  <div className="basic-modal">

    <h1>
      Why am I seeing NONE when data is being shown?
    </h1>

    <p>
      Many layers in Worldview are made available in
      {' '}
      <a href="https://earthdata.nasa.gov/earth-observation-data/near-real-time/near-real-time-versus-standard-products" target="_blank" rel="noopener noreferrer">Near Real-Time (NRT)</a>
      {' '}
      and then &quot;backfilled&quot; by the corresponding Standard product when it is available. Worldview displays them on a
      <a href="https://wiki.earthdata.nasa.gov/display/GIBS/GIBS+API+for+Developers#GIBSAPIforDevelopers-%22BestAvailable%22Layers" target="_blank" rel="noopener noreferrer"> &quot;Best Available&quot; </a>
      basis, showing Standard-quality imagery if it is available, NRT otherwise.
    </p>
    <p>
      Often layers will have both NRT and Standard collections available for download in Earthdata Search. If you are looking
      for data within the last ~7 days you will likely want to use the NRT collection.  If you have the NRT collection
      selected and the granule count shows &quot;NONE&quot;, this may be an indication that your selected date is too far in the past and you
      may have better luck with the Standard collection.
    </p>
    <hr />
    <h1>
      Why am I seeing &quot;0 out of n&quot; granules when there is imagery displayed on the map?
    </h1>
    <ol>
      <li>
        The target area selection does not encompass any of the imagery displayed on the map.
      </li>
      <li>
        The target area selection is encompassing imagery but the collection&apos;s metadata record does not contain the appropriate spatial
        information for this feature to work. You can either uncheck the Target Area Selection box in Worldview or click Download Via
        Earthdata Search and remove the spatial filter there.
      </li>
    </ol>


  </div>
);
export default GranuleAlertModalBody;
