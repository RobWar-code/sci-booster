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

    getNode (nodeNum) {
        let found = false;
        let index = 0;
        for (let node of this.nodes) {
            if (node.node_num === nodeNum) {
                let found = true;
                break;
            }
            ++index;
        }
        if (found) {
            return {node: node, index: index};
        }
        else {
            return null;
        }
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

    deleteNode(nodeNum) {
        if (this.nodes.length === 0) return;
        let nodeObj = this.getNode(nodeNum);
        if (nodeObj) {
            let index = nodeObj.index;
            if (index === 0) {
                this.nodes = this.nodes.splice(1);
            }
            else {
                this.nodes = this.nodes.splice(index, 1);
            }
        }
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

    getNode (nodeNum) {
        let nodeObj = this.page.getNode(nodeNum);
        let node = null;
        if (nodeObj) {
            node = nodeObj.node;
        }
        return node;
    }

    getNextNodeNum() {
        return this.page.getNextNodeNum();
    }

    deleteNode(nodeNum) {
        this.page.deleteNode(nodeNum);
    }
}
