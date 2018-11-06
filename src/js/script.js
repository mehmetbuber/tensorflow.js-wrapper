var tfwrapper = new Wrapper({
    onLog: function () {
        resetLogs();
    }
});
var layers = [];

setOptions(false);

$('#upload-model-radio').click(function () {
	$('#layer-div').hide();
	$('#upload-div').show();
});

$('#build-model-radio').click(function () {
	$('#layer-div').show();
	$('#upload-div').hide();
});

$(document).on('click', 'body .close', function () {
	$(this).parent().parent().remove();
});

$('#upload-button').click(function () {
	tfwrapper.upload();
	$('#upload-div').hide();
	$('#model-select-div').hide();
	$('#train-div').show();
});

$('#load-button').click(function () {
    setOptions();
	$('#train-div').hide();
	$('#upload-div').hide();
	$('#download-div').hide();

	var dataset = $('#data-set-path').val();

	tfwrapper.load(dataset, function () {
		var classes = tfwrapper.classes.join(', ');
		$('#classes-div').html(classes);
		$('#classes-label').show();
		$('#model-select-div').show();
		$('.layer-parent').find('div:first-child').find('.units').val(tfwrapper.dataColumnCount - 1);

		$('.outputLayer').find('.units').val(tfwrapper.classes.length);
		$('#load-div').hide();
	});
});

$('#add-layer-button').click(function () {
	$('.layer-parent').append('' +
		'<div class="col-md-4">' +
		'<div class="layer">' +
		'<div class="close"></div>' +
		'<div class="form-group">' +
		'<label>Units</label>' +
		'<input type="text" class="form-control units">' +
		'</div>' +
		'<label>Activation function:</label>' +
		'<select class="form-control activation-dropdown">' +
		'<option value="sigmoid">Sigmoid</option>' +
		'<option value="hardSigmoid">Hard Sigmoid</option>' +
		'<option value="linear">Linear</option>' +
		'<option value="elu">Elu</option>' +
		'<option value="relu">ReLU</option>' +
		'<option value="relu6">ReLU6</option>' +
		'<option value="selu">SELU</option>' +
		'<option value="softmax">Softmax</option>' +
		'<option value="softplus">Softplus</option>' +
		'<option value="softsign">Softsign</option>' +
		'<option value="tanh">Tanh</option>' +
		'</select>' +
		'</div>' +
		'</div >');
});

$('#set-layers-button').click(function () {
	layers = [];
	$('.layer').each(function () {
		layers.push(
			{
				units: parseInt($(this).find('.units').val()),
				inputShape: parseInt($(this).find('.input-shape').val()),
				activation: $(this).find('.activation-dropdown').val()
			}
		);
	});
	$('#train-div').show();
	$('#layer-div').hide();
	$('#model-select-div').hide();
});

$('#train-button').click(function () {
	setOptions(false);
	tfwrapper.train(function () {
		drawGraph();
		modelDraw();
		$('#download-div').show();
	});
});

var epochLeft = 0;

$('#slow-train-button').click(function () {
    setOptions(true);
    epochLeft = parseInt($('#epoch').val());
    slowTrain();
});

function slowTrain() {
    tfwrapper.train(function () {
        drawGraph();
        modelDraw();
        $('#download-div').show();
        epochLeft--;

        if (epochLeft > 0)
            slowTrain();
    });
}

$('#test-button').click(function () {
	modelDraw();
	tfwrapper.test();
});

$('#weights-button').click(function () {
	tfwrapper.download();
});

function modelDraw() {
	var layers = [];
	for (var i = 0; i < tfwrapper.model.layers.length; i++) {
		var tfLayer = tfwrapper.model.layers[i].getWeights()[0];
		var layer = new Layer(tfLayer.dataSync(), tfLayer.shape);
		layers.push(layer);
	}
	drawModel(layers, tfwrapper.classes, tfwrapper.table.columns);
}

function setOptions(slow) {
    var epochCount = 0;
    if (slow)
        epochCount = 1;
    else
        epochCount = parseInt($('#epoch').val());
	var learningRate = parseFloat($('#learningRate').val());
    var trainingDataRatio = parseFloat($('#trainingDataRatio').val());
	var shuffle = $('#shuffle').is(':checked');
	var options = {
		config: {
			epochs: epochCount,
			shuffle: shuffle
		},
		trainingDataRatio: trainingDataRatio,
		learningRate: learningRate,
		layers: layers,
		output: {
			activation: "sigmoid"
		}
	};

	tfwrapper.setOptions(options);
}

function resetLogs() {
	$('#logs').html("");
	for (var i = 0; i < tfwrapper.logs.length; i++) {
		$('#logs').append('<li class="log">' + tfwrapper.logs[i] + '</li>');
	}
}