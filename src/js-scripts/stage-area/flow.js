// Flow Data Class
dfm.Flow = class {
    constructor() {
        this.id = null; // If known
        this.flowNum = "";
        this.sourceX = 0;
        this.sourceY = 0;
        this.destinationX = 0;
        this.destinationY = 0;
        this.sourceNodeNum = 0;
        this.destinationNodeNum = 0;
        this.label = "";
        this.definition = "";
        this.keywords = "";
        this.hyperlink = "";
        this.conversionFormulas = []; // [{formula: , definition: }]
    }
}
