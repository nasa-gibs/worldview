export function getGreyScalar(val, min, max) {
  var colors = [];
  colors[0] = 255 * (val - min) / (max - min);
  colors[1] = colors[0];
  colors[2] = colors[0];
  return colors;
}

export function getGreyLog(val, min, max) {
  var colors = [];
  colors[0] = 255 * Math.log10((val - min) / (max - min) * 9 + 1);
  colors[1] = colors[0];
  colors[2] = colors[0];
  return colors;
}

export function getJetScalar(val, min, max) {
  var colors = [];
  var val = (val - min) / (max - min);
  if (val < 1 / 15) {
      var r = 0;
      var g = 0;
      var b = val * 15 * (255 - 189) + 189;
  } else if (val < 2 / 15 && val > 1 / 15) {
      val -= 1 / 15;
      var r = 0;
      var g = val * 15 * 66 + 66;
      var b = 255;
  } else if (val < 3 / 15 && val > 2 / 15) {
      val -= 2 / 15;
      var r = 0;
      var g = val * 15 * (132 - 66) + 66;
      var b = 255;
  } else if (val < 4 / 15 && val > 3 / 15) {
      val -= 3 / 15;
      var r = 0;
      var g = val * 15 * (189 - 132) + 132;
      var b = 255;
  } else if (val < 5 / 15 && val > 4 / 15) {
      val -= 4 / 15;
      var r = 0;
      var g = val * 15 * (255 - 189) + 189;
      var b = 255;
  } else if (val < 6 / 15 && val > 5 / 15) {
      val -= 5 / 15;
      var r = val * 15 * 66 + 66;
      var g = 255;
      var b = val * 15 * (189 - 255) + 255;
  } else if (val < 7 / 15 && val > 6 / 15) {
      val -= 6 / 15;
      var r = val * 15 * (132 - 66) + 66;
      var g = 255;
      var b = val * 15 * (132 - 189) + 189;
  } else if (val < 8 / 15 && val > 7 / 15) {
      val -= 7 / 15;
      var r = val * 15 * (189 - 132) + 132;
      var g = 255;
      var b = val * 15 * (66 - 132) + 132;
  } else if (val < 9 / 15 && val > 8 / 15) {
      val -= 8 / 15;
      var r = val * 15 * (255 - 189) + 255;
      var g = 255;
      var b = val * 15 * (0 - 66) + 66;
  } else if (val < 10 / 15 && val > 9 / 15) {
      val -= 9 / 15;
      var r = 255;
      var g = val * 15 * (189 - 255) + 255;
      var b = 0;
  } else if (val < 11 / 15 && val > 10 / 15) {
      val -= 10 / 15;
      var r = 255;
      var g = val * 15 * (132 - 189) + 189;
      var b = 0;
  } else if (val < 12 / 15 && val > 11 / 15) {
      val -= 11 / 15;
      var r = 255;
      var g = val * 15 * (66 - 132) + 132;
      var b = 0;
  } else if (val < 13 / 15 && val > 12 / 15) {
      val -= 12 / 15;
      var r = 255;
      var g = val * 15 * (0 - 66) + 66;
      var b = 0;
  } else if (val < 14 / 15 && val > 13 / 15) {
      val -= 13 / 15;
      var r = val * 15 * (189 - 255) + 255;
      var g = 0;
      var b = 0;
  } else if (val > 14 / 15) {
      val -= 14 / 15;
      var r = val * 15 * (132 - 189) + 189;
      var g = 0;
      var b = 0;
  }
  colors[0] = r;
  colors[1] = g;
  colors[2] = b;

  return colors;
}

export function getJetLog(val, min, max) {
  var colors = [];
  var val = Math.log10((val - min) / (max - min) * 9 + 1);
  if (val < 1 / 15) {
      var r = 0;
      var g = 0;
      var b = val * 15 * (255 - 189) + 189;
  } else if (val < 2 / 15 && val > 1 / 15) {
      val -= 1 / 15;
      var r = 0;
      var g = val * 15 * 66 + 66;
      var b = 255;
  } else if (val < 3 / 15 && val > 2 / 15) {
      val -= 2 / 15;
      var r = 0;
      var g = val * 15 * (132 - 66) + 66;
      var b = 255;
  } else if (val < 4 / 15 && val > 3 / 15) {
      val -= 3 / 15;
      var r = 0;
      var g = val * 15 * (189 - 132) + 132;
      var b = 255;
  } else if (val < 5 / 15 && val > 4 / 15) {
      val -= 4 / 15;
      var r = 0;
      var g = val * 15 * (255 - 189) + 189;
      var b = 255;
  } else if (val < 6 / 15 && val > 5 / 15) {
      val -= 5 / 15;
      var r = val * 15 * 66 + 66;
      var g = 255;
      var b = val * 15 * (189 - 255) + 255;
  } else if (val < 7 / 15 && val > 6 / 15) {
      val -= 6 / 15;
      var r = val * 15 * (132 - 66) + 66;
      var g = 255;
      var b = val * 15 * (132 - 189) + 189;
  } else if (val < 8 / 15 && val > 7 / 15) {
      val -= 7 / 15;
      var r = val * 15 * (189 - 132) + 132;
      var g = 255;
      var b = val * 15 * (66 - 132) + 132;
  } else if (val < 9 / 15 && val > 8 / 15) {
      val -= 8 / 15;
      var r = val * 15 * (255 - 189) + 255;
      var g = 255;
      var b = val * 15 * (0 - 66) + 66;
  } else if (val < 10 / 15 && val > 9 / 15) {
      val -= 9 / 15;
      var r = 255;
      var g = val * 15 * (189 - 255) + 255;
      var b = 0;
  } else if (val < 11 / 15 && val > 10 / 15) {
      val -= 10 / 15;
      var r = 255;
      var g = val * 15 * (132 - 189) + 189;
      var b = 0;
  } else if (val < 12 / 15 && val > 11 / 15) {
      val -= 11 / 15;
      var r = 255;
      var g = val * 15 * (66 - 132) + 132;
      var b = 0;
  } else if (val < 13 / 15 && val > 12 / 15) {
      val -= 12 / 15;
      var r = 255;
      var g = val * 15 * (0 - 66) + 66;
      var b = 0;
  } else if (val < 14 / 15 && val > 13 / 15) {
      val -= 13 / 15;
      var r = val * 15 * (189 - 255) + 255;
      var g = 0;
      var b = 0;
  } else if (val > 14 / 15) {
      val -= 14 / 15;
      var r = val * 15 * (132 - 189) + 189;
      var g = 0;
      var b = 0;
  }
  colors[0] = r;
  colors[1] = g;
  colors[2] = b;

  return colors;
}

export function getPanoplyScalar(val, min, max) {
  var colors = [];
  var val = (val - min) / (max - min);
  if (val < 1 / 15) {
      var r = val * 15 * (41 - 25) + 25;
      var g = val * 15 * (84 - 27) + 27;
      var b = val * 15 * (246 - 208) + 208;
  } else if (val < 2 / 15 && val > 1 / 15) {
      val -= 1 / 15;
      var r = val * 15 * (62 - 41) + 41;
      var g = val * 15 * (153 - 84) + 84;
      var b = val * 15 * (248 - 246) + 246;
  } else if (val < 3 / 15 && val > 2 / 15) {
      val -= 2 / 15;
      var r = val * 15 * (104 - 62) + 62;
      var g = val * 15 * (194 - 153) + 153;
      var b = val * 15 * (250 - 248) + 248;
  } else if (val < 4 / 15 && val > 3 / 15) {
      val -= 3 / 15;
      var r = val * 15 * (128 - 104) + 104;
      var g = val * 15 * (219 - 194) + 194;
      var b = val * 15 * (252 - 250) + 250;
  } else if (val < 5 / 15 && val > 4 / 15) {
      val -= 4 / 15;
      var r = val * 15 * (151 - 128) + 128;
      var g = val * 15 * (239 - 219) + 219;
      var b = val * 15 * (253 - 252) + 252;
  } else if (val < 6 / 15 && val > 5 / 15) {
      val -= 5 / 15;
      var r = val * 15 * (170 - 151) + 151;
      var g = val * 15 * (246 - 239) + 239;
      var b = val * 15 * (254 - 253) + 253;
  } else if (val < 7 / 15 && val > 6 / 15) {
      val -= 6 / 15;
      var r = val * 15 * (206 - 170) + 170;
      var g = val * 15 * (255 - 246) + 246;
      var b = val * 15 * (255 - 254) + 254;
  } else if (val < 8 / 15 && val > 7 / 15) {
      val -= 7 / 15;
      var r = val * 15 * (254 - 206) + 206;
      var g = val * 15 * (254 - 255) + 255;
      var b = val * 15 * (126 - 255) + 255;
  } else if (val < 9 / 15 && val > 8 / 15) {
      val -= 8 / 15;
      var r = val * 15 * (255 - 254) + 254;
      var g = val * 15 * (235 - 254) + 254;
      var b = val * 15 * (77 - 126) + 126;
  } else if (val < 10 / 15 && val > 9 / 15) {
      val -= 9 / 15;
      var r = 255;
      var g = val * 15 * (196 - 235) + 235;
      var b = val * 15 * (64 - 77) + 77;
  } else if (val < 11 / 15 && val > 10 / 15) {
      val -= 10 / 15;
      var r = 255;
      var g = val * 15 * (143 - 196) + 196;
      var b = val * 15 * (49 - 64) + 64;
  } else if (val < 12 / 15 && val > 11 / 15) {
      val -= 11 / 15;
      var r = 255;
      var g = val * 15 * (70 - 143) + 143;
      var b = val * 15 * (31 - 49) + 49;
  } else if (val < 13 / 15 && val > 12 / 15) {
      val -= 12 / 15;
      var r = 255;
      var g = val * 15 * (0 - 70) + 70;
      var b = val * 15 * (23 - 31) + 31;
  } else if (val < 14 / 15 && val > 13 / 15) {
      val -= 13 / 15;
      var r = val * 15 * (218 - 255) + 255;
      var g = 0;
      var b = val * 15 * (17 - 23) + 23;
  } else if (val > 14 / 15) {
      val -= 14 / 15;
      var r = val * 15 * (163 - 218) + 218;
      var g = 0;
      var b = val * 15 * (10 - 17) + 17;
  }
  colors[0] = r;
  colors[1] = g;
  colors[2] = b;

  return colors;
}

export function getPanoplyLog(val, min, max) {
  var colors = [];
  var val = Math.log10((val - min) / (max - min) * 9 + 1);
  if (val < 1 / 15) {
      var r = val * 15 * (41 - 25) + 25;
      var g = val * 15 * (84 - 27) + 27;
      var b = val * 15 * (246 - 208) + 208;
  } else if (val < 2 / 15 && val > 1 / 15) {
      val -= 1 / 15;
      var r = val * 15 * (62 - 41) + 41;
      var g = val * 15 * (153 - 84) + 84;
      var b = val * 15 * (248 - 246) + 246;
  } else if (val < 3 / 15 && val > 2 / 15) {
      val -= 2 / 15;
      var r = val * 15 * (104 - 62) + 62;
      var g = val * 15 * (194 - 153) + 153;
      var b = val * 15 * (250 - 248) + 248;
  } else if (val < 4 / 15 && val > 3 / 15) {
      val -= 3 / 15;
      var r = val * 15 * (128 - 104) + 104;
      var g = val * 15 * (219 - 194) + 194;
      var b = val * 15 * (252 - 250) + 250;
  } else if (val < 5 / 15 && val > 4 / 15) {
      val -= 4 / 15;
      var r = val * 15 * (151 - 128) + 128;
      var g = val * 15 * (239 - 219) + 219;
      var b = val * 15 * (253 - 252) + 252;
  } else if (val < 6 / 15 && val > 5 / 15) {
      val -= 5 / 15;
      var r = val * 15 * (170 - 151) + 151;
      var g = val * 15 * (246 - 239) + 239;
      var b = val * 15 * (254 - 253) + 253;
  } else if (val < 7 / 15 && val > 6 / 15) {
      val -= 6 / 15;
      var r = val * 15 * (206 - 170) + 170;
      var g = val * 15 * (255 - 246) + 246;
      var b = val * 15 * (255 - 254) + 254;
  } else if (val < 8 / 15 && val > 7 / 15) {
      val -= 7 / 15;
      var r = val * 15 * (254 - 206) + 206;
      var g = val * 15 * (254 - 255) + 255;
      var b = val * 15 * (126 - 255) + 255;
  } else if (val < 9 / 15 && val > 8 / 15) {
      val -= 8 / 15;
      var r = val * 15 * (255 - 254) + 254;
      var g = val * 15 * (235 - 254) + 254;
      var b = val * 15 * (77 - 126) + 126;
  } else if (val < 10 / 15 && val > 9 / 15) {
      val -= 9 / 15;
      var r = 255;
      var g = val * 15 * (196 - 235) + 235;
      var b = val * 15 * (64 - 77) + 77;
  } else if (val < 11 / 15 && val > 10 / 15) {
      val -= 10 / 15;
      var r = 255;
      var g = val * 15 * (143 - 196) + 196;
      var b = val * 15 * (49 - 64) + 64;
  } else if (val < 12 / 15 && val > 11 / 15) {
      val -= 11 / 15;
      var r = 255;
      var g = val * 15 * (70 - 143) + 143;
      var b = val * 15 * (31 - 49) + 49;
  } else if (val < 13 / 15 && val > 12 / 15) {
      val -= 12 / 15;
      var r = 255;
      var g = val * 15 * (0 - 70) + 70;
      var b = val * 15 * (23 - 31) + 31;
  } else if (val < 14 / 15 && val > 13 / 15) {
      val -= 13 / 15;
      var r = val * 15 * (218 - 255) + 255;
      var g = 0;
      var b = val * 15 * (17 - 23) + 23;
  } else if (val > 14 / 15) {
      val -= 14 / 15;
      var r = val * 15 * (163 - 218) + 218;
      var g = 0;
      var b = val * 15 * (10 - 17) + 17;
  }
  colors[0] = r;
  colors[1] = g;
  colors[2] = b;

  return colors;
}

export function getParulaScalar(val, min, max) {
  var colors = [];
  var val = (val - min) / (max - min);
  if (val < 1 / 15) {
      var r = val * 15 * (49 - 53) + 53;
      var g = val * 15 * (69 - 42) + 42;
      var b = val * 15 * (188 - 135) + 135;
  } else if (val < 2 / 15 && val > 1 / 15) {
      val -= 1 / 15;
      var r = val * 15 * (4 - 49) + 49;
      var g = val * 15 * (101 - 69) + 69;
      var b = val * 15 * (225 - 188) + 188;
  } else if (val < 3 / 15 && val > 2 / 15) {
      val -= 2 / 15;
      var r = val * 15 * (15 - 4) + 4;
      var g = val * 15 * (119 - 101) + 101;
      var b = val * 15 * (219 - 225) + 225;
  } else if (val < 4 / 15 && val > 3 / 15) {
      val -= 3 / 15;
      var r = val * 15 * (19 - 15) + 15;
      var g = val * 15 * (136 - 119) + 119;
      var b = val * 15 * (211 - 219) + 219;
  } else if (val < 5 / 15 && val > 4 / 15) {
      val -= 4 / 15;
      var r = val * 15 * (7 - 19) + 19;
      var g = val * 15 * (156 - 136) + 136;
      var b = val * 15 * (207 - 211) + 211;
  } else if (val < 6 / 15 && val > 5 / 15) {
      val -= 5 / 15;
      var r = 7;
      var g = val * 15 * (170 - 156) + 156;
      var b = val * 15 * (193 - 207) + 207;
  } else if (val < 7 / 15 && val > 6 / 15) {
      val -= 6 / 15;
      var r = val * 15 * (32 - 7) + 7;
      var g = val * 15 * (180 - 170) + 170;
      var b = val * 15 * (173 - 193) + 193;
  } else if (val < 8 / 15 && val > 7 / 15) {
      val -= 7 / 15;
      var r = val * 15 * (73 - 32) + 32;
      var g = val * 15 * (188 - 180) + 180;
      var b = val * 15 * (148 - 173) + 173;
  } else if (val < 9 / 15 && val > 8 / 15) {
      val -= 8 / 15;
      var r = val * 15 * (122 - 73) + 73;
      var g = val * 15 * (191 - 188) + 188;
      var b = val * 15 * (124 - 148) + 148;
  } else if (val < 10 / 15 && val > 9 / 15) {
      val -= 9 / 15;
      var r = val * 15 * (165 - 122) + 122;
      var g = val * 15 * (190 - 191) + 191;
      var b = val * 15 * (107 - 124) + 124;
  } else if (val < 11 / 15 && val > 10 / 15) {
      val -= 10 / 15;
      var r = val * 15 * (202 - 165) + 165;
      var g = val * 15 * (187 - 190) + 190;
      var b = val * 15 * (92 - 107) + 107;
  } else if (val < 12 / 15 && val > 11 / 15) {
      val -= 11 / 15;
      var r = val * 15 * (236 - 202) + 202;
      var g = val * 15 * (185 - 187) + 187;
      var b = val * 15 * (76 - 92) + 92;
  } else if (val < 13 / 15 && val > 12 / 15) {
      val -= 12 / 15;
      var r = val * 15 * (254 - 236) + 236;
      var g = val * 15 * (198 - 185) + 185;
      var b = val * 15 * (52 - 76) + 76;
  } else if (val < 14 / 15 && val > 13 / 15) {
      val -= 13 / 15;
      var r = val * 15 * (246 - 254) + 254;
      var g = val * 15 * (221 - 198) + 198;
      var b = val * 15 * (34 - 52) + 52;
  } else if (val > 14 / 15) {
      val -= 14 / 15;
      var r = val * 15 * (249 - 246) + 246;
      var g = val * 15 * (251 - 221) + 221;
      var b = val * 15 * (14 - 34) + 34;
  }
  colors[0] = r;
  colors[1] = g;
  colors[2] = b;

  return colors;
}

export function getParulaLog(val, min, max) {
  var colors = [];
  var val = Math.log10((val - min) / (max - min) * 9 + 1);
  if (val < 0) {
      val = 0;
  }
  if (val < 1 / 15) {
      var r = val * 15 * (49 - 53) + 53;
      var g = val * 15 * (69 - 42) + 42;
      var b = val * 15 * (188 - 135) + 135;
  } else if (val < 2 / 15 && val > 1 / 15) {
      val -= 1 / 15;
      var r = val * 15 * (4 - 49) + 49;
      var g = val * 15 * (101 - 69) + 69;
      var b = val * 15 * (225 - 188) + 188;
  } else if (val < 3 / 15 && val > 2 / 15) {
      val -= 2 / 15;
      var r = val * 15 * (15 - 4) + 4;
      var g = val * 15 * (119 - 101) + 101;
      var b = val * 15 * (219 - 225) + 225;
  } else if (val < 4 / 15 && val > 3 / 15) {
      val -= 3 / 15;
      var r = val * 15 * (19 - 15) + 15;
      var g = val * 15 * (136 - 119) + 119;
      var b = val * 15 * (211 - 219) + 219;
  } else if (val < 5 / 15 && val > 4 / 15) {
      val -= 4 / 15;
      var r = val * 15 * (7 - 19) + 19;
      var g = val * 15 * (156 - 136) + 136;
      var b = val * 15 * (207 - 211) + 211;
  } else if (val < 6 / 15 && val > 5 / 15) {
      val -= 5 / 15;
      var r = 7;
      var g = val * 15 * (170 - 156) + 156;
      var b = val * 15 * (193 - 207) + 207;
  } else if (val < 7 / 15 && val > 6 / 15) {
      val -= 6 / 15;
      var r = val * 15 * (32 - 7) + 7;
      var g = val * 15 * (180 - 170) + 170;
      var b = val * 15 * (173 - 193) + 193;
  } else if (val < 8 / 15 && val > 7 / 15) {
      val -= 7 / 15;
      var r = val * 15 * (73 - 32) + 32;
      var g = val * 15 * (188 - 180) + 180;
      var b = val * 15 * (148 - 173) + 173;
  } else if (val < 9 / 15 && val > 8 / 15) {
      val -= 8 / 15;
      var r = val * 15 * (122 - 73) + 73;
      var g = val * 15 * (191 - 188) + 188;
      var b = val * 15 * (124 - 148) + 148;
  } else if (val < 10 / 15 && val > 9 / 15) {
      val -= 9 / 15;
      var r = val * 15 * (165 - 122) + 122;
      var g = val * 15 * (190 - 191) + 191;
      var b = val * 15 * (107 - 124) + 124;
  } else if (val < 11 / 15 && val > 10 / 15) {
      val -= 10 / 15;
      var r = val * 15 * (202 - 165) + 165;
      var g = val * 15 * (187 - 190) + 190;
      var b = val * 15 * (92 - 107) + 107;
  } else if (val < 12 / 15 && val > 11 / 15) {
      val -= 11 / 15;
      var r = val * 15 * (236 - 202) + 202;
      var g = val * 15 * (185 - 187) + 187;
      var b = val * 15 * (76 - 92) + 92;
  } else if (val < 13 / 15 && val > 12 / 15) {
      val -= 12 / 15;
      var r = val * 15 * (254 - 236) + 236;
      var g = val * 15 * (198 - 185) + 185;
      var b = val * 15 * (52 - 76) + 76;
  } else if (val < 14 / 15 && val > 13 / 15) {
      val -= 13 / 15;
      var r = val * 15 * (246 - 254) + 254;
      var g = val * 15 * (221 - 198) + 198;
      var b = val * 15 * (34 - 52) + 52;
  } else if (val > 14 / 15) {
      val -= 14 / 15;
      var r = val * 15 * (249 - 246) + 246;
      var g = val * 15 * (251 - 221) + 221;
      var b = val * 15 * (14 - 34) + 34;
  }
  colors[0] = r;
  colors[1] = g;
  colors[2] = b;

  return colors;
}

export function getRedBlueScalar(val, min, max) {
  var colors = [];
  var val = (val - min) / (max - min);
  if (val < 1 / 15) {
      var r = val * 15 * (24 - 8) + 8;
      var g = 0;
      var b = val * 15 * (231 - 247) + 247;
  } else if (val < 2 / 15 && val > 1 / 15) {
      val -= 1 / 15;
      var r = val * 15 * (41 - 24) + 24;
      var g = 0;
      var b = val * 15 * (214 - 231) + 231;
  } else if (val < 3 / 15 && val > 2 / 15) {
      val -= 2 / 15;
      var r = val * 15 * (57 - 41) + 41;
      var g = 0;
      var b = val * 15 * (198 - 214) + 214;
  } else if (val < 4 / 15 && val > 3 / 15) {
      val -= 3 / 15;
      var r = val * 15 * (74 - 57) + 57;
      var g = 0;
      var b = val * 15 * (181 - 198) + 198;
  } else if (val < 5 / 15 && val > 4 / 15) {
      val -= 4 / 15;
      var r = val * 15 * (90 - 74) + 74;
      var g = 0;
      var b = val * 15 * (165 - 181) + 181;
  } else if (val < 6 / 15 && val > 5 / 15) {
      val -= 5 / 15;
      var r = val * 15 * (107 - 90) + 90;
      var g = 0;
      var b = val * 15 * (148 - 165) + 165;
  } else if (val < 7 / 15 && val > 6 / 15) {
      val -= 6 / 15;
      var r = val * 15 * (123 - 107) + 107;
      var g = 0;
      var b = val * 15 * (132 - 148) + 148;
  } else if (val < 8 / 15 && val > 7 / 15) {
      val -= 7 / 15;
      var r = val * 15 * (140 - 123) + 123;
      var g = 0;
      var b = val * 15 * (115 - 132) + 132;
  } else if (val < 9 / 15 && val > 8 / 15) {
      val -= 8 / 15;
      var r = val * 15 * (156 - 140) + 140;
      var g = 0;
      var b = val * 15 * (99 - 115) + 115;
  } else if (val < 10 / 15 && val > 9 / 15) {
      val -= 9 / 15;
      var r = val * 15 * (173 - 156) + 156;
      var g = 0;
      var b = val * 15 * (82 - 99) + 99;
  } else if (val < 11 / 15 && val > 10 / 15) {
      val -= 10 / 15;
      var r = val * 15 * (189 - 173) + 173;
      var g = 0;
      var b = val * 15 * (66 - 82) + 82;
  } else if (val < 12 / 15 && val > 11 / 15) {
      val -= 11 / 15;
      var r = val * 15 * (206 - 189) + 189;
      var g = 0;
      var b = val * 15 * (49 - 66) + 66;
  } else if (val < 13 / 15 && val > 12 / 15) {
      val -= 12 / 15;
      var r = val * 15 * (222 - 206) + 206;
      var g = 0;
      var b = val * 15 * (33 - 49) + 49;
  } else if (val < 14 / 15 && val > 13 / 15) {
      val -= 13 / 15;
      var r = val * 15 * (239 - 222) + 222;
      var g = 0;
      var b = val * 15 * (16 - 33) + 33;
  } else if (val > 14 / 15) {
      val -= 14 / 15;
      var r = val * 15 * (255 - 239) + 239;
      var g = 0;
      var b = val * 15 * (0 - 16) + 16;
  }
  colors[0] = r;
  colors[1] = g;
  colors[2] = b;

  return colors;
}

export function getRedBlueLog(val, min, max) {
  var colors = [];
  var val = Math.log10((val - min) / (max - min) * 9 + 1);
  if (val < 1 / 15) {
      var r = val * 15 * (24 - 8) + 8;
      var g = 0;
      var b = val * 15 * (231 - 247) + 247;
  } else if (val < 2 / 15 && val > 1 / 15) {
      val -= 1 / 15;
      var r = val * 15 * (41 - 24) + 24;
      var g = 0;
      var b = val * 15 * (214 - 231) + 231;
  } else if (val < 3 / 15 && val > 2 / 15) {
      val -= 2 / 15;
      var r = val * 15 * (57 - 41) + 41;
      var g = 0;
      var b = val * 15 * (198 - 214) + 214;
  } else if (val < 4 / 15 && val > 3 / 15) {
      val -= 3 / 15;
      var r = val * 15 * (74 - 57) + 57;
      var g = 0;
      var b = val * 15 * (181 - 198) + 198;
  } else if (val < 5 / 15 && val > 4 / 15) {
      val -= 4 / 15;
      var r = val * 15 * (90 - 74) + 74;
      var g = 0;
      var b = val * 15 * (165 - 181) + 181;
  } else if (val < 6 / 15 && val > 5 / 15) {
      val -= 5 / 15;
      var r = val * 15 * (107 - 90) + 90;
      var g = 0;
      var b = val * 15 * (148 - 165) + 165;
  } else if (val < 7 / 15 && val > 6 / 15) {
      val -= 6 / 15;
      var r = val * 15 * (123 - 107) + 107;
      var g = 0;
      var b = val * 15 * (132 - 148) + 148;
  } else if (val < 8 / 15 && val > 7 / 15) {
      val -= 7 / 15;
      var r = val * 15 * (140 - 123) + 123;
      var g = 0;
      var b = val * 15 * (115 - 132) + 132;
  } else if (val < 9 / 15 && val > 8 / 15) {
      val -= 8 / 15;
      var r = val * 15 * (156 - 140) + 140;
      var g = 0;
      var b = val * 15 * (99 - 115) + 115;
  } else if (val < 10 / 15 && val > 9 / 15) {
      val -= 9 / 15;
      var r = val * 15 * (173 - 156) + 156;
      var g = 0;
      var b = val * 15 * (82 - 99) + 99;
  } else if (val < 11 / 15 && val > 10 / 15) {
      val -= 10 / 15;
      var r = val * 15 * (189 - 173) + 173;
      var g = 0;
      var b = val * 15 * (66 - 82) + 82;
  } else if (val < 12 / 15 && val > 11 / 15) {
      val -= 11 / 15;
      var r = val * 15 * (206 - 189) + 189;
      var g = 0;
      var b = val * 15 * (49 - 66) + 66;
  } else if (val < 13 / 15 && val > 12 / 15) {
      val -= 12 / 15;
      var r = val * 15 * (222 - 206) + 206;
      var g = 0;
      var b = val * 15 * (33 - 49) + 49;
  } else if (val < 14 / 15 && val > 13 / 15) {
      val -= 13 / 15;
      var r = val * 15 * (239 - 222) + 222;
      var g = 0;
      var b = val * 15 * (16 - 33) + 33;
  } else if (val > 14 / 15) {
      val -= 14 / 15;
      var r = val * 15 * (255 - 239) + 239;
      var g = 0;
      var b = val * 15 * (0 - 16) + 16;
  }
  colors[0] = r;
  colors[1] = g;
  colors[2] = b;

  return colors;
}

export function getCubeHelixScalar(val, min, max) {
  var colors = [];
  var val = (val - min) / (max - min);
  if (val < 1 / 15) {
      var r = 0;
      var g = val * 15 * (28 - 0) + 0;
      var b = val * 15 * (14 - 0) + 0;
  } else if (val < 2 / 15 && val > 1 / 15) {
      val -= 1 / 15;
      var r = 0;
      var g = val * 15 * (51 - 28) + 28;
      var b = val * 15 * (47 - 14) + 14;
  } else if (val < 3 / 15 && val > 2 / 15) {
      val -= 2 / 15;
      var r = val * 15 * (7 - 0) + 0;
      var g = val * 15 * (65 - 51) + 51;
      var b = val * 15 * (91 - 47) + 47;
  } else if (val < 4 / 15 && val > 3 / 15) {
      val -= 3 / 15;
      var r = val * 15 * (35 - 7) + 7;
      var g = val * 15 * (71 - 65) + 65;
      var b = val * 15 * (135 - 91) + 91;
  } else if (val < 5 / 15 && val > 4 / 15) {
      val -= 4 / 15;
      var r = val * 15 * (78 - 35) + 35;
      var g = val * 15 * (72 - 71) + 71;
      var b = val * 15 * (168 - 135) + 135;
  } else if (val < 6 / 15 && val > 5 / 15) {
      val -= 5 / 15;
      var r = val * 15 * (129 - 78) + 78;
      var g = 72;
      var b = val * 15 * (184 - 168) + 168;
  } else if (val < 7 / 15 && val > 6 / 15) {
      val -= 6 / 15;
      var r = val * 15 * (177 - 129) + 129;
      var g = val * 15 * (77 - 72) + 72;
      var b = val * 15 * (181 - 184) + 184;
  } else if (val < 8 / 15 && val > 7 / 15) {
      val -= 7 / 15;
      var r = val * 15 * (214 - 177) + 177;
      var g = val * 15 * (90 - 77) + 77;
      var b = val * 15 * (165 - 181) + 181;
  } else if (val < 9 / 15 && val > 8 / 15) {
      val -= 8 / 15;
      var r = val * 15 * (235 - 214) + 214;
      var g = val * 15 * (113 - 90) + 90;
      var b = val * 15 * (143 - 165) + 165;
  } else if (val < 10 / 15 && val > 9 / 15) {
      val -= 9 / 15;
      var r = val * 15 * (238 - 235) + 235;
      var g = val * 15 * (142 - 113) + 113;
      var b = val * 15 * (128 - 143) + 143;
  } else if (val < 11 / 15 && val > 10 / 15) {
      val -= 10 / 15;
      var r = val * 15 * (230 - 238) + 238;
      var g = val * 15 * (175 - 142) + 142;
      var b = val * 15 * (127 - 128) + 128;
  } else if (val < 12 / 15 && val > 11 / 15) {
      val -= 11 / 15;
      var r = val * 15 * (219 - 230) + 230;
      var g = val * 15 * (206 - 175) + 175;
      var b = val * 15 * (144 - 127) + 127;
  } else if (val < 13 / 15 && val > 12 / 15) {
      val -= 12 / 15;
      var r = val * 15 * (216 - 219) + 219;
      var g = val * 15 * (231 - 206) + 206;
      var b = val * 15 * (178 - 144) + 144;
  } else if (val < 14 / 15 && val > 13 / 15) {
      val -= 13 / 15;
      var r = val * 15 * (223 - 216) + 216;
      var g = val * 15 * (244 - 231) + 231;
      var b = val * 15 * (178 - 144) + 144;
  } else if (val > 14 / 15) {
      val -= 14 / 15;
      var r = val * 15 * (251 - 223) + 223;
      var g = val * 15 * (251 - 244) + 244;
      var b = val * 15 * (251 - 216) + 216;
  }
  colors[0] = r;
  colors[1] = g;
  colors[2] = b;

  return colors;
}

export function getCubeHelixLog(val, min, max) {
  var colors = [];
  var val = Math.log10((val - min) / (max - min) * 9 + 1);
  if (val < 1 / 15) {
      var r = 0;
      var g = val * 15 * (28 - 0) + 0;
      var b = val * 15 * (14 - 0) + 0;
  } else if (val < 2 / 15 && val > 1 / 15) {
      val -= 1 / 15;
      var r = 0;
      var g = val * 15 * (51 - 28) + 28;
      var b = val * 15 * (47 - 14) + 14;
  } else if (val < 3 / 15 && val > 2 / 15) {
      val -= 2 / 15;
      var r = val * 15 * (7 - 0) + 0;
      var g = val * 15 * (65 - 51) + 51;
      var b = val * 15 * (91 - 47) + 47;
  } else if (val < 4 / 15 && val > 3 / 15) {
      val -= 3 / 15;
      var r = val * 15 * (35 - 7) + 7;
      var g = val * 15 * (71 - 65) + 65;
      var b = val * 15 * (135 - 91) + 91;
  } else if (val < 5 / 15 && val > 4 / 15) {
      val -= 4 / 15;
      var r = val * 15 * (78 - 35) + 35;
      var g = val * 15 * (72 - 71) + 71;
      var b = val * 15 * (168 - 135) + 135;
  } else if (val < 6 / 15 && val > 5 / 15) {
      val -= 5 / 15;
      var r = val * 15 * (129 - 78) + 78;
      var g = 72;
      var b = val * 15 * (184 - 168) + 168;
  } else if (val < 7 / 15 && val > 6 / 15) {
      val -= 6 / 15;
      var r = val * 15 * (177 - 129) + 129;
      var g = val * 15 * (77 - 72) + 72;
      var b = val * 15 * (181 - 184) + 184;
  } else if (val < 8 / 15 && val > 7 / 15) {
      val -= 7 / 15;
      var r = val * 15 * (214 - 177) + 177;
      var g = val * 15 * (90 - 77) + 77;
      var b = val * 15 * (165 - 181) + 181;
  } else if (val < 9 / 15 && val > 8 / 15) {
      val -= 8 / 15;
      var r = val * 15 * (235 - 214) + 214;
      var g = val * 15 * (113 - 90) + 90;
      var b = val * 15 * (143 - 165) + 165;
  } else if (val < 10 / 15 && val > 9 / 15) {
      val -= 9 / 15;
      var r = val * 15 * (238 - 235) + 235;
      var g = val * 15 * (142 - 113) + 113;
      var b = val * 15 * (128 - 143) + 143;
  } else if (val < 11 / 15 && val > 10 / 15) {
      val -= 10 / 15;
      var r = val * 15 * (230 - 238) + 238;
      var g = val * 15 * (175 - 142) + 142;
      var b = val * 15 * (127 - 128) + 128;
  } else if (val < 12 / 15 && val > 11 / 15) {
      val -= 11 / 15;
      var r = val * 15 * (219 - 230) + 230;
      var g = val * 15 * (206 - 175) + 175;
      var b = val * 15 * (144 - 127) + 127;
  } else if (val < 13 / 15 && val > 12 / 15) {
      val -= 12 / 15;
      var r = val * 15 * (216 - 219) + 219;
      var g = val * 15 * (231 - 206) + 206;
      var b = val * 15 * (178 - 144) + 144;
  } else if (val < 14 / 15 && val > 13 / 15) {
      val -= 13 / 15;
      var r = val * 15 * (223 - 216) + 216;
      var g = val * 15 * (244 - 231) + 231;
      var b = val * 15 * (178 - 144) + 144;
  } else if (val > 14 / 15) {
      val -= 14 / 15;
      var r = val * 15 * (251 - 223) + 223;
      var g = val * 15 * (251 - 244) + 244;
      var b = val * 15 * (251 - 216) + 216;
  }
  colors[0] = r;
  colors[1] = g;
  colors[2] = b;

  return colors;
}

export function getDiverging(val, min, max) {
  var colors = [];
  var val = (val - min) / (max - min);
  if (val < 1 / 10) {
      var r = val * 10 * (140 - 85) + 85;
      var g = val * 10 * (81 - 48) + 48;
      var b = val * 10 * (10 - 5) + 5;
  } else if (val > 1 / 10 && val < 2 / 10) {
      val -= 1 / 10;
      var r = val * 10 * (191 - 140) + 140;
      var g = val * 10 * (129 - 81) + 81;
      var b = val * 10 * (45 - 10) + 10;
  } else if (val > 2 / 10 && val < 3 / 10) {
      val -= 2 / 10;
      var r = val * 10 * (223 - 191) + 191;
      var g = val * 10 * (194 - 129) + 129;
      var b = val * 10 * (125 - 45) + 45;
  } else if (val > 3 / 10 && val < 4 / 10) {
      val -= 3 / 10;
      var r = val * 10 * (246 - 223) + 223;
      var g = val * 10 * (232 - 194) + 194;
      var b = val * 10 * (195 - 125) + 125;
  } else if (val > 4 / 10 && val < 5 / 10) {
      val -= 4 / 10;
      var r = val * 10 * (245 - 246) + 246;
      var g = val * 10 * (245 - 232) + 232;
      var b = val * 10 * (245 - 195) + 195;
  } else if (val > 5 / 10 && val < 6 / 10) {
      val -= 5 / 10;
      var r = val * 10 * (199 - 245) + 245;
      var g = val * 10 * (234 - 245) + 245;
      var b = val * 10 * (229 - 245) + 245;
  } else if (val > 6 / 10 && val < 7 / 10) {
      val -= 6 / 10;
      var r = val * 10 * (128 - 199) + 199;
      var g = val * 10 * (209 - 234) + 234;
      var b = val * 10 * (193 - 229) + 229;
  } else if (val > 7 / 10 && val < 8 / 10) {
      val -= 7 / 10;
      var r = val * 10 * (53 - 128) + 128;
      var g = val * 10 * (151 - 209) + 209;
      var b = val * 10 * (143 - 193) + 193;
  } else if (val > 8 / 10 && val < 9 / 10) {
      val -= 8 / 10;
      var r = val * 10 * (1 - 53) + 53;
      var g = val * 10 * (102 - 151) + 151;
      var b = val * 10 * (94 - 143) + 143;
  } else if (val > 9 / 10 && val <= 1) {
      val -= 9 / 10;
      var r = val * 10 * (0 - 1) + 1;
      var g = val * 10 * (60 - 102) + 102;
      var b = val * 10 * (48 - 94) + 94;
  }
  colors[0] = r;
  colors[1] = g;
  colors[2] = b;

  return colors;
}