const adjustStage = () => {
    console.log("Got to adjust stage:", window.innerWidth);
    dfm.scaleX = window.innerWidth / 400;
    console.log("scaleX:", dfm.scaleX);
    if (dfm.scaleX < 1) {
        dfm.scaleX = 1;
    }
    else if (dfm.scaleX > 2) {
        dfm.scaleX = 2;
    }

    dfm.stageWidth = dfm.scaleX * GLOBALS.minStageWidth;
    if (dfm.flowVisuals) redoStage();
}

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

    // Add the node group to a layer
    dfm.flowVisuals = new dfm.FlowVisuals();

    dfm.flowVisuals.nodeLayer = new Konva.Layer();

    // Add the node layer to the stage
    dfm.stageApp.add(dfm.flowVisuals.nodeLayer);

    // Test Shape
    myShape = new Konva.Rect({
        x: 10,
        y: 10,
        width: 100,
        height: 100,
        fill: 'green'
    })

    dfm.flowVisuals.nodeLayer.add(myShape);
    dfm.flowVisuals.nodeLayer.draw();

}

const redoStage = () => {
    console.log("stage width:", dfm.stageWidth);
    e = document.getElementById("flowModelStageDiv");
    e.style.width = dfm.stageWidth + "px";
    dfm.stageApp.width(dfm.stageWidth);
    dfm.stageApp.scale({x: dfm.scaleX, y: 1});
    dfm.stageApp.batchDraw();
}