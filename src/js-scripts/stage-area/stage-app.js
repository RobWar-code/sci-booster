
const startStageApp = () => {
    console.log ("Got to startApp");

	containerElem = document.getElementById("flowModelStageDiv");
	containerElem.style.width = (stageWidth + 4) + "px";

	// first we need to create a stage
	stageApp = new Konva.Stage({
	  container: 'flowModelStageDiv',   // id of container <div>
	  width: stageWidth,
	  height: stageHeight
	});

	// then create layer
	var layer = new Konva.Layer();

	// create our shape
	var circle = new Konva.Circle({
	  x: stageApp.width() / 2,
	  y: stageApp.height() / 2,
	  radius: 40,
	  fill: 'red',
	  stroke: 'black',
	  strokeWidth: 4
	});

	// add the shape to the layer
	layer.add(circle);

	// add the layer to the stage
	stageApp.add(layer);

	// Add an image file
	var imageObj = new Image();
	imageObj.onload = function () {
	  var node = new Konva.Image({
		x: 50,
		y: 50,
		image: imageObj,
		width: 100,
		height: 75
	  });

	  // add the shape to the layer
	  layer.add(node);
	};
	imageObj.src = '/sci-booster/src/images/node.png';

	// draw the image
	layer.draw();

}
