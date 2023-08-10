import {
  Circle as OlStyleCircle,
  Fill as OlStyleFill,
  Stroke as OlStyleStroke,
  Style as OlStyle,
} from 'ol/style';

export const areaBgFill = new OlStyleFill({
  color: 'rgba(213, 78, 33, 0.1)',
});

export const solidBlackLineStroke = new OlStyleStroke({
  color: 'rgba(0, 0, 0, 1)',
  lineJoin: 'round',
  width: 5,
});

export const drawStyles = [
  new OlStyle({
    fill: areaBgFill,
    stroke: solidBlackLineStroke,
  }),
  new OlStyle({
    stroke: new OlStyleStroke({
      color: '#fff',
      lineDash: [10, 20],
      lineJoin: 'round',
      width: 2,
    }),
    image: new OlStyleCircle({
      radius: 7,
      stroke: new OlStyleStroke({
        color: 'rgba(0, 0, 0, 0.7)',
      }),
      fill: new OlStyleFill({
        color: 'rgba(255, 255, 255, 0.3)',
      }),
    }),
  }),
];

export const vectorStyles = [
  new OlStyle({
    fill: areaBgFill,
    stroke: solidBlackLineStroke,
  }),
  new OlStyle({
    stroke: new OlStyleStroke({
      color: '#fff',
      lineJoin: 'round',
      width: 2,
    }),
  }),
];
