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
      This initial release of the &quot;data download via Earthdata Search&quot; feature currently links to either
      the NRT or Standard product but not to both; in most cases, it links to NRT. That may mean that if
      you are looking at a date older than ~7 days, the NRT product may not be available and the listing of
      granules will be set to &quot;NONE&quot; even though standard granules exist.
    </p>
    <p>
      Please note that the next version of this feature will further enhance Worldview&apos;s downloading capabilities and
      allow for standard products to be included in the listings.
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
