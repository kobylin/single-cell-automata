(function() {
    angular
        .module("noc", [])
        .controller("SingleCellAutomataCtrl", function($scope, $timeout) {
            $scope.rules = {
                "000": false,
                "001": true,
                "010": false,
                "011": true,
                "100": true,
                "101": false,
                "110": true,
                "111": false
            };
            $scope.ruleKeys = _.keys($scope.rules).sort();
            $scope.speed = 5;
            $scope.scale = 5;
            $scope.stateY = 0;
            $scope.width = 800;
            $scope.height = 600;

            var width = $scope.width,
                height = $scope.height,
                itemsCountX,
                itemsCountY,
                backgroundColor = "white",
                cellColor = "black",
                automata,
                manualState = [],
                manualModeActive = false,
                stepTimeoutPromise,
                ctx = document.getElementById("canvas").getContext("2d");

            $scope.handleBodyKey = function(event) {
                if (event.target.tagName === "BODY") {
                    if (event.key && event.key.toLowerCase() === 'r') {
                        $scope.run();
                    }
                    if (event.key && event.key.toLowerCase() === 's') {
                        $scope.stop();
                    }
                    if (event.key === 'ArrowUp') {
                        $scope.speed++;
                    }
                    if (event.key === 'ArrowDown') {
                        $scope.speed--;
                    }
                    if (event.key === 'ArrowRight') {
                        $scope.scale++;
                    }
                    if (event.key === 'ArrowLeft') {
                        $scope.scale--;
                    }
                }
            };

            $scope.$watch("stateY", function() {
                $scope.linePosition = {
                    top: $scope.stateY * $scope.scale + "px"
                };
            });

            $("canvas").click(function(e) {
                if (!manualModeActive) {
                    $scope.reset();
                    manualModeActive = true;
                    manualState = [];
                }
                var position = CanvasHelper.getMousePos(this, e);
                var idx = Math.floor(position.x / $scope.scale);

                manualState[idx] = Number(!manualState[idx]);

                CanvasHelper.clearScreen(ctx, width, height, backgroundColor);
                CanvasHelper.drawState(
                    ctx,
                    manualState,
                    0,
                    $scope.scale,
                    cellColor,
                    backgroundColor,
                    width
                );
                $scope.$apply();
            });

            $scope.$watch("scale", function() {
                itemsCountX = width / $scope.scale;
                itemsCountY = height / $scope.scale;

                if (automata) {
                    $scope.stateY = 0;
                    var oldState = automata.getState().slice();

                    if (oldState.length > itemsCountX) {
                        oldState = oldState.slice(0, itemsCountX);
                    } else if (oldState.length < itemsCountX) {
                        var tempState = automata.getState().slice();
                        var newItemIdx = 0;
                        while (tempState.length <= itemsCountX) {
                            tempState.push(
                                oldState[newItemIdx % oldState.length]
                            );
                            newItemIdx++;
                        }
                        oldState = tempState;
                    }

                    automata = new SingleCellAutomata({
                        state: oldState,
                        size: itemsCountX,
                        rules: $scope.rules
                    });
                    CanvasHelper.clearScreen(
                        ctx,
                        width,
                        height,
                        backgroundColor
                    );
                } else {
                    //TODO: fix it
                    $timeout(() => {
                        CanvasHelper.clearScreen(
                            ctx,
                            width,
                            height,
                            backgroundColor
                        );
                        CanvasHelper.drawRectSample(
                            ctx,
                            $scope.scale,
                            backgroundColor,
                            cellColor
                        );
                    });
                }
            });

            $scope.$watch(
                "rules",
                function() {
                    $scope.ruleCode = $scope.ruleKeys.reduce(
                        (total, rule) =>
                            total + Number($scope.rules[rule]).toString(),
                        ""
                    );
                },
                true
            );

            $scope.updateRuleFromCode = function() {
                $scope.ruleCode = $scope.ruleCode.slice(
                    0,
                    $scope.ruleKeys.length
                );
                for (var i = 0; i < $scope.ruleKeys.length; i++) {
                    $scope.rules[$scope.ruleKeys[i]] = Boolean(
                        Number($scope.ruleCode[i])
                    );
                }
            };

            $scope.toggleRule = function(rule) {
                $scope.rules[rule] = !$scope.rules[rule];
            };

            $scope.reset = function() {
                // console.log('Reset');
                // $scope.runInProgress = false;
                // initState = [];
                // if (!$scope.manual)
                //   initializeStateRandom();

                // clearTimeout(stepTimeoutId);
                $scope.stateY = 0;
                $scope.stop();
                CanvasHelper.clearScreen(ctx, width, height, backgroundColor);
            };

            $scope.stop = function() {
                // $scope.runInProgress = false;
                $timeout.cancel(stepTimeoutPromise);
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
                    state:
                        manualState.length === 0
                            ? SingleCellAutomata.createRandomState(itemsCountX)
                            : manualState,
                    size: itemsCountX,
                    rules: $scope.rules
                });

                manualState = [];
                manualModeActive = false;

                function doStep() {
                    automata.next();
                    CanvasHelper.drawState(
                        ctx,
                        automata.getState(),
                        $scope.stateY,
                        $scope.scale,
                        cellColor,
                        backgroundColor,
                        width
                    );

                    $scope.stateY++;
                    if ($scope.stateY > itemsCountY) {
                        CanvasHelper.clearScreen(
                            ctx,
                            width,
                            height,
                            backgroundColor
                        );
                        $scope.stateY = 0;
                    }
                    stepTimeoutPromise = $timeout(doStep, 1000 / $scope.speed);
                }
                doStep();
            };
        });
})();

function SingleCellAutomata(options) {
    this.options = _.extend(
        {
            state: [],
            size: 100,
            rules: {}
        },
        options || {}
    );

    this.state = _.clone(options.state);
}

SingleCellAutomata.createRandomState = function(size) {
    var state = [];
    for (var i = 0; i < size; i++) {
        state[i] = Math.random() > 0.7 ? 1 : 0;
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

            var pattern = prev + "" + state[i] + "" + next;
            newState[i] = rule[pattern] ? 1 : 0;
        }

        return newState;
    }
};

var CanvasHelper = {
    getMousePos: function(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    },
    drawState: function(
        ctx,
        state,
        t,
        scale,
        cellColor,
        backgroundColor,
        width
    ) {
        for (var i = 0; i < state.length; i++) {
            if (state[i] === 1) {
                ctx.fillStyle = cellColor;
                ctx.fillRect(i * scale, t * scale, scale - 1, scale - 1);
            } else {
            }
        }

        // debugger;
        // ctx.strokeStyle = backgroundColor;
        // ctx.beginPath();
        // ctx.moveTo(0, t * scale);
        // ctx.lineTo(width, t * scale);
        // ctx.stroke();
        //
        // ctx.strokeStyle = cellColor;
        // ctx.beginPath();
        // ctx.moveTo(0, (t + 1) * scale);
        // ctx.lineTo(width, (t + 1) * scale);
        // ctx.stroke();
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
