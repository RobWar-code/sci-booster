/***
 * Adjust the stage following a resize event
 */
const adjustStage = () => {
    getStageScaling();
    if (dfm.flowVisuals) redoStage();
}

const getStageScaling = () => {
    dfm.scaleX = window.innerWidth / GLOBALS.minAssumedDisplayWidth;
    if (dfm.scaleX < 1) {
        dfm.scaleX = 1;
    }
    else if (dfm.scaleX > 2) {
        dfm.scaleX = 2;
    }

    dfm.stageWidth = dfm.scaleX * GLOBALS.minStageWidth;
}

const startStageApp = () => {
    let containerElem = document.getElementById("flowModelStageDiv");
    getStageScaling();
    containerElem.style.width = (dfm.stageWidth + 4) + "px";

    // First, create a stage
    dfm.stageApp = new Konva.Stage({
        container: 'flowModelStageDiv',   // id of container <div>
        width: dfm.stageWidth,
        height: dfm.stageHeight
    });
    dfm.stageApp.scale({x: dfm.scaleX, y: 1});

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
    });

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