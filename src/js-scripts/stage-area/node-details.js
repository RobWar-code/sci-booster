const nodeDetails = {
    doNodeDetails: function (e) {
        if (!dfm.modelEditMode) return;

        let editMode="new";
        let stageCursorPos = dfm.stageApp.getPointerPosition();
        dfm.newNodeX = stageCursorPos.x;
        dfm.newNodeY = stageCursorPos.y;
        this.displayNodeDetailsModal(editMode);
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
        }
        console.log("Got to display node details");

        document.getElementById("nodeDetails").style.display = "block";
        document.getElementById("nodeErrors").style.display = "none";

    },

    dismissNodeDetails: function () {
        document.getElementById("nodeDetails").style.display = "none";
    },

    submitNodeDetails: function (event) {
        event.preventDefault();

        let node = new dfm.Node();

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

        node.node_num = document.getElementById("nodeNum").innerText;
        node.label = label;
        node.type = document.getElementById("nodeType").value;
        node.keywords = keywords;
        node.definition = definition;
        node.hyperlink = hyperlink;

        document.getElementById("nodeDetails").style.display = "none";

        dfm.currentPage.addNode(node);
        console.log("currentPage:", dfm.currentPage);
        console.log("nodeNum, newNodeX, newNodeY", node.node_num, dfm.newNodeX, dfm.newNodeY);
        dfm.currentVisual.addNode(label, node.node_num, dfm.newNodeX, dfm.newNodeY);
        console.log("nodeData:", dfm.currentVisual);
    }
}