const INPUT_SOURCES = document.querySelector("select#input-sources");
const OPEN_BUTTON = document.querySelector("button#open-input");
const AUDIO_CONTAINER = document.querySelector("div#input-audios");
const CHANNEL_COUNT = document.querySelector("input#channel-count");
const AGC = document.querySelector("input#AGC");
const EC = document.querySelector("input#EC");
const NS = document.querySelector("input#NS");

init();

async function init() {
  INPUT_SOURCES.disabled = true;

  OPEN_BUTTON.onclick = (event) => {
    if (INPUT_SOURCES.disabled) {
      OpenMediaStream(false);
      INPUT_SOURCES.disabled = false;
      return;
    }
    OpenMediaStream(true);
  };
}

async function OpenMediaStream(exactDevice) {
  const constraints = { audio: true };
  if (exactDevice) {
    console.assert(INPUT_SOURCES.value, "audio device must be set!");
    constraints.audio = { deviceId: { exact: INPUT_SOURCES.value } };
  }

  constraints.audio = Object.assign(
    {},
    { autoGainControl: AGC.checked },
    { echoCancellation: EC.checked },
    { noiseSuppression: NS.checked },
    constraints.audio
  );

  constraints.audio = Object.assign(
    {},
    { channelCount: CHANNEL_COUNT.value },
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

  // Update the selection list if it's empty
  if (INPUT_SOURCES.options.length == 0) {
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
  AUDIO_CONTAINER.appendChild(container);
}

function createTrackInfo(track, number) {
  function createTrackSettingBox(track, attribute) {
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = track.getSettings()[attribute];
    box.onclick = (event) => {
      let constraints = track.getSettings();
      constraints[attribute] = box.checked;
      track.applyConstraints(constraints).then(() => {
        box.checked = track.getSettings()[attribute];
      }).catch(handleError);
    };
    return box;
  }

  const info = document.createElement("div");

  const trackLabel = document.createElement("p");
  trackLabel.innerHTML = `track ${number}: ${track.label}`;

  const autoGainControl = createTrackSettingBox(track, "autoGainControl");
  const autoGainControlLabel = document.createElement("label");
  autoGainControlLabel.innerText = "Automatic Gain Control";

  const echoCancellation = createTrackSettingBox(track, "echoCancellation");
  const echoCancellationLabel = document.createElement("label");
  echoCancellationLabel.innerText = "Echo Cancellation"

  const noiseSuppression = createTrackSettingBox(track, "noiseSuppression");
  const noiseSuppressionLabel = document.createElement("label");
  noiseSuppressionLabel.innerText = "Noise Suppression";

  const channelsLabel = document.createElement("label");
  channelsLabel.innerHTML = "channelCount: ";

  const channelPicker = document.createElement("input");
  channelPicker.name = track.label;
  channelPicker.type = "number";
  channelPicker.min = 0;
  channelPicker.value = `${track.getSettings().channelCount}`;

  const channelsButton = document.createElement("button");
  channelsButton.innerHTML = "Set channel count";
  channelsButton.onclick = (event) => {
    let newChannels = channelPicker.value;
    let newConstraints = Object.assign(
      track.getSettings(), { channelCount: newChannels });
    track.applyConstraints(newConstraints).then(() => {
      channelPicker.value = `${track.getSettings().channelCount}`;
    }).catch(handleError);
  };

  info.appendChild(trackLabel);

  info.appendChild(autoGainControl);
  info.appendChild(autoGainControlLabel);

  info.appendChild(echoCancellation);
  info.appendChild(echoCancellationLabel);

  info.appendChild(noiseSuppression);
  info.appendChild(noiseSuppressionLabel);

  info.appendChild(document.createElement("br"));

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
  while (INPUT_SOURCES.firstChild) {
    INPUT_SOURCES.removeChild(INPUT_SOURCES.firstChild);
  }
}

function putToInputSources(device) {
  const option = document.createElement("option");
  option.value = device.deviceId;
  option.text = device.label || `audio input ${INPUT_SOURCES.length + 1}`;
  INPUT_SOURCES.appendChild(option);
}

function handleError(error) {
  const errorMessage = error.message + " " + error.name;
  console.log(errorMessage);
}
