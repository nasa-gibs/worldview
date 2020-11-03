import CoordinateParser from 'coordinate-parser';

// check for valid coordinates using https://www.npmjs.com/package/coordinate-parser
export default function isValidCoordinates(position) {
  try {
    const isValid = new CoordinateParser(position);
    return isValid;
  } catch (error) {
    return false;
  }
}
