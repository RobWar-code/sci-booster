// Node Data Class

dfm.Node = class {
    constructor () {
        this.id = ""; // If known
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
