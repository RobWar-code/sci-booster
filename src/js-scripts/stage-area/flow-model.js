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
        this.maxNodes = 8;
        this.nodes = []; // [Node objects]
        this.maxFlows = 99;
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
        let node = {};
        for (node of this.nodes) {
            if (node.node_num === nodeNum) {
                found = true;
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
        else if (this.nodes.length >= this.maxNodes) {
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

    nodeExists(nodeNum) {
        let found = false;
        for (let node of this.nodes) {
            if (node.node_num === nodeNum) {
                found = true;
                break;
            }
        }
        return found;
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

    getNextFlowNum() {
        if (this.flows.length === 0) {
            return "01";
        }
        else if (this.flows.length >= this.maxFlows) {
            return "";
        }
        // Search for the first available node num
        let flowNums = [];
        for (let flow of this.flows) {
            flowNums.push(parseInt(flow.flow_num));
        }
        let sortedNums = flowNums.sort();
        let lastFlowNum = 0;
        let found = false;
        let nextNum = 0;
        for (let num of sortedNums) {
            if (num - 1 > lastFlowNum) {
                found = true;
                nextNum = lastFlowNum + 1;
                break;
            }
            else {
                lastFlowNum = num;
            }
        }
        if (!found) {
            nextNum = lastFlowNum + 1;
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

    findFlow(flowNum) {
        let found = false;
        let count = 0;
        for (let flow of this.flows) {
            if (flow.flow_num === flowNum) {
                found = true;
            }
            ++count;
        }
        if (!found) return -1;
        else return count;
    }

}

dfm.FlowPageData = class {
    constructor() {
        this.id = null; // If known
        this.page = new dfm.FlowPage();
        this.nodeEditMode = "new"; // "new" or "update"
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

    nodeExists(nodeNum) {
        return this.page.nodeExists(nodeNum);
    }

    deleteNode(nodeNum) {
        this.page.deleteNode(nodeNum);
    }

    getNextFlowNum() {
        return this.page.getNextFlowNum();
    }

    findFlow(flowNum) {
        this.page.findFlow(flowNum);
    }

    addFlow(flow) {
        this.page.flows.push(flow);
    }

    updateFlow(flow) {
        let flowNum = flow.flow_num;
        let itemNum = this.findFlow(flowNum);
        if (itemNum != -1) {
            this.deleteFlowItem(itemNum);
        }
        this.addFlow(flow);
    }

    deleteFlowItem(itemNum) {
        this.page.flows = this.page.flows.splice(itemNum, 1);
    }
}
