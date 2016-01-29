(function() {
  angular
    .module('noc', [])
    .controller('SingleCellAutomataCtrl', function($scope, $timeout) {

      $scope.rules = {
        '000': false,
        '001': true,
        '010': false,
        '011': true,
        '100': true,
        '101': false,
        '110': true,
        '111': false
      };
      $scope.ruleKeys = _.keys($scope.rules).sort();
      $scope.speed = 5;
      $scope.scale = 10;

      var width = 800,
        height = 600,
        itemsX,
        itemsY,
        backgroundColor = 'white',
        cellColor = 'black';

      var stateY = 0;

      var ctx = document.getElementById("canvas").getContext('2d');
      var automata;

      var manualState = [];
      var manualModeActive = false;
      // $scope.runInProgress = false;

      $('canvas').click(function(e) {
        if (!manualModeActive) {
          $scope.reset();
          manualModeActive = true;
          manualState = [];
        }
        var p = CanvasHelper.getMousePos(this, e);
        var ix = p.x / $scope.scale - (p.x % $scope.scale / $scope.scale);
        manualState[ix] = +(!manualState[ix]);

        CanvasHelper.clearScreen(ctx, width, height, backgroundColor);
        CanvasHelper.drawState(ctx, manualState, 0, $scope.scale, cellColor, backgroundColor, width);
      });

      // $scope.manual = false;

      $scope.$watch('scale', function() {
        itemsX = width / $scope.scale;
        itemsY = height / $scope.scale;

        $scope.stop();

        CanvasHelper.clearScreen(ctx, width, height, backgroundColor);
        CanvasHelper.drawRectSample(ctx, $scope.scale, backgroundColor, cellColor);

        stateY = 0;
        // $scope.run();
      });

      var stepTimeoutId = null;

      $scope.reset = function() {
        // console.log('Reset');
        // $scope.runInProgress = false;
        // initState = [];
        // if (!$scope.manual)
        //   initializeStateRandom();

        // clearTimeout(stepTimeoutId);
        $scope.stop();
        CanvasHelper.clearScreen(ctx, width, height, backgroundColor);
      };

      $scope.stop = function() {
        // $scope.runInProgress = false;
        clearTimeout(stepTimeoutId);
      };

      $scope.run = function() {
        $scope.reset();
        CanvasHelper.clearScreen(ctx, width, height, backgroundColor);

        // if ($scope.runInProgress) {
        //   $scope.reset();
        // }
        // $scope.runInProgress = true;
        // 
        automata = new SingleCellAutomata({
          state: manualState.length === 0 ? SingleCellAutomata.createRandomState(itemsX) : manualState,
          size: itemsX,
          rules: $scope.rules
        });

        manualState = [];
        manualModeActive = false;
        stateY = 0;

        function doStep() {
          automata.next();
          CanvasHelper.drawState(ctx, automata.getState(), stateY, $scope.scale, cellColor, backgroundColor, width);

          stateY++;
          if (stateY > itemsY) {
            CanvasHelper.clearScreen(ctx, width, height, backgroundColor);
            stateY = 0;
          }
          stepTimeoutId = setTimeout(doStep, 1000 / $scope.speed)
        }
        doStep();
      }

      // $timeout(function() {
      //   $scope.run();
      // });

    });

}());


function SingleCellAutomata(options) {
  this.options = _.extend({
    state: [],
    size: 100,
    rules: {}
  }, options || {});

  this.state = _.clone(options.state);
}

SingleCellAutomata.createRandomState = function(size) {
  var state = [];
  for (var i = 0; i < size; i++) {
    state[i] = Math.random() > 0.9 ? 1 : 0;
  }

  return state;
};

SingleCellAutomata.prototype = {
  next: function() {
    this.state = this.applyRules(this.state, this.options.rules);
  },

  getState: function() {
    return this.state;
  },

  applyRules: function(state, rule) {
    var newState = [];

    for (var i = 0; i < this.options.size; i++) {
      var prev = state[i - 1] ? 1 : 0;
      var next = state[i + 1] ? 1 : 0;

      var pattern = prev + '' + state[i] + '' + next;
      newState[i] = rule[pattern] ? 1 : 0;
    }

    return newState;
  }
}

var CanvasHelper = {
  getMousePos: function(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  },
  drawState: function(ctx, state, t, scale, cellColor, backgroundColor, width) {
    for (var i = 0; i < state.length; i++) {

      ctx.strokeStyle = cellColor;
      ctx.beginPath();
      ctx.moveTo(0, (t + 1) * scale);
      ctx.lineTo(width, (t + 1) * scale);
      ctx.stroke();

      ctx.strokeStyle = backgroundColor;
      ctx.beginPath();
      ctx.moveTo(0, (t) * scale);
      ctx.lineTo(width, (t) * scale);
      ctx.stroke();

      if (state[i] === 1) {
        ctx.fillStyle = cellColor;
        ctx.fillRect(i * scale, t * scale, scale - 1, scale - 1);
      } else {

      }
    }
  },

  clearScreen: function(ctx, width, height, color) {
    ctx.rect(0, 0, width, height);
    ctx.fillStyle = color;
    ctx.fill();
  },

  drawRectSample: function(ctx, scale, cellColor, backgroundColor) {
    ctx.strokeStyle = cellColor;
    ctx.fillStyle = backgroundColor;
    var x = 1;
    var y = 1;
    ctx.fillRect(x, y, scale - 1, scale - 1);
  }
};