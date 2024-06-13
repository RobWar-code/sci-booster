// Flow Model and Flow Page Definitions

dfm.FlowPage = class {
    constructor() {
        this.id = null; // If known
        this.hierarchical_id = "";
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
        this.hierarchical_id = pageObj.hierarchical_id;
        this.title = pageObj.title;
        this.description = pageObj.description;
        this.authors = pageObj.authors;
        this.references = pageObj.references;
        this.keywords = pageObj.keywords;
    }

    setPageData(page) {
        this.set(page);
        this.nodes = page.nodes;
        this.flows = page.flows;
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
            this.nodes.splice(index, 1);
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

    getFlow(flowNum) {
        let flow = null;
        let index = this.findFlow(flowNum);
        if (index === -1) {
            return null;
        }
        return this.flows[index];
    }

    findFlow(flowNum) {
        let found = false;
        let count = 0;
        for (let flow of this.flows) {
            if (flow.flow_num === flowNum) {
                found = true;
                break;
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

    getFlow(flowNum) {
        return this.page.getFlow(flowNum);
    }
    
    findFlow(flowNum) {
        return this.page.findFlow(flowNum);
    }

    addFlow(flow) {
        this.page.flows.push(flow);
        console.log("Flows at addFlow:", this.page.flows);
    }

    updateFlow(flow) {
        let flowNum = flow.flow_num;
        let itemNum = this.findFlow(flowNum);
        if (itemNum != -1) {
            this.deleteFlowItem(itemNum);
        }
        this.addFlow(flow);
    }

    deleteFlow(flowNum) {
        let itemNum = this.findFlow(flowNum);
        if (itemNum > -1) {
            this.deleteFlowItem(itemNum);
        }
    }
    
    deleteFlowItem(itemNum) {
        if (this.page.flows.length === 1) {
            this.page.flows = [];
        }
        else {
            this.page.flows.splice(itemNum, 1);
            console.log("Deleted flow:", this.page.flows);
        }
    }

    // Server Interface
    async saveModel() {
        let pageJSONObject = this.prepareJSONObject();
        let pageJSON = JSON.stringify(pageJSONObject);
        console.log("pageJSON:", pageJSON);
        let responseData = await this.sendPage(pageJSON);
        if (responseData.result) {
            /*
            this.setPageData(pageData);
            dfm.currentVisual.redoPage();
            */
        }
    }

    async sendPage(pageJSON) {
        try {
            let response = await fetch(dfm.phpPath + 'flow-model/receive-page.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: pageJSON
            })

            let responseData = await response.json();

            console.log("responseData:", responseData);
            return responseData;
        }
        catch {(error) => {
            console.error("Problem with receive-page script call", error);
            return {result: false, error: "addUser Systems Error"};
        }};

    }

    prepareJSONObject() {
        let pageJSONObj = {
            flow_model_id: this.id,
            page: {
                id: this.page.id,
                hierarchical_id: this.page.hierarchical_id,
                title: this.page.title,
                keywords: this.page.keywords,
                description: this.page.description,
                authors: [],
                references: [],
                nodes: [],
                flows: []
            }
        }     
        for (let author of this.page.authors) {
            pageJSONObj.page.authors.push(author);
        }
        for (let ref of this.page.references) {
            pageJSONObj.page.references.push(ref);
        }
        for (let node of this.page.nodes) {
            pageJSONObj.page.nodes.push(node);
        }
        for (let flow of this.page.flows) {
            pageJSONObj.page.flows.push(flow);
        }
        console.log("Page Obj:", pageJSONObj);
        return pageJSONObj;
    }

    setPageData(pageData) {
        this.flow_model_id = pageData.flow_model_id;
        let page = pageData.page;
        this.page.setPageData(page);
    }
}
