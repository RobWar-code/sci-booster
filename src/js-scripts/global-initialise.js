// Initialisation of the global workspace for the flow model diagrams

// APP CONSTANTS
const GLOBALS = {
    minAssumedDisplayWidth: 400,
    minStageWidth: 380,
    maxStageWidth: 760,
    stageHeight: 680,
    minNodeWidth: 100,
    maxNodeWidth: 200,
    maxNodesPerPage: 8,
    maxHierarchyLevel: 32,
    nodeHeight: 70,
    nodeButtonTop: 48,
    minFlowLength: 60,
    numNodeOptions: 5,
    nodeOptionWidth: 20,
    nodeOptionHeight: 20,
    nodePadding: 4
}

// The global application object
var dfm = {};
dfm.phpPath = "/sci-booster/src/php-scripts/";
dfm.jsPath = "/sci-booster/src/js-scripts";