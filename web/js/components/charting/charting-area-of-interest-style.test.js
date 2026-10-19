import {
  areaBgFill,
  solidBlackLineStroke,
  drawStyles,
  vectorStyles,
} from './charting-area-of-interest-style';
import { Fill, Stroke, Style } from 'ol/style';

describe('charting-area-of-interest-style', () => {
  it('should export areaBgFill as an instance of Fill', () => {
    expect(areaBgFill).toBeDefined();
    expect(areaBgFill).toBeInstanceOf(Fill);
  });

  it('should export solidBlackLineStroke as an instance of Stroke', () => {
    expect(solidBlackLineStroke).toBeDefined();
    expect(solidBlackLineStroke).toBeInstanceOf(Stroke);
  });

  it('should export drawStyles array with correct styles', () => {
    expect(drawStyles).toBeDefined();
    expect(Array.isArray(drawStyles)).toBe(true);
    expect(drawStyles.length).toBe(2);
    expect(drawStyles[0]).toBeInstanceOf(Style);
    expect(drawStyles[1]).toBeInstanceOf(Style);
  });

  it('should export vectorStyles array with correct styles', () => {
    expect(vectorStyles).toBeDefined();
    expect(Array.isArray(vectorStyles)).toBe(true);
    expect(vectorStyles.length).toBe(2);
    expect(vectorStyles[0]).toBeInstanceOf(Style);
    expect(vectorStyles[1]).toBeInstanceOf(Style);
  });
});
