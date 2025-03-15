(function () {
  window.SingleCellAutomata = SingleCellAutomata;

  function SingleCellAutomata(options) {
    this.options = _.extend(
      {
        state: [],
        size: 100,
        rules: {},
      },
      options || {}
    );

    this.state = _.clone(options.state);
  }

  SingleCellAutomata.createRandomState = function (size) {
    var state = [];
    for (var i = 0; i < size; i++) {
      state[i] = Math.random() > 0.7 ? 1 : 0;
    }

    return state;
  };

  SingleCellAutomata.extendState = function (state, length) {
    if (state.length > length) {
      return state.slice(0, length);
    }

    if (state.length < length) {
      var tempState = state.slice();
      var newItemIdx = 0;
      while (tempState.length <= length) {
        tempState.push(state[newItemIdx % state.length]);
        newItemIdx++;
      }
      return tempState;
    }

    return state;
  };

  SingleCellAutomata.prototype = {
    next: function () {
      this.state = this.applyRules(this.state, this.options.rules);
    },

    getState: function () {
      return this.state;
    },

    applyRules: function (state, rule) {
      var newState = [];

      for (var i = 0; i < this.options.size; i++) {
        var prev = state[i - 1] ? 1 : 0;
        var next = state[i + 1] ? 1 : 0;

        var pattern = prev + '' + state[i] + '' + next;
        newState[i] = rule[pattern] ? 1 : 0;
      }

      return newState;
    },
  };
})();
