function countEvents(element, events) {
  initEventCount(element, events);
  addEventListeners(element, events, eventCounter)
}

function initEventCount(element, events) {
  element.eventCount = {};
  for (let evt of events) {
    element.eventCount[evt] = 0;
  }
}

function addEventListeners(element, events, listener) {
  for (let evt of events) {
    element.addEventListener(evt, eventCounter);
  }
}

function eventCounter(evt) {
  evt.target.eventCount[evt.type] += 1;
}