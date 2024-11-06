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
dfm.newZoomPage = false;
dfm.maxPageTitleLength = 128;
dfm.importTitle = "";

// Node and Flow details
dfm.maxNodeLabelLen = 42;
dfm.maxFlowLabelLen = 42;
dfm.maxFlowLabelWidth = 65;
dfm.minFlowLabelWidth = 31;
dfm.flowFontSize = 10;
dfm.flowOptionHeight = 15;
dfm.flowLineWidth = 5;
dfm.flowMarkerWidth = 10;
dfm.flowArrowRadius = 8;

// Hover Text
dfm.hoverFontSize = 10;

// The drawing stage
dfm.stageWidth = GLOBALS.minStageWidth;
dfm.stageHeight = GLOBALS.stageHeight;
dfm.scaleX = 1;
dfm.nodeTemplate = {
    width: 120,
    height: 75,
    textTop: 3,
    textLeft: 3,
    textLineHeight: 18,
    fontSize: 11, 
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
dfm.numNodeGraphics = 10;
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
    flowModelPage.restorePage();
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
    dfm.nodeGraphics.graphicPresent = new Image();
    dfm.nodeGraphics.graphicPresent.onload = loadRegister;
    dfm.nodeGraphics.graphicPresent.src = '/sci-booster/src/images/graphic-present.png';
    dfm.nodeGraphics.graphicAbsent = new Image();
    dfm.nodeGraphics.graphicAbsent.onload = loadRegister;
    dfm.nodeGraphics.graphicAbsent.src = '/sci-booster/src/images/graphic-absent.png';
    dfm.nodeGraphics.flowLink = new Image();
    dfm.nodeGraphics.flowLink.onload = loadRegister;
    dfm.nodeGraphics.flowLink.src = '/sci-booster/src/images/flow-link.png';
    dfm.nodeGraphics.hyperlinkAbsent = new Image();
    dfm.nodeGraphics.hyperlinkAbsent.onload = loadRegister;
    dfm.nodeGraphics.hyperlinkAbsent.src ='/sci-booster/src/images/web-link-absent.png';
    dfm.nodeGraphics.hyperlinkPresent = new Image();
    dfm.nodeGraphics.hyperlinkPresent.onload = loadRegister;
    dfm.nodeGraphics.hyperlinkPresent.src ='/sci-booster/src/images/web-link-present.png';
    dfm.nodeGraphics.zoomPresent = new Image();
    dfm.nodeGraphics.zoomPresent.onload = loadRegister;
    dfm.nodeGraphics.zoomPresent.src = '/sci-booster/src/images/zoom-present.png';
    dfm.nodeGraphics.zoomAbsent = new Image();
    dfm.nodeGraphics.zoomAbsent.onload = loadRegister;
    dfm.nodeGraphics.zoomAbsent.src = '/sci-booster/src/images/zoom-absent.png';
    dfm.nodeGraphics.flowDetails = new Image();
    dfm.nodeGraphics.flowDetails.onload = loadRegister;
    dfm.nodeGraphics.flowDetails.src = '/sci-booster/src/images/flow-details.png';
};
