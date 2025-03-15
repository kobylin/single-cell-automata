(function () {
  window.CanvasHelper = {
    getMousePos: function (canvas, evt) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top,
      };
    },
    drawState: function (ctx, state, t, scale, cellColor) {
      for (var i = 0; i < state.length; i++) {
        if (state[i] === 1) {
          ctx.fillStyle = cellColor;
          ctx.fillRect(i * scale, t * scale, scale - 1, scale - 1);
        } else {
        }
      }
    },

    clearScreen: function (ctx, width, height, color) {
      ctx.rect(0, 0, width, height);
      ctx.fillStyle = color;
      ctx.fill();
    },

    drawRectSample: function (ctx, scale, cellColor, backgroundColor) {
      ctx.strokeStyle = cellColor;
      ctx.fillStyle = backgroundColor;
      var x = 1;
      var y = 1;
      ctx.fillRect(x, y, scale - 1, scale - 1);
    },
  };
})();
