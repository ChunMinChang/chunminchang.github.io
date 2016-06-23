'use strict';

(function(aExports) {

  var audioContext;
  var bufferLoader;
  var source;

  function debug(aMsg) {
    console.log('[demo.js] ' + aMsg);
  }

  function init() {
    // Set audio context
    try {
      audioContext = new AudioContext();

      // Load songs
      let songs = [
        '../sounds/acoustic-guitar-strummy1.mp3',
        '../sounds/acoustic-guitar-strummy2.mp3',
      ];
      bufferLoader = new BufferLoader(songs);

      bufferLoader.load()
      .then(function() {
        // Show the loaded songs into playlist
        showPlaylist(songs);
        // Set default choice is the first song
        // ...
        // ...
      });
    } catch(e) {
      debug(e);
      return;
    }

    // Set callbacks
    setEventHandlers();
  }

  function showPlaylist(aList) {
    // Get the playlist div
    let playlist = document.querySelector('#playlist');
    for (let i in aList) {
      // Get the song's file name
      let songName = aList[i].substring(aList[i].lastIndexOf('/') + 1);
      // Create a radio button
      let item = createRadioButton('song', i, songName);
      // and append it to the playlist div
      playlist.appendChild(item);
      // Insert a line break
      playlist.appendChild(document.createElement('br'));
    }
  }

  function createRadioButton(aName, aValue, aText) {
    var label = document.createElement('label');
    let radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = aName;
    radio.value = aValue;
    label.appendChild(radio);
    label.appendChild(document.createTextNode(aText));
    return label;
  }

  function getSelectedSongIndex() {
    let itemName = 'song';
    let songs = document.querySelectorAll('input[name=' + itemName + ']');
    for (let i in songs) {
      if (songs[i].checked) {
        return songs[i].value; // The value is set to index in showPlaylist()
      }
    }
    return -1;
  }

  function setEventHandlers() {
    let playButton = document.querySelector('#playButton');
    let stopButton = document.querySelector('#stopButton');
    let loop = document.querySelector('#loop');

    playButton.onclick = play;
    stopButton.onclick = stop;
    loop.onclick = setLoop;

    function resetButtonState() {
      // Make play button clickable
      playButton.disabled = false;
      // Make stop button unclickable
      stopButton.disabled = true;;
    }

    function onEnded(aEvent) {
      resetButtonState();
    }

    function play(aEvent) {
      let index = getSelectedSongIndex();
      if (index < 0) {
        debug('No selected song');
        return;
      }

      let buffer = bufferLoader.bufferList[index];
      setAudioSource(buffer);

      // Set ended callback that will be fired upon sound finishes playing
      // If source.loop is set to true, then there is no 'end',
      // so the callback won't be triggered.
      source.onended = onEnded;
      // play the source now
      source.start(0);
      // Set loop for source
      source.loop = loop.checked;
      // Make play button unclickable
      playButton.disabled = true;
      // Make stop button clickable
      stopButton.disabled = false;
    }

    function stop(aEvent) {
      if (!source) {
        debug('Audio source is not loaded yet');
        return;
      }
      // Stop playing the sound now
      source.stop(0);

      resetButtonState();
    }

    function setLoop(aEvent) {
      if (!source) {
        debug('Audio source is not loaded yet');
        return;
      }

      source.loop = loop.checked;
    }
  }

  // BufferLoader class:
  // @ aUrlList:  A list containg all the urls of the sounds will be loaded
  function BufferLoader(aUrlList) {
    this.urlList = aUrlList;
    this.bufferList = new Array();
    this.loadCount = 0;
  }

  BufferLoader.prototype.load = function() {
    let self = this;
    return new Promise(function(aResolve, aReject) {
      if (!audioContext) {
        aReject('No available AudioContext');
        return;
      }

      // A function that will be fired upon all the urls in list are loaded
      self.onLoaded = function() {
        debug('All songs are loaded!');
        aResolve();
      }

      // A function that will be fired if there is anything wrong in decoding
      let handled = false;
      self.onError = function(aError, aIndex) {
        debug(aError);
        debug('Failed to load song ' + aIndex + ': ' + self.urlList[aIndex]);
        if (!handled) {
          handled = true;
          aReject(aError);
        }
      }

      for (let i = 0; i < self.urlList.length; ++i) {
        self.loadBuffer(i);
      }
    });
  }

  BufferLoader.prototype.loadBuffer = function(aIndex) {
    // Use XMLHttpRequest for fetching sound files.
    // The audio file data is binary
    // so we set the responseType of the request to 'arraybuffer'.
    var request = new XMLHttpRequest();
    let url = this.urlList[aIndex];
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    // We will use |this| in request.onload.
    // However, the |this| in request.onload is |request|,
    // so we set |self| to |this| and use |self| in request.onload.
    let self = this;

    // Once the undecoded audio file data has been received
    // it can be kept around for later decoding
    request.onload = function() {
      let audioData = request.response;

      // Decode asynchronously
      audioContext.decodeAudioData(audioData, function onDecoded(aBuffer) {
        self.bufferList[aIndex] = aBuffer;
        if (++self.loadCount == self.urlList.length) {
          self.onLoaded();
        }
      }, function onError(aError) {
        debug('Error with decoding audio data');
        self.onError(aError, aIndex);
      });
    }

    request.onerror = function() {
      debug('BufferLoader: XHR error');
      self.onError('XHR error', aIndex);
    }

    // Send the XMLHttpRequest request
    request.send();
  }

  function setAudioSource(aBuffer) {
    // Creates a sound source which is a AudioBufferSourceNode
    source = audioContext.createBufferSource();
    // Tell the source which sound to play
    source.buffer = aBuffer;
    // Connect the source to the context's destination
    // (system default is the speakers)
    source.connect(audioContext.destination);

    // The source, a AudioBufferSourceNode, is one-time-use only.
    // If we want to play the audio from the source repleatly,
    // we need to create the a new AudioBufferSourceNode and assign its
    // reference to the source.
  }

  // Run all the functions after the DOM content is loaded.
  aExports.ready(init);
}(window));
