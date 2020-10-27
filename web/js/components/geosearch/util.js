import CoordinateParser from 'coordinate-parser';

export default function isValidCoordinates(position) {
  try {
    const validatedCoordinates = new CoordinateParser(position);
    return validatedCoordinates;
  } catch (error) {
    return false;
  }
}
