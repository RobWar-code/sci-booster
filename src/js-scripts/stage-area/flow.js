// Flow Data Class
dfm.Flow = class {
    constructor() {
        this.id = null; // If known
        this.flow_num = "";
        this.sourceX = 0;
        this.sourceY = 0;
        this.destinationX = 0;
        this.destinationY = 0;
        this.source_node_num = "";
        this.destination_node_num = "";
        this.label = "";
        this.labelX = 0;
        this.labelY = 0;
        this.points = []; // {x:, y:}
        this.definition = "";
        this.keywords = "";
        this.hyperlink = "";
        this.conversion_formulas = []; // [{formula: , description: }]
    }
}
