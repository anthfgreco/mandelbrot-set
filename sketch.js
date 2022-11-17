var mapX1 = -2.0;
var mapX2 = 1.0;
var mapY1 = -1.0;
var mapY2 = 1.0;
// Change if you want higher/lower precision
var max_iteration = 2 ** 9;

function palette(t, a, b, c, d) {
  return [
    a[0] + b[0] * Math.cos(6.28318 * (c[0] * t + d[0])),
    a[1] + b[1] * Math.cos(6.28318 * (c[1] * t + d[1])),
    a[2] + b[2] * Math.cos(6.28318 * (c[2] * t + d[2])),
  ];
}

function map_range(value, low1, high1, low2, high2) {
  return low2 + ((high2 - low2) * (value - low1)) / (high1 - low1);
}

const gpu = new GPU();
gpu.addFunction(palette).addFunction(map_range);
var width = document.documentElement.clientWidth;
var height = document.documentElement.clientHeight;
//console.log(width, height);

function render() {
  const calculateMandelbrotSet = gpu
    .createKernel(function (
      max_iteration,
      width,
      height,
      mapX1,
      mapX2,
      mapY1,
      mapY2
    ) {
      let x0 = map_range(this.thread.x, 0, width, mapX1, mapX2);
      let y0 = map_range(this.thread.y, 0, height, mapY1, mapY2);
      let x = 0;
      let y = 0;
      let x2 = 0;
      let y2 = 0;
      let i = 0;

      while (x2 + y2 <= 4 && i < max_iteration) {
        y = 2 * x * y + y0;
        x = x2 - y2 + x0;
        x2 = x * x;
        y2 = y * y;
        i = i + 1;
      }

      const pixel = palette(
        i / max_iteration,
        [0.0, 0.0, 0.0],
        [0.39, 0.75, 0.95],
        [0.05, 0.5, 0.9],
        [0.55, 0.75, 0.75]
      );
      this.color(pixel[0], pixel[1], pixel[2], 1);
    })
    .setGraphical(true)
    .setOutput([width, height]);

  calculateMandelbrotSet(
    max_iteration,
    width,
    height,
    mapX1,
    mapX2,
    mapY1,
    mapY2
  );

  const canvas = calculateMandelbrotSet.canvas;
  document.body.appendChild(canvas);
  canvas.addEventListener("click", mouseClicked);
}

function mouseClicked(e) {
  var mouseX = e.clientX;
  var mouseY = e.clientY;
  if (mouseX < width / 2 && mouseY < height / 2) {
    //console.log("upper left");
    mapX2 = mapX2 - (mapX2 - mapX1) / 2;
    mapY1 = mapY1 - (mapY1 - mapY2) / 2;
  } else if (mouseX > width / 2 && mouseY < height / 2) {
    //console.log("upper right");
    mapX1 = mapX1 - (mapX1 - mapX2) / 2;
    mapY1 = mapY1 - (mapY1 - mapY2) / 2;
  } else if (mouseX < width / 2 && mouseY > height / 2) {
    //console.log("bottom left");
    mapX2 = mapX2 - (mapX2 - mapX1) / 2;
    mapY2 = mapY2 - (mapY2 - mapY1) / 2;
  } else if (mouseX > width / 2 && mouseY > height / 2) {
    //console.log("bottom right");
    mapX1 = mapX1 - (mapX1 - mapX2) / 2;
    mapY2 = mapY2 - (mapY2 - mapY1) / 2;
  }
  render();
}

render();
