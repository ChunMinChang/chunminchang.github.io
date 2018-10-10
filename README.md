## TO-DO
- [ ] Make seamless_looping_tester works on Chrome
  - `audioElement.mozCaptureStream()` doesn't work on Chrome.
  - Replace `createMediaStreamSource` with `createMediaElementSource`
  - Generate sine wave [on-the-fly](https://searchfox.org/mozilla-central/rev/80ac71c1c54af788b32e851192dfd2de2ec18e18/dom/media/test/test_seamless_looping.html#33-88)
