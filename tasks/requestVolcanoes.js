
const XLSX = require('xlsx');
const https = require('https');
const fs = require('fs');

const geoJSON = {
  type: 'FeatureCollection',
  features: [],
};
const options = {
  hostname: 'volcano.si.edu',
  port: 443,
  path: '/database/list_volcano_holocene_excel.cfm',
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
};
const smithText = 'Venzke, E (ed.). Smithsonian Institution.';
const req = https.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);
  const buffers = [];
  res.on('data', (chunk) => {
    try {
      if (!chunk) return;
      // console.log('chunk');
      // console.log(chunk);
      buffers.push(chunk);
    } catch (error) {
      console.log(error);
    }
  });
  res.on('end', () => {
    const geojsonFeatures = geoJSON.features;
    buffers.forEach((obj, index) => {
      if (index !== 0) return;
      const newBuffer = Buffer.concat(buffers);
      const workbook = XLSX.read(newBuffer, { type: 'buffer' });
      const worksheet = workbook.Sheets['Holocene Volcano List'];
      // console.log(workbook.Sheets['Holocene Volcano List']);
      geoJSON.citation = `${worksheet.A1.v} ${smithText} ${worksheet.F1.v}`;
      console.log(geoJSON);
      const oldRange = worksheet['!ref'];
      const range = XLSX.utils.decode_range(oldRange);
      range.s.r = 1;
      worksheet['!ref'] = XLSX.utils.encode_range(range);
      const jsObj = XLSX.utils.sheet_to_json(worksheet);
      // workbook.forEach((sheet) => {
      //   console.log(XLSX.utils.sheet_to_json(sheet));
      // });

      // if (!subArray.length) return;
      // const sheet = subArray[0];
      //  if (sheet.data) {
      // console.log(XLSX.utils.sheet_to_json(sheet.data[0][0]));
      // console.log(xlsx.parse(sheet.data[0]));
      //   }
      jsObj.forEach((feature) => {
        const geoJsonFeature = {
          type: 'Feature',
          properties: {
            'Volcano Number': feature['Volcano Number'],
            'Volcano Name': feature['Volcano Name'],
            Country: feature.Country,
            'Primary Volcano Type': feature['Primary Volcano Type'],
            'Activity Evidence': feature['Activity Evidence'],
            'Last Known Eruption': feature['Last Known Eruption'],
            Region: feature.Region,
            Subregion: feature.Subregion,
            Latitude: feature.Latitude,
            Longitude: feature.Longitude,
            'Elevation (m)': feature['Elevation (m)'],
            'Dominant Rock Type': feature['Dominant Rock Type'],
            'Tectonic Setting': feature['Tectonic Setting'],
          },
          geometry: {
            type: 'Point',
            coordinates: [
              feature.Longitude,
              feature.Latitude,
            ],
          },
        };
        geojsonFeatures.push(geoJsonFeature);
      });

      const jsonDone = JSON.stringify(geoJSON, null, 2);
      fs.writeFile('./volcanos/Holocene_Volcano_List.json', jsonDone, 'utf8', () => {
        console.log('wrote: Holocene Volcano List.json');
      });
    });
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.end();
