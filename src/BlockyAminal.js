// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
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
let u_ProjectionMatrix;

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
function connectVariablesToGLSL(){
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

  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  // Get the storage location of u_ProjectionMatrix
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  //Get storage location of u_GlobalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if(!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  //Set the initial value of the matrix
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

  var projectionMatrix = new Matrix4();
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projectionMatrix.elements);
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
let g_bodyAngle=0;


//let g_segNum=10;

function addActionsForHtmlUI(){
    
    document.getElementById('angleSlide').addEventListener('mousemove', function() {g_globalAngle=this.value; renderAllShapes(); });
    document.getElementById('legSlide').addEventListener('mousemove', function() {g_legAngle=this.value; renderAllShapes(); });
    document.getElementById('bodySlide').addEventListener('mousemove', function() {g_bodyAngle=this.value; renderAllShapes(); });




}   

function main() {
    setupWebGl();
    connectVariablesToGLSL();
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

  var zoomFactor = 2.5; // Adjust this value to control the zoom level
  var projectionMatrix = new Matrix4();
  projectionMatrix.setIdentity();
  projectionMatrix.scale(1 / zoomFactor, 1 / zoomFactor, 1/zoomFactor);
  projectionMatrix.translate(0, -1, 0); // Translate the scene to keep the floor at y = -1

  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projectionMatrix.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //Right Foot
  var rightFoot = new Cube();
  rightFoot.color=[0.2,0.2,0.2,1.0];
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
  bRightleg.color=[0.19,0.19,0.19,1.0];
  bRightleg.matrix.translate(0.20,-0.75,-0.35);
  bRightleg.matrix.rotate(g_legAngle,1,0,0);
  var rightLegCoord = new Matrix4(bRightleg.matrix);
  bRightleg.matrix.scale(0.4,0.6,0.45);
  bRightleg.matrix.translate(0,-0.28,0);
  bRightleg.render();

  //BottmLeftLeg
  var bLeftleg = new Cube();
  bLeftleg.color=[0.23,0.23,0.23,1.0];
  bLeftleg.matrix.translate(-0.60,-0.75,-0.35);
  bLeftleg.matrix.rotate(g_legAngle,1,0,0);
  var leftLegCoord = new Matrix4(bLeftleg.matrix);
  bLeftleg.matrix.scale(0.4,0.6,0.45);
  bLeftleg.matrix.translate(0,-0.28,0);
  bLeftleg.render();

  //TopRightLeg
  var tRightleg = new Cube();
  tRightleg.color=[0.21,0.21,0.21,1.0];
  tRightleg.matrix = rightLegCoord;
  tRightleg.matrix.translate(0,0.60,-0.01);
  tRightleg.matrix.rotate(-g_legAngle*1.5,1,0,0);
  tRightleg.matrix.scale(0.45,0.7,0.351);
  tRightleg.matrix.translate(-0.05,-0.25,0);
  tRightleg.render();

  //TopLeftLeg
  var tLeftleg = new Cube();
  tLeftleg.color=[0.22,0.22,0.22,1.0];
  tLeftleg.matrix = leftLegCoord;
  tLeftleg.matrix.translate(0,0.60,-0.01);
  tLeftleg.matrix.rotate(-g_legAngle*1.5,1,0,0);
  var TLegCoord = new Matrix4(tLeftleg.matrix);
  tLeftleg.matrix.scale(0.45,0.7,0.351);
  tLeftleg.matrix.translate(-0.05,-0.25,0);
  tLeftleg.render();

  //Body
  var body = new Cube();
  body.color=[0.2,0.2,0.2,1.0];

  TLegCoord.translate(0,0,0.20);
  body.matrix=TLegCoord;
  body.matrix.translate(0.05,0.2,-0.05);
  body.matrix.rotate(g_bodyAngle,1,0,0);
  var bodyCoor = new Matrix4(body.matrix);
  body.matrix.translate(0,0,-0.20);
  body.matrix.scale(1.1,1.7,0.5);
  body.render();

  //back
  var back = new Cube();
  back.color=[0.2,0.2,0.2,1.0];
  back.matrix = bodyCoor;
  back.matrix.translate(0,0.65,0.25);
  back.matrix.scale(1,1,0.1);
  back.render();

  //TailStart
  var tailStart = new Cube();
  tailStart.color=[0.2,0.2,0.2,1.0];
  tailStart.matrix = bodyCoor;
  tailStart.matrix.translate(0.1,-0.5,0.35);
  var tailCoord = new Matrix4(tailStart.matrix);
  tailStart.matrix.scale(0.8,0.7,4);
  tailStart.render();

  var tailTwo = new Cube();
  tailTwo.color=[0.6,0.2,0.2,1.0];
  tailTwo.matrix = tailCoord;
  tailTwo.matrix.translate(0.1,0.05,3.5);
  var tailtwoCoord = new Matrix4(tailTwo.matrix);
  tailTwo.matrix.scale(0.6,0.6,5);
  tailTwo.render();

  var tailThree = new Cube();
  tailThree.color=[0.2,0.2,0.2,1.0];
  tailThree.matrix = tailtwoCoord;
  tailThree.matrix.translate(0.05,0.02,4.5);
  var tailThreeCoord = new Matrix4(tailThree.matrix);
  tailThree.matrix.scale(0.5,0.5,6);
  tailThree.matrix.rotate(-20,1,0,0);
  tailThree.render();

  var tailFour = new Cube();
  tailFour.color=[0.6,0.2,0.2,1.0];
  tailFour.matrix = tailThreeCoord;
  tailFour.matrix.translate(0.05,0.12,3.5);
  var tailFourCoord = new Matrix4(tailFour.matrix);
  tailFour.matrix.scale(0.4,0.4,8);
  tailFour.matrix.rotate(-50,1,0,0);
  tailFour.render();

  var tailFive = new Cube();
  tailFive.color=[0.2,0.2,0.2,1.0];
  tailFive.matrix = tailFourCoord;
  tailFive.matrix.translate(0.05,0.40,4.0);
  var tailFiveCoord = new Matrix4(tailFive.matrix);
  tailFive.matrix.scale(0.32,0.25,6.5);
  tailFive.matrix.rotate(-65,1,0,0);
  tailFive.matrix.translate(0,0,-0.3);
  tailFive.render();

  var tailSix = new Cube();
  tailSix.color=[0.6,0.2,0.2,1.0];
  tailSix.matrix = tailFiveCoord;
  tailSix.matrix.translate(0.05,0.20,4.0);
  var tailSixCoord = new Matrix4(tailSix.matrix);
  tailSix.matrix.scale(0.32,0.25,8.5);
  tailSix.matrix.rotate(-40,1,0,0);
  tailSix.matrix.translate(0,0.0,-0.55);
  tailSix.render();

  var tailSeven = new Cube();
  tailSeven.color=[0.2,0.2,0.2,1.0];
  tailSeven.matrix = tailSixCoord;
  tailSeven.matrix.translate(0.05,0.10,4.0);
  var tailSevenCoord = new Matrix4(tailSeven.matrix);
  tailSeven.matrix.scale(0.32,0.25,5.5);
  tailSeven.matrix.rotate(-10,1,0,0);
  tailSeven.matrix.translate(0,0.05,-1.0);
  tailSeven.render();
  











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