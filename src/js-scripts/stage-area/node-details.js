const nodeDetails = {
    doNodeDetails: function (e) {
        if (dfm.modelEditMode != "edit") return;

        let editMode="new";
        let stageCursorPos = dfm.stageApp.getPointerPosition();
        dfm.newNodeX = stageCursorPos.x / dfm.scaleX;
        dfm.newNodeY = stageCursorPos.y;
        dfm.currentPage.nodeEditMode = "new";
        this.displayNodeDetailsModal(editMode);
    },

    viewNodeDetails: function (event) {
        console.log("viewNodeDetails: dfm.currentVisual.flowDrawMode - ", dfm.currentVisual.flowDrawMode);
        if (dfm.modelEditMode === "edit" && !dfm.currentVisual.flowDrawMode) {
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

        if (editMode === "new") {
            // Clear the modal form fields
            document.getElementById("nodeLabel").value = "";
            document.getElementById("nodeKeywords").value = "";
            document.getElementById("nodeDefinition").value = "";
            document.getElementById("nodeHyperlink").value = "";
            // Get the default node num
            let nodeNum = dfm.currentPage.getNextNodeNum();
            document.getElementById("nodeNum").innerText = nodeNum;
            document.getElementById("nodeDeleteButton").style.display = "none";
        }
        else {
            document.getElementById("nodeDeleteButton").style.display = "inline";
        }

        window.scrollTo(0,0);
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
        label = Misc.stripHTML(label).trim();
        if (label === "") {
            document.getElementById("nodeErrors").value = "Bad node label submitted";
            document.getElementById("nodeErrors").style.display = "block";
            return;
        }
        else if (label.length > dfm.maxNodeLabelLen) {
            document.getElementById("nodeErrors").value = `Label too long for display - > ${dfm.maxNodeLabelLen}`;
            document.getElementById("nodeErrors").style.display = "block";
            return;
        }
        else {
            // Check whether this label already appears on the page
            if (this.isDuplicateLabel(this.editMode, label)) {
                return;
            }
        }
        let keywords = document.getElementById("nodeKeywords").value;
        keywords = Misc.stripHTML(keywords).trim();
        let definition = document.getElementById("nodeDefinition").value;
        definition = Misc.stripHTML(definition).trim();
        let hyperlink = document.getElementById("nodeHyperlink").value;
        hyperlink = Misc.stripHTML(hyperlink).trim();

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
            node.id = null;
            node.x = dfm.newNodeX;
            node.y = dfm.newNodeY;
            dfm.currentPage.addNode(node);
            dfm.currentVisual.addNode(label, node.node_num, dfm.newNodeX, dfm.newNodeY);
        }
        else {
            // node is updated
            dfm.currentVisual.updateNode(label, nodeNum);
        }
        if (dfm.currentPage.page.nodes.length === 1) {
            document.getElementById("saveModelButton").style.display = "inline";
        }
    },

    isDuplicateLabel: function (editMode, label) {
        let nodes = dfm.currentPage.page.nodes;
        let found = false;
        let count = 0;
        for (let node of nodes) {
            if (node.label === label) {
                if (editMode === "new") {
                    found = true;
                    break;
                }
                else {
                    if (++count > 1) {
                        found = true;
                        break;
                    }
                }
            }
        }
        if (found) {
            document.getElementById("nodeErrors").value = "Duplicate node label submitted";
            document.getElementById("nodeErrors").style.display = "block";
            return true;
        }
        return false;
    },

    deleteNode: function () {
        // Get the node number from the form
        let nodeNum = document.getElementById("nodeNum").innerText;
        dfm.currentPage.deleteNode(nodeNum);
        dfm.currentVisual.deleteNode(nodeNum);
        dfm.modelChanged = true;
        document.getElementById("nodeDetails").style.display = "none";
        if (dfm.currentPage.page.nodes.length === 0) {
            document.getElementById("saveModelButton").style.display = "none";
        }
        else {
            document.getElementById("saveModelButton").style.display = "inline";
        }
    },

    doHoverText: function (event) {
        event.cancelBubble = true;
        let graphic = event.target;
        let text = graphic.getAttr("hoverText");
        let x = graphic.getAttr("x") + 10;
        let y = graphic.getAttr("y") - 25;
        let nodeNum = graphic.getAttr("nodeNum");
        let node = dfm.currentPage.getNode(nodeNum);
        x += node.x;
        y += node.y;
        displayHoverText(text, x, y);
    }
}