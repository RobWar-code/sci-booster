// Site Details
dfm.phpPath = "/sci-booster/src/php-scripts/";

// User Details
dfm.userStatus = "unregistered"; // Other options are "user", "editor", "owner"
dfm.username = "";
dfm.loginOption = "";

// The Flow Model that is current in this session
// See README.md for the JSON definition
dfm.currentPage = {};
dfm.currentVisual = {};

// Model Definition Vars
dfm.currentPageSet = false;
dfm.currentVisualsSet = false;
dfm.modelEditMode = "read-only";
dfm.topPage = false;
dfm.modelAuthorsVisible = false;
dfm.modelExtAuthorsVisible = false;
dfm.modelReferencesVisible = false;
dfm.flowDrawMode = false;
dfm.modelChanged = false;

// Node and Flow details
dfm.maxNodeLabelLen = 42;
dfm.maxFlowLabelLen = 42;
dfm.maxFlowLabelWidth = 90; 

// The drawing stage
dfm.stageWidth = GLOBALS.minStageWidth;
dfm.stageHeight = GLOBALS.stageHeight;
dfm.scaleX = 1;
dfm.nodeTemplate = {
    width: 140,
    height: 75,
    textTop: 3,
    textLeft: 3,
    textLineHeight: 18,
    fontSize: 13, 
    fontFamily: "Calibri",
    optionTop: 48,
    optionLeft: 3,
    optionHeight: 25,
    optionWidth: 25
}
dfm.newNodeX = 0;
dfm.newNodeY = 0;
dfm.nodeData = {};
dfm.stageApp = {};

// Load the images
dfm.numNodeGraphics = 5;
dfm.nodeGraphics = {};
dfm.loadedEvent = new CustomEvent('graphicsLoaded', {detail: {graphicsLoaded: true}});

loadDrawingImages();

window.addEventListener("resize", () => {
    stageApp.adjustStage();
});

document.addEventListener("graphicsLoaded", (e) => {
    if (e.detail.graphicsLoaded) {
        flowMain();
    }  
});

function flowMain() {
    flowModelPage.getModelSelectionList();
    stageApp.startStageApp();
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
    dfm.nodeGraphics.hyperlink = new Image();
    dfm.nodeGraphics.hyperlink.onload = loadRegister;
    dfm.nodeGraphics.hyperlink.src ='/sci-booster/src/images/web-link.png';
    dfm.nodeGraphics.zoomDetails = new Image();
    dfm.nodeGraphics.zoomDetails.onload = loadRegister;
    dfm.nodeGraphics.zoomDetails.src = '/sci-booster/src/images/zoom-details.png';

};
