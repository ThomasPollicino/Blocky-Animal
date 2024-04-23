// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;

function setupWebGl(){
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    //gl = getWebGLContext(canvas);
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    gl.enable(gl.DEPTH_TEST);
} 
function connectVarialbesToGLSL(){
    // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_modelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  //Get storage location of u_GlobalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if(!u_GlobalRotateMatrix)
    {
      console.log('Failed to get the storage location of u_GlobalRotateMatrix');
      return;
    }

  //Set the initial value of the matrix
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
  
  
 


}
//Constants
const POINT=0;
const TRIANGLE=1;
const CIRCLE=2;
//Globals UI based
let g_selectedColor=[1.0,1.0,1.0,1.0];
let g_selectedSize=10;
let g_selectedType=POINT;
let g_globalAngle=0;
let g_legAngle=0;


//let g_segNum=10;

function addActionsForHtmlUI(){
    document.getElementById('green').onclick = function() {g_selectedColor = [0.0,1.0,0.0,1.0]; };
    document.getElementById('red').onclick = function() {g_selectedColor = [1.0,0.0,0.0,1.0]; };
    document.getElementById('clearButton').onclick = function() {g_shapesList=[]; gameStarted=false; renderAllShapes();};

    document.getElementById('pointButton').onclick = function() {g_selectedType=POINT};
    document.getElementById('triButton').onclick = function() {g_selectedType=TRIANGLE};
    document.getElementById('circleButton').onclick = function() {g_selectedType=CIRCLE};
    document.getElementById('pictureButton').onclick = function() {pictureDrawing();};
    document.getElementById('gameButton').onclick = function() {drawBoard();};


    //Slider Events
    document.getElementById('redSlide').addEventListener('mouseup', function() {g_selectedColor[0]=this.value/100; });
    document.getElementById('greenSlide').addEventListener('mouseup', function() {g_selectedColor[1]=this.value/100; });
    document.getElementById('blueSlide').addEventListener('mouseup', function() {g_selectedColor[2]=this.value/100; });
    console.log(g_selectedColor);

    document.getElementById('sizeSlide').addEventListener('mouseup', function() {g_selectedSize=this.value; });
    document.getElementById('segmentSlide').addEventListener('mouseup', function() {g_segNum=this.value; });

    document.getElementById('angleSlide').addEventListener('mousemove', function() {g_globalAngle=this.value; renderAllShapes(); });
    document.getElementById('legSlide').addEventListener('mousemove', function() {g_legAngle=this.value; renderAllShapes(); });



}   

function main() {
  
    setupWebGl();
    connectVarialbesToGLSL();
    addActionsForHtmlUI();
  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) {if(ev.buttons == 1)  {click(ev) } };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.6, 0.8, 1.0, 1.0);

  // Clear <canvas>
  //gl.clear(gl.COLOR_BUFFER_BIT);
  renderAllShapes();
}


var g_shapesList=[];

// var g_points = [];  // The array for the position of a mouse press
// var g_colors = [];  // The array to store the color of a point
// var g_sizes = [];   //The array to size the color of a point


let timerInterval;
let startTime;
let gameStarted=false;

function click(ev) {
  let [x,y] = convertCoordinatesEventToGl(ev);


  //Create and store the new point
  //let point = new Point(); 
  let point;
  if(g_selectedType==POINT){
    point=new Point();
  } else if(g_selectedType==TRIANGLE){
    point=new Triangle();
  } else {
    point = new Circle(g_segNum);
  }
  point.position=[x,y];
  point.color=g_selectedColor.slice();
  point.size=g_selectedSize;
  g_shapesList.push(point);


  if (gameStarted) {
    gameClick(ev, x, y);
  }

  

  
  // Store the coordinates to g_colors array
//   if (x >= 0.0 && y >= 0.0) {      // First quadrant
//     g_colors.push([1.0, 0.0, 0.0, 1.0]);  // Red
//   } else if (x < 0.0 && y < 0.0) { // Third quadrant
//     g_colors.push([0.0, 1.0, 0.0, 1.0]);  // Green
//   } else {                         // Others
//     g_colors.push([1.0, 1.0, 1.0, 1.0]);  // White
//   }

  //Draw every shape that is supposed to be in the canvas
  renderAllShapes();
}

function convertCoordinatesEventToGl(ev){
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
    return([x,y]); 
}
function renderAllShapes(){

  var startTime = performance.now();


  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);


    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  //Right Foot
  var rightFoot = new Cube();
  rightFoot.color=[0.4,0.4,0.2,1.0];
  rightFoot.matrix.translate(0.20,-0.95,-0.50);
  rightFoot.matrix.scale(0.4,0.2,0.5);
  rightFoot.render();
  //Left Foot
  var leftFoot = new Cube();
  leftFoot.color=[0.2,0.2,0.2,1.0];
  leftFoot.matrix.translate(-0.60,-0.95,-0.5);
  leftFoot.matrix.scale(0.4,0.2,0.5);
  leftFoot.render();


  //BottmRightLeg
  var bRightleg = new Cube();
  bRightleg.color=[0.3,0.2,0.2,1.0];
  bRightleg.matrix.translate(0.25,-0.75,-0.35);
  bRightleg.matrix.scale(0.3,0.6,0.35);
  bRightleg.matrix.rotate(g_legAngle,1,0,0);
  bRightleg.matrix.translate(0,-0.30,0);
  bRightleg.render();

  //BottmLeftLeg
  var bLeftleg = new Cube();
  bLeftleg.color=[0.3,0.2,0.2,1.0];
  bLeftleg.matrix.translate(-0.55,-0.75,-0.35);
  bLeftleg.matrix.scale(0.3,0.4,0.35);
  bLeftleg.render();

  //middleMarker
  var m = new Cube();
  m.color=[1,0.2,0.2,1.0];
  m.matrix.scale(0.001,2,0.001);
  m.matrix.translate(0,-0.5,0);
  m.render();



  
  
  

  var duration = performance.now() - startTime;
  sendTextToHTML(" ms: " +  Math.floor(duration) + " fps " + Math.floor(10000/duration)/10, "numdot")
}
function sendTextToHTML(text, htmlID){
    var htmlElm = document.getElementById(htmlID);
    if(!htmlElm) {
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}

