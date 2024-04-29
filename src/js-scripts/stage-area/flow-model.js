// Flow Model and Flow Page Definitions

dfm.FlowPage = class {
    constructor() {
        this.id = null; // If known
        this.hierarchicalPageId = "";
        this.title = "";
        this.description = "";
        this.authors = [];
        this.references = []; // [{source:, author:, title: }],
        this.keywords = "";
        this.nodes = []; // [Node objects]
        this.flows = []; // [Flow objects]
    }

    set(pageObj) {
        this.id = pageObj.id;
        this.hierarchicalPageId = pageObj.hierarchicalPageId;
        this.title = pageObj.title;
        this.description = pageObj.description;
        this.authors = pageObj.authors;
        this.references = pageObj.references;
        this.keywords = pageObj.keywords;
    }
}

dfm.FlowPageData = class {
    constructor() {
        this.id = null; // If known
        this.page = new dfm.FlowPage();
    }

    addPage(pageObj) {
        this.page.set(pageObj);
    }
}
