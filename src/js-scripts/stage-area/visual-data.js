// The flow diagram visual data and processing class
dfm.FlowVisuals = class {
    constructor() {
        this.active = false;
        this.flowDrawMode = false;
        this.nodeLayer = null;
        this.nodes = [
            {
                active: false,
                nodeNum: "00",
                nodeGroup: null
            }
        ]
        this.flows= [
            {
                active: false,
                flowNum: "00",
                flowGroup: null,
                points: [] // [{x:, y:}]
            }
        ]
    }
}
