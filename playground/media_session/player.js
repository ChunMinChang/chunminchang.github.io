// Redirect the error to page
window.onerror = function (msg, url, lineNo, columnNo, error) {
  var string = msg.toLowerCase();
  var substring = 'script error';
  if (string.indexOf(substring) > -1) {
    Logger.log('Script Error: See Browser Console for Detail');
  } else {
    var message = [
      'Message: ' + msg,
      'URL: ' + url,
      'Line: ' + lineNo,
      'Column: ' + columnNo,
      'Error object: ' + JSON.stringify(error)
    ].join(' - ');

    Logger.log(message);
  }

  return false;
};

// Init after the page is loaded
window.addEventListener('DOMContentLoaded', (event) => {
  let playBtn = document.querySelector('#playpause');
  if (!('mediaSession' in navigator)) {
    Logger.setStatus('The Media Session API is not yet available in this browser');
    playBtn.disabled = true;
    return;
  }

  Logger.setStatus('Click the play button to start');
  MediaSession.init();
  playBtn.addEventListener('click', onPlayPauseClick);
});

function onPlayPauseClick(evt) {
  let btn = evt.target;
  if (btn.value == 'playing') {
    btn.value = 'paused';
    btn.innerHTML = '▶ play';
    Player.pause();
  } else {
    btn.value = 'playing';
    btn.innerHTML = '| | pause';
    Player.playOrResume();
  }
}

const PlayerState = Object.freeze({
  paused: 'PAUSED',
  playing: 'PLAYING',
});
let Player = {
  playOrResume: function () {
    let audio = this.getAudio();
    if (audio.currentSrc == '') {
      this.play();
    } else {
      this.resume();
    }
  },
  play: function () {
    let list = this.getList();
    let track = list.currentTrack();
    this.playTrack(track);
  },
  resume: function () {
    let audio = this.getAudio();
    audio.play();
  },
  pause: function () {
    let audio = this.getAudio();
    audio.pause();
  },
  playNext: function () {
    let list = this.getList();
    let track = list.nextTrack();
    this.playTrack(track);
  },
  playPrevious: function () {
    let list = this.getList();
    let track = list.previousTrack();
    this.playTrack(track);
  },
  playTrack: function (track) {
    this.loadTrack(track);
    let audio = this.getAudio();
    audio.play()
      .then(_ => {
        this.updateState();
        MediaSession.updateMetadata(track);
      })
      .catch(error => Logger.log(error));
  },
  seek: function (time) {
    let audio = this.getAudio();
    audio.currentTime = Math.min(Math.max(0, audio.currentTime + time), audio.duration);
  },
  loadTrack: function (track) {
    let audio = this.getAudio();
    audio.src = track.src
  },
  updateState: function () {
    let audio = this.getAudio();
    if (audio.paused) {
      this._state = PlayerState.paused;
    } else {
      this._state = PlayerState.playing;
    }
    audio.setAttribute('state', this._state);
  },
  getAudio: function () {
    if (!this._audio) {
      this._audio = document.createElement('audio');
      this.updateState();
      this._audio.addEventListener('ended', evt => {
        console.log(evt);
        this.playNext();
      });
    }
    return this._audio;
  },
  getList: function () {
    if (!this._list) {
      this._list = new PlayList(getGooglePlaylist());
    }
    return this._list;
  },
  _state: PlayerState.paused,
  _list: null,
  _audio: null,
};

class PlayList {
  constructor(tracks) {
    console.assert(tracks && tracks.length != 0, 'the playlist cannot be empty');
    this.tracks = tracks;
    this.index = 0;
  }

  nextTrack() {
    this.index = (this.index + 1) % this.tracks.length;
    return this.currentTrack();
  }

  previousTrack() {
    this.index = (this.index - 1 + this.tracks.length) % this.tracks.length;
    return this.currentTrack();
  }

  currentTrack() {
    return this.tracks[this.index];
  }
};

// Utils
let MediaSession = {
  init: function () {
    let handlers = {
      'play': this.play,
      'pause': this.pause,
      'stop': this.stop,
      'previoustrack': this.previoustrack,
      'nexttrack': this.nexttrack,
      'seekbackward': this.seekbackward,
      'seekforward': this.seekforward,
    };
    this.setHandlers(handlers);
  },
  updateMetadata: function (track) {
    Logger.log('Update metadata for ' + track.title);
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: track.artwork
    });
  },
  setHandlers: function (handlers) {
    for (let action in handlers) {
      Logger.log("Set action handler for " + action);
      let handler = handlers[action];
      navigator.mediaSession.setActionHandler(action, handler);
    }
  },
  // Action handlers
  play: function (evt) {
    Logger.log('> User click play!');
    console.log(evt);
    Player.resume();
  },
  pause: function (evt) {
    Logger.log('> User click pause!');
    console.log(evt);
    Player.pause();
  },
  stop: function (evt) {
    Logger.log('> User click stop!');
    console.log(evt);
  },
  previoustrack: function (evt) {
    Logger.log('> User click previoustrack!');
    console.log(evt);
    Player.playPrevious();
  },
  nexttrack: function (evt) {
    Logger.log('> User click nexttrack!');
    console.log(evt);
    Player.playNext();
  },
  seekbackward: function (evt) {
    Logger.log('> User click seekbackward!');
    console.log(evt);
    Player.seek(-10);
  },
  seekforward: function (evt) {
    Logger.log('> User click seekforward!');
    console.log(evt);
    Player.seek(10);
  },
};

let Logger = {
  log: function () {
    var line = Array.prototype.slice.call(arguments).map(function (argument) {
      return typeof argument === 'string' ? argument : JSON.stringify(argument);
    }).join(' ');

    document.querySelector('#log').textContent += line + '\n';
  },

  clearLog: function () {
    document.querySelector('#log').textContent = '';
  },

  setStatus: function (status) {
    document.querySelector('#status').textContent = status;
  },

  setContent: function (newContent) {
    var content = document.querySelector('#content');
    while (content.hasChildNodes()) {
      content.removeChild(content.lastChild);
    }
    content.appendChild(newContent);
  }
};

function getGooglePlaylist() {
  const BASE_URL = 'https://storage.googleapis.com/media-session/';

  return [{
    src: BASE_URL + 'sintel/snow-fight.mp3',
    title: 'Snow Fight',
    artist: 'Jan Morgenstern',
    album: 'Sintel',
    artwork: [{
      src: BASE_URL + 'sintel/artwork-96.png',
      sizes: '96x96',
      type: 'image/png'
    },
    {
      src: BASE_URL + 'sintel/artwork-128.png',
      sizes: '128x128',
      type: 'image/png'
    },
    {
      src: BASE_URL + 'sintel/artwork-192.png',
      sizes: '192x192',
      type: 'image/png'
    },
    {
      src: BASE_URL + 'sintel/artwork-256.png',
      sizes: '256x256',
      type: 'image/png'
    },
    {
      src: BASE_URL + 'sintel/artwork-384.png',
      sizes: '384x384',
      type: 'image/png'
    },
    {
      src: BASE_URL + 'sintel/artwork-512.png',
      sizes: '512x512',
      type: 'image/png'
    },
    ]
  }, {
    src: BASE_URL + 'big-buck-bunny/prelude.mp3',
    title: 'Prelude',
    artist: 'Jan Morgenstern',
    album: 'Big Buck Bunny',
    artwork: [{
      src: BASE_URL + 'big-buck-bunny/artwork-96.png',
      sizes: '96x96',
      type: 'image/png'
    },
    {
      src: BASE_URL + 'big-buck-bunny/artwork-128.png',
      sizes: '128x128',
      type: 'image/png'
    },
    {
      src: BASE_URL + 'big-buck-bunny/artwork-192.png',
      sizes: '192x192',
      type: 'image/png'
    },
    {
      src: BASE_URL + 'big-buck-bunny/artwork-256.png',
      sizes: '256x256',
      type: 'image/png'
    },
    {
      src: BASE_URL + 'big-buck-bunny/artwork-384.png',
      sizes: '384x384',
      type: 'image/png'
    },
    {
      src: BASE_URL + 'big-buck-bunny/artwork-512.png',
      sizes: '512x512',
      type: 'image/png'
    },
    ]
  }, {
    src: BASE_URL + 'elephants-dream/the-wires.mp3',
    title: 'The Wires',
    artist: 'Jan Morgenstern',
    album: 'Elephants Dream',
    artwork: [{
      src: BASE_URL + 'elephants-dream/artwork-96.png',
      sizes: '96x96',
      type: 'image/png'
    },
    {
      src: BASE_URL + 'elephants-dream/artwork-128.png',
      sizes: '128x128',
      type: 'image/png'
    },
    {
      src: BASE_URL + 'elephants-dream/artwork-192.png',
      sizes: '192x192',
      type: 'image/png'
    },
    {
      src: BASE_URL + 'elephants-dream/artwork-256.png',
      sizes: '256x256',
      type: 'image/png'
    },
    {
      src: BASE_URL + 'elephants-dream/artwork-384.png',
      sizes: '384x384',
      type: 'image/png'
    },
    {
      src: BASE_URL + 'elephants-dream/artwork-512.png',
      sizes: '512x512',
      type: 'image/png'
    },
    ]
  }, {
    src: BASE_URL + 'caminandes/original-score.mp3',
    title: 'Original Score',
    artist: 'Jan Morgenstern',
    album: 'Caminandes 2: Gran Dillama',
    artwork: [{
      src: BASE_URL + 'caminandes/artwork-96.png',
      sizes: '96x96',
      type: 'image/png'
    },
    {
      src: BASE_URL + 'caminandes/artwork-128.png',
      sizes: '128x128',
      type: 'image/png'
    },
    {
      src: BASE_URL + 'caminandes/artwork-192.png',
      sizes: '192x192',
      type: 'image/png'
    },
    {
      src: BASE_URL + 'caminandes/artwork-256.png',
      sizes: '256x256',
      type: 'image/png'
    },
    {
      src: BASE_URL + 'caminandes/artwork-384.png',
      sizes: '384x384',
      type: 'image/png'
    },
    {
      src: BASE_URL + 'caminandes/artwork-512.png',
      sizes: '512x512',
      type: 'image/png'
    },
    ]
  }];
}