(function() {
    nocModule.service("utils", function() {
        this.normalizeRuleCode = function(ruleCode, length) {
            var strRuleCode = ruleCode.toString();

            if (/^[01]+$/.test(strRuleCode)) {
                return strRuleCode.slice(0, length).padStart(length, "0");
            } else if (/^#[\d]+$/.test(strRuleCode)) {
                var number = parseInt(strRuleCode.slice(1)) || 0;
                number = Math.min(Math.max(0, number), 255);
                return number
                    .toString(2)
                    .slice(0, length)
                    .padStart(length, "0");
            }

            return "0".padStart(length, "0");
        };

        this.getRuleNumber = function(ruleCode) {
            return parseInt(ruleCode, 2);
        };

        this.downloadCanvasImageFromLink = function(link, canvas, name) {
            link.setAttribute("download", name);
            link.setAttribute(
                "href",
                canvas
                    .toDataURL("image/png")
                    .replace("image/png", "image/octet-stream")
            );
            link.click();
        };

        this.getByFlexibleIndex = function(array, index) {
            if (index < 0) {
                return array[array.length + (index % array.length)];
            }
            if (index >= array.length) {
                return array[index % array.length];
            }
            return array[index];
        };

        this.getNextArrayElement = function(array, element) {
            var idx = array.indexOf(element);

            if (idx === -1) return undefined;
            return this.getByFlexibleIndex(array, idx + 1);
        };
        this.getPrevArrayElement = function(array, element) {
            var idx = array.indexOf(element);

            if (idx === -1) return undefined;
            return this.getByFlexibleIndex(array, idx - 1);
        };
    });

    nocModule.service("fullscreenService", function($rootScope) {
        var self = this;
        var scope = $rootScope.$new(true);
        var fullscreen = false;

        this.subscribe = function(func) {
            scope.$on("fullscreen", func);
            if (fullscreen) {
                func({}, fullscreen);
            }
        };

        this._checkFullscreen = function() {
            if (!fullscreen && screen.width === window.innerWidth) {
                fullscreen = true;
                scope.$emit("fullscreen", fullscreen);
            } else if (fullscreen && screen.width !== window.innerWidth) {
                fullscreen = false;
                scope.$emit("fullscreen", fullscreen);
            }
        };
        this._checkFullscreen();
        window.addEventListener("resize", function() {
            self._checkFullscreen();
            $rootScope.$apply();
        });
    });
})();
