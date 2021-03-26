const inputSourses = document.querySelector("select#inputsources");
const openButton = document.querySelector("button#openinput");
const audioContainer = document.querySelector("div#inputaudios");
var deviceStreams = {}; // Track the MediaStream we created
var deviceInfos = {}; // Cache the MediaDeviceInfo data

init();

async function init() {
  await loadDevices();
  await OpenMediaStream();
  openButton.onclick = (event) => {
    OpenMediaStream();
  };
}

async function OpenMediaStream() {
  console.assert(inputSourses.value, "audio device must be set!");
  const deviceId = inputSourses.value;
  const constraints = {
    audio: {deviceId: {exact: deviceId}},
  };
  console.log("Open stream by", constraints);
  let stream = await navigator.mediaDevices.getUserMedia(constraints).catch(handleError);
  console.log("Got stream", stream);

  let devices = "";
  stream.getAudioTracks().forEach((audioTrack) => {
    devices += audioTrack.label + " ";
  });
  console.log("stream runs on: " + devices);

  // Update device.label in the inputSourses and remove the deviceId
  await updateInputSourcesIfNeeded();

  addStream(deviceId, stream);
}

async function loadDevices() {
  let devices = await navigator.mediaDevices.enumerateDevices().catch(handleError);
  loadInputSources(devices);
  updateCachedDevices(devices);
}

function addStream(deviceId, stream) {
  addDeviceStream(deviceId, stream);
  addStreamAudio(deviceId, stream);
}

function addDeviceStream(deviceId, stream) {
  console.log("Add MediaStream " + stream.id + " for device " + deviceId);
  if (!deviceStreams.hasOwnProperty(deviceId)) {
    deviceStreams[deviceId] = {};
  }
  console.assert(!deviceStreams[deviceId].hasOwnProperty(stream.id));
  deviceStreams[deviceId][stream.id] = stream;
  console.log("Device - Streams",deviceStreams);
}

function removeDeviceStream(deviceId, stream) {
  console.log("Remove MediaStream " + stream.id + " for device " + deviceId);
  console.assert(deviceStreams.hasOwnProperty(deviceId));
  console.assert(deviceStreams[deviceId].hasOwnProperty(stream.id));
  delete deviceStreams[deviceId][stream.id];
  if (Object.keys(deviceStreams[deviceId]).length === 0 && deviceStreams[deviceId].constructor === Object) {
    delete deviceStreams[deviceId];
  }
  console.log("Device - Streams",deviceStreams);
}

function addStreamAudio(deviceId, stream) {
  const container = getDeviceAudioContainer(deviceId);

  const div = document.createElement("div");
  div.id = stream.id;

  const elementId = deviceId + "|" + stream.id;

  const label = document.createElement("label");
  const streamNumber = Object.keys(deviceStreams[deviceId]).length;
  label.innerText = `${deviceInfos[deviceId].label} #${streamNumber}`;
  label.for = elementId;

  const audioElement = document.createElement("audio");
  audioElement.id = elementId;
  audioElement.srcObject = stream;
  audioElement.controls = true;

  const closeButton = document.createElement("button");
  closeButton.innerText = "Close " + label.innerText;
  closeButton.id = "close-" + elementId;
  closeButton.onclick = (event) => {
    removeDeviceStream(deviceId, stream);
    label.remove();
    audioElement.remove();
    closeButton.remove();
    div.remove();
  };

  div.appendChild(label);
  div.appendChild(audioElement);
  div.appendChild(closeButton);
  container.appendChild(div);
}

function getDeviceAudioContainer(deviceId) {
  let container = document.getElementById(deviceId);
  if (!container) {
    container = document.createElement("div");
    container.id = deviceId;
    audioContainer.appendChild(container);
  }
  return container;
}

async function updateInputSourcesIfNeeded() {
  if (getStreamCount() > 0) {
    return;
  }
  await loadDevices();
}

function getStreamCount() {
  let streams = 0;
  for (const deviceId in deviceStreams) {
    streams += Object.keys(deviceStreams[deviceId]).length;
  }
  return streams;
}

function updateCachedDevices(infos) {
  // Clear cache
  deviceInfos = {};
  infos.forEach((info) => {
    deviceInfos[info.deviceId] = {
      "kind": info.kind,
      "label": info.label,
      "groupId": info.groupId
    };
  });
}

function loadInputSources(devices) {
  clearInputSources();
  devices.forEach((device) => {
    console.log("Device:", device);
    // Skip non-audioinput device
    if (device.kind === "audioinput") {
      putToInputSources(device)
    }
  });
}

function clearInputSources() {
  while (inputSourses.firstChild) {
    inputSourses.removeChild(inputSourses.firstChild);
  }
}

function putToInputSources(device) {
  const option = document.createElement("option");
  option.value = device.deviceId;
  option.text = device.label || `audio input ${inputSourses.length + 1}`;
  inputSourses.appendChild(option);
}

function handleError(error) {
  const errorMessage = error.message + " " + error.name;
  console.log(errorMessage);
}