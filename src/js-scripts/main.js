// The Flow Model that is current in this session
// See README.md for the JSON definition
dfm.currentFlowModel = {};

// The drawing stage
dfm.stageWidth = GLOBALS.minStageWidth;
dfm.stageHeight = GLOBALS.stageHeight;
dfm.scaleX = 1;
dfm.flowVisuals = null;
dfm.nodeData = {};
dfm.stageApp = {};

// Load the images
dfm.numNodeGraphics = 5;
dfm.nodeGraphics = {};
dfm.loadedEvent = new CustomEvent('graphicsLoaded', {detail: {graphicsLoaded: true}});

loadDrawingImages();

window.addEventListener("resize", () => {
    adjustStage();
});

document.addEventListener("graphicsLoaded", (e) => {
    if (e.detail.graphicsLoaded) {
        main();
    }  
});

function main() {
    console.log("Hello World");
    startStageApp();
};

function loadDrawingImages() {
    var count = 0;
    const loadRegister = () => {
        ++count;
        if (count >= dfm.numNodeGraphics) {
            document.dispatchEvent(dfm.loadedEvent);
        }
    }

    dfm.nodeGraphics.node = new Image();
    dfm.nodeGraphics.node.onload = loadRegister;
    dfm.nodeGraphics.node.src = '/sci-booster/src/images/node.png';
    dfm.nodeGraphics.details = new Image();
    dfm.nodeGraphics.details.onload = loadRegister;
    dfm.nodeGraphics.details.src = '/sci-booster/src/images/details.png';
    dfm.nodeGraphics.flowLink = new Image();
    dfm.nodeGraphics.flowLink.onload = loadRegister;
    dfm.nodeGraphics.flowLink.src = '/sci-booster/src/images/flow-link.png';
    dfm.nodeGraphics.webLink = new Image();
    dfm.nodeGraphics.webLink.onload = loadRegister;
    dfm.nodeGraphics.webLink.src ='/sci-booster/src/images/web-link.png';
    dfm.nodeGraphics.zoomDetails = new Image();
    dfm.nodeGraphics.zoomDetails.onload = loadRegister;
    dfm.nodeGraphics.zoomDetails.src = '/sci-booster/src/images/zoom-details.png';

};
