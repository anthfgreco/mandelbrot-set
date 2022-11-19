const WIDTH = document.documentElement.clientWidth;
const HEIGHT = document.documentElement.clientHeight;
const MAX_ITERATION = 10 ** 30; // precision
const CLICK_SCALE_MULTIPLIER = 2; // changes how much zoom per click, 1 is no zoom, 2 is 2x, 4 is 4x etc
const DEBUG = false;
const gpu = new GPU();
gpu.addFunction(palette).addFunction(map_range);

var scale = 2;

// true values for mandelbrot set
var mandelbrot_x1 = -2.0 * scale;
var mandelbrot_x2 = 1.0 * scale;
var mandelbrot_y1 = -1.0 * scale;
var mandelbrot_y2 = 1.0 * scale;

// mobile
if (WIDTH < 800) {
  mandelbrot_x1 = -1.0 * scale;
  mandelbrot_x2 = 0.3 * scale;
  mandelbrot_y1 = -1.0 * scale;
  mandelbrot_y2 = 1.0 * scale;
}

// fantastic color scheme with iteration 10**9
var colors = [
  [0.9877190927088983, 0.8489733891916198, 0.9040134860552345],
  [0.7174616500573332, 0.0403616850161399, 0.24421852989314874],
  [0.9797508483767834, 0.37709148454561436, 0.5642008828996832],
];

var colors = [
  [Math.random(), Math.random(), Math.random()],
  [Math.random(), Math.random(), Math.random()],
  [Math.random(), Math.random(), Math.random()],
];

function palette(t, b, c, d) {
  return [
    b[0] * Math.tan(6.28318 * (b[0] * t + b[0])),
    b[1] * Math.tan(6.28318 * (c[1] * t + d[1])),
    b[2] * Math.tan(6.28318 * (c[2] * t + d[2])),
  ];
}

function map_range(value, low1, high1, low2, high2) {
  return low2 + ((high2 - low2) * (value - low1)) / (high1 - low1);
}

const calculateMandelbrotSet = gpu
  .createKernel(function (
    MAX_ITERATION,
    WIDTH,
    HEIGHT,
    mandelbrot_x1,
    mandelbrot_x2,
    mandelbrot_y1,
    mandelbrot_y2,
    c1,
    c2,
    c3,
    c4,
    c5,
    c6,
    c7,
    c8,
    c9,
    DEBUG
  ) {
    // map screen pixel x and y to mandelbrot x and y
    let x0 = map_range(this.thread.x, 0, WIDTH, mandelbrot_x1, mandelbrot_x2);
    let y0 = map_range(this.thread.y, 0, HEIGHT, mandelbrot_y1, mandelbrot_y2);
    let x = 0;
    let y = 0;
    let x2 = 0;
    let y2 = 0;
    let i = 0;

    while (x2 + y2 <= 4 && i < MAX_ITERATION) {
      y = 2 * x * y + y0;
      x = x2 - y2 + x0;
      x2 = x * x;
      y2 = y * y;
      i = i + 1;
    }

    const pixel = palette(i, [c1, c2, c3], [c4, c5, c6], [c7, c8, c9]);
    this.color(pixel[0], pixel[1], pixel[2], 1);

    // draw yellow crosshair on center
    if (DEBUG) {
      if (this.thread.x == WIDTH / 2 || this.thread.y == HEIGHT / 2) {
        this.color(255, 255, 0, 1);
      }
    }
  })
  .setGraphical(true)
  .setOutput([WIDTH, HEIGHT]);

function render() {
  // I have no idea why I couldn't pass a colors list to the gpu, which is why there's c1-c9
  calculateMandelbrotSet(
    MAX_ITERATION,
    WIDTH,
    HEIGHT,
    mandelbrot_x1,
    mandelbrot_x2,
    mandelbrot_y1,
    mandelbrot_y2,
    colors[0][0],
    colors[0][1],
    colors[0][2],
    colors[1][0],
    colors[1][1],
    colors[1][2],
    colors[2][0],
    colors[2][1],
    colors[2][2],
    DEBUG
  );

  const canvas = calculateMandelbrotSet.canvas;
  document.body.appendChild(canvas);
  canvas.addEventListener("click", mouseClicked);
}

function mouseClicked(e) {
  let mouseX = e.clientX;
  let mouseY = e.clientY;
  let x0 = map_range(mouseX, 0, WIDTH, mandelbrot_x1, mandelbrot_x2);
  let y0 = map_range(mouseY, 0, HEIGHT, mandelbrot_y1, mandelbrot_y2);

  if (DEBUG) {
    console.log("mandelbrot x:", [mandelbrot_x1, mandelbrot_x2]);
    console.log("mandelbrot y:", [mandelbrot_y1, mandelbrot_y2]);
    console.log("mandelbrot mouse:", [x0, y0]);
  }

  x1 = mandelbrot_x1;
  x2 = mandelbrot_x2;
  y1 = mandelbrot_y1;
  y2 = mandelbrot_y2;

  x_sum = x1 + x2;
  y_sum = y1 + y2;
  x_diff = x2 - x1;
  y_diff = y2 - y1;

  // Translating and scaling properly took ages to figure out

  // Translate to mouse positio
  mandelbrot_x1 -= x0 - x_sum / 2;
  mandelbrot_x2 -= x0 - x_sum / 2;
  mandelbrot_y1 += y0 - y_sum / 2;
  mandelbrot_y2 += y0 - y_sum / 2;

  // Scale
  if (e.shiftKey) {
    console.log("Shift key is pressed.");
    mandelbrot_x1 = x_sum / 2 - x_diff / (2 / CLICK_SCALE_MULTIPLIER);
    mandelbrot_x2 = x_sum / 2 + x_diff / (2 / CLICK_SCALE_MULTIPLIER);
    mandelbrot_y1 = y_sum / 2 - (y2 - y1) / (2 / CLICK_SCALE_MULTIPLIER);
    mandelbrot_y2 = y_sum / 2 + (y2 - y1) / (2 / CLICK_SCALE_MULTIPLIER);
  } else {
    mandelbrot_x1 = x_sum / 2 - x_diff / (2 * CLICK_SCALE_MULTIPLIER);
    mandelbrot_x2 = x_sum / 2 + x_diff / (2 * CLICK_SCALE_MULTIPLIER);
    mandelbrot_y1 = y_sum / 2 - (y2 - y1) / (2 * CLICK_SCALE_MULTIPLIER);
    mandelbrot_y2 = y_sum / 2 + (y2 - y1) / (2 * CLICK_SCALE_MULTIPLIER);
  }

  // Translate back to original position
  mandelbrot_x1 += x0 - x_sum / 2;
  mandelbrot_x2 += x0 - x_sum / 2;
  mandelbrot_y1 -= y0 - y_sum / 2;
  mandelbrot_y2 -= y0 - y_sum / 2;

  if (DEBUG) {
    console.log("mandelbrot x:", [mandelbrot_x1, mandelbrot_x2]);
    console.log("mandelbrot y:", [mandelbrot_y1, mandelbrot_y2]);
    console.log("");
  }
  render();
}

render();
