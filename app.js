(function() {

    angular
        .module('noc', [])
        .controller('SingleCellAutomataCtrl', function($scope) {

            var width = 800,
                height = 600,
                itemsX,
                itemsY,
                backgroundColor = 'white',
                cellColor = 'black';

            var ctx = document.getElementById("canvas").getContext('2d');

            var initState = [];
            var manualModeOn = false;
            $scope.runInProgress = false;

            $('canvas').click(function(e) {
                if (!$scope.manual) return;

                if (!manualModeOn) {
                    $scope.reset();
                    manualModeOn = true;
                    initState = [];
                }

                var p = getMousePos(this, e);

                var ix = p.x / $scope.scale - (p.x % $scope.scale / $scope.scale);

                initState[ix] = 1;

                drawState(initState, 0);

            });

            function getMousePos(canvas, evt) {
                var rect = canvas.getBoundingClientRect();
                return {
                    x: evt.clientX - rect.left,
                    y: evt.clientY - rect.top
                };
            }

            $scope.rule = {
                '000': false,
                '001': true,
                '010': false,
                '011': true,
                '100': true,
                '101': false,
                '110': true,
                '111': false
            };
            $scope.ruleKeys = _.keys($scope.rule).sort();

            $scope.speed = 5;
            $scope.manual = false;
            $scope.scale = 10;

            $scope.$watch('scale', function() {
                itemsX = width / $scope.scale;
                itemsY = height / $scope.scale;

                $scope.reset();
                $scope.run();
            });

            function initializeStateRandom() {
                for (var i = 0; i < itemsX; i++) {
                    initState[i] = Math.random() > 0.9 ? 1 : 0;
                }
            }


            function drawState(state, t) {

                for (var i = 0; i < itemsX; i++) {

                    ctx.strokeStyle = cellColor;
                    ctx.beginPath();
                    ctx.moveTo(0, (t + 1) * $scope.scale);
                    ctx.lineTo(width, (t + 1) * $scope.scale);
                    ctx.stroke();

                    ctx.strokeStyle = backgroundColor;
                    ctx.beginPath();
                    ctx.moveTo(0, (t) * $scope.scale);
                    ctx.lineTo(width, (t) * $scope.scale);
                    ctx.stroke();


                    if (state[i] === 1) {
                        ctx.fillStyle = cellColor;
                        ctx.fillRect(i * $scope.scale, t * $scope.scale, $scope.scale - 1, $scope.scale - 1);
                    } else {

                    }
                }
            }

            function applyRule(state, rule) {
                var newState = [];

                for (var i = 0; i < itemsX; i++) {
                    var prev = state[i - 1] ? 1 : 0;
                    var next = state[i + 1] ? 1 : 0;

                    var pattern = prev + '' + state[i] + '' + next;
                    newState[i] = rule[pattern] ? 1 : 0;
                }

                return newState;
            }


            var runTimeoutId = null;

            $scope.reset = function() {
                console.log('Reset');
                manualModeOn = false;
                $scope.runInProgress = false;
                initState = [];
                if (!$scope.manual)
                    initializeStateRandom();

                clearTimeout(runTimeoutId);
                ctx.rect(0, 0, width, height);
                ctx.fillStyle = backgroundColor;
                ctx.fill();
            };

            $scope.stop = function() {
                $scope.runInProgress = false;
                clearTimeout(runTimeoutId);
            };

            $scope.run = function() {
                if ($scope.runInProgress) {
                    $scope.reset();
                }
                $scope.runInProgress = true;
                console.log('Run');
                manualModeOn = false;

                drawState(initState, 0);
                var prevState = initState;

                var t = 1;
                runTimeoutId = setTimeout(function doStep() {
                    var state = applyRule(prevState, $scope.rule);
                    // console.log(t, state);
                    drawState(state, t);
                    prevState = state;
                    t++;

                    if (t > itemsY) {
                        $scope.reset();
                        t = 1;
                    }

                    runTimeoutId = setTimeout(doStep, 1000 / $scope.speed)
                }, 1000 / $scope.speed);
            }

            $scope.reset();

        });

}());