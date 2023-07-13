import React from 'react';

function GranuleAlertModalBody() {
  return (
    <div className="basic-modal">

      <h1>
        Why am I seeing NONE or “0 out of n” granules when there is imagery displayed on the map?
      </h1>

      <p>
        Many layers in @NAME@ are made available in
        {' '}
        <a href="https://earthdata.nasa.gov/earth-observation-data/near-real-time/near-real-time-versus-standard-products" target="_blank" rel="noopener noreferrer">Near Real-Time (NRT)</a>
        {' '}
        and then &quot;backfilled&quot; by the corresponding Standard (STD) product when it is available. @NAME@ displays them on a
        <a href="https://nasa-gibs.github.io/gibs-api-docs/access-advanced-topics/#best-available-layers" target="_blank" rel="noopener noreferrer"> &quot;Best Available&quot; </a>
        basis, showing Standard-quality imagery if it is available, NRT otherwise.
      </p>
      <p>
        Often layers will have both NRT and STD collections available for download in Earthdata Search. If you are looking
        for data within the last ~7 days you will likely want to use the NRT collection.  If you have the NRT collection
        selected and the granule count shows &quot;NONE&quot;, this may be an indication that your selected date is too far in the past and you
        may have better luck with the STD collection.
      </p>
      <p>You may also see NONE or “0 out of n” granules when:</p>
      <ol>
        <li>
          The area of interest does not encompass any of the imagery displayed on the map.
        </li>
        <li>
          The area of interest is encompassing imagery but the collection&apos;s metadata record does not contain the appropriate spatial
          information for this feature to work. Unchecking the &quot;Set Area of Interest&quot; box should address this.
        </li>
      </ol>


    </div>
  );
}
export default GranuleAlertModalBody;
