// Declare a "SerialPort" object
var serial;
var latestData = "waiting for data";  // you'll use this to write incoming data to the canvas

var bgImg, img2, holeImg, welcomeImg;
var imgX = 0;
var imgY = 0;
var bird;
var holes = [];
var m = 0;
var fontsize = 80;
var gameStart = false;
var gameOver = false;
var trans = 100;
var health = 5;

var myRec;

function preload() {
  // load image
  bgImg = loadImage("bg.png");
  img2 = loadImage("dinosaur.png");
  trapImg = loadImage("hole.png");
  welcomeImg = loadImage("welcome.jpg");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textSize(fontsize);
  textAlign(CENTER, CENTER);
  bird = new Bird();
  
  holes.push(new Hole());

  // Instantiate our SerialPort object and SpeechRec
  serial = new p5.SerialPort();
  myRec = new p5.SpeechRec('en-US', parseResult); // new P5.SpeechRec object
  myRec.continuous = true; // do continuous recognition
  myRec.interimResults = true; // allow partial recognition (faster, less accurate)
  myRec.start(); 
    

  // Get a list the ports available
  // You should have a callback defined to see the results
  serial.list();

  // Assuming our Arduino is connected, let's open the connection to it
  // Change this to the name of your arduino's serial port
  serial.open("/dev/cu.usbmodem1421");

  // Here are the callbacks that you can register

  // When we connect to the underlying server
  serial.on('connected', serverConnected);

  // When we get a list of serial ports that are available
  serial.on('list', gotList);
  // OR
  //serial.onList(gotList);

  // When we some data from the serial port
  serial.on('data', gotData);
  // OR
  //serial.onData(gotData);

  // When or if we get an error
  serial.on('error', gotError);
  // OR
  //serial.onError(gotError);

  // When our serial port is opened and ready for read/write
  serial.on('open', gotOpen);
  // OR
  //serial.onOpen(gotOpen);

  // Callback to get the raw data, as it comes in for handling yourself
  //serial.on('rawdata', gotRawData);
  // OR
  //serial.onRawData(gotRawData);
}

// We are connected and ready to go
function serverConnected() {
  println("Connected to Server");
}

// Got the list of ports
function gotList(thelist) {
  println("List of Serial Ports:");
  // theList is an array of their names
  for (var i = 0; i < thelist.length; i++) {
    // Display in the console
    println(i + " " + thelist[i]);
  }
}

// Connected to our serial device
function gotOpen() {
  println("Serial Port is Open");
}

// Ut oh, here is an error, let's log it
function gotError(theerror) {
  println(theerror);
}

// There is data available to work with from the serial port
function gotData() {
  var currentString = serial.readLine();  // read the incoming string
  trim(currentString);                    // remove any trailing whitespace
  if (!currentString) return;             // if the string is empty, do no more
  //console.log(currentString);             // println the string
  latestData = currentString;            // save it for the draw method
}

// We got raw from the serial port
function gotRawData(thedata) {
  println("gotRawData" + thedata);
}

//////////////////////////////////////////////DRAW///////////////////////////////////////////////////

function draw() {
  background(0);
  //fill(255, 255, 255, trans);
  //text("Sound is Not Detected", width/2, height/2);
  image(welcomeImg, imgX, imgY, windowWidth, windowHeight);
  
    
  if(gameOver) {
      background(0);
      fill(255, 255, 255, trans);
      text("Your Dinosaur is Dead", width/2, height/2);
  }
    
  game();
  if(gameStart && !gameOver) {
      image(bgImg, imgX, imgY, windowWidth, windowHeight);
      image(bgImg, imgX+windowWidth, imgY, windowWidth, windowHeight);
      
      for (var i = holes.length-1; i >= 0; i--) {
          holes[i].show();
          holes[i].update();

          if(holes[i].hits(bird)) {
              //console,log("HIT");
              health -= 1;
              holes.splice(i, 1);
              //holes.push(new Hole());
              if(health == 0) {
                  gameStart = false;
                  gameOver = true;
              }
          }

          if (holes[i].offscreen()) {
              holes.splice(i, 1);
          }
      }
      
      bird.show();
      bird.update();
      
      if (frameCount % 90 == 0) {
          holes.push(new Hole());
          m += 1;
      }

      text(m , windowWidth-100, 50);
      text("Life  " + health, windowWidth-400, 50);

      // background movement
      imgX -= 5;
      if(imgX <= -windowWidth){
         imgX = 0;
      }
  }
}

function game() {
    if(latestData>300) {
       gameStart = true;
       }
}

function parseResult() {
		// recognition system will often append words into phrases.
		// so hack here is to only use the last word:
		var mostrecentword = myRec.resultString.split(' ').pop();
        if(mostrecentword.indexOf("up")!==-1) {
            bird.up();
        }else if(mostrecentword.indexOf("down")!==-1) {
            bird.down();
        }else if(mostrecentword.indexOf("clear")!==-1) {
            background(255); 
        }
		console.log(mostrecentword);
}

///////////////////////KeyPressed////////////////////////////
/*function keyPressed() {
    if (keyCode === UP_ARROW) {
        if(bird.y != height/2 - 300){
            bird.up();
        }
    }
    if (keyCode === DOWN_ARROW) {
        if(bird.y != height/2 + 300){
            bird.down();
        }
    }
}*/
///////////////////////////////////////////////////
function Bird() {
    var initalpositionX = 250;
    var midLane = height/2 + 230;
    this.y = midLane;
    this.x = initalpositionX;
    this.velocity = 0;
    
    this.show = function() {
        fill(255);
        //ellipse(this.x, this.y, 32, 32);
        image(img2, this.x-40, this.y-40, 180, 100);
    }
    
    this.up = function() {
        if(bird.y != midLane - 150){
            this.y -= 150;
            this.x += 50;
            
        }
    }
    
    this.down = function() {
        if(bird.y != midLane + 150){
            this.y += 150;
            this.x += 50;
        }
    }
    
    this.update = function() {
        if(this.x >= initalpositionX) {
            this.x -= 4;
        }
    }
}
//////////////////////////////////////////////////
function Hole() {
    this.y = generate(floor(random(4)));
    this.x = width;
    this.speed = 5;
    this.highlight = false;
    
    this.hits = function(bird) {
        if(bird.y == this.y){
            if(bird.x > this.x-30 && bird.x < this.x+30){
               this.highlight = true;
               return true; 
            }
        }
        return false;
    }
    
    this.show = function() {
        //fill(0);
        /*if(this.highlight) {
            fill(255, 0, 0);
        }*/
        //ellipse(this.x, this.y, 100, 100);
        image(trapImg, this.x - 90, this.y - 60, 200, 140);
    }
    
    this.update = function() {
        this.x -= this.speed;
    }
    
    this.offscreen = function() {
        if(this.x < -100) {
            return true;
        }else{
            return false;
        }
    }
    
    function generate(x){
        var mid = height/2 + 230;
        if(x <= 1){
            return mid - 150;
        }else if(x == 2){
            return mid;
        }else if(x >= 3){
            return mid + 150;
        }
    }
}