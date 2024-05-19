const nodeDetails = {
    doNodeDetails: function (e) {
        if (!dfm.modelEditMode) return;

        let editMode="new";
        let stageCursorPos = dfm.stageApp.getPointerPosition();
        dfm.newNodeX = stageCursorPos.x;
        dfm.newNodeY = stageCursorPos.y;
        dfm.currentPage.nodeEditMode = "new";
        this.displayNodeDetailsModal(editMode);
    },

    viewNodeDetails: function (event) {
        if (dfm.currentVisual.flowDrawMode) {
            event.cancelBubble = true;
            return;
        }
        if (dfm.modelEditMode) {
            this.setInputDisabledStatus(false);
            dfm.currentPage.nodeEditMode = "update";
        }
        else {
            this.setInputDisabledStatus(true);
        }
        let nodeNum = event.target.getAttr("nodeNum");
        this.setNodeForm(nodeNum);
        this.displayNodeDetailsModal("view");
        // Prevent stage click
        event.cancelBubble = true;
    },

    setNodeForm(nodeNum) {
        let node = dfm.currentPage.getNode(nodeNum);
        console.log("setNodeForm, nodeNum, node:", nodeNum, node);
        if (node) {
            document.getElementById("nodeNum").innerText = nodeNum;
            document.getElementById("nodeLabel").value = node.label;
            document.getElementById("nodeType").value = node.type;
            document.getElementById("nodeKeywords").value = node.keywords;
            document.getElementById("nodeDefinition").value = node.definition;
            document.getElementById("nodeHyperlink").value = node.hyperlink;
        }
    },

    setInputDisabledStatus: function (setting) {
        document.getElementById("nodeLabel").disabled = setting;
        document.getElementById("nodeType").disabled = setting;
        document.getElementById("nodeKeywords").disabled = setting;
        document.getElementById("nodeDefinition").disabled = setting;
        document.getElementById("nodeHyperlink").disabled = setting;
        if (!setting) {
            document.getElementById("nodeDeleteButton").style.display = "inline";
            document.getElementById("nodeDetailsSubmit").style.display = "inline";
        }
        else {
            document.getElementById("nodeDeleteButton").style.display = "none";
            document.getElementById("nodeDetailsSubmit").style.display = "none";
        }
        document.getElementById("nodeErrors").style.display = "none";
    },

    displayNodeDetailsModal: function (editMode) {

        console.log("Got to display node details, editMode:", editMode);

        if (editMode === "new") {
            // Clear the modal form fields
            document.getElementById("nodeLabel").value = "";
            document.getElementById("nodeKeywords").value = "";
            document.getElementById("nodeDefinition").value = "";
            document.getElementById("nodeHyperlink").value = "";
            // Get the default node num
            let nodeNum = dfm.currentPage.getNextNodeNum();
            document.getElementById("nodeNum").innerText = nodeNum;
        }

        document.getElementById("nodeDetails").style.display = "block";
        document.getElementById("nodeErrors").style.display = "none";

    },

    dismissNodeDetails: function () {
        document.getElementById("nodeDetails").style.display = "none";
    },

    submitNodeDetails: function (event) {
        event.preventDefault();


        // Check the field contents
        let label = document.getElementById("nodeLabel").value;
        label = Misc.stripHTML(label);
        if (label === "") {
            document.getElementById("nodeErrors").value = "Bad node label submitted";
            document.getElementById("nodeErrors").style.display = "block";
            return;
        }
        let keywords = document.getElementById("nodeKeywords").value;
        keywords = Misc.stripHTML(keywords);
        let definition = document.getElementById("nodeDefinition").value;
        definition = Misc.stripHTML(definition);
        let hyperlink = document.getElementById("nodeHyperlink").value;
        hyperlink = Misc.stripHTML(hyperlink);

        let nodeNum = document.getElementById("nodeNum").innerText;
        let node = null; 
        if (dfm.currentPage.nodeEditMode === "new") {
            node = new dfm.Node();
            node.node_num = nodeNum;
        }
        else {
            node = dfm.currentPage.getNode(nodeNum);
        }
        node.label = label;
        node.type = document.getElementById("nodeType").value;
        node.keywords = keywords;
        node.definition = definition;
        node.hyperlink = hyperlink;

        document.getElementById("nodeDetails").style.display = "none";

        if (dfm.currentPage.nodeEditMode === "new") {
            dfm.currentPage.addNode(node);
            dfm.currentVisual.addNode(label, node.node_num, dfm.newNodeX, dfm.newNodeY);
        }
        else {
            // node is updated
            dfm.currentVisual.updateNode(label, nodeNum);
        }
        console.log("submitNodeDetails - currentPage:", dfm.currentPage);
        console.log("nodeNum, newNodeX, newNodeY", node.node_num, dfm.newNodeX, dfm.newNodeY);
        console.log("nodeData:", dfm.currentVisual);
    },

    deleteNodeDetails: function () {
        // Get the node number from the form
        let nodeNum = document.getElementById("nodeNum").innerText;
        dfm.currentPage.deleteNode(nodeNum);
        dfm.currentVisuals.deleteNode(nodeNum);
        document.getElementById("nodeDetails").style.display = "none";
    },

    doHoverText: function (event) {
        let graphic = event.target;
        let text = graphic.getAttr("hoverText");
        let x = graphic.getAttr("x") + 25;
        let y = graphic.getAttr("y") - 10;
        displayHoverText(text, x, y);
    }
}