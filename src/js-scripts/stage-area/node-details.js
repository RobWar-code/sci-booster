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
        if (dfm.modelEditMode === "edit" && !dfm.flowDrawMode) {
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

        if (dfm.modelEditMode === "edit") {
            document.getElementById("nodeGraphicDiv").style.display = "block";
        }
        else {
            document.getElementById("nodeGraphicDiv").style.display = "none";
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
        let graphicFile = document.getElementById("nodeGraphicFile").value;
        graphicFile = Misc.stripHTML(graphicFile);
        let graphicText = document.getElementById("nodeGraphicText").value;
        graphicText = Misc.stripHTML(graphicText);
        let graphicCredits = document.getElementById("nodeGraphicCredits").value;
        graphicText = Misc.stripHTML(graphicCredits);
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
        node.graphic_file = graphicFile;
        node.graphic_text = graphicText;
        node.graphic_credits = graphicCredits;
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
            dfm.currentVisual.addNode(node, node.node_num, dfm.newNodeX, dfm.newNodeY);
        }
        else {
            // node is updated
            dfm.currentVisual.updateNode(label, nodeNum);
        }
        if (dfm.currentPage.page.nodes.length > 0) {
            document.getElementById("saveModelButton").style.display = "inline";
        }
        dfm.modelChanged = true;
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

    startDeleteNode: async function () {
        // Get the node number from the form
        let nodeNum = document.getElementById("nodeNum").innerText;
        // Check whether the node has child page(s)
        let node = dfm.currentPage.getNode(nodeNum);
        if (node.has_child_page) {
            $message = "This node has child pages - to remove this node the child pages must be deleted - proceed?";
            $response = await flowModelPage.deleteNodeRequired($message);
            if ($response === "yes") {
                if (await dfm.currentPage.deleteDatabaseNodeAndChildren(node)) {
                    this.deleteNode(nodeNum);
                }
            }
            else {
                return;
            }
        }
    },

    deleteNode: function (nodeNum) {
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
        dfm.hoverText.displayHoverText(text, x, y);
    },

    doHyperlink: function (event) {
        event.cancelBubble = true;
        let nodeNum = event.target.getAttr("nodeNum");
        let node = dfm.currentPage.getNode(nodeNum);
        if (node.hyperlink === "") return;

        window.open(node.hyperlink, "_blank");
    },

    uploadNodeGraphic: async function (event) {
        event.preventDefault();
        const fileInput = document.getElementById("nodeGraphicInput");
        const file = fileInput.files[0];
        document.getElementById("nodeGraphicFile").value = "";
        document.getElementById("nodeErrors").style.display = "none";
        if (file) {
            let filename = file.name;
            let formData = new FormData();
            formData.append('file', file);
            formData.append('username', dfm.username);
            let progname = `${dfm.phpPath}flow-model/upload-node-graphic.php`;
            fetch(progname, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.result === true) {
                    document.getElementById("nodeGraphicFile").value = dfm.username + "/" + filename;
                }
                else {
                    document.getElementById("nodeErrors").innerText = `Problem uploading file ${filename}`;
                    document.getElementById("nodeErrors").style.display = "block";
                }
            })
            .catch (error => {
                document.getElementById("nodeErrors").innerText = `Problem uploading file ${filename}`;
                document.getElementById("nodeErrors").style.display = "block";
                console.error("Problem uploading graphic file " + filename + " " + error);
            });
        }
    }
}