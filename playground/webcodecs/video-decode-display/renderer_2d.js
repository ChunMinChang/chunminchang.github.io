class Canvas2DRenderer {
  #canvas = null;
  #ctx = null;
  #processing = "";

  constructor(canvas) {
    this.#canvas = canvas;
    this.#ctx = canvas.getContext("2d");
  }

  draw(frame) {
    this.#canvas.width = frame.displayWidth;
    this.#canvas.height = frame.displayHeight;
    switch (this.#processing) {
      case "grayscale":
        this.grayscale(frame);
        break;
      case "inverted":
        this.invert(frame);
        break;
      case "sepia":
        this.sepia(frame);
        break;
      default:
        this.#ctx.drawImage(frame, 0, 0, frame.displayWidth, frame.displayHeight);
        break;
    }
    frame.close();
  }

  setProcessing(processing) {
    this.#processing = processing;
  }

  // Pixel processing functions
  grayscale(frame) {
    this.#ctx.drawImage(frame, 0, 0, frame.displayWidth, frame.displayHeight);
    const imageData = this.#ctx.getImageData(0, 0, this.#canvas.width, this.#canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg; // red
      data[i + 1] = avg; // green
      data[i + 2] = avg; // blue
    }
    this.#ctx.putImageData(imageData, 0, 0);
  }

  invert(frame) {
    this.#ctx.drawImage(frame, 0, 0, frame.displayWidth, frame.displayHeight);
    const imageData = this.#ctx.getImageData(0, 0, this.#canvas.width, this.#canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i]; // red
      data[i + 1] = 255 - data[i + 1]; // green
      data[i + 2] = 255 - data[i + 2]; // blue
    }
    this.#ctx.putImageData(imageData, 0, 0);
  }

  sepia(frame) {
    this.#ctx.drawImage(frame, 0, 0, frame.displayWidth, frame.displayHeight);
    const imageData = this.#ctx.getImageData(0, 0, this.#canvas.width, this.#canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const red = data[i];
      const green = data[i + 1];
      const blue = data[i + 2];
      data[i] = Math.min(Math.round(0.393 * red + 0.769 * green + 0.189 * blue), 255);
      data[i + 1] = Math.min(Math.round(0.349 * red + 0.686 * green + 0.168 * blue), 255);
      data[i + 2] = Math.min(Math.round(0.272 * red + 0.534 * green + 0.131 * blue), 255);
    }
    this.#ctx.putImageData(imageData, 0, 0);
  }
};
