function Wrapper(wrapperOptions) {
    var wrapper = this;

    this.table = [];
    this.inputData = [];
    this.outputData = [];
    this.lossHistory = [];
    this.classes = [];
    this.logs = [];

    if (typeof wrapperOptions.onLog !== "undefined")
        this.onLog = wrapperOptions.onLog;

    this.dataRowCount = 0;
    this.dataColumnCount = 0;
    this.trainingDataCount = 0;
    this.initialized = false;

    this.load = function (csv, callback) {
        this.table = loadTable(csv, "csv", "header", function () {
            wrapper.initializeData(function () {
                if (typeof callback !== "undefined")
                    callback(wrapper);
            });
        });
    };

    this.initializeData = function (callback) {
        //Building data
        this.dataRowCount = this.table.getRowCount();
        this.dataColumnCount = this.table.getColumnCount();
        this.trainingDataCount = Math.floor(this.options.trainingDataRatio * this.dataRowCount);

        for (var r = 0; r < this.dataRowCount; r++) {
            let row = [];
            for (let c = 0; c < this.dataColumnCount - 1; c++) {
                row.push(parseFloat(this.table.getString(r, c)));
            }
            this.inputData.push(row);
        }

        var tempOutputData = [];
        for (let r = 0; r < this.dataRowCount; r++) {
            tempOutputData.push(this.table.getString(r, this.dataColumnCount - 1));
        }

        this.classes = tempOutputData.filter(onlyUnique); // returns ['a', 1, 2, '1']

        for (let r = 0; r < this.dataRowCount; r++) {
            let row = [];
            for (var c = 0; c < this.classes.length; c++) {
                if (this.classes[c] === tempOutputData[r]) {
                    row.push(1);
                } else {
                    row.push(0);
                }
            }
            this.outputData.push(row);
        }

        var inputDataClone = this.inputData.slice(0);
        var outputDataClone = this.outputData.slice(0);

        const trainingDataX = inputDataClone.splice(0, this.trainingDataCount);
        const trainingDataY = outputDataClone.splice(0, this.trainingDataCount);

        this.trainingXList = tf.tensor2d(trainingDataX);
        this.trainingYList = tf.tensor2d(trainingDataY);

        if (typeof callback !== "undefined")
            callback(this);
    };

    this.initialize = function (callback) {
        //Training Model

        if (!this.initialized) {
            this.model = tf.sequential();

            const firstLayer = tf.layers.dense({
                units: this.options.layers[0].units,
                inputShape: this.dataColumnCount - 1,
                activation: this.options.layers[0].activation
            });

            this.model.add(firstLayer);
            for (var i = 1; i < this.options.layers.length; i++) {
                const layer = tf.layers.dense({
                    units: this.options.layers[i].units,
                    activation: this.options.layers[i].activation
                });
                this.model.add(layer);
            }

            const outputLayer = tf.layers.dense({
                units: this.classes.length,
                activation: this.options.output.activation
            });

            this.model.add(outputLayer);

            this.log("Training started for " + wrapper.options.config.epochs + " epochs with " + wrapper.options.learningRate + " learning rate.");
            const sgdOptimizer = tf.train.adam(wrapper.options.learningRate);
            this.model.compile({
                optimizer: sgdOptimizer,
                loss: tf.losses.meanSquaredError
            });
            //Optimizer

            var optionsText = "Training Options:<br/>" +
                "---------------------------------<br/>" +
                "Training Data Ratio: " +
                this.options.trainingDataRatio +
                "<br/>" +
                "Training Data Count: " +
                this.trainingDataCount +
                "<br/>";
            this.log(optionsText);

            this.initialized = true;
            if (typeof callback !== "undefined")
                callback(this);
        }
    };

    this.train = async function (callback) {
        this.initialize();

        const response = await wrapper.model.fit(wrapper.trainingXList, wrapper.trainingYList, wrapper.options.config);
        wrapper.lossHistory = wrapper.lossHistory.concat(response.history.loss);
        
        wrapper.log("Training ended with the loss of " + wrapper.lossHistory[wrapper.lossHistory.length - 1]);

        if (typeof callback !== "undefined")
            callback(wrapper);
    };

    this.test = function (callback) {
        this.initialize();
        tf.tidy(function () {
            const testingXList = tf.tensor2d(wrapper.inputData);
            var result = wrapper.model.predict(testingXList);
            result.data().then(function (e) {
                var chunk = chunkArray(e, wrapper.classes.length);

                var success = 0;

                for (var i = 0; i < chunk.length; i++) {
                    if (successful(chunk[i], wrapper.outputData[i]))
                        success++;
                }

                var result = "Results:<br/>" +
                    "---------------------------------<br/>" +
                    "Total input: " +
                    wrapper.inputData.length +
                    "<br/>" +
                    "Successful Predictions: " +
                    success +
                    "<br/>" +
                    "Success Ratio: %" +
                    ((success / wrapper.inputData.length) * 100).toFixed(2);

                wrapper.log(result);
                if (typeof callback !== "undefined")
                    callback(this);
            });
            result.dispose();
            testingXList.dispose();

        });
    };

    this.download = async function () {
        await this.model.save('downloads://model');
    };

    this.upload = async function () {
        this.initialized = true;
        const jsonUpload = document.getElementById('json-upload');
        const weightsUpload = document.getElementById('weights-upload');

        this.model = await tf.loadModel(tf.io.browserFiles([jsonUpload.files[0], weightsUpload.files[0]]));
        const sgdOptimizer = tf.train.adam(wrapper.options.learningRate);
        this.model.compile({
            optimizer: sgdOptimizer,
            loss: tf.losses.meanSquaredError
        });
        wrapper.log("Model loaded successfully");
    };

    this.setOptions = function (options) {
        this.options = options;
    }

    this.clearTensors = function () {
        if (this.trainingXList)
            this.trainingXList.dispose();
        if (this.trainingYList)
            this.trainingYList.dispose();
    };

    this.log = function (message) {
        this.logs.push(message);
        if (typeof wrapperOptions.onLog !== "undefined")
            this.onLog(this);
    };
}

//Helpers
function successful(result, answer) {
    var maxResult = Math.max.apply(Math, result);
    var maxAnswer = Math.max.apply(Math, answer);
    if (result.indexOf(maxResult) === answer.indexOf(maxAnswer))
        return true;
    else
        return false;
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function chunkArray(myArray, chunk_size) {
    var index = 0;
    var arrayLength = myArray.length;
    var tempArray = [];

    for (index = 0; index < arrayLength; index += chunk_size) {
        myChunk = myArray.slice(index, index + chunk_size);
        // Do something if you want with the group
        tempArray.push(myChunk);
    }

    return tempArray;
}