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
        this.hierarchical_page_id = pageObj.hierarchicalPageId;
        this.title = pageObj.title;
        this.description = pageObj.description;
        this.authors = pageObj.authors;
        this.references = pageObj.references;
        this.keywords = pageObj.keywords;
    }

    addNode (node) {
        this.nodes.push(node);
    }

    getNextNodeNum() {
        if (this.nodes.length === 0) {
            return "01";
        }
        else if (this.nodes.length >= 8) {
            return "";
        }
        // Search for the first available node num
        let nodeNums = [];
        for (let node of this.nodes) {
            nodeNums.push(parseInt(node.node_num));
        }
        let sortedNums = nodeNums.sort();
        let lastNodeNum = 0;
        let found = false;
        let nextNum = 0;
        for (let num of sortedNums) {
            if (num - 1 > lastNodeNum) {
                found = true;
                nextNum = lastNodeNum + 1;
                break;
            }
            else {
                lastNodeNum = num;
            }
        }
        if (!found) {
            nextNum = lastNodeNum + 1;
        }
        // Convert to numeric string
        if (nextNum < 10) {
            nextNum = "0" + nextNum;
        }
        else {
            nextNum = "" + nextNum;
        }
        return nextNum;
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

    addNode (node) {
        this.page.addNode(node);
    }

    getNextNodeNum() {
        return this.page.getNextNodeNum();
    }
}
