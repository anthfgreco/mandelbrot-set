const WIDTH = document.documentElement.clientWidth;
const HEIGHT = document.documentElement.clientHeight;
const MAX_ITERATION = 10 ** 9; //precision
const gpu = new GPU();
gpu.addFunction(palette).addFunction(map_range);

var scale = 2;

// desktop
if (WIDTH > 800) {
  var mapX1 = -2.0 * scale;
  var mapX2 = 1.5 * scale;
  var mapY1 = -1.0 * scale;
  var mapY2 = 1.0 * scale;
}
// mobile
else {
  var mapX1 = -1.0 * scale;
  var mapX2 = 0.3 * scale;
  var mapY1 = -1.0 * scale;
  var mapY2 = 1.0 * scale;
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
    b[0] * Math.cos(6.28318 * (b[0] * t + b[0])),
    b[1] * Math.cos(6.28318 * (c[1] * t + d[1])),
    b[2] * Math.cos(6.28318 * (c[2] * t + d[2])),
  ];
}

function map_range(value, low1, high1, low2, high2) {
  return low2 + ((high2 - low2) * (value - low1)) / (high1 - low1);
}

const calculateMandelbrotSet = gpu
  .createKernel(function (
    MAX_ITERATION,
    width,
    height,
    mapX1,
    mapX2,
    mapY1,
    mapY2,
    c1,
    c2,
    c3,
    c4,
    c5,
    c6,
    c7,
    c8,
    c9
  ) {
    let x0 = map_range(this.thread.x, 0, width, mapX1, mapX2);
    let y0 = map_range(this.thread.y, 0, height, mapY1, mapY2);
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
  })
  .setGraphical(true)
  .setOutput([WIDTH, HEIGHT]);

function render() {
  // I have no idea why I couldn't pass a colors list to the gpu which is why there's c1-c9
  calculateMandelbrotSet(
    MAX_ITERATION,
    WIDTH,
    HEIGHT,
    mapX1,
    mapX2,
    mapY1,
    mapY2,
    colors[0][0],
    colors[0][1],
    colors[0][2],
    colors[1][0],
    colors[1][1],
    colors[1][2],
    colors[2][0],
    colors[2][1],
    colors[2][2]
  );

  const canvas = calculateMandelbrotSet.canvas;
  document.body.appendChild(canvas);
  canvas.addEventListener("click", mouseClicked);
}

function mouseClicked(e) {
  var mouseX = e.clientX;
  var mouseY = e.clientY;
  if (mouseX < WIDTH / 2 && mouseY < HEIGHT / 2) {
    //console.log("upper left");
    mapX2 = mapX2 - (mapX2 - mapX1) / 2;
    mapY1 = mapY1 - (mapY1 - mapY2) / 2;
  } else if (mouseX > WIDTH / 2 && mouseY < HEIGHT / 2) {
    //console.log("upper right");
    mapX1 = mapX1 - (mapX1 - mapX2) / 2;
    mapY1 = mapY1 - (mapY1 - mapY2) / 2;
  } else if (mouseX < WIDTH / 2 && mouseY > HEIGHT / 2) {
    //console.log("bottom left");
    mapX2 = mapX2 - (mapX2 - mapX1) / 2;
    mapY2 = mapY2 - (mapY2 - mapY1) / 2;
  } else if (mouseX > WIDTH / 2 && mouseY > HEIGHT / 2) {
    //console.log("bottom right");
    mapX1 = mapX1 - (mapX1 - mapX2) / 2;
    mapY2 = mapY2 - (mapY2 - mapY1) / 2;
  }
  render();
  console.log({ zoom: 7 / (mapX2 - mapX1) + "x", precision: mapX2 - mapX1 });
}

render();
