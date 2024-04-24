// GLOBAL RESIDENT DATA
const GLOBALS = {
    minStageWidth: 380,
    maxStageWidth: 760,
    stageHeight: 580,
    minNodeWidth: 100,
    maxNodeWidth: 200,
    nodeHeight: 70,
    minFlowLength: 60,
    nodeOptionWidth: 20,
    nodeOptionHeight: 20
}

// The Flow Model that is current in this session
// See README.md for the JSON definition
var currentFlowModel = {};

// The drawing stage
var stageWidth = 400;
var stageHeight = 400;
var nodeData = {};
var nodeTexture;
var stageApp;

main();

function main() {
    console.log("Hello World");
    startStageApp();
    addNode();
};