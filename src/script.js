const contentWidth = 640;
const contentHeight = 480;
const canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

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

  el = document.createElement('h2');
  eltxt = document.createTextNode('How to play air guitar 🤘');
  el.appendChild(eltxt);
  document.querySelector("#overlay div").appendChild(el);

  el = document.createElement('p');
  eltxt = document.createTextNode('Stand in a spot where the camera can see your full torso as well as both arms. Your left arm controls the pitch of the notes - the further away it is from your body on the white line, the lower the notes. Move your right hand across the white line to strum the strings.');
  el.appendChild(eltxt);
  document.querySelector("#overlay div").appendChild(el);

  async function poseDetectionFrame() {
    const pose = await net.estimateSinglePose(video, 0.5, false, 16);
    console.log(pose);
     requestAnimationFrame(poseDetectionFrame);
  }
  poseDetectionFrame();
}


start();


