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
            $scope.colors = COLORS;
            $scope.backgroundColor = "#00c853";
            $scope.cellColor = "#fffde7";

            var itemsCountX,
                itemsCountY,
                automata,
                manualState = [],
                manualModeActive = false,
                stepTimeoutPromise,
                canvas = document.getElementById("canvas"),
                ctx = canvas.getContext("2d");

            $scope.handleBodyKey = function(event) {
                if (event.target.tagName === "BODY") {
                    if (event.key && event.key.toLowerCase() === "r") {
                        $scope.run();
                    }
                    if (event.key && event.key.toLowerCase() === "s") {
                        $scope.stop();
                    }
                    if (event.key && event.key.toLowerCase() === "n") {
                        $scope.previousBgColor();
                    }
                    if (event.key && event.key.toLowerCase() === "m") {
                        $scope.nextBgColor();
                    }
                    if (event.key && event.key.toLowerCase() === "o") {
                        $scope.previousCellColor();
                    }
                    if (event.key && event.key.toLowerCase() === "p") {
                        $scope.nextCellColor();
                    }
                    if (event.key && event.key.toLowerCase() === "d") {
                        $scope.downloadImage();
                    }

                    //TODO: make buttons bellow trigering on keypressed
                    if (event.key === "ArrowUp") {
                        $scope.speed++;
                    }
                    if (event.key === "ArrowDown") {
                        $scope.speed--;
                    }
                    if (event.key === "ArrowRight") {
                        $scope.scale++;
                    }
                    if (event.key === "ArrowLeft") {
                        $scope.scale--;
                    }
                }
            };

            $scope.previousBgColor = function() {
                var colorIdx = $scope.colors.indexOf($scope.backgroundColor);

                if (colorIdx === 0) {
                    colorIdx = $scope.colors.length - 1;
                } else {
                    colorIdx--;
                }

                $scope.backgroundColor = $scope.colors[colorIdx];
            };

            $scope.nextBgColor = function() {
                var colorIdx = $scope.colors.indexOf($scope.backgroundColor);

                if (colorIdx === $scope.colors.length - 1) {
                    colorIdx = 0;
                } else {
                    colorIdx++;
                }

                $scope.backgroundColor = $scope.colors[colorIdx];
            };

            $scope.previousCellColor = function() {
                var colorIdx = $scope.colors.indexOf($scope.cellColor);

                if (colorIdx === 0) {
                    colorIdx = $scope.colors.length - 1;
                } else {
                    colorIdx--;
                }

                $scope.cellColor = $scope.colors[colorIdx];
            };

            $scope.nextCellColor = function() {
                var colorIdx = $scope.colors.indexOf($scope.cellColor);

                if (colorIdx === $scope.colors.length - 1) {
                    colorIdx = 0;
                } else {
                    colorIdx++;
                }

                $scope.cellColor = $scope.colors[colorIdx];
            };

            $scope.$watch("stateY", function() {
                $scope.linePosition = {
                    top: $scope.stateY * $scope.scale + "px"
                };
            });

            $scope.$watch("backgroundColor", function() {
                CanvasHelper.clearScreen(
                    ctx,
                    $scope.width,
                    $scope.height,
                    $scope.backgroundColor
                );
                CanvasHelper.drawRectSample(
                    ctx,
                    $scope.scale,
                    $scope.backgroundColor,
                    $scope.cellColor
                );
            });
            $scope.$watch("cellColor", function() {
                CanvasHelper.drawRectSample(
                    ctx,
                    $scope.scale,
                    $scope.backgroundColor,
                    $scope.cellColor
                );
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

                CanvasHelper.clearScreen(
                    ctx,
                    $scope.width,
                    $scope.height,
                    $scope.backgroundColor
                );
                CanvasHelper.drawState(
                    ctx,
                    manualState,
                    0,
                    $scope.scale,
                    $scope.cellColor,
                    $scope.backgroundColor,
                    $scope.width
                );
                $scope.$apply();
            });

            $scope.$watch("scale", function() {
                itemsCountX = $scope.width / $scope.scale;
                itemsCountY = $scope.height / $scope.scale;

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
                        $scope.width,
                        $scope.height,
                        $scope.backgroundColor
                    );
                } else {
                    //TODO: fix timeout
                    $timeout(() => {
                        CanvasHelper.clearScreen(
                            ctx,
                            $scope.width,
                            $scope.height,
                            $scope.backgroundColor
                        );
                        CanvasHelper.drawRectSample(
                            ctx,
                            $scope.scale,
                            $scope.backgroundColor,
                            $scope.cellColor
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
                $scope.stateY = 0;
                $scope.stop();
                CanvasHelper.clearScreen(
                    ctx,
                    $scope.width,
                    $scope.height,
                    $scope.backgroundColor
                );
            };

            $scope.stop = function() {
                $timeout.cancel(stepTimeoutPromise);
            };

            $scope.run = function() {
                $scope.reset();
                CanvasHelper.clearScreen(
                    ctx,
                    $scope.width,
                    $scope.height,
                    $scope.backgroundColor
                );

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
                        $scope.cellColor,
                        $scope.backgroundColor,
                        $scope.width
                    );

                    $scope.stateY++;
                    if ($scope.stateY > itemsCountY) {
                        CanvasHelper.clearScreen(
                            ctx,
                            $scope.width,
                            $scope.height,
                            $scope.backgroundColor
                        );
                        $scope.stateY = 0;
                    }
                    stepTimeoutPromise = $timeout(doStep, 1000 / $scope.speed);
                }
                doStep();
            };

            $scope.downloadImage = function() {
                var link = $(".canvas__download-link")[0];

                link.setAttribute("download", "cell_automata.png");
                link.setAttribute(
                    "href",
                    canvas
                        .toDataURL("image/png")
                        .replace("image/png", "image/octet-stream")
                );
                link.click();
            };

            setTimeout(function() {
                var selects = $("select").formSelect();

                selects.each(function(idx, el) {
                    $(el)
                        .siblings(".dropdown-content.select-dropdown")
                        .find("li")
                        .each(function(idx, liEl) {
                            var value = $(liEl)
                                .find("span")
                                .text();
                            if (/^#\w{6}$/.test(value)) {
                                $(liEl)
                                    .find("span")
                                    .css({
                                        color: value
                                    });
                            }
                        });
                });
            }, 100);

            $scope.fullscreen = false;

            window.addEventListener("resize", function() {
                if (screen.width === window.innerWidth) {
                    $scope.fullscreen = true;
                    $scope.width = screen.width;
                    $scope.height = screen.height;
                    $scope.scale++;
                    $scope.$apply();
                } else if ($scope.fullscreen) {
                    $scope.fullscreen = false;
                    $scope.width = 800;
                    $scope.height = 600;
                    $scope.scale--;
                    $scope.$apply();
                }
            });
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
    drawState: function(ctx, state, t, scale, cellColor) {
        for (var i = 0; i < state.length; i++) {
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

var COLORS = [
    "#ffebee",
    "#ffcdd2",
    "#ef9a9a",
    "#e57373",
    "#ef5350",
    "#f44336",
    "#e53935",
    "#d32f2f",
    "#c62828",
    "#b71c1c",
    "#ff8a80",
    "#ff5252",
    "#ff1744",
    "#d50000",
    "#fce4ec",
    "#f8bbd0",
    "#f48fb1",
    "#f06292",
    "#ec407a",
    "#e91e63",
    "#d81b60",
    "#c2185b",
    "#ad1457",
    "#880e4f",
    "#ff80ab",
    "#ff4081",
    "#f50057",
    "#c51162",
    "#f3e5f5",
    "#e1bee7",
    "#ce93d8",
    "#ba68c8",
    "#ab47bc",
    "#9c27b0",
    "#8e24aa",
    "#7b1fa2",
    "#6a1b9a",
    "#4a148c",
    "#ea80fc",
    "#e040fb",
    "#d500f9",
    "#aa00ff",
    "#ede7f6",
    "#d1c4e9",
    "#b39ddb",
    "#9575cd",
    "#7e57c2",
    "#673ab7",
    "#5e35b1",
    "#512da8",
    "#4527a0",
    "#311b92",
    "#b388ff",
    "#7c4dff",
    "#651fff",
    "#6200ea",
    "#e8eaf6",
    "#c5cae9",
    "#9fa8da",
    "#7986cb",
    "#5c6bc0",
    "#3f51b5",
    "#3949ab",
    "#303f9f",
    "#283593",
    "#1a237e",
    "#8c9eff",
    "#536dfe",
    "#3d5afe",
    "#304ffe",
    "#e3f2fd",
    "#bbdefb",
    "#90caf9",
    "#64b5f6",
    "#42a5f5",
    "#2196f3",
    "#1e88e5",
    "#1976d2",
    "#1565c0",
    "#0d47a1",
    "#82b1ff",
    "#448aff",
    "#2979ff",
    "#2962ff",
    "#e1f5fe",
    "#b3e5fc",
    "#81d4fa",
    "#4fc3f7",
    "#29b6f6",
    "#03a9f4",
    "#039be5",
    "#0288d1",
    "#0277bd",
    "#01579b",
    "#80d8ff",
    "#40c4ff",
    "#00b0ff",
    "#0091ea",
    "#e0f7fa",
    "#b2ebf2",
    "#80deea",
    "#4dd0e1",
    "#26c6da",
    "#00bcd4",
    "#00acc1",
    "#0097a7",
    "#00838f",
    "#006064",
    "#84ffff",
    "#18ffff",
    "#00e5ff",
    "#00b8d4",
    "#e0f2f1",
    "#b2dfdb",
    "#80cbc4",
    "#4db6ac",
    "#26a69a",
    "#009688",
    "#00897b",
    "#00796b",
    "#00695c",
    "#004d40",
    "#a7ffeb",
    "#64ffda",
    "#1de9b6",
    "#00bfa5",
    "#e8f5e9",
    "#c8e6c9",
    "#a5d6a7",
    "#81c784",
    "#66bb6a",
    "#4caf50",
    "#43a047",
    "#388e3c",
    "#2e7d32",
    "#1b5e20",
    "#b9f6ca",
    "#69f0ae",
    "#00e676",
    "#00c853",
    "#f1f8e9",
    "#dcedc8",
    "#c5e1a5",
    "#aed581",
    "#9ccc65",
    "#8bc34a",
    "#7cb342",
    "#689f38",
    "#558b2f",
    "#33691e",
    "#ccff90",
    "#b2ff59",
    "#76ff03",
    "#64dd17",
    "#f9fbe7",
    "#f0f4c3",
    "#e6ee9c",
    "#dce775",
    "#d4e157",
    "#cddc39",
    "#c0ca33",
    "#afb42b",
    "#9e9d24",
    "#827717",
    "#f4ff81",
    "#eeff41",
    "#c6ff00",
    "#aeea00",
    "#fffde7",
    "#fff9c4",
    "#fff59d",
    "#fff176",
    "#ffee58",
    "#ffeb3b",
    "#fdd835",
    "#fbc02d",
    "#f9a825",
    "#f57f17",
    "#ffff8d",
    "#ffff00",
    "#ffea00",
    "#ffd600",
    "#fff8e1",
    "#ffecb3",
    "#ffe082",
    "#ffd54f",
    "#ffca28",
    "#ffc107",
    "#ffb300",
    "#ffa000",
    "#ff8f00",
    "#ff6f00",
    "#ffe57f",
    "#ffd740",
    "#ffc400",
    "#ffab00",
    "#fff3e0",
    "#ffe0b2",
    "#ffcc80",
    "#ffb74d",
    "#ffa726",
    "#ff9800",
    "#fb8c00",
    "#f57c00",
    "#ef6c00",
    "#e65100",
    "#ffd180",
    "#ffab40",
    "#ff9100",
    "#ff6d00",
    "#fbe9e7",
    "#ffccbc",
    "#ffab91",
    "#ff8a65",
    "#ff7043",
    "#ff5722",
    "#f4511e",
    "#e64a19",
    "#d84315",
    "#bf360c",
    "#ff9e80",
    "#ff6e40",
    "#ff3d00",
    "#dd2c00",
    "#efebe9",
    "#d7ccc8",
    "#bcaaa4",
    "#a1887f",
    "#8d6e63",
    "#795548",
    "#6d4c41",
    "#5d4037",
    "#4e342e",
    "#3e2723",
    "#fafafa",
    "#f5f5f5",
    "#eeeeee",
    "#e0e0e0",
    "#bdbdbd",
    "#9e9e9e",
    "#757575",
    "#616161",
    "#424242",
    "#212121",
    "#eceff1",
    "#cfd8dc",
    "#b0bec5",
    "#90a4ae",
    "#78909c",
    "#607d8b",
    "#546e7a",
    "#455a64",
    "#37474f",
    "#263238"
];
