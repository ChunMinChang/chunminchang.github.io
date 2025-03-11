function getVideoStream(size) {
  let constraints = { video: true, audio: false };
  if (size && size.width && size.height) {
    constraints.video.width = size.width;
    constraints.video.height = size.height;
  }
  return navigator.mediaDevices.getUserMedia(constraints);
}

function takePicture(videoElement, ts) {
  const timestamp = ts || videoElement.currentTime * 1000000 /* microseconds */;
  return new VideoFrame(videoElement, { timestamp });
}
