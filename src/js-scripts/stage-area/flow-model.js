// Flow Model and Flow Page Definitions

dfm.FlowPage = class {
    constructor() {
        this.id = null; // If known
        this.hierarchical_id = "";
        this.title = "";
        this.description = "";
        this.user_authors = [];
        this.external_authors = [];
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
        this.user_authors = pageObj.user_authors;
        this.external_authors = pageObj.external_authors;
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

    setNodeCoords (nodeNum, x, y) {
        let nodeObj = this.getNode(nodeNum);
        if (nodeObj != null) {
            nodeObj.node.x = x;
            nodeObj.node.y = y;
        }
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
        this.flow_model_title = "";
        this.update = false;
        this.page = new dfm.FlowPage();
        this.nodeEditMode = "new"; // "new" or "update"
    }

    isUserAuthor() {
        let userIsAuthor = false;
        for (let i = 0; i < this.page.user_authors.length; i++) {
            if (dfm.username === this.page.user_authors[i]) {
                userIsAuthor = true;
                break;
            }
        }
        return userIsAuthor;
    }

    addPage(pageObj) {
        this.page.set(pageObj);
    }


    setModelDetails(title, description, keywords) {
        let change = false;
        if (this.page.title != title) change = true;
        this.page.title = title;
        if (this.page.description != description) change = true;
        this.page.description = description;
        if (this.page.keywords != keywords) change = true;
        this.page.keywords = keywords;
        return change;
    }
    
    addNode (node) {
        this.page.addNode(node);
    }

    setNodeCoords (nodeNum, x, y) {
        this.page.setNodeCoords(nodeNum, x, y);
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
        }
    }

    // Server Interface
    async selectModel(e) {
        let modelTitle = e.target.value;

        if (modelTitle != "") {
            let pageData = await this.fetchModelByTitle(modelTitle);
            if (!pageData) {
                console.error(`could not fetch model - ${modelTitle}`);
                return;
            }
            if (pageData.result) {
                this.setPageData(pageData);
                this.update = true;
                dfm.currentVisual.redoPage();
            }
            else {
                console.error(`selectModel: could not fetch selected model ${modelTitle}`);
            }
        }
    }

    async fetchModelByTitle(title) {
        let request = {request: "fetch model by title", title: title};
        let requestJSON = JSON.stringify(request);
        try {
            let response = await fetch(dfm.phpPath + 'flow-model/receive-page.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: requestJSON
            })

            let responseData = await response.json();

            return responseData;
        }
        catch {(error) => {
            console.error("Problem with fetch by title receive-page script call", error);
            return {result: false, error: "addUser Systems Error"};
        }};

    }

    /**
     * Save the current model to the database. If the reload option is true
     * then the page is reloaded
     * @param {*} reload 
     */
    async saveModel(reload) {
        let pageJSONObject = this.prepareJSONObject();
        console.log("saveModel:", pageJSONObject);
        let pageJSON = JSON.stringify(pageJSONObject);
        let pageData = await this.sendPage(pageJSON);
        if (pageData.result) {
            if (reload) {
                dfm.currentVisual.destroyCurrentPage();
                this.setPageData(pageData);
                this.update = true;
                dfm.currentVisual.redoPage();
            }
            // Re-do the titles list
            if (dfm.currentPage.page.hierarchical_id === '01') {
                flowModelPage.getModelSelectionList();
            }
            // Inform user
            flowModelPage.issueNotice("Saved Successfully");
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
            flow_model_title: this.flow_model_title,
            update: this.update,
            page: {
                id: this.page.id,
                hierarchical_id: this.page.hierarchical_id,
                title: this.page.title,
                keywords: this.page.keywords,
                description: this.page.description,
                user_authors: [],
                external_authors: [],
                references: [],
                nodes: [],
                flows: []
            }
        }     
        for (let authorItem of this.page.user_authors) {
            pageJSONObj.page.user_authors.push(authorItem);
        }
        for (let authorItem of this.page.external_authors) {
            pageJSONObj.page.external_authors.push(authorItem);
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
        return pageJSONObj;
    }

    setPageData(pageData) {
        this.flow_model_id = pageData.flow_model_id;
        this.flow_model_title = pageData.flow_model_title;
        let page = pageData.page;
        this.page.setPageData(page);
    }

    async deletePage() {
        // Check with the user
        let result = await flowModelPage.deletePageRequired("Are sure you want to delete the page and its children?");
        if (result === "yes") {
            await this.doDeletePage();
            flowModelPage.getModelSelectionList();
            flowModelPage.cancelModel();
        }
    }

    async doDeletePage() {
        let pageId = this.page.id;
        let message = {request: "delete page by id", page_id: pageId};
        let messageJSON = JSON.stringify(message);
        try {
            let response = await fetch(dfm.phpPath + 'flow-model/receive-page.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: messageJSON
            })

            let responseData = await response.json();

            return responseData;
        }
        catch {(error) => {
            console.error("Problem with receive-page script call", error);
        }};
    }

    async userExists(username) {
        let message = {request: "find user", username: username};
        let messageJSON = JSON.stringify(message);
        try {
            let response = await fetch(dfm.phpPath + 'flow-model/receive-page.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: messageJSON
            })

            let responseData = await response.json();

            if (responseData.result === true) {
                return true;
            }
            else {
                return false;
            }
        }
        catch {(error) => {
            console.error("Problem with receive-page script call - userExists()", error);
        }};


    }
}
