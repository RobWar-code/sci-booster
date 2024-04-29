// Node Data Class

dfm.Node = class {
    constructor () {
        this.id = ""; // If known
        this.nodeNum = ""; // Auto
        this.x = 0;
        this.y = 0;
        this.label = "";
        this.type = ""; // (Mechanism/Effect)
        this.definition = "";
        this.keywords = "";
        this.hyperlink = "";
        this.hasChildPage = false;
    }
}
