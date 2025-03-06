const RGB_FOUR_COLORS = [
  [255, 255, 0], // Yellow
  [255, 0, 0], // Red
  [0, 255, 0], // Green
  [0, 0, 255], // Blue
];

const YUV_FOUR_COLORS = RGB_FOUR_COLORS.map((color) => rgb2yuv(color));

function rgb2yuv(rgb) {
  let y = rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114;
  let u = rgb[0] * -0.168736 + rgb[1] * -0.331264 + rgb[2] * 0.5 + 128;
  let v = rgb[0] * 0.5 + rgb[1] * -0.418688 + rgb[2] * -0.081312 + 128;

  y = Math.floor(y);
  u = Math.floor(u);
  v = Math.floor(v);
  return [y, u, v];
}

function createImageData(format, width, height) {
  if (format.toLowerCase() == "rgbx") {
    return createRGB32ImageData(width, height, RGB_FOUR_COLORS);
  }
  if (format.toLowerCase() == "i420") {
    return createI420ImageData(width, height, YUV_FOUR_COLORS);
  }
  throw new Error(`Unsupported format: ${format}`);
  return undefined;
}

function createRGB32ImageData(width, height, fourColors) {
  let buffer = new Uint8Array(width * height * 4);
  for (let i of [0, 1, 2]) {
    for (let y = 0; y < height; ++y) {
      for (let x = 0; x < width; ++x) {
        const offset = (y * width + x) * 4;
        buffer[i + offset] = getColor(x, y, width, height, fourColors, i);
      }
    }
  }
  return buffer;
}

function createI420ImageData(width, height, fourColors) {
  const halfWidth = Math.floor((width + 1) / 2);
  const halfHeight = Math.floor((height + 1) / 2);
  return createYUVImageData(
    [
      [width, height],
      [halfWidth, halfHeight],
      [halfWidth, halfHeight],
    ],
    fourColors
  );
}

function createYUVImageData(planeDimensions, fourColors) {
  let buffer = new Uint8Array(
    planeDimensions.reduce((acc, [width, height]) => acc + width * height, 0)
  );

  let index = 0;
  planeDimensions.forEach(([planeWidth, planeHeight], i) => {
    for (let y = 0; y < planeHeight; ++y) {
      for (let x = 0; x < planeWidth; ++x) {
        buffer[index] = getColor(x, y, planeWidth, planeHeight, fourColors, i);
        index += 1;
      }
    }
  });
  return buffer;
}

// This function determines which quadrant of a rectangle (width * height)
// a point (x, y) falls into, and returns the corresponding color for that
// quadrant. The rectangle is divided into four quadrants:
//    <        w        >
//  ^ +--------+--------+
//    | (0, 0) | (1, 0) |
//  h +--------+--------+
//    | (0, 1) | (1, 1) |
//  v +--------+--------+
//
// The colors array must contain at least four colors, each corresponding
// to one of the quadrants:
// - colors[0] : top-left (0, 0)
// - colors[1] : top-right (1, 0)
// - colors[2] : bottom-left (0, 1)
// - colors[3] : bottom-right (1, 1)
//
// The channel parameter specifies which color channel to return:
// - For RGB colors, channel = 0, 1, or 2 corresponds to R, G, or B.
// - For YUV colors, channel = 0, 1, or 2 corresponds to Y, U, or V.
function getColor(x, y, width, height, colors, channel) {
  // Determine which quadrant (x, y) belongs to.
  const xIndex = x * 2 >= width ? 1 : 0;
  const yIndex = y * 2 >= height ? 1 : 0;

  const index = yIndex * 2 + xIndex;
  return colors[index][channel];
}
