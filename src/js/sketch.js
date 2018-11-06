var canvas;
var nodeWidth = 30;
var spacingX = 50;
var spacingY = 70;
var paddingTop = 20;
var paddingLeft = 100;

function setup() {
    background(30, 43, 60);
    var width = document.getElementById('graph').offsetWidth - 30;
    canvas = createCanvas(width, 30);
    canvas.parent("graph");
    noSmooth();
    noLoop();
    textAlign(CENTER);
}

var s = function (p) { // p could be any variable name
    var x = 100;
    var y = 100;
    p.setup = function () {
        p.background(30, 43, 60);
        var width = document.getElementById('graph').offsetWidth - 30;
        p.createCanvas(width, 300);
        p.noSmooth();
        p.noLoop();
    };

    this.drawGraph = function () {
        p.drawGraph();
    };

    p.drawGraph = function () {
        p.background(30, 43, 60);
        p.stroke(255);
        p.noFill();
        p.beginShape();

        var prevData = 0;
        var prevX = 0;

        var max = Math.max.apply(Math, tfwrapper.lossHistory);

        for (var i = 0; i < tfwrapper.lossHistory.length; i++) {
            p.stroke(255);
            var y = 300 - map(tfwrapper.lossHistory[i], 0, max, 0, 300 - 20);
            var x = map(i, 0, tfwrapper.lossHistory.length, 0, width - 40) + 10;
            p.vertex(x, y);

            p.fill(255);
            if (prevData !== tfwrapper.lossHistory[i] && x - prevX > 40 && i != tfwrapper.lossHistory.length - 1) {
                ellipse(x, y, 5, 5);
                p.textSize(12);
                p.text(tfwrapper.lossHistory[i].toFixed(2), x + 5, y - 5);
                p.text(i, x, 300 - 5);
                prevX = x;
            }
            if (i === tfwrapper.lossHistory.length - 1) {
                p.textSize(16);
                p.text(tfwrapper.lossHistory[i].toFixed(5), x + 5, y - 5);
                p.text(i, x + 5, 300 - 5);
            }
            p.noFill();

            prevData = tfwrapper.lossHistory[i];
        }

        p.endShape();
    };
};
var graphCanvas = new p5(s, 'c1');

// Sketch Two
var t = function (p) {
    p.setup = function () {
        p.background(30, 43, 60);
        var width = document.getElementById('graph').offsetWidth - 30;
        p.createCanvas(width, 300);
        p.noSmooth();
        p.noLoop();
    };

    this.drawModel = function (layers, classes, attributes) {
        p.drawModel(layers, classes, attributes);
    };

    p.drawModel = function (layers, classes, attributes) {
        p.fill(255);
        var usableWidth = width - 300;
        spacingX = usableWidth / (layers.length);

        var nodeLengths = [];
        var weights = [];
        for (var l = 0; l < layers.length; l++) {
            nodeLengths.push(layers[l].shape[0]);
            nodeLengths.push(layers[l].shape[1]);
            weights = weights.concat(Array.prototype.slice.call(layers[l].weightData));
        }
        var maxWeight = weights.max();
        var minWeight = weights.min();
        var absMaxMin = Math.max(maxWeight, Math.abs(minWeight));
        
        var maxNode = nodeLengths.max();
        p.resizeCanvas(width, maxNode * spacingY + paddingTop);
        p.background(30, 43, 60);

        var inputNodeCount = layers[0].shape[0];
        var inputDifference = maxNode - inputNodeCount;
        var inputPadding = inputDifference * spacingY / 2;

        var nodeCount = 0;
        var difference = 0;
        var nodePadding = 0;
        for (var l = 0; l < layers.length; l++) {
            nodeCount = layers[l].shape[1];
            difference = maxNode - nodeCount;
            nodePadding = difference * spacingY / 2;

            var previousNodeCount = 0;
            var previousDifference = 0;
            var previousNodePadding = 0;

            if (l !== 0) {
                previousNodeCount = layers[l - 1].shape[1];
                previousDifference = maxNode - previousNodeCount;
                previousNodePadding = previousDifference * spacingY / 2;
            }

            for (var i = 0; i < layers[l].shape[0]; i++) {
                if (l === 0) {
                    p.stroke(255);
                    p.strokeWeight(1);
                    p.ellipse(
                        l * spacingX + paddingLeft + nodeWidth / 2,
                        i * spacingY + paddingTop + inputPadding + nodeWidth / 2,
                        nodeWidth,
                        nodeWidth
                    );
                }
                for (var j = 0; j < layers[l].shape[1]; j++) {
                    var weight = layers[l].weights[i][j];
                    var alpha = map(Math.abs(weight), 0, absMaxMin, 0, 16);
                    alpha = alpha * alpha - 1;
                    var sWeight = map(Math.abs(weight), 0, absMaxMin, 0, 5);
                    p.stroke(255);
                    p.strokeWeight(sWeight);
                    if (weight > 0) {
                        p.stroke(0, 255, 0, parseInt(alpha));
                    } else {
                        p.stroke(255, 0, 0, parseInt(alpha));
                    }
                    if (l === 0) {
                        p.line(
                            l * spacingX + paddingLeft + nodeWidth / 2,
                            i * spacingY + paddingTop + nodeWidth / 2 + inputPadding,
                            (l + 1) * spacingX + paddingLeft + nodeWidth / 2,
                            j * spacingY + paddingTop + nodeWidth / 2 + nodePadding
                        );

                    } else {
                        p.line(
                            l * spacingX + paddingLeft + nodeWidth / 2,
                            i * spacingY + paddingTop + nodeWidth / 2 + previousNodePadding,
                            (l + 1) * spacingX + paddingLeft + nodeWidth / 2,
                            j * spacingY + paddingTop + nodeWidth / 2 + nodePadding
                        );
                    }


                    if (l === layers.length - 1) {
                        p.stroke(0);
                        p.strokeWeight(1);
                        p.textSize(16);
                        p.textAlign(LEFT);
                        p.textStyle(NORMAL);
                        p.textFont('Helvetica');
                        p.text(classes[j], (l + 1) * spacingX + paddingLeft + nodeWidth / 2 + 25, j * spacingY + paddingTop + nodeWidth / 2 + nodePadding + 5);
                    }
                }
            }

            for (i = 0; i < layers[l].shape[1]; i++) {
                p.stroke(30, 43, 60);
                p.strokeWeight(1);
                p.ellipse(
                    (l + 1) * spacingX + paddingLeft + nodeWidth / 2,
                    i * spacingY + paddingTop + nodePadding + nodeWidth / 2,
                    nodeWidth,
                    nodeWidth
                );
            }
        }

        nodeCount = layers[0].shape[0];
        difference = maxNode - nodeCount;
        nodePadding = difference * spacingY / 2;

        for (var i = 0; i < layers[0].shape[0]; i++) {
            p.stroke(0);
            p.strokeWeight(1);
            p.textSize(16);
            p.textAlign(RIGHT);
            p.textStyle(NORMAL);
            p.textFont('Helvetica');
            p.text(
                attributes[i],
                paddingLeft + nodeWidth / 2 - 25,
                i * spacingY + paddingTop + nodeWidth / 2 + nodePadding + 5);
        }
    };
};
var modelCanvas = new p5(t, 'c2');

function Layer(weights, shape) {
    this.shape = shape;
    this.weightData = weights;
    this.weights = chunkArray(weights, shape[1]);
}

Array.prototype.max = function () {
    return Math.max.apply(null, this);
};

Array.prototype.min = function () {
    return Math.min.apply(null, this);
};