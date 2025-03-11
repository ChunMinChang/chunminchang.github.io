function getVideoStream(size) {
  let constraints = { video: true, audio: false };
  if (size && size.width && size.height) {
    constraints.video.width = size.width;
    constraints.video.height = size.height;
  }
  return navigator.mediaDevices.getUserMedia(constraints);
}

function createVideoWithStream(size) {
  const video = document.createElement("video");
  video.autoplay = true;
  getVideoStream(size).then((stream) => {
    video.srcObject = stream;
    video.play();
  });
  return video;
}

async function createStreamingVideo(size) {
  const video = document.createElement("video");
  video.autoplay = true;
  const stream = await getVideoStream(size);
  video.srcObject = stream;
  await video.play();
  return { video, stream };
}

function takePicture(videoElement, ts) {
  const timestamp = ts || videoElement.currentTime * 1000000; /* microseconds */
  return new VideoFrame(videoElement, { timestamp });
}
