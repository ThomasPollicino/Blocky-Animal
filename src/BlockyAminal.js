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
let g_globalAngle=60;
let g_legAngle=0;
let g_bodyAngle=0;
let g_tailAngle=0;
let g_tailAngle2=0;
let g_mouthAngle=0;
let g_headAngle=0;
let g_leftArmAngle=0;
let g_rightArmAngle=0;
let g_spikeColor=0.3;
let g_bodyAngle2=0;
let g_animation=false;
let g_startTime=null;
let g_quick=false;



//let g_segNum=10;

function addActionsForHtmlUI(){
    
    document.getElementById('angleSlide').addEventListener('mousemove', function() {g_globalAngle=this.value; renderAllShapes(); });
    document.getElementById('legSlide').addEventListener('mousemove', function() {g_legAngle=this.value; renderAllShapes(); });
    document.getElementById('bodySlide').addEventListener('mousemove', function() {g_bodyAngle=this.value; renderAllShapes(); });
    document.getElementById('bodySlide2').addEventListener('mousemove', function() {g_bodyAngle2=this.value; renderAllShapes(); });
    document.getElementById('tailSlide').addEventListener('mousemove', function() {g_tailAngle=this.value; renderAllShapes(); });
    document.getElementById('tailSlide2').addEventListener('mousemove', function() {g_tailAngle2=this.value; renderAllShapes(); });
    document.getElementById('mouthSlide').addEventListener('mousemove', function() {g_mouthAngle=this.value; renderAllShapes(); });
    document.getElementById('headSlide').addEventListener('mousemove', function() {g_headAngle=this.value; renderAllShapes(); });
    document.getElementById('leftArmSlide').addEventListener('mousemove', function() {g_leftArmAngle=this.value; renderAllShapes(); });
    document.getElementById('rightArmSlide').addEventListener('mousemove', function() {g_rightArmAngle=this.value; renderAllShapes(); });
    document.getElementById('spikeColorSlide').addEventListener('mousemove', function() {g_spikeColor = parseFloat(this.value); renderAllShapes(); });

    document.getElementById('start').onclick = function() {g_animation=true; g_startTime=null; g_quick=false; tick();};
    document.getElementById('stop').onclick = function() {g_animation=false; g_startTime=null; renderAllShapes();};
    document.getElementById('quick').onclick = function() {g_animation=true; g_startTime=null; g_quick=true; tick();};





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
//var g_startTime = performance.now()/1000.0;
var g_seconds=performance.now()/1000.0 - g_startTime;

function tick() {
  if (g_startTime === null) {
    g_startTime = performance.now() / 1000.0;
    if (g_quick) {
      g_startTime -= 30; 
    }
  }
  g_seconds = performance.now() / 1000.0 - g_startTime;
  renderAllShapes();
  if (g_animation) {
    requestAnimationFrame(tick);
  }
}


function renderAllShapes(){
  var startTime = performance.now();

  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);

  if(g_animation==true){
    if(g_seconds>37){
      var rotationAngle = (g_seconds - 37) * 20; 
    globalRotMat.rotate(rotationAngle, 0, 1, 0);
    }
  }
  
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  var zoomFactor = 2.5; 
  var projectionMatrix = new Matrix4();
  projectionMatrix.setIdentity();
  projectionMatrix.scale(1 / zoomFactor, 1 / zoomFactor, 1/zoomFactor);
  projectionMatrix.translate(0, -1, 0); 

  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projectionMatrix.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //Right Foot
  var rightFoot = new Cube();
  rightFoot.color=[0.2,0.2,0.2,1.0];
  rightFoot.matrix.translate(0.20,-0.95,-0.50);
  rightFoot.matrix.rotate(g_bodyAngle2,0,1,0);
  var rightFootCoord = new Matrix4(rightFoot.matrix);
  rightFoot.matrix.scale(0.4,0.2,0.5);
  rightFoot.render();
  //Left Foot
  var leftFoot = new Cube();
  leftFoot.color=[0.2,0.2,0.2,1.0];
  leftFoot.matrix.translate(-0.60,-0.95,-0.5);
  leftFoot.matrix.rotate(g_bodyAngle2,0,1,0);
  var leftFootCoord = new Matrix4(leftFoot.matrix);

  leftFoot.matrix.scale(0.4,0.2,0.5);
  leftFoot.render();


  //BottmRightLeg
  var bRightleg = new Cube();
  bRightleg.color=[0.19,0.19,0.19,1.0];
  bRightleg.matrix = rightFootCoord;
  bRightleg.matrix.translate(0.0,0.2,0.1);
  bRightleg.matrix.rotate(g_legAngle,1,0,0);
  //bRightleg.matrix.rotate(g_bodyAngle2,0,1,0);
  var rightLegCoord = new Matrix4(bRightleg.matrix);
  bRightleg.matrix.scale(0.4,0.6,0.45);
  bRightleg.matrix.translate(0,-0.28,0);
  bRightleg.render();

  //BottmLeftLeg
  var bLeftleg = new Cube();
  bLeftleg.color=[0.23,0.23,0.23,1.0];
  bLeftleg.matrix = leftFootCoord;
  bLeftleg.matrix.translate(0.0,0.2,0.1);
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
  //tRightleg.matrix.rotate(g_bodyAngle2,0,1,0);

  tRightleg.matrix.scale(0.45,0.7,0.551);
  tRightleg.matrix.translate(-0.05,-0.25,0);
  tRightleg.render();

  //TopLeftLeg
  var tLeftleg = new Cube();
  tLeftleg.color=[0.22,0.22,0.22,1.0];
  tLeftleg.matrix = leftLegCoord;
  tLeftleg.matrix.translate(0,0.60,-0.01);
  tLeftleg.matrix.rotate(-g_legAngle*1.5,1,0,0);
  //tLeftleg.matrix.rotate(g_bodyAngle2,0,1,0);

  var TLegCoord = new Matrix4(tLeftleg.matrix);
  tLeftleg.matrix.scale(0.45,0.7,0.551);
  tLeftleg.matrix.translate(-0.05,-0.25,0);
  tLeftleg.render();

  //Body
  var body = new Cube();
  body.color=[0.2,0.2,0.2,1.0];
  TLegCoord.translate(0.7,0,0.20);
  body.matrix=TLegCoord;
  //body.matrix.translate(-0.65,0.2,0.1);
  body.matrix.rotate(g_bodyAngle,1,0,0);
  //body.matrix.rotate(g_bodyAngle2,0,1,0);
  body.matrix.translate(-0.65,0.2,0.1);
  if(g_animation==true){
    if(g_seconds>31.5){
      body.matrix.rotate(-Math.abs(45*Math.sin(g_seconds/5)),1,0,0);//39.5 sec

    }
    //armRight.matrix.rotate(45*Math.sin(g_seconds/1),0,1,0);

  }
  var bodyCoor = new Matrix4(body.matrix);
  var bodyCoorChest = new Matrix4(body.matrix);
  var bodyCoorNeck = new Matrix4(body.matrix);
  var bodyCoorArmRight = new Matrix4(body.matrix);
  var bodyCoorArmLeft = new Matrix4(body.matrix);
  body.matrix.translate(0,0,-0.20);
  body.matrix.scale(1.1,1.7,0.5);
  
  body.render();

  //ArmRight
  var armRight = new Cube();
  armRight.color=[0.2,0.2,0.2,1.0];
  armRight.matrix = bodyCoorArmRight;
  armRight.matrix.translate(1,0.90,0.1);
  if(g_animation==true){
    //armRight.matrix.rotate(45*Math.sin(g_seconds/1),0,1,0);
    armRight.matrix.rotate(45*Math.sin(g_seconds/1),1,0,0);

  }
  else{
    armRight.matrix.rotate(-g_rightArmAngle,1,0,0);

  }
  armRight.matrix.scale(0.4,0.4,-1.2);
  armRight.render();

  //ArmLeft
  var armLeft = new Cube();
  armLeft.color=[0.2,0.2,0.2,1.0];
  armLeft.matrix = bodyCoorArmLeft;
  armLeft.matrix.translate(-0.4,0.90,0.1);
  if(g_animation==true){
    //armLeft.matrix.rotate(-45*Math.sin(g_seconds/1),0,1,0);
    armLeft.matrix.rotate(-45*Math.sin(g_seconds/1.2),1,0,0);

  }
  else{
    armLeft.matrix.rotate(-g_rightArmAngle,1,0,0);

  }
  armLeft.matrix.scale(0.4,0.4,-1.2);
  armLeft.render();



  //Chest
  var chest = new Cube();
  chest.color=[0.2,0.2,0.2,1.0];
  chest.matrix = bodyCoorChest;
  chest.matrix.translate(0,0.25,-0.25);
  var chestCoord = new Matrix4(chest.matrix);
  chest.matrix.scale(1,1.4,0.2);
  chest.render();

  //Peck
  var peck = new Cube();
  peck.color=[0.2,0.2,0.2,1.0];
  peck.matrix = chestCoord;
  peck.matrix.translate(0.15,0.50,-0.05);
  peck.matrix.scale(0.8,0.8,0.1);
  peck.render();

  //Neck
  var neck = new Cube();
  neck.color=[0.2,0.2,0.2,1.0];
  neck.matrix = bodyCoorNeck;
  neck.matrix.translate(0.25,1.6,-0.25);
  var neckCoord = new Matrix4(neck.matrix);
  neck.matrix.scale(0.6,0.17,0.5);
  neck.render();

  //Head
  var head = new Cube();
  head.color=[0.2,0.2,0.2,1.0];
  neckCoord.translate(0.5,0,0.2);
  head.matrix = neckCoord;
  //var testy =neckCoord;
  //head.matrix.translate(-0.10,0.15,-0.05);
  //head.matrix.rotate(g_headAngle,0,1,0);
  head.matrix.rotate(-10,1,0,0);

  if(g_animation==true){
    if(g_seconds>0&&g_seconds<12.6){
     head.matrix.rotate((35*Math.sin(g_seconds/1)),0,1,0);
    }
    else if(g_seconds>14&&g_seconds<17.5){
      
      head.matrix.rotate((-45*Math.sin(g_seconds/4))-10,1,0,0);

    }
    else if(g_seconds>17.5){

    
      
      head.matrix.rotate(35,1,0,0);

    }
  else{
    head.matrix.rotate(g_headAngle,1,0,0);

    }
  }
  head.matrix.translate(-0.6,0.15,-0.15);

  var headCoordTop = new Matrix4(head.matrix);
  var headCoordBottom = new Matrix4(head.matrix);
  var headCoordEyeL = new Matrix4(head.matrix);
  var headCoordEyeR = new Matrix4(head.matrix);

  var BreathCoord1 = new Matrix4(head.matrix);
  

  head.matrix.scale(0.8,0.75,0.6);
  head.render();

  

  //MouthTop
  var mouthTop = new Cube();
  mouthTop.color=[0.22,0.2,0.2,1.0];
  mouthTop.matrix = headCoordTop;
  mouthTop.matrix.translate(0.10,0.30,-0.4);
  var mouthTopCoord = new Matrix4(mouthTop.matrix);
  var mouthTopCoordTwo = new Matrix4(mouthTop.matrix);
  var mouthTopCoordThree = new Matrix4(mouthTop.matrix);
  var mouthTopCoordFour = new Matrix4(mouthTop.matrix);
  mouthTop.matrix.scale(0.6,0.3,0.45);
  mouthTop.render();

  //ToothOne
  var toothOne = new Cube();
  toothOne.color=[1,1,1,1.0];
  toothOne.matrix = mouthTopCoord;
  toothOne.matrix.translate(0.05,-0.05,0.05);
  toothOne.matrix.scale(0.1,0.1,0.1);
  toothOne.render();

  //ToothTwo
  var toothTwo = new Cube();
  toothTwo.color=[1,1,1,1.0];
  toothTwo.matrix = mouthTopCoordTwo;
  toothTwo.matrix.translate(0.05,-0.05,0.2);
  toothTwo.matrix.scale(0.1,0.1,0.1);
  toothTwo.render();

  //ToothThree
  var toothThree = new Cube();
  toothThree.color=[1,1,1,1.0];
  toothThree.matrix = mouthTopCoordThree;
  toothThree.matrix.translate(0.45,-0.05,0.05);
  toothThree.matrix.scale(0.1,0.1,0.1);
  toothThree.render();

  //ToothFour
  var toothFour = new Cube();
  toothFour.color=[1,1,1,1.0];
  toothFour.matrix = mouthTopCoordFour;
  toothFour.matrix.translate(0.45,-0.05,0.2);
  toothFour.matrix.scale(0.1,0.1,0.1);
  toothFour.render();



  //MouthBottom
  var mouthBottom = new Cube();
  mouthBottom.color=[0.21,0.2,0.2,1.0];
  headCoordBottom.translate(0,0.2,0.35);
  mouthBottom.matrix = headCoordBottom;
  mouthBottom.matrix.translate(0.09,0.1,-0.15);
  mouthBottom.matrix.rotate(180,1,0,0);


  if(g_animation==true){
    
    if(g_seconds<6.1){
      mouthBottom.matrix.rotate(-Math.abs(30*Math.sin(g_seconds/2)), 1, 0, 0);
    }
    else if(g_seconds>19&&g_seconds<22){
      mouthBottom.matrix.rotate(-Math.abs(45*Math.sin(g_seconds/2)), 1, 0, 0);
    }
    else if(g_seconds>22){
      mouthBottom.matrix.rotate(-45,1,0,0);
    }
    
  }
  else{
    mouthBottom.matrix.rotate(g_headAngle,1,0,0);

  }
  mouthBottom.matrix.rotate(g_mouthAngle,1,0,0);
  var mouthBottomCoord = new Matrix4(mouthBottom.matrix);
  var mouthBottomCoordTwo = new Matrix4(mouthBottom.matrix);
  var mouthBottomCoordThree = new Matrix4(mouthBottom.matrix);
  var mouthBottomCoordFour = new Matrix4(mouthBottom.matrix);
  var mouthBottomCoordFive = new Matrix4(mouthBottom.matrix);
  mouthBottom.matrix.scale(0.6,0.28,0.65);
  mouthBottom.render();

  //ToothOne
  var toothOneBot = new Cube();
  toothOneBot.color=[1,1,1,1.0];
  toothOneBot.matrix = mouthBottomCoord;
  toothOneBot.matrix.translate(0.05,-0.05,0.3);
  toothOneBot.matrix.scale(0.1,0.1,0.1);
  toothOneBot.render();

  //ToothTwo
  var toothTwoBot = new Cube();
  toothTwoBot.color=[1,1,1,1.0];
  toothTwoBot.matrix = mouthBottomCoordTwo;
  toothTwoBot.matrix.translate(0.05,-0.05,0.51);
  toothTwoBot.matrix.scale(0.1,0.1,0.1);
  toothTwoBot.render();

  //ToothThree
  var toothThreeBot = new Cube();
  toothThreeBot.color=[1,1,1,1.0];
  toothThreeBot.matrix = mouthBottomCoordThree;
  toothThreeBot.matrix.translate(0.45,-0.05,0.3);
  toothThreeBot.matrix.scale(0.1,0.1,0.1);
  toothThreeBot.render();

  //ToothFour
  var toothFourBot = new Cube();
  toothFourBot.color=[1,1,1,1.0];
  toothFourBot.matrix = mouthBottomCoordFour;
  toothFourBot.matrix.translate(0.45,-0.05,0.51);
  toothFourBot.matrix.scale(0.1,0.1,0.1);
  toothFourBot.render();

  //ToothFive
  var toothFiveBot = new Cube();
  toothFiveBot.color=[1,1,1,1.0];
  toothFiveBot.matrix = mouthBottomCoordFive;
  toothFiveBot.matrix.translate(0.25,-0.05,0.49);
  toothFiveBot.matrix.scale(0.1,0.1,0.1);
  toothFiveBot.render();




  //EyeRight
  var eyeRight = new Cube();
  eyeRight.color=[1,1,1,1.0];
  eyeRight.matrix = headCoordEyeR;
  eyeRight.matrix.translate(0.80,0.50,0);
  eyeRight.matrix.scale(0.01,0.1,0.1);
  if (g_animation === true) {
    if(g_seconds>24){
      eyeRight.color=[0.3,0.3,1,1.0];


    }
  }
  eyeRight.render();

  
//EyeLeft
  var eyeLeft = new Cube();
  eyeLeft.color=[1,1,1,1.0];
  eyeLeft.matrix = headCoordEyeL;
  eyeLeft.matrix.translate(-0.01,0.50,0);
  eyeLeft.matrix.scale(0.01,0.1,0.1);
  if (g_animation === true) {
    if(g_seconds>24){
      eyeLeft.color=[0.3,0.3,1,1.0];
    }
  }

  eyeLeft.render();

 

  //back
  var back = new Cube();
  back.color=[0.2,0.2,0.2,1.0];
  back.matrix = bodyCoor;
  back.matrix.translate(0,0.65,0.25);
  var backCoord = new Matrix4(back.matrix);
  var backCoordTwo = new Matrix4(back.matrix);
  var backCoordThree = new Matrix4(back.matrix);
  var backCoordFour = new Matrix4(back.matrix);
  var backCoordFive = new Matrix4(back.matrix);
  back.matrix.scale(1,1,0.1);
  back.render();

  //BackSpikes
  var spikeBack = new Pyramid();
  spikeBack.color=[0.3,0.3,0.3,1.0];
  spikeBack.matrix = backCoord;
  spikeBack.matrix.translate(0.1,0.7,0);
  spikeBack.matrix.scale(0.3,0.3,1);
  spikeBack.matrix.rotate(90,1,0,0);
  if (g_animation === true) {
    if(g_seconds>18&&g_seconds<19){
      var scaleY =  1+ Math.abs(Math.sin(g_seconds/2 * Math.PI));
      spikeBack.matrix.scale(1, scaleY, 1);
      spikeBack.matrix.translate(-scaleY/3,0,0);

    }
    else if(g_seconds>19){
      spikeBack.color=[0.3,0.3,0.9,1.0];
      spikeBack.matrix.translate(-0.333,0,0);
      spikeBack.matrix.scale(1, 2, 1);
    }
  }
  spikeBack.render();

  var spikeBack2 = new Pyramid();
  spikeBack2.color=[0.3,0.3,0.3,1.0];
  spikeBack2.matrix = backCoordTwo;
  spikeBack2.matrix.translate(0.7,0.7,0);
  spikeBack2.matrix.scale(0.3,0.3,1);
  spikeBack2.matrix.rotate(90,1,0,0);
  if (g_animation === true) {
    if(g_seconds>18&&g_seconds<19){
      var scaleY =  1+ Math.abs(Math.sin(g_seconds/2 * Math.PI));
      spikeBack2.matrix.scale(1, scaleY, 1);
      spikeBack2.matrix.translate(scaleY/3,0,0);

    }
    else if(g_seconds>19){
      spikeBack2.color=[0.3,0.3,0.9,1.0];
      spikeBack2.matrix.translate(0.333,0,0);
      spikeBack2.matrix.scale(1, 2, 1);
    }
  }
  spikeBack2.render();

  var spikeBack3 = new Pyramid();
  spikeBack3.color=[0.3,0.3,0.3,1.0];
  spikeBack3.matrix = backCoordThree;
  spikeBack3.matrix.translate(0.1,1.05,0);
  spikeBack3.matrix.scale(0.3,0.3,1);
  spikeBack3.matrix.rotate(90,1,0,0);
  if (g_animation === true) {
    if(g_seconds>22&&g_seconds<23){
      var scaleY =  1+ Math.abs(Math.sin(g_seconds/2 * Math.PI));
      spikeBack3.matrix.scale(1, scaleY, 1);
      spikeBack3.matrix.translate(-scaleY/3,0,0);
      
    }
    else if(g_seconds>23){
      spikeBack3.color=[0.3,0.3,0.9,1.0];
      spikeBack3.matrix.translate(-0.333,0,0);
      spikeBack3.matrix.scale(1, 2, 1);
    }
  }
  spikeBack3.render();


  
  var spikeBack4 = new Pyramid();
  spikeBack4.color=[0.3,0.3,0.3,1.0];
  spikeBack4.matrix = backCoordFour;
  spikeBack4.matrix.translate(0.7,1.05,0);
  spikeBack4.matrix.scale(0.3,0.3,1);
  spikeBack4.matrix.rotate(90,1,0,0);
  if (g_animation === true) {
    if(g_seconds>22&&g_seconds<23){
      var scaleY =  1+ Math.abs(Math.sin(g_seconds/2 * Math.PI));
      spikeBack4.matrix.scale(1, scaleY, 1);
      spikeBack4.matrix.translate(scaleY/3,0,0);

    }
    else if(g_seconds>23){
      spikeBack4.color=[0.3,0.3,0.9,1.0];
      spikeBack4.matrix.translate(0.333,0,0);
      spikeBack4.matrix.scale(1, 2, 1);
    }
  }
  spikeBack4.render();

  var spikeBack5 = new Pyramid();
  spikeBack5.color=[0.3,0.3,0.3,1.0];
  spikeBack5.matrix = backCoordFive;
  spikeBack5.matrix.translate(0.4,0.9,0);
  spikeBack5.matrix.scale(0.3,0.35,1.1);
  spikeBack5.matrix.rotate(90,1,0,0);
  if (g_animation === true) {
    if(g_seconds>20&&g_seconds<21){
      var scaleY =  1+ Math.abs(Math.sin(g_seconds/2 * Math.PI));
      spikeBack5.matrix.scale(1, scaleY, 1);
    }
    else if(g_seconds>21){
      spikeBack5.color=[0.3,0.3,0.9,1.0];

      spikeBack5.matrix.scale(1, 2, 1);
    }
  }
  spikeBack5.render();




  //TailStart
  console.log("g_seconds: " + g_seconds);
  var tailStart = new Cube();
  tailStart.color=[0.2,0.2,0.2,1.0];
  tailStart.matrix = bodyCoor;
  tailStart.matrix.translate(0.1,-0.5,0.35);
  if(g_animation==true){
    tailStart.matrix.rotate(3.5*Math.sin(g_seconds/1),0,1,0);
    
    //tailStart.matrix.rotate(3.5*Math.sin(g_seconds/2),0,1,0);

    tailStart.matrix.rotate(2*Math.sin(g_seconds),1,0,0);
    
    
    
  }
  else{
      tailStart.matrix.rotate(g_tailAngle,0,1,0);
      tailStart.matrix.rotate(g_tailAngle2,1,0,0);
  }
  

  var tailCoord = new Matrix4(tailStart.matrix);
  tailStart.matrix.scale(0.8,0.9,4);
  
  tailStart.render();

  




  var tailTwo = new Cube();
  tailTwo.color=[0.2,0.2,0.2,1.0];
  tailTwo.matrix = tailCoord;
  tailTwo.matrix.translate(0.1,0.05,3.5);
  var tailtwoCoord = new Matrix4(tailTwo.matrix);
  var tailtwoCoordSpike = new Matrix4(tailTwo.matrix);

  tailTwo.matrix.scale(0.6,0.6,5);
  tailTwo.render();

  var spikeTailTwo = new Pyramid();
  spikeTailTwo.color=[0.3,0.3,0.3,1.0];
  spikeTailTwo.matrix = tailtwoCoordSpike;
  spikeTailTwo.matrix.translate(0.05,0.55,1.2);
  spikeTailTwo.matrix.scale(0.5,1,2.5);
  if (g_animation === true) {
    if(g_seconds>16&&g_seconds<17){
      var scaleY =  1+ Math.abs(Math.sin(g_seconds/2 * Math.PI));
      spikeTailTwo.matrix.scale(1, scaleY, 1);
    }
    else if(g_seconds>17){
      spikeTailTwo.color=[0.3,0.3,0.9,1.0];

      spikeTailTwo.matrix.scale(1, 2, 1);
    }
    
  } 
  spikeTailTwo.render();
  


  var tailThree = new Cube();
  tailThree.color=[0.2,0.2,0.2,1.0];
  tailThree.matrix = tailtwoCoord;
  tailThree.matrix.translate(0.05,0.02,4.5);
  var tailThreeCoord = new Matrix4(tailThree.matrix);
  tailThree.matrix.scale(0.5,0.5,6);
  tailThree.matrix.rotate(-20,1,0,0);
  tailThree.render();

  var tailFour = new Cube();
  tailFour.color=[0.2,0.2,0.2,1.0];
  tailFour.matrix = tailThreeCoord;
  tailFour.matrix.translate(0.05,0.12,3.5);
  var tailFourCoord = new Matrix4(tailFour.matrix);
  var tailFourCoordSpike = new Matrix4(tailFour.matrix);
  tailFour.matrix.scale(0.4,0.4,8);
  tailFour.matrix.rotate(-50,1,0,0);
  tailFour.render();

  var spikeTailFour = new Pyramid();
  spikeTailFour.color=[0.3,0.3,0.3,1.0];
  spikeTailFour.matrix = tailFourCoordSpike;
  spikeTailFour.matrix.translate(-0.05,0.30,-3.2);
  spikeTailFour.matrix.rotate(-1,1,0,0);
  spikeTailFour.matrix.scale(0.5,1,2.5);
  if (g_animation === true) {
    if(g_seconds>14&&g_seconds<15){
      var scaleY =  1+ Math.abs(Math.sin(g_seconds/2 * Math.PI));
      spikeTailFour.matrix.scale(1, scaleY, 1);
    }
    else if(g_seconds>15){
      spikeTailFour.color=[0.3,0.3,0.9,1.0];
      spikeTailFour.matrix.scale(1, 2, 1);
    }
    
  } 
  spikeTailFour.render();

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
  tailSix.color=[0.2,0.2,0.2,1.0];
  tailSix.matrix = tailFiveCoord;
  tailSix.matrix.translate(0.05,0.20,4.0);
  var tailSixCoord = new Matrix4(tailSix.matrix);
  var tailSixCoordSpike = new Matrix4(tailSix.matrix);
  tailSix.matrix.scale(0.32,0.25,8.5);
  tailSix.matrix.rotate(-40,1,0,0);
  tailSix.matrix.translate(0,0.0,-0.55);
  tailSix.render();

  var spikeTailSix = new Pyramid();
  spikeTailSix.color=[0.3,0.3,0.3,1.0];
  spikeTailSix.matrix = tailSixCoordSpike;
  spikeTailSix.matrix.translate(0.05,0.15,-7.2);
  spikeTailSix.matrix.rotate(-1,1,0,0);
  spikeTailSix.matrix.scale(0.2,0.5,2.5);
  if (g_animation === true) {
    if(g_seconds>12&&g_seconds<13){
      var scaleY =  1+ Math.abs(Math.sin(g_seconds/2 * Math.PI));
      spikeTailSix.matrix.scale(1, scaleY, 1);
    }
    else if(g_seconds>13){
      spikeTailSix.color=[0.3,0.3,0.9,1.0];
      spikeTailSix.matrix.scale(1, 2, 1);
    }
    
  } 
  spikeTailSix.render();

  var tailSeven = new Cube();
  tailSeven.color=[0.2,0.2,0.2,1.0];
  tailSeven.matrix = tailSixCoord;
  tailSeven.matrix.translate(0.05,0.10,4.0);
  var tailSevenCoord = new Matrix4(tailSeven.matrix);
  var tailSevenCoordSpike = new Matrix4(tailSeven.matrix);
  tailSeven.matrix.scale(0.32,0.25,5.5);
  tailSeven.matrix.rotate(-10,1,0,0);
  tailSeven.matrix.translate(0,0.05,-1.0);
  tailSeven.render();
  
  var spikeTail5 = new Pyramid();
  spikeTail5.color=[0.3,0.3,0.3,1.0];
  spikeTail5.matrix = tailSevenCoord;
  spikeTail5.matrix.translate(0.05,0.10,-7.2);
  spikeTail5.matrix.rotate(-1,1,0,0);
  spikeTail5.matrix.scale(0.2,0.5,2.5);
  if (g_animation === true) {
    if(g_seconds>10&&g_seconds<11){
      var scaleY =  1+ Math.abs(Math.sin(g_seconds/2 * Math.PI));
      spikeTail5.matrix.scale(1, scaleY, 1);
    }
    else if(g_seconds>11){
      spikeTail5.color=[0.3,0.3,0.9,1.0];

      spikeTail5.matrix.scale(1, 2, 1);
    }
    
  } 
  spikeTail5.render();

  var spikeTailSeven = new Pyramid();
  spikeTailSeven.color=[0.3,0.3,0.3,1.0];
  spikeTailSeven.matrix = tailSevenCoordSpike;
  spikeTailSeven.matrix.translate(0.05,0.10,-4.2);
  spikeTailSeven.matrix.rotate(-1,1,0,0);
  spikeTailSeven.matrix.scale(0.2,0.5,2.5);
  if (g_animation === true) {
    if(g_seconds>8&&g_seconds<9){
      var scaleY =  1+ Math.abs(Math.sin(g_seconds/2 * Math.PI));
      spikeTailSeven.matrix.scale(1, scaleY, 1);
    }
    else if(g_seconds>9){
      spikeTailSeven.color=[0.3,0.3,0.9,1.0];

      spikeTailSeven.matrix.scale(1, 2, 1);
    }
    
  } 
  spikeTailSeven.render();
  if(g_seconds>34){
    breathTime(BreathCoord1);
  }


  
  








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