const contentWidth = 640;
const contentHeight = 480;
const canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

let indexes = {
  'nose': 0,
  'leftEye': 1,
  'rightEye': 2,
  'leftShoulder': 5,
  'rightShoulder': 6,
  'leftElbow': 7,
  'rightElbow': 8,
  'leftWrist' : 9,
  'rightWrist' : 10,
  'leftHip' : 11,
  'rightHip': 12,
  'leftKnee': 13,
	'rightKnee': 14,
	'leftAnkle': 15,
	'rightAnkle': 16
};

nparts = 17;

let fixedPosition = [];
let lastPosition = [];
isFixed = false;



const findNewPoint = (x, y, radians, distance)=>{
  var result = {};
  result.x = Math.round(Math.cos(radians) * distance + x);
  result.y = Math.round(Math.sin(radians) * distance + y);
  return result;
}

// returns true if the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
const intersects = (a,b,c,d,p,q,r,s) =>{
  var det, gamma, lambda;
  det = (c - a) * (s - q) - (r - p) * (d - b);
  if (det === 0) {
    return false;
  } else {
    lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
    gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
  }
};

const getRadians = (x1, y1, x2, y2) => {
  return Math.atan2(y2 - y1, x2 - x1);
}

async function start() {
  canvas.width = contentWidth;
  canvas.height = contentHeight;
  ctx.translate(contentWidth, 0);
  ctx.scale(-1, 1);
  const net = await posenet.load();
  let video;
  try {
      video = await loadVideo();
  } catch (e) {
      console.error(e);
      return;
  }
  detectPoseInRealTime(video, net);
}

async function loadVideo() {
  const video = await setupCamera();
  video.play();
  return video;
}

async function setupCamera() {
  const video = document.getElementById('video');
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    const stream = await navigator.mediaDevices.getUserMedia({
      'audio': false,
      'video': {
        width: contentWidth,
        height: contentHeight
      }
    });
    video.width = contentWidth;
    video.height = contentHeight;
    video.srcObject = stream;
    return new Promise(resolve => {
      video.onloadedmetadata = () => {
        resolve(video);
      };
    });
  } else {
    const errorMessage = "This browser does not support video capture, or this device does not have a camera";
    alert(errorMessage);
    return Promise.reject(errorMessage);
  }
}


function detectPoseInRealTime(video, net) {
  document.querySelector('#overlay div h2').remove();

  async function poseDetectionFrame() {
      const pose = await net.estimateSinglePose(video, 0.5, false, 16);
      detectPose(pose.keypoints);
      requestAnimationFrame(poseDetectionFrame);
  }
  poseDetectionFrame();
}

const line = (x1, y1,x2,y2,strokeStyle, strokeWidth) =>{
  ctx.strokeStyle = strokeStyle;
  ctx.strokeWidth = strokeWidth;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

const ellipse = (x,y,radius, hex) =>{
  ctx.fillStyle  =  hex;
  ctx.beginPath();
  ctx.arc(x, y, radius, radius, 0, 2 * Math.PI);
  ctx.fill();
}

function detectPose(points){
  ctx.clearRect(0, 0, contentWidth, contentHeight);
  ctx.drawImage(video, 0, 0, contentWidth, contentHeight);
  if(points[indexes.leftShoulder].score>0.4 && points[indexes.rightShoulder].score > 0.4)
  {

    // remove the instructions
    if(document.querySelector('.overlay.active')){
      document.querySelector('.overlay.active').classList.remove('active');
    }

    lastPosition = points;

    for (ipos = 0; ipos < nparts; ipos++) {
      if (points[ipos].score > 0.7) {
        ellipse(points[ipos].position.x, points[ipos].position.y, 10 * points[ipos].score ** 2, 'red');
      }
    }

    if (isFixed) {
      for (ipos = 0; ipos < fixedPosition.length; ipos++) {
        if (fixedPosition[ipos].score > 0.7) {
          ellipse(fixedPosition[ipos].position.x, fixedPosition[ipos].position.y, 10, 'blue');

          line(points[ipos].position.x, points[ipos].position.y,
               fixedPosition[ipos].position.x, fixedPosition[ipos].position.y, 'yellow', 8);
        }
      }

      distance = compute_distance(fixedPosition, points);

      if (distance > 100) {
        document.getElementById('messages').innerHTML = 'moving';
      }
      else {
        document.getElementById('messages').innerHTML = 'OK';
      }

      console.log(distance);

    }

    /*
    line(points[indexes.leftShoulder].position.x, points[indexes.leftShoulder].position.y,
         points[indexes.rightShoulder].position.x, points[indexes.rightShoulder].position.y, 'white', 4);
    line(points[indexes.leftShoulder].position.x, points[indexes.leftShoulder].position.y,
         points[indexes.leftElbow].position.x, points[indexes.leftElbow].position.y, 'white', 4);
    line(points[indexes.rightShoulder].position.x, points[indexes.rightShoulder].position.y,
         points[indexes.rightElbow].position.x, points[indexes.rightElbow].position.y, 'white', 4);
    line(points[indexes.rightKnee].position.x, points[indexes.rightKnee].position.y,
         points[indexes.rightAnkle].position.x, points[indexes.rightAnkle].position.y, 'white', 4);
    line(points[indexes.leftKnee].position.x, points[indexes.leftKnee].position.y,
         points[indexes.leftAnkle].position.x, points[indexes.leftAnkle].position.y, 'white', 4);
  */

  }
}

function compute_distance(a, fixed)
{
  let sum = 0.;
  for (ipos = 0; ipos < a.length; ipos++) {
    if (fixed[ipos].score > 0.7) {
      sum += (a[ipos].position.x - fixed[ipos].position.x) ** 2 + (a[ipos].position.y - fixed[ipos].position.y) ** 2;
    }
  }
  return Math.sqrt(sum);
}

function fixPosition()
{
  console.log('fix');
  fixedPosition = Array.from(lastPosition);
  isFixed = true;
}


start();
