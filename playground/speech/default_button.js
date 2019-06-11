window.addEventListener('DOMContentLoaded', (event) => {
  default_init();
});

function default_init() {
  create_default_button();
}

function create_default_button() {
  let body = document.getElementsByTagName("body")[0];
  createElement("button", "btn", "click me", body, "click", onDefaultButtonClick);
}

function onDefaultButtonClick() {
  runOnClick();
}

function createElement(type, id, inner, parent, event, listener) {
  let ele = document.createElement(type);
  ele.id = id;
  ele.innerHTML = inner;
  ele.addEventListener(event, listener);
  parent.appendChild(ele);
}