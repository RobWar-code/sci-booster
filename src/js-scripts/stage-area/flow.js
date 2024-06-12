// Flow Data Class
dfm.Flow = class {
    constructor() {
        this.id = null; // If known
        this.page_id = null;
        this.flow_num = "";
        this.source_node_num = "";
        this.destination_node_num = "";
        this.label = "";
        this.label_x = 0;
        this.label_y = 0;
        this.label_width = 0;
        this.drawing_group_x = 0;
        this.drawing_group_y = 0;
        this.arrow_points = [];//[{id:, flow_id:, x:, y:}];
        this.points = []; // {id:, flow_id:, x:, y:}
        this.definition = "";
        this.keywords = "";
        this.hyperlink = "";
        this.conversion_formulas = []; // [{id: , flow_id: , formula: , description: }]
    }
}
