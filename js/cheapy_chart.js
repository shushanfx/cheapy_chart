(function($){
    var DEFAULT_OPTIONS = {
        animation: {
            enable: true,
            time: 1000
        },
        title:{
            position: "left",
            x: 33,
            y: 10,
            show: true,
            name: "Cheapy Chart",
            font: {
                weight: "bold"
            }
        },
        legend: {
            show: false,
            position: "right",
            x: 10,
            y: 10,
            textStyle: {
                size: 12,
                weight: "bold"
            }
        },
        tooltip: {
            show: true,
            lineStyle: {
                color: '#48b',
                width: 1,
                type: 'solid'
            },
            formatter: function(){
                return "Hello Cheaphy!";
            },
            position: function(arr){
                return arr;
            }
        },
        xAxis: {
            show: true,
            name: "x轴",
            boundaryGap: [0.02,0.02],
            axisLabel:{
                show: true,
                formatter: function(value){
                    return value;
                },
                x: 0,
                y: 5,
                textStyle: {
                    fontSize: 12
                }
            },
            axisLine: {
                show: true,
                onZero: true,
                position: "bottom",
                lineStyle: {
                    color: '#48b',
                    width: 1,
                    type: 'solid'
                }
            },
            splitLine: {
                show: true,
                first: false,
                last: false,
                count: 4,
                lineStyle:{
                    color: ['#ccc'],
                    width: 1,
                    type: 'solid'
                }
            }
        },
        yAxis: {
            show: true,
            name: "y轴",
            boundaryGap: [0.02,0.02],
            axisLabel:{
                show: true,
                position: "right",
                x: -25,
                y: 8,
                formatter: function(value, index, list){
                    if(index === 0 || index === list.length - 1){
                        return null;
                    }
                    return value;
                },
                textStyle: {
                    size: 12
                }
            },
            axisLine: {
                show: true,
                onZero: true,
                position: "left",
                lineStyle: {
                    color: '#48b',
                    width: 2,
                    type: 'solid'
                }
            },
            splitLine: {
                show: true,
                count: 4,
                first: false,
                last: false,
                lineStyle: {
                    color: '#ccc',
                    width: 1,
                    type: 'solid'
                }
            },
            data: []
        },
        position: {
            x: 30,
            y: 30,
            x2: 30,
            y2: 20
        },
        font: {
            size: 12,
            family: "Times New Roman",
            weight: "normal"
        },
        base:{
            upColor: "#c12e34",
            downColor: "#68a54a",
            backgroundColor: "#fff",
            color: "#000",
            markStyle: {
                width: 2,
                color: "#48b"
            }
        }
    };

    var CheapyChart = function(options){
        var op = $.extend(true, {}, DEFAULT_OPTIONS, options);
        var $el = null;
        this.state = CheapyChart.STATE_CREATE;
        this.ticker = null;
        this.el = op.el;
        this.width = 0;
        this.height = 0;
        this.options = op;
        this.tickList = [];
        $el = $(this.el);

        if($el.length > 0){
            this.width = $el.width();
            this.height = $el.height();
        }
        if(!this.width || !this.height){
            console.error("Width or height is required");
            return ;
        }
    };
    CheapyChart.STATE_CREATE = 1;
    CheapyChart.STATE_READY = 2;
    CheapyChart.STATE_RENDING = 4;
    CheapyChart.STATE_COMPLETE = 8;

    CheapyChart.prototype.render = function(){
        this.initCanvas();
        this.initSeries();
        this._clear();
        this.renderTitle();
        this.renderAxis();
        this.renderSeries();
        this._bindEvent();
        this._startTick();
    };
    CheapyChart.prototype.renderAgain = function(beforeRender){
        this._clear();
        this.renderTitle();
        this.renderAxis();
        this.renderSeries();
        beforeRender && beforeRender();
        this._startTick(true);
    };

    CheapyChart.prototype.initCanvas = function(){
        var width = this.width,
            height = this.height,
            $el = $(this.el);
        var html = [];
        html.push('<canvas width="', width * 2, '" height="', height * 2, '" style="width:');
        html.push(width, 'px;height:', height, 'px;"></canvas>');
        $el.html(html.join(""));
        this.canvas = $el.children("canvas").get(0);
        this.context = this.canvas.getContext("2d");
        this.context.scale(2, 2);
    };
    CheapyChart.prototype.initSeries = function(){
        var list = this.options.series;
        var options = this.options;
        var i, item, type;
        var minValueList = [], maxValueList = [];
        for(i = 0; i < list.length; i++){
            item = list[i];
            type = item.type;
            if((typeof(item.show) === "undefined" || item.show) && type && item.data){
                item.instance = CheapyChart.newType(type, this, item);
                if(item.instance){
                    minValueList.push(item.instance.minValue());
                    maxValueList.push(item.instance.maxValue());
                }
            }
        }
        this.maxValue = Math.max.apply(Array, maxValueList);
        this.minValue = Math.min.apply(Array, minValueList);
        if(options.yAxis.axisLine.onZero){
            if(this.maxValue * this.minValue < 0){
                item = Math.max(this.maxValue, Math.abs(this.minValue));
                this.maxValue = item;
                this.minValue = 0 - item;
                item = options.yAxis.splitLine.count;
                if(item % 2 === 0){

                }
            }
        }
    };
    CheapyChart.prototype.renderTitle = function(){
        var title = this.options.title,
            context = this.context,
            me = this;
        var newX;
        if(context && title && title.show){
            if(title.position === "right"){
                newX = me.width - title.x - me._measureText(title.name, title.textStyle).width;
            }
            this._registerTick(function(){
                me._drawText(title.x, title.y, title.name, title, title.textStyle);
            });
        }
    };
    CheapyChart.prototype.renderAxis = function(){
        var options = this.options,
            x = options.position.x,
            y = options.position.y,
            x2 = options.position.x2,
            y2 = options.position.y2,
            width = this.width,
            height = this.height;
        var me = this, i, curSize = 10,
            curXPace = (width - x - x2) / curSize,
            curYPace = (height - y - y2) / curSize;
        var xPosition = options.xAxis.axisLine.position,
            yPosition = options.yAxis.axisLine.position;
        var generateLineArray = function(type){
            var count = options[type + "Axis"].splitLine.count,
                lineStart, lineStep, linePace,
                gap1 = 0, gap2 = 0, i;
            var arr = [];
            var realCount = null, temp, realSpace;
            if(typeof(options[type + "Axis"].boundaryGap) === "object"){
                gap1 = options[type + "Axis"].boundaryGap[0] || 0;
                gap2 = options[type + "Axis"].boundaryGap[1] || 0;
                gap1 = parseInt(gap1 * 100, 10);
                gap2 = parseInt(gap2 * 100, 10);
            }
            if(type === "x"){
                realCount = options.xAxis.data.length - 1;
                lineStep = (width - x - x2) / 100;
                linePace = lineStep * (100 - gap1 - gap2) / realCount;
                lineStart = x + lineStep * gap1;
                me.xLineStart = lineStart;
                me.xLineEnd = lineStart + lineStep * (100 - gap1 - gap2);
                me.xLineStep = lineStep;
                me.xStepCount = (100 - gap1 - gap2);
                temp = realCount / count - Math.floor(realCount % count);
                realSpace = Math.ceil(realCount / count);
                if(temp > 0 && temp < 0.25){
                    count = count - 1;
                }
                for(i = 0; i <= count; i++){
                    if(i === count){
                        arr.push(me.xLineEnd);
                    }
                    else{
                        arr.push(lineStart + (linePace * i * realSpace));
                    }
                }
            }
            else{
                if(me.minValue === me.maxValue){
                    count = 2;
                }
                lineStep = (height - y - y2) / 100;
                linePace = lineStep * (100 - gap1 - gap2) / count;
                lineStart = height - y2 - (lineStep * gap2);
                me.yLineStart = lineStart;
                me.yLineEnd = lineStart + lineStep * (100 - gap1 - gap2);
                me.yLineStep = lineStep;
                me.yStepCount = (100 - gap1 - gap2);
                for(i = 0; i <= count; i++){
                    arr.push(lineStart - (linePace * i));
                }
            }
            return arr;
        };

        var xAxisCount, xAxisPace;

        this.xLineArray = generateLineArray("x");
        this.yLineArray = generateLineArray("y");
        for(i = 0; i < curSize; i++){
            (function(i){
                me._registerTick(function(){
                    options.xAxis.axisLine.show && (xPosition === "both" || xPosition === "bottom") && me._drawLine(x +  i * curXPace, height - y2, x + (i + 1) * curXPace, height - y2, options.xAxis.axisLine.lineStyle);
                    options.yAxis.axisLine.show && (yPosition === "both" || yPosition === "left") &&  me._drawLine(x, (height - y2) - i * curYPace, x, (height - y2) - (i + 1) * curYPace, options.yAxis.axisLine.lineStyle);
                    options.xAxis.axisLine.show && (xPosition === "both" || xPosition === "top") &&  me._drawLine(x +  i * curXPace, y, x + (i + 1) * curXPace, y, options.xAxis.axisLine.lineStyle);
                    options.yAxis.axisLine.show && (yPosition === "both" || yPosition === "right") && me._drawLine(width - x2, (height - y2) - i * curYPace, width - x2, (height - y2) - (i + 1) * curYPace, options.yAxis.axisLine.lineStyle);
                    if(options.xAxis.splitLine.show){
                        $.each(me.xLineArray, function(index, item){
                            if(index === 0 && !options.xAxis.splitLine.first){
                                return true;
                            }
                            if(index === me.xLineArray.length - 1 && !options.xAxis.splitLine.last){
                                return true;
                            }
                            me._drawLine(item, (height - y2) - i * curYPace, item, (height - y2) - (i + 1) * curYPace, options.xAxis.splitLine.lineStyle);
                        });
                    }
                    if(options.yAxis.splitLine.show){
                        $.each(me.yLineArray, function(index, item){
                            if(index === 0 && !options.yAxis.splitLine.first){
                                return true;
                            }
                            if(index === me.yLineArray.length - 1 && !options.yAxis.splitLine.last){
                                return true;
                            }
                            me._drawLine(x +  i * curXPace, item, x + (i + 1) * curXPace, item, options.yAxis.splitLine.lineStyle);
                        });
                    }
                });
            })(i);
        }
        // render x Label
        if(options.xAxis.axisLabel.show){
            xAxisCount = options.xAxis.splitLine.count;
            xAxisPace = Math.floor(options.xAxis.data.length / xAxisCount);
            $.each(me.xLineArray, function(index, item){
                var newX = item, value = null, myWidth;
                var myIndex = xAxisPace * index;
                var myObj = null;
                if(index === me.xLineArray.length - 1){
                    myIndex = options.xAxis.data.length - 1;
                }
                value = options.xAxis.data[myIndex];
                value = options.xAxis.axisLabel.formatter.call(me, value, index, me.xLineArray);
                if(value){
                    myObj = me._measureText(value, options.xAxis.axisLabel.textStyle);
                    myWidth = myObj.width;
                    if(index === 0){
                        // do nothing
                        newX = Math.max(x, newX - myWidth / 2);
                    }
                    else if(index === me.xLineArray.length - 1){
                        newX = Math.min(newX + myWidth / 2, width - x2) - myWidth;
                    }
                    else{
                        newX = newX - myWidth / 2;
                    }
                    me._registerTick(function(){
                        me._drawText(newX + options.xAxis.axisLabel.x, height - options.xAxis.axisLabel.y - myObj.height, value, options.xAxis.axisLabel.textStyle);
                    });
                }
            });
        }
        // render y label
        if(options.yAxis.axisLabel.show){
            $.each(me.yLineArray, function(index, item){
                var newValue = (height - y2) - item;
                var newX, newY=null;
                newValue = ((me.maxValue - me.minValue) * newValue / (me.height - y2 - y) + me.minValue).toFixed(2);
                newValue = options.yAxis.axisLabel.formatter.call(me, newValue, index, me.yLineArray);
                if(newValue){
                    if(options.yAxis.axisLabel.position === "left"){
                        newX = x + options.yAxis.axisLabel.x;
                    }
                    else{
                        newX = width - x2 - options.yAxis.axisLabel.x - me._measureText(newValue, options.yAxis.axisLabel.textStyle).width;
                    }
                    newY = item - options.yAxis.axisLabel.y;
                }
                newValue && me._registerTick(function(){
                    me._drawText(newX, newY, newValue, options.yAxis.axisLabel.textStyle);
                });
            });
        }
    };
    CheapyChart.prototype.renderSeries = function(){
        var list = this.options.series;
        var options = this.options;
        var i, item, me = this;
        var legendWidth = 0;
        if(options.legend.show){
            if(options.legend.position == "left"){
                legendWidth += options.legend.x;
            }
            else{
                legendWidth += options.legend.x;
            }
        }
        for(i = 0; i < list.length; i++){
            item = list[i];
            if(item.instance){
                item.instance.render();
                if(options.legend.show){
                    if(options.legend.position === "left"){
                        item.instance.renderLegend(legendWidth);
                        legendWidth += (me._measureText(item.name, options.legend.textStyle).width + 3 + 12 + 3);
                    }
                    else{
                        legendWidth += (me._measureText(item.name, options.legend.textStyle).width + 3 + 12 + 3);
                        item.instance.renderLegend(me.width - legendWidth);
                    }
                }
            }
        }
    };
    CheapyChart.prototype._registerTick = function(callback){
        this.tickList.push(callback);
    };
    CheapyChart.prototype._startTick = function(closeAnimation){
        var option = this.options,
            animation = option.animation,
            list = this.tickList,
            size = list.length,
            iCount = 0, me = this,
            step = 1,
            recursiveFunction = function(){
                var start = Math.floor(iCount * step), end = Math.floor((iCount + 1) * step);
                for(var i= start; i < end; i++){
                    i < size && list[i]();
                }
                iCount ++;
                if(end >= size){
                    me._stopTick();
                }
                else{
                    this.ticker = me._nextTick(recursiveFunction, speed);
                }
            },
            time, speed;

        if(size === 0){
            return ;
        }
        // Sogou浏览器关闭动画效果
        if(/SogouMobileBrowser/gi.exec(navigator.userAgent)){
            animation.enable = false;
        }

        if(animation.enable){
            time = animation.time;
            speed = time / size;
            step = size / 60 / (time / 1000);
        }
        if(!closeAnimation && animation.enable){
            recursiveFunction();
        }
        else{
            $.each(list, function(){
                this();
            });
        }
    };
    CheapyChart.prototype._stopTick = function(){
        var method = window.cancelAnimationFrame || window.clearTimeout;
        if(this.ticker){
            method(this.ticker);
            this.ticker = null;
        }
    };
    CheapyChart.prototype._nextTick = function(callback, timeout){
        var method = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
        if(method){
            return method(callback);
        }
        else{
            return setTimeout(callback, timeout);
        }
    };
    CheapyChart.prototype._bindEvent = function(){
        var canvas = this.canvas, me = this;
        if(canvas){
            $(canvas).on("touchstart", function(e){
                var pos = me.getPixFromEvent(e);
                me.startPageX = e.touches[0].pageX;
                me.startPageY = e.touches[0].pageY;
                me.currentPageX = null;
                me.currentPageY = null;
                me._showToolTip(pos, e);
            }).on("touchmove", function(e){
                var pos = me.getPixFromEvent(e);
                me.currentPageX = e.touches[0].pageX;
                me.currentPageY = e.touches[0].pageY;
                me._showToolTip(pos, e);
            }).on("touchend", function(){
                me._hideToolTip();
            }).on("touchcancel", function(e){
                me._hideToolTip();
            });
        }
    };
    CheapyChart.prototype.getPixFromValue = function(index, value){
        var xDataCount = this.options.xAxis.data.length - 1;
        var xPos = index / xDataCount * this.xStepCount * this.xLineStep + this.xLineStart;
        var yPos = null;
        if(this.minValue === this.maxValue){
            return [xPos, this.yLineStart - Math.abs((this. yLineStart - this.yLineEnd) / 2)];
        }
        if(value <= this.minValue){
            value = this.minValue;
        }
        else if(value >= this.maxValue){
            value = this.maxValue;
        }
        yPos =  this.yLineStart - (value - this.minValue) / (this.maxValue - this.minValue) * this.yStepCount * this.yLineStep;
        return [xPos, yPos];
    };
    CheapyChart.prototype.getPixFromEvent = function(event){
        var canvas = this.canvas, touch = event.touches[0];
        var offset = $(canvas).offset();
        return [touch.clientX - offset.left, touch.clientY - offset.top];
    };
    CheapyChart.prototype._clear = function(){
        this.tickList.length = 0;
        this.tickList = [];
        this._stopTick();
        this._cleanRect(0, 0, this.width, this.height);
    };
    CheapyChart.prototype._cleanRect = function(x, y, w, h){
        var ctx = this.context;
        ctx.clearRect(x, y, w, h);
        ctx.restore();
    };
    CheapyChart.prototype._drawText = function(x, y, text, other){
        var context = this.context, options = this.options;
        var fontStyle = $.extend({}, options.font, {color: options.base.color}, other);
        context.font = [fontStyle.size + "px", fontStyle.family, fontStyle.weight].join(" ");
        context.fillStyle = fontStyle.color;
        context.fillText(text, x, y + fontStyle.size);
        context.fill();
    };

    CheapyChart.prototype._measureText = function(text, other){
        var context = this.context, options = this.options;
        var fontStyle = $.extend({}, options.font, {color: options.base.color}, other);
        context.font = [fontStyle.size + "px", fontStyle.family, fontStyle.weight].join(" ");
        return {width: context.measureText(text).width, height: fontStyle.size};
    };

    CheapyChart.prototype._drawLine = function(x, y, x2, y2, other){
        var ctx = this.context,
            type = other.type,
            dashArray = [5, 8, 5];
        if(type === "dot"){
            ctx.beginPath();
            ctx.strokeStyle = other.color;
            ctx.lineWidth = other.width;
            var dashCount = dashArray.length;
            ctx.moveTo(x, y);
            var dx = (x2 - x), dy = (y2 - y);
            var slope = dy / dx;
            var distRemaining = Math.sqrt(dx * dx + dy * dy);
            var dashIndex = 0, draw = true;
            while (distRemaining >= 0.1 && dashIndex < 10000) {
                var dashLength = dashArray[dashIndex++ % dashCount];
                if (dashLength === 0) {dashLength = 0.001;} // Hack for Safari
                if (dashLength > distRemaining) {dashLength = distRemaining;}
                var xStep = Math.sqrt(dashLength * dashLength / (1 + slope * slope));
                x += xStep;
                y += slope * xStep;
                ctx[draw ? 'lineTo' : 'moveTo'](x, y);
                distRemaining -= dashLength;
                draw = !draw;
            }
            ctx.stroke();
            ctx.closePath();
        }
        else{
            ctx.beginPath();
            ctx.strokeStyle = other.color;
            ctx.lineWidth = other.width;
            ctx.moveTo(x, y);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.closePath();
        }
    };
    CheapyChart.prototype._drawSLine = function(x, y, x2, y2, other){
        var ctx = this.context,
            type = other.type,
            dashArray = [10, 5, 5];
        if(type === "dot"){
            ctx.beginPath();
            ctx.strokeStyle = other.color;
            ctx.lineWidth = other.width;
            var dashCount = dashArray.length;
            ctx.moveTo(x, y);
            var dx = (x2 - x), dy = (y2 - y);
            var slope = dy / dx;
            var distRemaining = Math.sqrt(dx * dx + dy * dy);
            var dashIndex = 0, draw = true;
            while (distRemaining >= 0.1 && dashIndex < 10000) {
                var dashLength = dashArray[dashIndex++ % dashCount];
                if (dashLength === 0) {dashLength = 0.001;} // Hack for Safari
                if (dashLength > distRemaining) {dashLength = distRemaining;}
                var xStep = Math.sqrt(dashLength * dashLength / (1 + slope * slope));
                x += xStep;
                y += slope * xStep;
                ctx[draw ? 'lineTo' : 'moveTo'](x, y);
                distRemaining -= dashLength;
                draw = !draw;
            }
            ctx.stroke();
            ctx.closePath();
        }
        else{
            ctx.beginPath();
            ctx.strokeStyle = other.color;
            ctx.lineWidth = other.width;
            ctx.moveTo(x, y);
            ctx.stroke();
            ctx.closePath();
        }
    };
    CheapyChart.prototype._drawCircle = function(x, y, other){
        var ctx = this.context;
        ctx.beginPath();
        ctx.fillStyle= other.color;
        ctx.arc( x, y, other.width,0,Math.PI*2,true);

        ctx.fill();
        ctx.closePath();
    };
    CheapyChart.prototype._drawRect = function(x, y, x2, y2, other) {
        var startX, startY, width, height, ctx = this.context;
        startX = x < x2 ? x : x2;
        startY = y < y2 ? y : y2;
        width = Math.abs(x2 - x);
        height = Math.abs(y2 - y);
        ctx.beginPath();
        ctx.fillStyle = other.color;
        ctx.fillRect(startX, startY, width, height);
        ctx.fill();
        ctx.closePath();
    };
    CheapyChart.prototype._showToolTip = function(pos, e){
        var $el = $(this.el),
            $tooltip = $el.children(".tooltip"),
            $toolline = $el.children(".toolline"),
            tooltip = this.options.tooltip,
            arr = null, isTarget = false, me = this;
        var options = this.options,
            h = this.height,
            y = options.position.y,
            y2 = options.position.y2;

        var calcDelta = function(){
            if(me.startPageX > 0 && me.currentPageX > 0){
                var deltaX = Math.abs(me.startPageX - me.currentPageX);
                var deltaY = Math.abs(me.startPageY - me.currentPageY);
                if(deltaY > deltaX){
                    return false;
                }
                return true;
            }
            return false;
        };

        if(tooltip && tooltip.show){
            if($tooltip.length === 0){
                $tooltip = $('<div class="tooltip" style="position:absolute;left: 0px; top:0px;"></div>');
                $el.append($tooltip);
                $toolline = $('<div class="toolline" style="border: none; border-right: solid red 1px;position: absolute; left:0px; top: ' + y + 'px; height: ' + (h - y - y2) + 'px; display:block;background-color:none;"></div>');
                $el.append($toolline);
            }
            arr = [];
            $.each(this.options.series, function(index, item){
                if(item.instance){
                    var temp = item.instance.getValueByPix(pos[0], pos[1]);
                    if(temp){
                        arr.push(temp);
                    }
                }
            });
            if(arr.length > 0){
                isTarget = true;
            }
        }
        if(isTarget){
            var str = tooltip.formatter.call($tooltip.get(0), arr);
            $tooltip.html(str).css({left: 0, top: 0});
            $tooltip.show();
            var newPos = tooltip.position.call($tooltip.get(0), arr[0].pos);
            $tooltip.css({
                left: newPos[0],
                top: newPos[1]
            });
            $toolline.css({
                "width" : arr[0].pos[0] + "px",
                "border-right-style" : tooltip.lineStyle.type,
                "border-right-color" : tooltip.lineStyle.color,
                "border-right-width" : tooltip.lineStyle.width + "px"
            }).show();

            calcDelta() && e && e.preventDefault();
        }
        else{
            $tooltip.hide();
            $toolline.hide();
        }
    };
    CheapyChart.prototype._hideToolTip = function(){
        var $el = $(this.el);
        this.renderAgain();
        $el.children(".tooltip").hide();
        $el.children(".toolline").hide();
    };

    CheapyChart.registerType = function(type, ext){
        var map = this.TYPES, fun;
        if(!map){
            this.TYPES = map = {};
        }
        fun = function(){
            BaseType.apply(this, arguments);
        };
        fun.prototype = $.extend({}, BaseType.prototype, ext);
        map[type] = fun;
    };
    CheapyChart.newType = function(type, chart, options){
        var Cls = this.TYPES[type];
        if(Cls){
            return new Cls(chart, options);
        }
        return null;
    };


    var BaseType = function(chart, options){
        this.chart = chart;
        this.options = options;
        this.init();
    };
    BaseType.prototype = {
        minValue : function(){
            return Math.min.apply(Array, this.options.data);
        },
        maxValue: function(){
            return Math.max.apply(Array, this.options.data);
        },
        init: function(){

        },
        render: function(){

        },
        getValueByPix: function(x, y){
            var chart = this.chart,
                options = this.options,
                count = this.chart.options.xAxis.data.length - 1;
            var xIndex = null;
            var value = null;
            if(count === 0){
                xIndex = 0;
            }
            else{
                xIndex = (x - chart.xLineStart) / (chart.xLineEnd - chart.xLineStart) * count;
            }
            if(xIndex >= 0 && xIndex < count + 1){
                xIndex = Math.round(xIndex);
                value = this.options.data[xIndex];
                if(typeof(value)!=="undefined"){
                    return {
                        name: chart.options.xAxis.data[xIndex],
                        seriesName: options.name,
                        type: options.type,
                        pos: chart.getPixFromValue(xIndex, value),
                        value: value,
                        index: xIndex
                    };
                }
            }
            return null;
        },
        renderMarkLine: function(){
            var options = this.options, me = this;
            if(options.markLine && $.isArray(options.markLine)){
                $.each(options.markLine, function(index, item){
                    me._renderMarkLine(item);
                });
            }
        },
        _renderMarkLine: function(lineOptions){
            var type, value,
                pos, lineStyle, fontStyle, textLength,
                chart = this.chart,
                options = this.options;
            var newX = 0, newY = 0;
            if(lineOptions){
                type = lineOptions.type || "value";
                value = 0;
                if(type === "min"){
                    value = this.minValue();
                }
                else if(type === "max"){
                    value = this.maxValue();
                }
                else if(type === "average"){
                    value = getAverage(this.options.data);
                }
                else if(type === "value"){
                    value = lineOptions.value;
                }
                lineStyle = $.extend({}, chart.options.base, options.lineStyle, lineOptions.lineStyle);
                fontStyle = $.extend({}, chart.options.base.font, lineOptions.textStyle);
                pos = chart.getPixFromValue(0, value);
                textLength = chart._measureText(value, fontStyle);
                chart._registerTick(function(){
                    var newValue = value;
                    chart._drawLine(chart.options.position.x, pos[1], chart.width - chart.options.position.x2, pos[1], lineStyle);
                    if(lineOptions.formatter){
                        newValue = lineOptions.formatter.call(chart, newValue);
                    }
                    if(lineOptions.x > 0){
                        newX = lineOptions.x;
                    }
                    if(lineOptions.y > 0){
                        newY = lineOptions.y;
                    }
                    if(pos[1] - newY < chart.options.position.y){
                        newY = newY - textLength.height - 4;
                    }
                    else if(pos[1] - newY + textLength.height > chart.height - chart.options.position.y2){
                        newY = newY + textLength.height + 4;
                    }
                    if(newValue){
                        chart._drawText(chart.options.position.x + newX, pos[1] - newY, newValue, fontStyle);
                    }
                });
            }
        },
        renderLegend: function(){

        }
    };

    CheapyChart.registerType("line", {
        render: function(){
            var chart = this.chart,
                options = this.options;
            var lineStyle = $.extend({}, chart.options.base, options.lineStyle);
            var other = $.extend({}, chart.options.base.markStyle, options.markStyle);
            $.each(options.data, function(index){
                if(index !== options.data.length - 1){
                    var pos1 = chart.getPixFromValue(index, options.data[index]),
                        pos2 = chart.getPixFromValue(index + 1, options.data[index + 1]);
                    chart._registerTick(function(){
                        chart._drawLine(pos1[0], pos1[1], pos2[0], pos2[1], lineStyle);
                        if(options.data.length < 10){
                            chart._drawCircle(pos1[0], pos1[1], other);
                            chart._drawCircle(pos2[0], pos2[1], other);
                        }
                    });
                }
            });
            this.renderMarkLine();
        },
        renderLegend: function(startX){
            var options = this.options,
                chart = this.chart;
            var name = options.name;
            var lineStyle = $.extend({}, chart.options.base, options.lineStyle);
            //var textWidth = chart._measureText(name, chart.options.legend.textStyle).width;
            chart._registerTick(function(){
                chart._drawLine(startX, chart.options.legend.y + chart.options.legend.textStyle.size / 2,
                        startX + 12, chart.options.legend.y + chart.options.legend.textStyle.size / 2, lineStyle);
                chart._drawText(startX + 15, chart.options.legend.y, name, chart.options.legend.textStyle);
            });
        }
    });
    CheapyChart.registerType("bar", {
        render: function(){
            var chart = this.chart,
                options = this.options;
            var lineStyle = $.extend({}, chart.options.base, options.lineStyle);
            $.each(options.data, function(index){
                if(index < options.data.length){
                    var pos1 = chart.getPixFromValue(index, options.data[index]);
                    var pos2 = chart.getPixFromValue(index, 0);
                    var width = chart.xLineStep * 5 / 7 * chart.xStepCount / chart.options.xAxis.data.length;
                    var pos3 = [pos1[0] - width / 2, pos1[1]];
                    var pos4 = [pos2[0] + width / 2, pos2[1]];
                    chart._registerTick(function(){
                        chart._drawRect(pos3[0], pos3[1], pos4[0], pos4[1], lineStyle);
                    });
                }
            });
            this.renderMarkLine();
        },
        renderLegend: function(startX){
            var options = this.options,
                chart = this.chart;
            var name = options.name;
            var lineStyle = $.extend({}, chart.options.base, options.lineStyle);
            chart._registerTick(function(){
                chart._drawRect(startX, chart.options.legend.y,
                        startX + 12, chart.options.legend.y + chart.options.legend.textStyle.size, lineStyle);
                chart._drawText(startX + 12 + 3, chart.options.legend.y, name, chart.options.legend.textStyle);
            });
        }
    });
    CheapyChart.registerType("kline", {
        maxValue: function(){
            var arr = [], options = this.options;
            $.each(options.data, function(index, item){
                if(item && item.length >= 4){
                    arr.push(item[3]);
                }
            });
            return Math.max.apply(Math, arr);
        },
        minValue: function(){
            var arr = [], options = this.options;
            $.each(options.data, function(index, item){
                if(item && item.length >= 4){
                    arr.push(item[2]);
                }
            });
            return Math.min.apply(Math, arr);
        },
        render: function(){
            var chart = this.chart,
                options = this.options;
            var lineStyle = $.extend({}, chart.options.base, options.lineStyle);
            var upColor = lineStyle.upColor,
                downColor = lineStyle.downColor;
            $.each(options.data, function(index){
                var pos1 = chart.getPixFromValue(index, options.data[index][0]);
                var pos2 = chart.getPixFromValue(index, options.data[index][1]);
                var width = chart.xLineStep * 5 / 7 * chart.xStepCount / chart.options.xAxis.data.length;
                var pos3 = [pos1[0] - width / 2, pos1[1] - 1];
                var pos4 = [pos2[0] + width / 2, pos2[1] + 1];
                var pos5 = chart.getPixFromValue(index, options.data[index][2]);
                var pos6 = chart.getPixFromValue(index, options.data[index][3]);
                var color = options.data[index][0] > options.data[index][1] ? downColor : upColor;
                chart._registerTick(function(){
                    var tempObject = $.extend({}, lineStyle, {color: color});
                    chart._drawRect(pos3[0], pos3[1], pos4[0], pos4[1], tempObject);
                    chart._drawLine(pos5[0], pos5[1] + 1, pos6[0], pos6[1] - 1, tempObject);
                });
            });
            this.renderMarkLine();
        }
    });

    function getAverage(list){
        var sum = 0, size = 0;
        if(list && list.length > 0){
            size = list.length;
            $.each(list, function(index, item){
                sum += item;
            });
            sum = sum / size;
        }
        return sum;
    }

    window.CheapyChart = CheapyChart;
})(window.jQuery || window.Zepto);
