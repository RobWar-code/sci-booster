// Flow Data Class
dfm.Flow = class {
    constructor() {
        this.id = null; // If known
        this.flow_num = "";
        this.source_node_num = "";
        this.destination_node_num = "";
        this.label = "";
        this.label_x = 0;
        this.label_y = 0;
        this.drawing_group_x = 0;
        this.drawing_group_y = 0;
        this.arrow_points = [];
        this.points = []; // {x:, y:}
        this.definition = "";
        this.keywords = "";
        this.hyperlink = "";
        this.conversion_formulas = []; // [{formula: , description: }]
    }
}
