var mapX1 = -2.0;
var mapX2 =  1.0;
var mapY1 = -1.0;
var mapY2 =  1.0;

// 2^9 iterations per pixel, change if you want higher/lower precision
var precision = 2**9;

function setup() {
  createCanvas(windowWidth, windowHeight);
  drawMandelbrotSet();
}

function drawMandelbrotSet() {
  loadPixels();
  for (var screenPixelX = 0; screenPixelX < width; screenPixelX++) {
    for (var screenPixelY = 0; screenPixelY < height; screenPixelY++) {
      var x0 = map(screenPixelX, 0, width,  mapX1, mapX2);
      var y0 = map(screenPixelY, 0, height, mapY1, mapY2);
      var x = 0;
      var y = 0;
      xold = 0;
      yold = 0;
      period = 0;

      var i = 0;
      var max_iteration = precision;
      
      while (x*x + y*y <= 4 && i < max_iteration) {
        var xtemp = x*x - y*y + x0;
        y = 2*x*y + y0;
        x = xtemp;
        i = i+1;
      }
      
      // Color function
      if (i < max_iteration ) {
        var log_zn = log(x*x + y*y) / 2;
        var nu = log(log_zn / log(2)) / log(2);
        i = i + 1 - nu;
      }
      
      var b = i % 255;
      var g = (i % 255)*b+1;
      var r = ( (i%1)*b*g ) % 255;
      var pixelColor = color(r, g, b);
      set(screenPixelX, screenPixelY, pixelColor);
    }
  }
  updatePixels();
}

function draw() {
  stroke(255, 255, 255);
  // X axis line
  line(0, windowHeight/2, windowWidth, windowHeight/2);
  // Y axis line
  line(windowWidth/2, 0, windowWidth/2, windowHeight);

  textSize(22);
  fill(255);
  stroke(255);
  text("Click quadrant to zoom in", 5, 5, 500, 100);
}

function touchStarted() {
  print(mouseX, mouseY);
  if (mouseX < windowWidth/2 && mouseY < windowHeight/2){
    print("Upper left quadrant");
    mapX2 = mapX2 - ((mapX2 - mapX1)/2);
    mapY2 = mapY2 - ((mapY2 - mapY1)/2);
  } 
  else if (mouseX > windowWidth/2 && mouseY < windowHeight/2){
    print("Upper right quadrant");
    mapX1 = mapX1 - ((mapX1 - mapX2)/2);
    mapY2 = mapY2 - ((mapY2 - mapY1)/2);
  } 
  else if (mouseX < windowWidth/2 && mouseY > windowHeight/2){
    print("Bottom left quadrant");
    mapX2 = mapX2 - ((mapX2 - mapX1)/2);
    mapY1 = mapY1 - ((mapY1 - mapY2)/2);
  } 
  else if (mouseX > windowWidth/2 && mouseY > windowHeight/2){
    print("Bottom right quadrant");
    mapX1 = mapX1 - ((mapX1 - mapX2)/2);
    mapY1 = mapY1 - ((mapY1 - mapY2)/2);
  } 

  drawMandelbrotSet();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  drawMandelbrotSet();
  redraw();
}