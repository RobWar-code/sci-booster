
const startStageApp = () => {
    console.log ("Got to startApp");

    let containerElem = document.getElementById("flowModelStageDiv");
    containerElem.style.width = (dfm.stageWidth + 4) + "px";

    // First, create a stage
    dfm.stageApp = new Konva.Stage({
        container: 'flowModelStageDiv',   // id of container <div>
        width: dfm.stageWidth,
        height: dfm.stageHeight
    });

	// Set-up the hover text
	setupHoverText();

    // Add the node image file
    buildNodeGraphic();

    // Add the node group to a layer
    nodeLayer = new Konva.Layer();
    nodeLayer.add(dfm.nodeGroup);

    // Add the node layer to the stage
    dfm.stageApp.add(nodeLayer);
	dfm.hoverLayer.setZIndex(1);

    // Draw the graphics
    nodeLayer.draw();

}
