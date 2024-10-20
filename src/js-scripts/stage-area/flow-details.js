flowDetails = {
    flowDetailsSet: false,
    flowFormulasOpen: false,
    editMode: "",
    currentFlow: null,

    addNewFlow: function (event) {
        if (dfm.flowDrawMode || dfm.modelEditMode != "edit") {
            event.cancelBubble = true;
            return;
        }
        event.cancelBubble = true;
        this.displayFlowModal("new");
        this.flowDetailsSet = false;
        this.flowFormulasOpen = false;
        this.editMode = "new";
        this.currentFlow = new dfm.Flow();
    },

    viewFlowDetails: function (event) {
        event.cancelBubble = true;
        if (dfm.currentVisual.addingFlowLabel) {
            dfm.currentVisual.addingFlowLabel = false;
            return;
        }
        // Fetch the flow details
        let flowNum = event.target.getAttr("flowNum");
        this.currentFlow = dfm.currentPage.getFlow(flowNum);
        this.loadDisplayFields(this.currentFlow);
        let editMode = "";
        if (dfm.modelEditMode === "edit" && !dfm.flowDrawMode) {
            editMode = "edit";
            this.editMode = "edit";
            this.flowFormulasOpen = false;
            document.getElementById("drawFlowButton").style.display = "block";
            document.getElementById("flowDeleteButton").style.display = "inline";
            this.setDisableFlowDetailsEdit(false);
        }
        else {
            this.editMode = "";
            editMode = "";
            this.flowFormulasOpen = false;
            document.getElementById("drawFlowButton").style.display = "none";
            document.getElementById("flowDeleteButton").style.display = "none"
            this.setDisableFlowDetailsEdit(true);
        }
        this.displayFlowModal(editMode);
    },

    loadDisplayFields: function(flow) {
        document.getElementById("flowNum").innerText = flow.flow_num;
        document.getElementById("flowLabel").value = flow.label;
        document.getElementById("flowKeywords").value = flow.keywords;
        document.getElementById("flowSourceNodeNum").value = flow.source_node_num;
        document.getElementById("flowDestinationNodeNum").value = flow.destination_node_num;
        document.getElementById("flowDefinition").value = flow.definition;
        document.getElementById("flowHypertext").value = flow.hyperlink;
    },

    displayFlowModal: function(editMode) {
        document.getElementById("flowFormulasDiv").style.display = "none";
        if (editMode === "new") {
            this.clearValues();
            this.setDisableFlowDetailsEdit(false);
            document.getElementById("drawFlowButton").style.display = "none";
            document.getElementById("flowDeleteButton").style.display = "none";
        }
        dfm.currentVisual.lastWindowY = window.scrollY;
        window.scrollTo(0,0);
        document.getElementById("flowDetails").style.display = "block";
        document.getElementById("flowDetailsSubmit").style.display = "block";
        document.getElementById("flowDetailsError").style.display = "none";
        document.getElementById("formulaToggleWarning").style.display = "none";
    },

    clearValues: function () {
        let flowNum = dfm.currentPage.getNextFlowNum();
        document.getElementById("flowNum").innerText = flowNum;
        document.getElementById("flowLabel").value = "";
        document.getElementById("flowSourceNodeNum").value = "";
        document.getElementById("flowDestinationNodeNum").value = "";
        document.getElementById("flowKeywords").value = "";
        document.getElementById("flowDefinition").value = "";
        document.getElementById("flowHypertext").value = "";
        document.getElementById("flowFormula").value = "";
        document.getElementById("flowFormulaDescription").value = "";
    },

    setDisableFlowDetailsEdit: function (setting) {
        document.getElementById("flowLabel").disabled = setting;
        document.getElementById("flowSourceNodeNum").disabled = setting;
        document.getElementById("flowDestinationNodeNum").disabled = setting;
        document.getElementById("flowKeywords").disabled = setting;
        document.getElementById("flowDefinition").disabled = setting;
        document.getElementById("flowHypertext").disabled = setting;
        document.getElementById("flowFormula").disabled = setting;
        document.getElementById("flowFormulaDescription").disabled = setting;
        if (setting) {
            document.getElementById("flowDetailsSubmit").style.display = "none";
            document.getElementById("flowFormula").style.display = "none";
            document.getElementById("flowFormulaDescription").style.display = "none";
            document.getElementById("flowFormulaSubmit").style.display = "none";
        }
    },

    submitFlowDetails: function (event) {
        event.preventDefault();
        let errElem = document.getElementById("flowDetailsError");
        errElem.style.display = "none";
        // Check values
        let label = Misc.stripHTML(document.getElementById("flowLabel").value);
        if (label === "") {
            errElem.innerText = "Label not entered";
            errElem.style.display = "block";
            return;
        }
        else if (label.length > dfm.maxFlowLabelLen) {
            errElem.innerText = `Label too long for display - > ${dfm.maxFlowLabelLen}`;
            errElem.style.display = "block";
            return;
        }
        let flowNum = document.getElementById("flowNum").innerText;
        this.currentFlow.flow_num = flowNum;
        this.currentFlow.label = label;
        let sourceNodeNum = Misc.stripHTML(document.getElementById("flowSourceNodeNum").value).trim();
        // Check whether the given node num exists
        if (sourceNodeNum != "") {
            if (!dfm.currentPage.nodeExists(sourceNodeNum)) {
                errElem.innerText = "Source Node Num does not exist";
                errElem.style.display = "block";
                return;
            }
            this.currentFlow.source_node_num = sourceNodeNum; 
        }
        let destinationNodeNum = Misc.stripHTML(document.getElementById("flowDestinationNodeNum").value).trim();
        // Check whether the given node num exists
        if (destinationNodeNum != "") {
            if (!dfm.currentPage.nodeExists(destinationNodeNum)) {
                errElem.innerText = "Destination Node Num does not exist";
                errElem.style.display = "block";
                return;
            }
            this.currentFlow.destination_node_num = destinationNodeNum;
        }
        if (destinationNodeNum === "" && sourceNodeNum === "") {
            errElem.innerText = "At least either the source node or the destination node must be set";
            errElem.style.display = "block";
            return;
        }
        let keywords = Misc.stripHTML(document.getElementById("flowKeywords").value).trim();
        this.currentFlow.keywords = keywords;
        let definition = Misc.stripHTML(document.getElementById("flowDefinition").value).trim();
        this.currentFlow.definition = definition;
        let hypertext = Misc.stripHTML(document.getElementById("flowHypertext").value).trim();
        this.currentFlow.hypertext = hypertext;
        if (this.editMode === "new") {
            this.currentFlow.id = null;
            dfm.currentPage.addFlow(this.currentFlow);
        }
        else {
            dfm.currentPage.updateFlow(this.currentFlow);
            dfm.currentVisual.updateFlowLabel(flowNum);
        }
        document.getElementById("drawFlowButton").style.display = "block";
        this.flowDetailsSet = true;       
        dfm.modelChanged = true;
    },

    toggleFormulas: function () {
        if (this.flowFormulasOpen) {
            document.getElementById("flowFormulasDiv").style.display = "none";
            return;
        }
        if (!this.flowDetailsSet) {
            document.getElementById("formulaToggleWarning").style.display = "block";
            setTimeout(() => {
                document.getElementById("formulaToggleWarning").style.display = "none";
            }, 4000);
        }
        document.getElementById("flowFormulasDiv").style.display = "block";
        this.displayFlowFormulas();
        if (this.editMode === "edit" || this.editMode === "new") {
            document.getElementById("flowFormulasInputForm").style.display = "block";
            document.getElementById("formulaDeletePara").style.display = "block";
        }
        else {
            document.getElementById("flowFormulasInputForm").style.display = "none";
            document.getElementById("formulaDeletePara").style.display = "none";
        }
    },

    displayFlowFormulas: function () {
        this.flowFormulasOpen = true;
        let formulasListElem = document.getElementById("flowFormulasListDiv");
        let listHtml = '<ul class="modalFormList" id="flowFormulasList">';
        let count = 0;
        for (let formula of this.currentFlow.conversion_formulas) {
          listHtml += '<li>';
          listHtml += `<div data-item="${count}" onclick="flowDetails.deleteFormula(event)">`;
          listHtml += `<p class="modalFormListItem">Formula: ${formula.formula}</p>`;
          listHtml += `<p class="modalFormListItem">Description: ${formula.description}</p>`;
          listHtml += '<hr class="modalListHR" />';
          listHtml += '</div>';
          listHtml += '</li>';
          ++count;
        }
        listHtml += '</ul>';
        formulasListElem.innerHTML = listHtml;
        formulasListElem.style.display = "block";
    },

    deleteFormula: function(event) {
        if (this.editMode != "edit" && this.editMode != "new") return;
        let itemNum = parseInt(event.target.dataset.item);
        this.currentFlow.conversion_formulas.splice(itemNum, 1);
        dfm.currentPage.updateFlow(this.currentFlow);
        this.displayFlowFormulas();
    },

    submitFormula: function(event) {
        event.preventDefault();
        let formula = Misc.stripHTML(document.getElementById("flowFormula").value).trim();
        let description = Misc.stripHTML(document.getElementById("flowFormulaDescription").value).trim();
        if (formula != "") {
            let conversion_formula = {id: null, formula: formula, description: description};
            this.currentFlow.conversion_formulas.push(conversion_formula);
            dfm.currentPage.updateFlow(this.currentFlow);
            this.displayFlowFormulas();
        }
        dfm.modelChanged = true;
    },

    deleteFlow: function() {
        if (this.currentFlow.flow_num === "") {
            return;
        }
        let flowNum = this.currentFlow.flow_num;
        dfm.currentVisual.deleteFlow(flowNum);
        dfm.currentPage.deleteFlow(flowNum);
        document.getElementById("flowDetails").style.display = "none";
        dfm.modelChanged = true;
        document.getElementById("saveModelButton").style.display = "inline";
    },

    dismissFlowDetails: function() {
        let flowNum = this.currentFlow.flow_num;
        let flow = dfm.currentPage.getFlow(flowNum);
        if (flow != null) {
            if (flow.points.length === 0) {
                dfm.currentPage.deleteFlow(flowNum);
            }
        }
        document.getElementById("flowDetails").style.display = "none";
        window.scrollTo(0, dfm.currentVisual.lastWindowY);
    },
    
    drawFlow: function() {
        // Scroll back to edit position
        window.scrollTo(0, dfm.currentVisual.lastWindowY);

        dfm.flowDrawMode = true;
        console.log("flowDetails editMode:", this.editMode);
        if (this.editMode === "new") {
            dfm.currentVisual.initialiseFlowDraw(this.currentFlow);
        }
        else {
            dfm.currentVisual.initialiseFlowEdit(this.currentFlow);
        }
        document.getElementById("flowDetails").style.display = "none";
        flowModelPage.displayModelEditOptions();

        let instructElem = document.getElementById("instructionsText");
        let s = "Click the stage to draw the flow corner node by corner node."; 
        s += " Double-click the stage to add the flow label.";
        s += " Drag and drop the label to move it."
        s += " To adjust a node drag and drop the marker circle. To delete it, double click the marker.";
        s += " Click a line to add the flow arrow.";
        s += " Double click the flow arrow to delete it.";
        instructElem.innerText = s;
        instructElem.style.display = "block";
    },

    doHoverText: function (event) {
        event.cancelBubble = true;
        let graphic = event.target;
        let text = graphic.getAttr("hoverText");
        let x = graphic.getAttr("x") + 10;
        let y = graphic.getAttr("y") - 25;
        let flowNum = graphic.getAttr("flowNum");
        let flow = dfm.currentPage.getFlow(flowNum);
        x += flow.label_x + flow.drawing_group_x;
        y += flow.label_y + flow.drawing_group_y;
        dfm.hoverText.displayHoverText(text, x, y);
    },

    doHyperlink: function () {
        let hyperlink = document.getElementById("flowHypertext").value;
        if (hyperlink === "") return;

        window.open(hyperlink, "_blank");

    }

}