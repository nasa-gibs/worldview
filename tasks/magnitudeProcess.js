const fs = require('fs');
const util = require('util');

const fsWriteFile = util.promisify(fs.writeFile);

const SOURCE_DIR = '../data/allStormsIce.json';
const DEST_DIR = '../data/magnitudeProcess.json';

const eventsData = JSON.parse(fs.readFileSync(SOURCE_DIR, 'utf-8'));
const totals = {
  seaLakeIce: {
    totalPoints: 0,
    pointsWithMagnitude: 0,
    totalEvents: 0,
    eventsWithMagnitude: 0,
  },
  severeStorms: {
    totalPoints: 0,
    pointsWithMagnitude: 0,
    totalEvents: 0,
    eventsWithMagnitude: 0,
  },
};

const kts = [];
const nmSquared = [];

eventsData.events.forEach(({ geometry, categories }) => {
  categories.forEach(({ id }) => {
    if (!Object.keys(totals).includes(id)) return;
    let hasMagnitude = false;
    totals[id].totalEvents += 1;
    geometry.forEach(({ magnitudeValue, magnitudeUnit }) => {
      totals[id].totalPoints += 1;
      if (magnitudeValue && magnitudeUnit) {
        hasMagnitude = true;
        totals[id].pointsWithMagnitude += 1;
      }
      if (magnitudeUnit === 'kts') {
        if (!kts.includes(magnitudeValue)) kts.push(magnitudeValue);
      } else if (magnitudeUnit === 'NM^2') {
        if (!nmSquared.includes(magnitudeValue)) nmSquared.push(magnitudeValue);
      }
    });
    if (hasMagnitude) totals[id].eventsWithMagnitude += 1;
  });
});

const uniqueKts = kts.sort((a, b) => a - b);
const uniqueNmSquared = nmSquared.sort((a, b) => a - b);

fsWriteFile(DEST_DIR, JSON.stringify({
  severeStorms: {
    min: uniqueKts[0],
    max: uniqueKts[uniqueKts.length - 1],
    ...totals.severeStorms,
    percentEventsWithMagnitude: ((totals.severeStorms.eventsWithMagnitude / totals.severeStorms.totalEvents)).toFixed(2),
    percentPointsWithMagnitude: ((totals.severeStorms.pointsWithMagnitude / totals.severeStorms.totalPoints)).toFixed(2),
    uniqueKts,
  },
  seaLakeIce: {
    min: nmSquared[0],
    max: nmSquared[nmSquared.length - 1],
    ...totals.seaLakeIce,
    percentEventsWithMagnitude: ((totals.seaLakeIce.eventsWithMagnitude / totals.seaLakeIce.totalEvents)).toFixed(2),
    percentPointsWithMagnitude: ((totals.seaLakeIce.pointsWithMagnitude / totals.seaLakeIce.totalPoints)).toFixed(2),
    uniqueNmSquared,
  },
}, null, 2), 'utf-8');
