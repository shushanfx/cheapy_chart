(function($){
    var DEFAULT_OPTIONS = {
        animation: {
            enable: true,
            time: 1000
        },
        title:{
            x: 50,
            y: 10,
            show: true,
            name: "Cheapy Chart",
            font: {
                weight: "bold"
            }
        },
        tooltip: {
            show: true,
            formatter: function(param){

            },
            position: function(arr){
                return arr;
            }
        },
        xAxis: {
            show: true,
            name: "x轴",
            boundaryGap: [.02,.02],
            axisLabel:{
                show: true,
                position: "outside"
            },
            axisTick:{

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
            boundaryGap: [.02,.02],
            axisLabel:{
                show: true,
                position: "inside"
            },
            axisTick:{

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
                lineStyle: {
                    color: ['#ccc'],
                    width: 1,
                    type: 'solid'
                }
            },
            data: []
        },
        position: {
            x: 30,
            y: 30,
            x2: 20,
            y2: 20
        },
        font: {
            size: 12,
            family: "Times New Roman",
            weight: "normal"
        },
        base:{
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
        this.renderTitle();
        this.renderAxis();
        this.renderSeries();
        this.renderOther();
        this._bindEvent();
        this._startTick();
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
        var minValueList = [], maxValueList = [], me = this;
        for(i = 0; i < list.length; i++){
            item = list[i];
            type = item.type;
            if(type && item.data){
                item.instance = CheapyChart.newType(type, this, item);
                if(item.instance){
                    minValueList.push(item.instance.minValue());
                    maxValueList.push(item.instance.maxValue());
                }
            }
        }
        this.maxValue = Math.max.apply(Array, maxValueList);
        this.minValue = Math.min.apply(Array, minValueList);
    };
    CheapyChart.prototype.renderTitle = function(){
        var title = this.options.title, context = this.context, me = this;
        if(context && title && title.show){
            this._registerTick(function(){
                me._drawText(title.x, title.y, title.name, title);
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
                gap1 = 0, gap2 = 0, totalGap;
            var arr = [];
            if(typeof(options[type + "Axis"].boundaryGap) === "object"){
                gap1 = options[type + "Axis"].boundaryGap[0] || 0;
                gap2 = options[type + "Axis"].boundaryGap[1] || 0;
                gap1 = parseInt(gap1 * 100, 10);
                gap2 = parseInt(gap2 * 100, 10);
            }
            if(type === "x"){
                lineStep = (width - x - x2) / 100;
                linePace = lineStep * (100 - gap1 - gap2) / count;
                lineStart = x + lineStep * gap1;
                me.xLineStart = lineStart;
                me.xLineEnd = lineStart + lineStep * (100 - gap1 - gap2);
                me.xLineStep = lineStep;
                me.xStepCount = (100 - gap1 - gap2);
            }
            else{
                lineStep = (height - y - y2) / 100;
                linePace = lineStep * (100 - gap1 - gap2) / count;
                lineStart = height - y2 - (lineStep * gap2);
                me.yLineStart = lineStart;
                me.yLineEnd = lineStart + lineStep * (100 - gap1 - gap2);
                me.yLineStep = lineStep;
                me.yStepCount = (100 - gap1 - gap2);
            }
            for(var i = 0; i < count; i++){
                if(i == 0){
                    continue;
                }
                if(i === count){
                    if(type === "x"){
                        arr.push(width - x2);
                    }
                    else if(type === "y"){
                        arr.push(y);
                    }
                }
                else{
                    if(type === "x"){
                        arr.push(lineStart + (linePace * i));
                    }
                    else if(type === "y"){
                        arr.push(lineStart - (linePace * i));
                    }
                }
            }
            return arr;
        };
        this.xLineArray = generateLineArray("x");
        this.yLineArray = generateLineArray("y");
        for(i = 0; i < curSize; i++){
            (function(i){
                me._registerTick(function(){
                    options.xAxis.axisLabel.show && (xPosition === "both" || xPosition === "bottom") && me._drawLine(x +  i * curXPace, height - y2, x + (i + 1) * curXPace, height - y2, options.xAxis.axisLine.lineStyle);
                    options.yAxis.axisLabel.show && (yPosition === "both" || yPosition === "left") &&  me._drawLine(x, (height - y2) - i * curYPace, x, (height - y2) - (i + 1) * curYPace, options.yAxis.axisLine.lineStyle);
                    options.xAxis.axisLabel.show && (xPosition === "both" || xPosition === "top") &&  me._drawLine(x +  i * curXPace, y, x + (i + 1) * curXPace, y, options.xAxis.axisLine.lineStyle);
                    options.yAxis.axisLabel.show && (yPosition === "both" || yPosition === "right") && me._drawLine(width - x2, (height - y2) - i * curYPace, width - x2, (height - y2) - (i + 1) * curYPace, options.yAxis.axisLine.lineStyle);
                    if(options.xAxis.splitLine.show){
                        $.each(me.xLineArray, function(index, item){
                            me._drawLine(item, (height - y2) - i * curYPace, item, (height - y2) - (i + 1) * curYPace, {
                                color : getIndex(options.xAxis.splitLine.lineStyle.color, index),
                                width: options.xAxis.splitLine.lineStyle.width,
                                type: options.xAxis.splitLine.lineStyle.type
                            });
                        });
                    }
                    if(options.yAxis.splitLine.show){
                        $.each(me.yLineArray, function(index, item){
                            me._drawLine(x +  i * curXPace, item, x + (i + 1) * curXPace, item, {
                                color : getIndex(options.yAxis.splitLine.lineStyle.color, index),
                                width: options.yAxis.splitLine.lineStyle.width,
                                type: options.yAxis.splitLine.lineStyle.type
                            });
                        });
                    }
                });
            })(i);
        }
    };
    CheapyChart.prototype.renderSeries = function(){
        var list = this.options.series;
        var i, item;
        for(i = 0; i < list.length; i++){
            item = list[i];
            if(item.instance){
                item.instance.render();
            }
        }
    };
    CheapyChart.prototype.renderOther = function(){

    };
    CheapyChart.prototype._registerTick = function(callback){
        this.tickList.push(callback);
    };
    CheapyChart.prototype._startTick = function(){
        var option = this.options,
            animation = option.animation,
            list = this.tickList,
            size = list.length,
            iCount = 0, me = this,
            recursiveFunction = function(){
                list[iCount ++]();
                if(iCount >= size){
                    me._stopTick();
                }
                else{
                    me._nextTick(recursiveFunction, speed)
                }
            },
            time, speed;
        if(size == 0){
            return ;
        }
        if(animation.enable){
            time = animation.time;
            speed = time / size;
        }
        if(animation.enable){
            recursiveFunction();
        }
        else{
            $.each(list, function(){
                this();
            })
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
            method(callback);
        }
        else{
            setTimeout(method, timeout);
        }
    };
    CheapyChart.prototype._bindEvent = function(){
        var canvas = this.canvas, me = this;
        var xStart = this.xLineStart, xEnd = this.xLineEnd;
        if(canvas){
            $(canvas).on("touchstart", function(e){
                var pos = me.getPixFromEvent(e);
                console.dir(pos);
                me._showToolTip(pos);
            }).on("touchmove", function(e){
                var pos = me.getPixFromEvent(e);
                console.dir(pos);
                me._showToolTip(pos);
            }).on("touchend", function(e){
                me._hideToolTip();
            });
        }
    }
    CheapyChart.prototype.getPixFromValue = function(index, value){
        var xDataCount = this.options.xAxis.data.length - 1;
        var xPos = index / xDataCount * this.xStepCount * this.xLineStep + this.xLineStart;
        var yPos =  this.yLineStart - (value - this.minValue) / (this.maxValue - this.minValue) * this.yStepCount * this.yLineStep;
        return [xPos, yPos];
    };
    CheapyChart.prototype.getPixFromEvent = function(event){
        var canvas = this.canvas, touch = event.touches[0];
        var offset = $(canvas).offset();
        return [touch.clientX - offset.left, touch.clientY - offset.top];
    };
    CheapyChart.prototype._drawText = function(x, y, text, other){
        var context = this.context, options = this.options;
        var fontSize = options.font.size, fontFamily = options.font.family,
            fontWeight = options.font.weight, color = options.base.color;
        context.font = [fontSize + "px", fontFamily, fontWeight].join(" ");
        context.fillStyle = color;
        context.fillText(text, x, y + fontSize);
        context.fill();
    };
    CheapyChart.prototype._drawLine = function(x, y, x2, y2, other){
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
                if (dashLength == 0) dashLength = 0.001; // Hack for Safari
                if (dashLength > distRemaining) dashLength = distRemaining;
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
                if (dashLength == 0) dashLength = 0.001; // Hack for Safari
                if (dashLength > distRemaining) dashLength = distRemaining;
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
    CheapyChart.prototype._drawArc = function(x, y, radiu, percent, isRevert, other){

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
    CheapyChart.prototype._showToolTip = function(pos){
        var $el = $(this.el),
            $tooltip = $el.children(".tooltip"),
            tooltip = this.options.tooltip,
            obj = null, arr = null;
        if(tooltip && tooltip.show){
            if($tooltip.length == 0){
                $tooltip = $('<div class="tooltip" style="position:absolute;left: 0px; top:0px;"></div>');
                $el.after($tooltip);
            }
            obj = {};
            arr = [];
        }
    };
    CheapyChart.prototype._hideToolTip = function(pos){
        var $el = $(this.el);
        $el.children(".tooltip").hide();
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
        var cls = this.TYPES[type];
        if(cls){
            return new cls(chart, options);
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
            return null;
        }
    };

    CheapyChart.registerType("line", {
        render: function(){
            var chart = this.chart,
                options = this.options;
            var lineStyle = $.extend({}, chart.options.base, options.lineStyle);
            var other = $.extend({}, chart.options.base.markStyle, options.markStyle);
            $.each(options.data, function(index ,item){
                if(index !== options.data.length - 1){
                    var pos1 = chart.getPixFromValue(index, options.data[index]),
                        pos2 = chart.getPixFromValue(index + 1, options.data[index + 1]);
                    chart._registerTick(function(){
                        chart._drawLine(pos1[0], pos1[1], pos2[0], pos2[1], lineStyle);
                        if(options.data.length < 10){
                            chart._drawCircle(pos1[0], pos1[1], other);
                            chart._drawCircle(pos2[0], pos2[1], other);
                        }
                    })
                }
            });
        },
        getValueByPix: function(){

        }
    });
    CheapyChart.registerType("bar", {
        render: function(){
            var chart = this.chart,
                options = this.options;
            var lineStyle = $.extend({}, chart.options.base, options.lineStyle);
            $.each(options.data, function(index ,item){
                if(index < options.data.length){
                    var pos1 = chart.getPixFromValue(index, options.data[index]);
                    var pos2 = chart.getPixFromValue(index, 0);
                    var width = chart.xLineStep * 5 / 7 * chart.xStepCount / chart.options.xAxis.data.length;
                    var pos3 = [pos1[0] - width / 2, pos1[1]];
                    var pos4 = [pos2[0] + width / 2, pos2[1]];
                    chart._registerTick(function(){
                        chart._drawRect(pos3[0], pos3[1], pos4[0], pos4[1], lineStyle);
                    })
                }
            });
        }
    });
    CheapyChart.registerType("kline", {
        maxValue: function(){

        },
        minValue: function(){

        },
        render: function(){

        }
    });


    function getIndex(arr, index){
        if(arr.length > 1){
            return index % arr.length;
        }
        else{
            return 0;
        }
    }

    window.CheapyChart = CheapyChart;
})(window.jQuery || window.Zepto);