const inputSourses = document.querySelector("select#inputsources");
const openButton = document.querySelector("button#openinput");
const audioContainer = document.querySelector("div#inputaudios");
const audioProcessing = document.querySelector("input#processing");
const channelCount = document.querySelector("input#channelCount");

init();

async function init() {
  await loadDevices();
  await OpenMediaStream(false);
  openButton.onclick = (event) => {
    OpenMediaStream(true);
  };
}

async function OpenMediaStream(exactDevice) {
  console.assert(inputSourses.value, "audio device must be set!");
  let constraints;
  if (exactDevice) {
    constraints = { audio: { deviceId: { exact: inputSourses.value } } };
  } else {
    constraints = { audio: true };
  }

  if (!audioProcessing.checked) {
    constraints.audio = Object.assign(
      {},
      { autoGainControl: false },
      { echoCancellation: false },
      { noiseSuppression: false },
      constraints.audio
    );
  }

  constraints.audio = Object.assign(
    {},
    { channelCount: channelCount.value },
    constraints.audio
  );

  console.log("Open stream by", constraints);
  let stream = await navigator.mediaDevices
    .getUserMedia(constraints)
    .catch(handleError);
  console.log("Got stream", stream);

  let devices = "";
  stream.getAudioTracks().forEach((audioTrack) => {
    devices += audioTrack.label + " ";
  });
  console.log("stream runs on: " + devices);

  // Update the selection list if this is the first stream
  if (audioContainer.childElementCount == 0) {
    await loadDevices();
  }

  addStreamAudio(stream)
}

async function loadDevices() {
  let devices = await navigator.mediaDevices
    .enumerateDevices()
    .catch(handleError);
  loadInputSources(devices);
}

function addStreamAudio(stream) {
  const container = getDeviceAudioContainer(stream.id);

  const div = document.createElement("div");
  div.id = stream.id;

  const label = document.createElement("p");
  label.innerText = "Stream: ";
  const info = document.createElement("div");
  let audiotracks = stream.getAudioTracks();
  for (let i = 0; i < audiotracks.length; ++i) {
    let track = audiotracks[i];
    if (i > 0) {
      label.innerText += " | ";
    }
    label.innerText += track.label;
    let trackInfo = createTrackInfo(audiotracks[i], i + 1);
    trackInfo.style = "margin-left: 40px;";
    info.appendChild(trackInfo);
  }

  const audioElement = document.createElement("audio");
  audioElement.srcObject = stream;
  audioElement.controls = true;

  const closeButton = document.createElement("button");
  closeButton.innerText = "Close " + label.innerText;
  closeButton.onclick = (event) => {
    label.remove();
    audioElement.remove();
    closeButton.remove();
    div.remove();

    let tracks = stream.getAudioTracks();
    tracks.forEach(track => track.stop());
  };
  closeButton.style = "margin-left: 20px;";

  div.appendChild(label);
  div.appendChild(audioElement);
  div.appendChild(closeButton);
  div.appendChild(info);
  container.appendChild(div);
  audioContainer.appendChild(container);
}

function createTrackInfo(track, number) {
  const info = document.createElement("div");

  const label = document.createElement("label");
  label.innerHTML = `track ${number}: ${track.label}`;

  const audioSettings = document.createElement("p");
  audioSettings.innerHTML =
    `autoGainControl: ${track.getSettings().autoGainControl},
     echoCancellation: ${track.getSettings().echoCancellation},
     noiseSuppression: ${track.getSettings().noiseSuppression}`;

  const channelsLabel = document.createElement("label");
  channelsLabel.innerHTML = "channelCount: ";

  const channelPicker = document.createElement("input");
  channelPicker.id = track.id;
  channelPicker.name = track.label;
  channelPicker.type = "number";
  channelPicker.min = 0;
  channelPicker.value = `${track.getSettings().channelCount}`;

  const channelsButton = document.createElement("button");
  channelsButton.innerHTML = "Update";
  channelsButton.onclick = (event) => {
    let newChannels = channelPicker.value;
    let newConstraints = Object.assign(
      track.getSettings(), { channelCount: newChannels });
    track.applyConstraints(newConstraints).then(() => {
      channelPicker.value = `${track.getSettings().channelCount}`;
      console.log("channel count - expect " + newChannels +
        ", get " + channelPicker.value);
    }).catch(handleError);
  };

  info.appendChild(label);
  info.appendChild(audioSettings);
  info.appendChild(channelsLabel);
  info.appendChild(channelPicker);
  info.appendChild(channelsButton);

  return info;
}

function getDeviceAudioContainer(streamId) {
  let container = document.getElementById(streamId);
  if (!container) {
    container = document.createElement("div");
    container.id = streamId;
  }
  return container;
}

function loadInputSources(devices) {
  clearInputSources();
  devices.forEach((device) => {
    console.log("Device:", device);
    // Skip non-audioinput device
    if (device.kind === "audioinput") {
      putToInputSources(device);
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
