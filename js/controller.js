(function() {
    nocModule.controller("SingleCellAutomataCtrl", function(
        $scope,
        $timeout,
        utils,
        colors,
        fullscreenService,
        defaults
    ) {
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
        $scope.ruleKeys = _.keys($scope.rules)
            .sort()
            .reverse();
        $scope.speed = 5;
        $scope.scale = 5;
        $scope.stateY = 0;
        $scope.width = defaults.width;
        $scope.height = defaults.height;
        $scope.colors = colors.slice();
        $scope.backgroundColor = "#00c853";
        $scope.cellColor = "#fffde7";
        $scope.fullscreen = false;
        $scope.isRunning = false;

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
                var key = event.key || "";
                if (key.toLowerCase() === "r") {
                    $scope.run();
                }
                if (key.toLowerCase() === "s") {
                    $scope.stop();
                }
                if (key.toLowerCase() === "n") {
                    $scope.previousBgColor();
                }
                if (key.toLowerCase() === "m") {
                    $scope.nextBgColor();
                }
                if (key.toLowerCase() === "o") {
                    $scope.previousCellColor();
                }
                if (key.toLowerCase() === "p") {
                    $scope.nextCellColor();
                }
                if (key.toLowerCase() === "d") {
                    $scope.downloadImage();
                }
                if (/^\d$/.test(key)) {
                    $scope.toggleRuleByIdx(Number(event.key) - 1);
                }

                //TODO: make buttons bellow trigering on keypressed
                if (key === "ArrowUp") {
                    $scope.speed++;
                }
                if (key === "ArrowDown") {
                    $scope.speed--;
                }
                if (key === "ArrowRight") {
                    $scope.scale++;
                }
                if (key === "ArrowLeft") {
                    $scope.scale--;
                }
            }
        };

        $scope.previousBgColor = function() {
            $scope.backgroundColor = utils.getPrevArrayElement(
                $scope.colors,
                $scope.backgroundColor
            );
        };

        $scope.nextBgColor = function() {
            $scope.backgroundColor = utils.getNextArrayElement(
                $scope.colors,
                $scope.backgroundColor
            );
        };

        $scope.previousCellColor = function() {
            $scope.cellColor = utils.getPrevArrayElement(
                $scope.colors,
                $scope.cellColor
            );
        };

        $scope.nextCellColor = function() {
            $scope.cellColor = utils.getNextArrayElement(
                $scope.colors,
                $scope.cellColor
            );
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
            if (!$scope.isRunning) {
                CanvasHelper.drawRectSample(
                    ctx,
                    $scope.scale,
                    $scope.backgroundColor,
                    $scope.cellColor
                );
            }
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

                var newState = SingleCellAutomata.extendState(
                    automata.getState(),
                    itemsCountX
                );
                automata = new SingleCellAutomata({
                    state: newState,
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
                // first render
                // TODO: fix timeout
                // Timeout needs to wait when width and height will be applied to canvas
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
                $scope.ruleNumber = utils.getRuleNumber($scope.ruleCode);
            },
            true
        );

        $scope.updateRuleFromCode = function() {
            $scope.ruleCode = utils.normalizeRuleCode(
                $scope.ruleCode,
                $scope.ruleKeys.length
            );
            $scope.ruleNumber = utils.getRuleNumber($scope.ruleCode);

            for (var i = 0; i < $scope.ruleKeys.length; i++) {
                $scope.rules[$scope.ruleKeys[i]] = Boolean(
                    Number($scope.ruleCode[i])
                );
            }
        };

        $scope.toggleRule = function(rule) {
            $scope.rules[rule] = !$scope.rules[rule];
        };

        $scope.toggleRuleByIdx = function(idx) {
            if (idx < $scope.ruleKeys.length) {
                $scope.rules[$scope.ruleKeys[idx]] = !$scope.rules[
                    $scope.ruleKeys[idx]
                ];
            }
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
            $scope.isRunning = false;
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
            $scope.isRunning = true;

            function doStep() {
                CanvasHelper.drawState(
                    ctx,
                    automata.getState(),
                    $scope.stateY,
                    $scope.scale,
                    $scope.cellColor,
                    $scope.backgroundColor,
                    $scope.width
                );

                automata.next();
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
            var link = $(".canvas__download-hidden-link")[0];

            utils.downloadCanvasImageFromLink(
                link,
                canvas,
                "cell_automata.png"
            );
        };

        $scope.onDownloadClick = function() {
            var link = $(".canvas__download-link")[0];

            utils.downloadCanvasImageFromLink(
                link,
                canvas,
                "cell_automata.png"
            );
        };

        // TODO: move to directive
        this._initColorDropdowns = function() {
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
        };

        setTimeout(this._initColorDropdowns, 100);

        fullscreenService.subscribe(function(e, fullscreen) {
            $scope.fullscreen = fullscreen;
            if (fullscreen) {
                $scope.width = screen.width;
                $scope.height = screen.height;
                $scope.scale++;
            } else {
                $scope.width = defaults.width;
                $scope.height = defaults.height;
                $scope.scale--;
            }
            CanvasHelper.clearScreen(
                ctx,
                $scope.width,
                $scope.height,
                $scope.backgroundColor
            );
        });
    });
})();
