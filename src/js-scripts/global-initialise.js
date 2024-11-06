// Initialisation of the global workspace for the flow model diagrams

// APP CONSTANTS
const GLOBALS = {
    minAssumedDisplayWidth: 400,
    minStageWidth: 360,
    maxStageWidth: 760,
    stageHeight: 680,
    minNodeWidth: 100,
    maxNodeWidth: 200,
    maxNodesPerPage: 8,
    maxHierarchyLevel: 32,
    nodeHeight: 75,
    nodeButtonTop: 48,
    minFlowLength: 60,
    numNodeOptions: 4,
    nodeOptionWidth: 25,
    nodeOptionHeight: 25,
    nodePadding: 4
}

// The global application object
var dfm = {};
dfm.phpPath = "/sci-booster/src/php-scripts/";
dfm.jsPath = "/sci-booster/src/js-scripts";