// Node Data Class

dfm.Node = class {
    constructor () {
        this.id = null; // If known
        this.page_id = null;
        this.node_num = ""; // Auto
        this.x = 0;
        this.y = 0;
        this.label = "";
        this.type = ""; // (Mechanism/Effect)
        this.definition = "";
        this.keywords = "";
        this.hyperlink = "";
        this.has_child_page = false;
    }
}
