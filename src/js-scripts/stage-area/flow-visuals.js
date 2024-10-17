// The flow diagram visual data and processing class
dfm.FlowVisuals = class {
    constructor() {
        this.active = false;
        this.lastWindowY = 0;
        this.drawFlowNum = "";
        this.flowNodeCount = 0;
        this.drawFlowClickTime = 0;
        this.flowNodeClickTime = 0;
        this.lastFlowNodeClicked = -1;
        this.flowLineClickTime = 0;
        this.flowLineClickTimer = null;
        this.lastFlowLineClicked = -1;
        this.flowArrowClickTime = 0;
        this.flowArrowAdded = false;
        this.flowLabelSet = false;
        this.flowDrawStarted = false;
        this.flowDrawTimeout = null;
        this.currentFlow = {};
        this.currentFlowDrawing = {};
        this.flowClickX = 0;
        this.flowClickY = 0;
        this.addingFlowLabel = false;
        this.terminatingFlowNodeNum = 0;
        this.lastX = 0;
        this.lastY = 0;
        this.nodeTemplate = {
            active: false,
            nodeNum: "00",
            label: "",
            nodeGroup: null,
            rect: {},
            labelText: "",
            detailsOpt: null,
            zoomDetailsOpt: null,
            flowLinkOpt: null,
            hyperlinkOpt: null
        }
        this.nodes = []
        this.flowTemplate = {
            active: false,
            flowNum: "00",
            label: "",
            flowGroup: null,
            flowArrow: {},
            graphicLabel: {},
            points: [] // [{x:, y:}]
        }
        this.flows = [];
        this.setStageDetails();
    }

    setStageDetails() {
        dfm.stageApp.destroy();
        this.nodeLayer = stageApp.startStageApp();
    }

    redoPage() {
        this.redoNodes();
        this.redoFlows();
        this.currentVisualsSet = true;
        dfm.currentPageSet = true;
    }

    redoNodes() {
        for (let node of dfm.currentPage.page.nodes) {
            let nodeNum = node.node_num;
            let x = node.x;
            let y = node.y;
            this.addNode(node, nodeNum, x, y);
        }
    }

    redoFlows() {
        this.flows = [];
        for (let flow of dfm.currentPage.page.flows) {
            let visualFlowDrawing = this.makeVisualFlow(flow);           
            // Add the flow line drawing to the visual data
            this.flows.push(visualFlowDrawing);
        }
    }

    destroyCurrentPage() {
        this.nodeLayer.destroy();
        dfm.stageApp.draw();
        this.setStageDetails();
        this.nodes = [];
        this.flows = [];
        dfm.currentVisualsSet = false;
    }

    addNode(nodeItem, nodeNum, x, y) {
        let node = Misc.copyObject(this.nodeTemplate);
        node.active = true;
        node.nodeNum = nodeNum;
        let label = nodeItem.label;
        node.label = label;
        node.nodeGroup = new Konva.Group({
            x: x,
            y: y,
            nodeNum: nodeNum
        });
        node.nodeGroup.setAttr("draggable", true);
        node.nodeGroup.on("dragstart", (e) => this.nodeDragStart(e));
        node.nodeGroup.on("dragmove", (e) => this.nodeDragMove(e));
        node.nodeGroup.on("dragend", (e) => this.nodeDragEnd(e));
        node.rect = new Konva.Rect({
            x: 0,
            y: 0,
            width: dfm.nodeTemplate.width,
            height: dfm.nodeTemplate.height,
            stroke: 'black',
            strokeWidth: 2
        });
        node.labelText = new Konva.Text({
            x: dfm.nodeTemplate.textLeft,
            y: dfm.nodeTemplate.textTop,
            text: nodeNum + " " + label,
            width: dfm.nodeTemplate.width - 6,
            fontSize: dfm.nodeTemplate.fontSize,
            fontFamily: dfm.nodeTemplate.fontFamily,
            fill: 'black'
        });
        let optionMargin = (dfm.nodeTemplate.width - (GLOBALS.numNodeOptions * dfm.nodeTemplate.optionWidth)) / (GLOBALS.numNodeOptions + 1);
        node.detailsOpt = new Konva.Image({
            x: optionMargin,
            y: dfm.nodeTemplate.optionTop,
            image: dfm.nodeGraphics.details,
            width: dfm.nodeTemplate.optionWidth,
            height: dfm.nodeTemplate.optionHeight,
            nodeNum: nodeNum,
            hoverText: "Node Details"
        });
        let imageGraphic = dfm.nodeGraphics.graphicPresent;
        if (nodeItem.graphic_file === "") {
            imageGraphic = dfm.nodeGraphics.graphicAbsent;
        }
        node.graphicOpt = new Konva.Image({
            x: dfm.nodeTemplate.optionWidth + optionMargin * 2,
            y: dfm.nodeTemplate.optionTop,
            image: imageGraphic,
            width: dfm.nodeTemplate.optionWidth,
            height: dfm.nodeTemplate.optionHeight,
            nodeNum: nodeNum,
            hoverText: "Graphic"
        });
        let zoomGraphic = dfm.nodeGraphics.zoomAbsent;
        if (nodeItem.has_child_page) {
            zoomGraphic = dfm.nodeGraphics.zoomPresent;
        }
        node.zoomDetailsOpt = new Konva.Image({
            x: dfm.nodeTemplate.optionWidth * 2 + optionMargin * 3,
            y: dfm.nodeTemplate.optionTop,
            image: zoomGraphic,
            width: dfm.nodeTemplate.optionWidth,
            height: dfm.nodeTemplate.optionHeight,
            nodeNum: nodeNum,
            hoverText: "Zoom Page"
        });
        node.flowLinkOpt = new Konva.Image({
            x: dfm.nodeTemplate.optionWidth * 3 + optionMargin * 4,
            y: dfm.nodeTemplate.optionTop,
            image: dfm.nodeGraphics.flowLink,
            width: dfm.nodeTemplate.optionWidth,
            height: dfm.nodeTemplate.optionHeight,
            nodeNum: nodeNum,
            hoverText: "Flow Link"
        });
        let linkGraphic = dfm.nodeGraphics.hyperlinkPresent;
        if (nodeItem.hyperlink === "") {
            linkGraphic = dfm.nodeGraphics.hyperlinkAbsent;
        }
        node.hyperlinkOpt = new Konva.Image({
            x: dfm.nodeTemplate.optionWidth * 4 + optionMargin * 5,
            y: dfm.nodeTemplate.optionTop,
            image: linkGraphic,
            width: dfm.nodeTemplate.optionWidth,
            height: dfm.nodeTemplate.optionHeight,
            nodeNum: nodeNum,
            hoverText: "Hyperlink"
        });

        // Events
        node.detailsOpt.on("click", (event) => nodeDetails.viewNodeDetails(event));
        node.detailsOpt.on("mouseover", (event) => nodeDetails.doHoverText(event));
        node.graphicOpt.on("click", (event) => dfm.nodeGraphic.viewNodeGraphic(event));
        node.graphicOpt.on("mouseover", (event) => nodeDetails.doHoverText(event));
        node.zoomDetailsOpt.on("click", (event) => flowModelPage.zoomPage(event));
        node.zoomDetailsOpt.on("mouseover", (event) => nodeDetails.doHoverText(event));
        node.flowLinkOpt.on("click", (event) => flowDetails.addNewFlow(event));
        node.flowLinkOpt.on("mouseover", (event) => nodeDetails.doHoverText(event));
        node.hyperlinkOpt.on("click", (event) => nodeDetails.doHyperlink(event));
        node.hyperlinkOpt.on("mouseover", (event) => nodeDetails.doHoverText(event));

        // Assemble items
        node.nodeGroup.add(node.rect);
        node.nodeGroup.add(node.labelText);
        node.nodeGroup.add(node.detailsOpt);
        node.nodeGroup.add(node.graphicOpt);
        node.nodeGroup.add(node.zoomDetailsOpt);
        node.nodeGroup.add(node.flowLinkOpt);
        node.nodeGroup.add(node.hyperlinkOpt);
        this.nodeLayer.add(node.nodeGroup);
        this.nodeLayer.draw();
        dfm.currentVisualsSet = true;
        this.nodes.push(node);
    }

    nodeDragStart(event) {
        event.cancelBubble = true;
    }

    nodeDragMove(event) {
        event.cancelBubble = true;
        if (dfm.modelEditMode != "edit" || dfm.flowDrawMode) {
            let nodeNum = event.target.getAttr("nodeNum");
            let node = dfm.currentPage.getNode(nodeNum);
            event.target.position({x: node.x, y: node.y});
            this.nodeLayer.draw();
            return;
        }
    }

    nodeDragEnd(event) {
        if (dfm.modelEditMode != "edit" || dfm.flowDrawMode) {
            event.cancelBubble = true;
            return
        }
        let nodeNum = event.target.getAttr("nodeNum");
        let x = event.target.getAttr("x");
        let y = event.target.getAttr("y");
        // Update the page data
        let node = dfm.currentPage.getNode(nodeNum);
        if (node != null) {
            node.x = x;
            node.y = y;
            dfm.modelChanged = true;
            document.getElementById("saveModelButton").style.display = 'inline';
        }
    }

    getNode(nodeNum) {
        let found = false;
        let index = 0;
        let node = {};
        for (node of this.nodes) {
            if (node.nodeNum === nodeNum) {
                found = true;
                break;
            }
            ++index;
        }
        if (found) {
            return {found: true, node: node, index: index};
        }
        else {
            return {found: false};
        }
    }

    updateNode(label, nodeNum) {
        let nodeObj = this.getNode(nodeNum);
        let nodeItem = dfm.currentPage.getNode(nodeNum);
        if (nodeObj.found) {
            nodeObj.node.label = label;
            let linkGraphic = dfm.nodeGraphics.hyperlinkPresent;
            if (nodeItem.hyperlink === "") {
                linkGraphic = dfm.nodeGraphics.hyperlinkAbsent;
            }
            nodeObj.node.hyperlinkOpt.setAttr("image", linkGraphic);
            let imageGraphic = dfm.nodeGraphics.graphicPresent;
            if (nodeItem.graphic_file === "") {
                imageGraphic = dfm.nodeGraphics.graphicAbsent;
            }
            nodeObj.node.graphicOpt.setAttr("image", imageGraphic);
            nodeObj.node.labelText.setAttr("text", nodeNum + " " + label);
            nodeObj.node.nodeGroup.draw();
        }
    }

    deleteNode (nodeNum) {
        if (this.nodes.length === 0) return;
        let nodeObj = this.getNode(nodeNum);
        if (!nodeObj.found) return;
        let node = nodeObj.node;
        let index = nodeObj.index;
        node.nodeGroup.destroy();
        this.nodeLayer.draw();
        this.nodes.splice(index, 1);
    }

    // Flow Drawing Procedures
    initialiseFlowDraw(flowDetails) {
        this.currentFlow = flowDetails;
        this.flowNodeCount = 0;
        this.flowLabelSet = false;
        this.currentFlowDrawing = Misc.copyObject(this.flowTemplate);
        this.currentFlowDrawing.flowNum = flowDetails.flow_num;
        this.flowDrawStarted = false;
        this.flowNodeClickTime = 0;
        this.lastFlowNodeClicked = -1;
        this.drawFlowClickTime = 0;
        this.flowLineClickedTime = 0;
        this.flowLineClickTimer = null;
        this.lastFlowLineClicked = -1;
        this.flowArrowAdded = false;
        this.addingFlowLabel = false;
        this.flowArrowClickTime = 0;
    }

    initialiseFlowEdit(flowDetails) {
        this.currentFlow = flowDetails;
        // Remove the non-editable version of the flow line
        let flowNum = flowDetails.flow_num;
        let flow = this.getFlow(flowNum);
        if (flow === null) {
            console.error("Visual flow details for flow not found:", flowNum);
            return;
        }
        flow.flowGroup.destroy();
        dfm.stageApp.draw();
        // Create the editable flow group
        this.flowLabelSet = false;
        this.flowDrawStarted = true;
        this.makeEditFlowGraphic(this.currentFlow);
        // Set the initial edit states
        this.flowNodeCount = flowDetails.points.length;
        this.flowLabelSet = true;
        this.currentFlowDrawing.flowNum = flowDetails.flow_num;
        this.flowNodeClickTime = 0;
        this.lastFlowNodeClicked = -1;
        this.drawFlowClickTime = 0;
        this.flowLineClickedTime = 0;
        this.flowLineClickTimer = null;
        this.lastFlowLineClicked = -1;
        this.flowArrowAdded = true;
        this.addingFlowLabel = false;
        this.flowArrowClickTime = 0;
    }

    deleteFlow(flowNum) {
        // Delete the flow graphic
        // Delete the visual flow entry
        let flowItemNum = this.findFlow(flowNum);
        if (flowItemNum > -1) {
            let flow = this.flows[flowItemNum];
            flow.flowGroup.destroy();
            if (this.flows.length === 1) {
                this.flows = [];
            }
            else {
                this.flows.splice(flowItemNum, 1);
            }
        }
    }

    cancelFlowDraw() {
        // Clear the current flow drawing
        if (this.flowDrawStarted) {
            this.currentFlowDrawing.flowGroup.destroy();
            dfm.stageApp.draw();
            this.currentFlowDrawing = {};
            this.flowDrawStarted = false;
        }
        let flowNum = this.currentFlow.flow_num;
        // Check whether a flow line has already been defined
        let flow = dfm.currentPage.getFlow(flowNum);
        if (flow != null) {
            dfm.currentPage.deleteFlow(flowNum);
        }
        this.editMode = "";
        dfm.flowDrawMode = false;
        document.getElementById("flowDoneButton").style.display = "none";
        document.getElementById("cancelFlowDrawButton").style.display = "none";
        flowModelPage.displayModelEditOptions();
        flowModelPage.displayFlowModelEditMessage();
    }

    findFlow(flowNum) {
        let found = false;
        let count = 0;
        for (let flow of this.flows) {
            if (flow.flowNum === flowNum) {
                found = true;
                break;
            }
            ++count;
        }
        if (!found) return -1;
        return count;
    }

    makeEditFlowGraphic(flowDetails) {
        this.currentFlowDrawing = Misc.copyObject(this.flowTemplate);
        this.currentFlowDrawing.flowGroup = new Konva.Group({
            x: flowDetails.drawing_group_x,
            y: flowDetails.drawing_group_y
        });
        this.nodeLayer.add(this.currentFlowDrawing.flowGroup);
        // Add the lines and markers
        let lastX = flowDetails.drawing_group_x;
        let lastY = flowDetails.drawing_group_y;
        let count = 0;
        for (let coords of flowDetails.points) {
            let x = coords.x;
            let y = coords.y;
            let marker = new Konva.Circle({
                x: x,
                y: y,
                radius: 4,
                fill: 'white',
                stroke: 'black',
                strokeWidth: 1,
                strokeScaleEnabled: false,
                nodeNum: count
            });
            marker.setAttr("draggable", true);
            marker.on("click", (e) => this.flowNodeClicked(e));
            marker.on("dragstart", (e) => this.flowNodeDragStart(e));
            marker.on("dragmove", (e) => this.flowNodeDragged(e));
            marker.on("dragend", (e) => this.flowNodeDragEnd(e));
            this.currentFlowDrawing.flowGroup.add(marker);
            let line = {};
            if (count > 0) {
                line = this.drawFlowLine(lastX, lastY, x, y, count);
            }
            if (count === 0) {
                this.currentFlowDrawing.points.push({marker: marker, nextNodeNum: null, prevNodeNum: null});
            }
            else {
                this.currentFlowDrawing.points.push({marker: marker, line: line, prevNodeNum: count - 1, nextNodeNum: null});
                this.currentFlowDrawing.points[count - 1].nextNodeNum = count;
            }
            lastX = x;
            lastY = y;
            ++count;
        }
        this.flowNodeCount = flowDetails.points.length;
        this.terminatingFlowNodeNum = this.flowNodeCount - 1;
        this.flowDrawStarted = true;
        this.lastX = lastX;
        this.lastY = lastY;
        // Add the flow arrow (if present)
        if (flowDetails.arrow_points.length > 0) {
            let points = [];
            for (let coords of flowDetails.arrow_points) {
                points.push(coords.x);
                points.push(coords.y);
            }
            this.currentFlowDrawing.flowArrow = new Konva.Line({
                points: points,
                stroke: 'red',
                strokeWidth: 2,
                closed: true,
                fill: 'white'
            })
            this.currentFlowDrawing.flowArrow.on("click", (e) => this.flowArrowClicked(e));
            this.currentFlowDrawing.flowGroup.add(this.currentFlowDrawing.flowArrow);
            this.flowArrowAdded = true;
        }
        else {
            this.flowArrowAdded = false;
        }
        this.currentFlowDrawing.flowGroup.draw();
        // Add the flow label
        let fromClick = false;
        this.addFlowLabel(fromClick);
    }

    // Actions when the user has completed the flow drawing.
    flowDone() {
        // Check that the flow drawing is completed adequately.
        if (!this.checkFlowDrawing()) return;

        // Transfer the flow drawing details to the flow details object
        // flow points
        let points = [];
        for (let item of this.currentFlowDrawing.points) {
            let x = item.marker.getAttr('x');
            let y = item.marker.getAttr('y');
            points.push({x: x, y: y});
        }
        this.currentFlow.points = points;

        // arrow
        let flowArrowPoints = [];
        points = this.currentFlowDrawing.flowArrow.getAttr("points");
        for (let i = 0; i < points.length; i += 2) {
            let x = points[i];
            let y = points[i + 1];
            flowArrowPoints.push({x: x, y: y});
        }
        this.currentFlow.arrow_points = flowArrowPoints;

        // label
        let x = this.currentFlowDrawing.graphicLabel.flowLabelGroup.getAttr('x');
        let y = this.currentFlowDrawing.graphicLabel.flowLabelGroup.getAttr('y');
        this.currentFlow.label_x = x;
        this.currentFlow.label_y = y;
        
        // Destroy the current flow graphic
        this.destroyCurrentFlowGraphic();

        // Create the non-edit version of the flow drawing
        let visualFlowDrawing = this.makeVisualFlow(this.currentFlow);

        // Add the flow line drawing to the visual data
        this.flows.push(visualFlowDrawing);

        // Add the flow details to the current page
        // Debug
        if (this.currentFlow.label === "Drilling Mud + Debris") {
            console.log("currentFlow:", this.currentFlow);
        }
        dfm.currentPage.updateFlow(this.currentFlow);

        // Remove the current flow details
        this.currentFlow = {};

        dfm.flowDrawMode = false;
        dfm.modelEditMode = "edit";
        dfm.modelChanged = true;

        document.getElementById("flowDoneButton").style.display = "none";
        document.getElementById("cancelFlowDrawButton").style.display = "none";
        flowModelPage.displayModelEditOptions();
        flowModelPage.displayFlowModelEditMessage();
    }

    destroyCurrentFlowGraphic() {
        this.currentFlowDrawing.flowGroup.destroy();
        this.currentFlowDrawing = {};
    }

    makeVisualFlow(flowDetailsItem) {
        // Debug
        if (flowDetailsItem.label === "Drilling Mud + Debris") {
            console.log("Problem Flow:", flowDetailsItem);
        }
        
        let visualFlowItem = Misc.copyObject(this.flowTemplate);
        visualFlowItem.flowNum = flowDetailsItem.flow_num;
        visualFlowItem.active = false;
        // Create the group
        let x = flowDetailsItem.drawing_group_x;
        let y = flowDetailsItem.drawing_group_y;
        visualFlowItem.flowGroup = new Konva.Group({
            x: x,
            y: y
        });
        // Add the flow line
        let points = [];
        for (let coords of flowDetailsItem.points) {
            let x = coords.x;
            let y = coords.y;
            points.push(x);
            points.push(y);
        }
        let line = new Konva.Line({
            points: points,
            stroke: 'black',
            strokeWidth: 2
        });
        visualFlowItem.flowGroup.add(line);
        // Add the flow arrow
        if (flowDetailsItem.arrow_points) {
            let points = [];
            for (let coords of flowDetailsItem.arrow_points) {
                let x = coords.x;
                let y = coords.y;
                points.push(x);
                points.push(y);
            }
            let flowArrow = new Konva.Line({
                points: points,
                stroke: 'red',
                strokeWidth: 2,
                fill: 'white',
                closed: true
            });
            visualFlowItem.flowGroup.add(flowArrow);
        }
        // Add the label
        this.addVisualFlowLabel(visualFlowItem, flowDetailsItem)
        this.nodeLayer.add(visualFlowItem.flowGroup);
        return visualFlowItem;
    }

    addVisualFlowLabel(visualFlowItem, flowDetailsItem) {
        // Determine text width
        // Calculate text width / height
        let textItem = flowDetailsItem.label;
        let fontSize = dfm.flowFontSize;
        let fontFamily = dfm.nodeTemplate.fontFamily; 
        let textWidth = this.calculateTextWidth(textItem, fontSize, fontFamily);
        let rectHeight = dfm.flowFontSize + dfm.flowOptionHeight + 6;
        let textHeight = 0;
        if (textWidth >= dfm.maxFlowLabelWidth) {
            textWidth = dfm.maxFlowLabelWidth - 2;
            ({textWidth, textHeight} = this.calculateTextHeight(textItem, textWidth, fontSize, fontFamily)); 
            rectHeight = textHeight + dfm.flowOptionHeight + 6;
        }
        let labelWidth = textWidth + 13;

        let x = flowDetailsItem.label_x;
        let y = flowDetailsItem.label_y;
        let flowLabelGroup = new Konva.Group({x: x, y: y});
        let rect = new Konva.Rect({
            x: 0,
            y: 0,
            width: labelWidth,
            height: rectHeight,
            stroke: 'black',
            strokeWidth: 1,
            fill: 'white',
            flowNum: flowDetailsItem.flow_num
        });
        let text = new Konva.Text({
            x: 3,
            y: 3,
            text: textItem,
            width: textWidth,
            fontFamily: fontFamily,
            fontSize: fontSize,
            fill: 'black'
        });
        let detailsOpt = new Konva.Image({
            x: labelWidth/2 - dfm.nodeTemplate.optionWidth / 2,
            y: rectHeight - dfm.flowOptionHeight - 3,
            image: dfm.nodeGraphics.flowDetails,
            width: dfm.nodeTemplate.optionWidth,
            height: dfm.flowOptionHeight,
            hoverText: "Flow Details",
            flowNum: flowDetailsItem.flow_num
        });
        detailsOpt.on('click', (e) => flowDetails.viewFlowDetails(e));
        detailsOpt.on("mouseover", (event) => flowDetails.doHoverText(event));

        flowLabelGroup.add(rect);
        flowLabelGroup.add(text);
        flowLabelGroup.add(detailsOpt);
        visualFlowItem.flowLabelGroup = flowLabelGroup;
        visualFlowItem.flowGroup.add(flowLabelGroup);
    }

    // Function to calculate the angle between two points
    calculateLineAngle(x1, y1, x2, y2) {
        var deltaX = x1 - x2;
        var deltaY = y2 - y1;
        var angleRadians = Math.atan2(deltaX, deltaY);
        var angleDegrees = angleRadians * (180 / Math.PI);
        return angleDegrees;
    }
    
    calculateTextWidth(text, fontSize, fontFamily) {
        // Create a temporary Konva.Text object
        var tempText = new Konva.Text({
            text: text,
            fontSize: fontSize,
            fontFamily: fontFamily,
            visible: false // Hide the text object
        });

        // Get the width of the text
        var textWidth = tempText.width();

        tempText.destroy();

        // Return the width
        return textWidth;
    }

    calculateTextHeight(text, width, fontSize, fontFamily) {
        var textLayer = new Konva.Layer();
        dfm.stageApp.add(textLayer);

        // Create a temporary Konva.Text object
        var tempText = new Konva.Text({
            text: text,
            width: width,
            fontSize: fontSize,
            fontFamily: fontFamily,
            visible: false // Hide the text object
        });
        textLayer.add(tempText);
        textLayer.draw();

        // Get the dimensions of the text
        let textWidth = this.getKonvaWrapTextMaxWidth(text, width, fontSize, fontFamily);
        let textHeight = tempText.getClientRect().height;

        textLayer.destroy();

        // Return the width
        return {textWidth: textWidth, textHeight: textHeight};
    }

    getKonvaWrapTextMaxWidth(text, maxWidth, fontSize, fontFamily) {
        let words = text.split(" ");
        let maxWrapWidth = 0;
        let done = false;
        let n = 0;
        while (!done && n < words.length) {
            let width = 0;
            let line = "";
            let numWords = 0;
            let lastWidth = 0;
            while (width < maxWidth && n < words.length) {
                line += words[n];
                ++numWords;
                width = this.calculateTextWidth(line, fontSize, fontFamily);
                if (width < maxWidth) {
                    lastWidth = width;
                    ++n;
                }
            }
            if (width > maxWidth) {
                if (numWords === 1) {
                    maxWrapWidth = maxWidth;
                    done = true;
                }
                else {
                    if (lastWidth > maxWrapWidth) {
                        maxWrapWidth = lastWidth;
                    }
                }
            }
            else {
                if (lastWidth > maxWrapWidth) {
                    maxWrapWidth = lastWidth;
                }
            }
        }
        return maxWrapWidth;
    }

    checkFlowDrawing() {
        let message = "";
        if (this.currentFlowDrawing.points.length < 2) {
            message = "Flow line not defined.";
        }
        if (!this.flowArrowAdded) {
            if (message != "") message += " ";
            message += "Flow arrow not added.";
        }
        if (!this.flowLabelSet) {
            if (message != "") message += " ";
            message += "Flow Label not added.";
        }
        if (message != "") {
            document.getElementById("warningText").innerText = message;
            document.getElementById("warningRow").style.display = "block";
            return false;
        }
        return true;
    }

    drawFlowClick(event) {
        event.cancelBubble = true;
        ({x: this.flowClickX, y: this.flowClickY} = dfm.stageApp.getPointerPosition());
        if (this.drawFlowClickTime != 0) {
            if (Date.now() - this.drawFlowClickTime < 500 && !this.flowLabelSet) {
                clearTimeout(this.drawFlowTimeout);
                this.addingFlowLabel = true; // Flag to prevent activation of other events
                let fromClick = true;
                this.addFlowLabel(fromClick);
                this.drawFlowClickTime = 0;
                return;
            }
        }
        this.drawFlowClickTime = Date.now();
        this.drawFlowTimeout = setTimeout(() => {this.drawFlow(event)}, 600);
    }

    drawFlow(e) {
        let flowNodeNum = this.getNextFlowNodeNum();
        let prevNodeNum = null;
        let x = this.flowClickX / dfm.scaleX;
        let y = this.flowClickY;
        if (!this.flowDrawStarted) {
            this.currentFlowDrawing.flowGroup = new Konva.Group({
                x: x,
                y: y
            });
            this.nodeLayer.add(this.currentFlowDrawing.flowGroup);
            this.flowDrawStarted = true;
            this.currentFlow.drawing_group_x = x;
            this.currentFlow.drawing_group_y = y;
            this.terminatingFlowNodeNum = flowNodeNum;
        }
        else if (this.currentFlowDrawing.points.length > 0) {
            prevNodeNum = this.terminatingFlowNodeNum;
            let flowNodeItem = this.findFlowNode(this.terminatingFlowNodeNum).flowNodeItem;
            flowNodeItem.nextNodeNum = flowNodeNum;
        }
        let flowNode = {};
        x = x - this.currentFlowDrawing.flowGroup.getAttr('x');
        y = y - this.currentFlowDrawing.flowGroup.getAttr('y');
        let empty = null;
        flowNode.marker = new Konva.Circle({
            x: x,
            y: y,
            radius: dfm.flowMarkerWidth / 2,
            fill: 'white',
            stroke: 'black',
            strokeWidth: 1,
            nodeNum: flowNodeNum,
            strokeScaleEnabled: false
        });
        flowNode.marker.setAttr("draggable", true);
        flowNode.marker.on("click", (e) => this.flowNodeClicked(e));
        flowNode.marker.on("dragstart", (e) => this.flowNodeDragStart(e));
        flowNode.marker.on("dragmove", (e) => this.flowNodeDragged(e));
        flowNode.marker.on("dragend", (e) => this.flowNodeDragEnd(e));
        if (this.currentFlowDrawing.points.length > 0) {
            let x1 = this.lastX;
            let y1 = this.lastY;
            let x2 = x;
            let y2 = y;
            flowNode.line = this.drawFlowLine(x1, y1, x2, y2, flowNodeNum);
        }
        flowNode.prevNodeNum = prevNodeNum;
        flowNode.nextNodeNum = null;
        this.currentFlowDrawing.points.push(flowNode);
        this.currentFlowDrawing.flowGroup.add(flowNode.marker);
        this.currentFlowDrawing.flowGroup.draw();
        ++this.flowNodeCount;
        this.lastX = x;
        this.lastY = y;
        this.terminatingFlowNodeNum = flowNodeNum;
    }

    drawFlowLine(x1, y1, x2, y2, flowNodeNum) {
        // Adjust the length of the line, to allow for markers
        let {ax1, ay1, ax2, ay2} = this.adjustFlowLine(x1, y1, x2, y2);
        // Calculate angle of the line
        let lineAngle = this.calculateLineAngle(ax1, ay1, ax2, ay2);
        let line = new Konva.Rect({
            x: ax1,
            y: ay1,
            width: dfm.flowLineWidth,
            height: Math.sqrt((ax1 - ax2)**2 + (ay1 - ay2)**2),
            stroke: '#c0c0c0',
            strokeWidth: 1,
            fill: '#404040',
            offsetX: dfm.flowLineWidth / 2,
            offsetY: 0,
            rotation: lineAngle,
            points: [x1, y1, x2, y2],
            nodeNum: flowNodeNum
        })
        line.on("click", (e) => this.flowLineClicked(e));
        this.currentFlowDrawing.flowGroup.add(line);
        return line;
    }

    /** Adjust the start and end points of the line to allow for the marker */
    adjustFlowLine(x1, y1, x2, y2) {
        let dx = x2 - x1;
        let dy = y2 - y1;
        let dr = dfm.flowMarkerWidth / 2;
        let t = Math.atan2(dx, dy);
        let dx1 = dr * Math.sin(t);
        let dy1 = dr * Math.cos(t);
        let ax1 = dx1 + x1;
        let ay1 = dy1 + y1;
        let ax2 = x2 - dx1;
        let ay2 = y2 - dy1;
        return {ax1, ay1, ax2, ay2};
    }

    updateFlowLabel(flowNum) {
        // Remove the label from the existing flow drawing
        let visualFlow = this.getFlow(flowNum);
        visualFlow.flowLabelGroup.destroy();
        dfm.stageApp.draw();
        let flowDetails = dfm.currentPage.getFlow(flowNum);
        this.addVisualFlowLabel(visualFlow, flowDetails);
    }

    addFlowLabel(fromClick) {
        if (this.flowLabelSet || !this.flowDrawStarted) return;

        // Calculate text width / height
        let textItem = this.currentFlow.label;
        let fontSize = dfm.flowFontSize;
        let fontFamily = dfm.nodeTemplate.fontFamily; 
        let textWidth = this.calculateTextWidth(textItem, fontSize, fontFamily);
        let rectHeight = dfm.flowFontSize + dfm.flowOptionHeight + 6;
        let textHeight = 0;
        if (textWidth > dfm.maxFlowLabelWidth) {
            textWidth = dfm.maxFlowLabelWidth - 2;
            ({textWidth, textHeight} = this.calculateTextHeight(textItem, textWidth, fontSize, fontFamily));
            rectHeight = textHeight + dfm.flowOptionHeight + 6;
        }
        let labelWidth = textWidth + 13;

        let x, y;
        if (fromClick) {
            x = this.flowClickX / dfm.scaleX;
            y = this.flowClickY;
            x = x - this.currentFlowDrawing.flowGroup.getAttr('x');
            y = y - this.currentFlowDrawing.flowGroup.getAttr('y');
        }
        else {
            x = this.currentFlow.label_x;
            y = this.currentFlow.label_y;
        }
        let label = this.currentFlow.label;
        this.currentFlow.label_width = labelWidth;
        let leftXOffset = 0;
        let rectYOffset = 0;
        let textYOffset = 3;
        if (fromClick) { 
            leftXOffset = labelWidth / 2;
        }
        else {
            textYOffset = 3
        }
        x = x - leftXOffset;
        let rect = new Konva.Rect({
            x: 0,
            y: 0,
            width: labelWidth,
            height: rectHeight,
            stroke: 'black',
            strokeWidth: 1,
            fill: 'white',
            flowNum: this.currentFlow.flow_num
        });
        let text = new Konva.Text({
            x: 3,
            y: textYOffset,
            text: textItem,
            width: textWidth,
            fontFamily: fontFamily,
            fontSize: fontSize,
            fill: 'black',
            flowNum: this.currentFlow.flow_num
        });
        let detailsOpt = new Konva.Image({
            x: labelWidth/2 - dfm.nodeTemplate.optionWidth / 2,
            y: rectHeight - dfm.flowOptionHeight - 3,
            image: dfm.nodeGraphics.flowDetails,
            width: dfm.nodeTemplate.optionWidth,
            height: dfm.flowOptionHeight,
            hoverText: "Flow Details",
            flowNum: this.currentFlow.flow_num
        });
        detailsOpt.on('click', (e) => flowDetails.viewFlowDetails(e));
        detailsOpt.on("mouseover", (event) => flowDetails.doHoverText(event));
        let flowLabelGroup = new Konva.Group({x: x, y: y, flowNum: flowNum});
        flowLabelGroup.setAttr("draggable", true);
        flowLabelGroup.on('dragstart', (e) => this.flowLabelDragStart(e));
        flowLabelGroup.on('dragmove', (e) => this.flowLabelDragMove(e));
        flowLabelGroup.on('dragend', (e) => this.flowLabelDragEnd(e));
        this.currentFlowDrawing.graphicLabel = {};
        this.currentFlowDrawing.graphicLabel.rect = rect;
        this.currentFlowDrawing.graphicLabel.text = text;
        this.currentFlowDrawing.graphicLabel.detailsOpt = detailsOpt;
        this.currentFlowDrawing.graphicLabel.flowLabelGroup = flowLabelGroup;
        flowLabelGroup.add(rect);
        flowLabelGroup.add(text);
        flowLabelGroup.add(detailsOpt);
        this.currentFlowDrawing.flowGroup.add(flowLabelGroup);
        this.currentFlowDrawing.flowGroup.draw();
        if (fromClick) {
            this.currentFlow.label_x = x - leftXOffset;
            this.currentFlow.label_y = y - 3;
        }
        this.flowLabelSet = true;
    }

    flowLabelDragStart(e) {
        e.cancelBubble = true;
    }

    flowLabelDragMove(e) {
        e.cancelBubble = true;
        let x = this.currentFlowDrawing.graphicLabel.flowLabelGroup.getAttr('x');
        let y = this.currentFlowDrawing.graphicLabel.flowLabelGroup.getAttr('y');
    }

    flowLabelDragEnd(e) {
        e.cancelBubble = true;
        
    }

    flowNodeClicked(e) {
        e.cancelBubble = true;
        let flowNodeNum = e.target.getAttr("nodeNum");
        if (flowNodeNum === this.lastFlowNodeClicked && Date.now() - this.flowNodeClickTime < 500) {
            this.deleteFlowNode(flowNodeNum);
            this.flowNodeClickTime = 0;
        }
        else {
            this.flowNodeClickTime = Date.now();
            this.lastFlowNodeClicked = flowNodeNum;
        }
    }

    deleteFlowNode(flowNodeNum) {
        // Tidy-up the click
        this.flowNodeClickTime = 0;
        this.lastFlowNodeClicked = -1;
        dfm.stageApp.cancelBubble = true;

        let pointsLen = this.currentFlowDrawing.points.length;
        let {itemNum, flowNodeItem} = this.findFlowNode(flowNodeNum);
        if (itemNum === -1) {
            console.error("Could not find flow node to delete");
            return;
        }
        // If the only node
        if (pointsLen === 1) {
            // Destroy the flow group
            this.currentFlowDrawing.flowGroup.destroy();
            this.currentFlowDrawing.points = [];
            this.flowDrawStarted = false;
            return;
        }
        else {
            // If the start node
            if (flowNodeItem.prevNodeNum === null) {
                let nextNodeNum = flowNodeItem.nextNodeNum;
                let flowNodeObj = this.findFlowNode(nextNodeNum);
                flowNodeObj.flowNodeItem.line.destroy();
                flowNodeObj.flowNodeItem.prevNodeNum = null;
                flowNodeItem.marker.destroy();
                this.currentFlowDrawing.points.splice(itemNum, 1);
            }
            // End Node
            else if (flowNodeItem.nextNodeNum === null) {
                let prevNodeNum = flowNodeItem.prevNodeNum;
                let flowNodeObj = this.findFlowNode(prevNodeNum);
                flowNodeObj.flowNodeItem.nextNodeNum = null;
                flowNodeItem.marker.destroy();
                flowNodeItem.line.destroy();
                this.currentFlowDrawing.points.splice(itemNum, 1);
                this.terminatingFlowNodeNum = prevNodeNum;
                this.lastX = flowNodeObj.flowNodeItem.marker.getAttr("x");
                this.lastY = flowNodeObj.flowNodeItem.marker.getAttr("y");
            }
            else {
                // Intermediate node
                let prevNodeNum = flowNodeItem.prevNodeNum;
                let nextNodeNum = flowNodeItem.nextNodeNum;
                let prevNodeObj = this.findFlowNode(prevNodeNum);
                prevNodeObj.flowNodeItem.nextNodeNum = nextNodeNum;
                let nextNodeObj = this.findFlowNode(nextNodeNum);
                nextNodeObj.flowNodeItem.prevNodeNum = prevNodeNum;
                flowNodeItem.marker.destroy();
                flowNodeItem.line.destroy();
                nextNodeObj.flowNodeItem.line.destroy();
                let x1 = prevNodeObj.flowNodeItem.marker.getAttr("x");
                let y1 = prevNodeObj.flowNodeItem.marker.getAttr("y");
                let x2 = nextNodeObj.flowNodeItem.marker.getAttr("x");
                let y2 = nextNodeObj.flowNodeItem.marker.getAttr("y");
                let line = this.drawFlowLine(x1, y1, x2, y2, nextNodeNum);
                nextNodeObj.flowNodeItem.line = line;
                this.currentFlowDrawing.flowGroup.draw();
                this.currentFlowDrawing.points.splice(itemNum, 1);
            }
        }
    }

    flowNodeDragStart(e) {
        e.cancelBubble = true;
    }

    flowNodeDragged(e) {
        e.cancelBubble = true;
    }

    flowNodeDragEnd(e) {
        let flowNodeNum = e.target.getAttr("nodeNum");
        let x = e.target.getAttr("x");
        let y = e.target.getAttr("y");
        let {itemNum, flowNodeItem} = this.findFlowNode(flowNodeNum);
        let prevNodeNum = flowNodeItem.prevNodeNum;
        let nextNodeNum = flowNodeItem.nextNodeNum;
        if (flowNodeItem != null) {
            if (prevNodeNum != null) {
                let x1 = flowNodeItem.line.getAttr("points")[0];
                let y1 = flowNodeItem.line.getAttr("points")[1];
                let x2 = x;
                let y2 = y;
                flowNodeItem.line.destroy();
                let line = this.drawFlowLine(x1, y1, x2, y2, flowNodeNum);
                flowNodeItem.line = line;
            }
            if (nextNodeNum != null) {
                let nextNodeObj = this.findFlowNode(nextNodeNum);
                nextNodeObj.flowNodeItem.line.destroy();
                let x1 = x;
                let y1 = y;
                let x2 = nextNodeObj.flowNodeItem.marker.getAttr("x");
                let y2 = nextNodeObj.flowNodeItem.marker.getAttr("y");
                let line = this.drawFlowLine(x1, y1, x2, y2, nextNodeNum);
                nextNodeObj.flowNodeItem.line = line;
            }

            if (flowNodeNum === this.terminatingFlowNodeNum) {
                    this.lastX = x;
                    this.lastY = y;
            }
            
        }
        else {
            console.error("Drag end - could not find flowNodeItem")
        }
        e.cancelBubble = true;
    }

    flowLineClicked(e) {
        e.cancelBubble = true;
        let flowNodeNum = e.target.getAttr("nodeNum");
        let {x, y} = dfm.stageApp.getPointerPosition();
        this.addFlowArrow(flowNodeNum, x, y);
    }

    addFlowArrow(flowNodeNum, x, y) {
        if (this.flowArrowAdded) return;

        let groupX = this.currentFlowDrawing.flowGroup.getAttr("x");
        let groupY = this.currentFlowDrawing.flowGroup.getAttr("y");
        x = x/dfm.scaleX - groupX;
        y = y - groupY;

        // Adjust x, y to sit exactly on the line
        let {itemNum, flowNodeItem} = this.findFlowNode(flowNodeNum);
        if (itemNum === -1) {
            console.error("addFlowArrow could find flowNodeNum:", flowNodeNum);
            return;
        }
        let prevNodeObj = this.findFlowNode(flowNodeItem.prevNodeNum);
        let prevNodeItem = prevNodeObj.flowNodeItem;
        let l1 = new patternArt.Geo.Line(); 
        l1.a.x = flowNodeItem.marker.getAttr("x");
        l1.a.y = flowNodeItem.marker.getAttr("y");
        l1.b.x = prevNodeItem.marker.getAttr("x");
        l1.b.y = prevNodeItem.marker.getAttr("y");
        let intersectObj = patternArt.Geo.perpendicular(l1, x, y, 0.001);
        x = intersectObj.p.x;
        y = intersectObj.p.y;
    
        let sourceNodeX = -1;
        let sourceNodeY = -1;
        let destNodeX = -1;
        let destNodeY = -1;
        // Get Source/Destination Component Node Positions
        if (this.currentFlow.source_node_num != "") {
            let sourceNodeNum = this.currentFlow.source_node_num;
            let {found, node, index} = this.getNode(sourceNodeNum);
            if (!found) {
                console.error("addFlowArrow could not find source node:", sourceNodeNum);
                return;
            }
            sourceNodeX = node.nodeGroup.getAttr('x') + dfm.nodeTemplate.width / 2;
            sourceNodeY = node.nodeGroup.getAttr('y') + dfm.nodeTemplate.height / 2;
        }
        if (this.currentFlow.destination_node_num != "") {
            let destNodeNum = this.currentFlow.destination_node_num;
            let {found, node, index} = this.getNode(destNodeNum);
            if (!found) {
                console.error("addFlowArrow could not find source node:", destNodeNum);
                return;
            }
            destNodeX = node.nodeGroup.getAttr('x') + dfm.nodeTemplate.width / 2;
            destNodeY = node.nodeGroup.getAttr('y') + dfm.nodeTemplate.height / 2;
        }

        // Get the start and end nodes of the complete flow
        let {startIndex, startNode, endIndex, endNode} = this.findFlowTerminators();

        // Determine which end of the complete flow line is nearest to source component 
        // and destination component respectively
        let {sourceFlowNode, destFlowNode} = this.getSourceAndDestinationFlowNodes(startNode, 
            endNode, sourceNodeX, sourceNodeY, destNodeX, destNodeY);

        // Determine which ends of the line clicked is nearest (by connection) to the
        // sourceFlowNode
        let {sourceEndX, sourceEndY, destEndX, destEndY} = this.getSourceFlowLineEnds(flowNodeItem, sourceFlowNode); 

        // Get the points of the triangle
        let dx = destEndX - sourceEndX;
        let dy = destEndY - sourceEndY;
        let a = Math.atan2(dx, dy);
        let arrowPoints = [];
        arrowPoints.push(dfm.flowArrowRadius * Math.sin(a) + x);
        arrowPoints.push(dfm.flowArrowRadius * Math.cos(a) + y);
        arrowPoints.push(dfm.flowArrowRadius * Math.sin(a + (2 * Math.PI / 3)) + x);
        arrowPoints.push(dfm.flowArrowRadius * Math.cos(a + (2 * Math.PI / 3)) + y);
        arrowPoints.push(x);
        arrowPoints.push(y);
        arrowPoints.push(dfm.flowArrowRadius * Math.sin(a + (4 * Math.PI / 3)) + x);
        arrowPoints.push(dfm.flowArrowRadius * Math.cos(a + (4 * Math.PI / 3)) + y);

        // Add the arrow to the line
        let line = new Konva.Line({
            points: arrowPoints,
            stroke: 'red',
            strokeWidth: 2,
            fill: 'white',
            closed: true
        });
        line.on("click", (e) => this.flowArrowClicked(e));
        this.currentFlowDrawing.flowArrow = line;
        this.currentFlowDrawing.flowGroup.add(line);
        this.flowArrowAdded = true;
    }

    /**
     * Identify which of the startNode and endNode flow nodes is nearest to the
     * source or destination component nodes respectively
     * @param {*} startNode 
     * @param {*} endNode 
     * @param {*} sourceNodeX 
     * @param {*} sourceNodeY 
     * @param {*} destNodeX 
     * @param {*} destNodeY 
     */
    getSourceAndDestinationFlowNodes(startNode, endNode, sourceNodeX, sourceNodeY, destNodeX, destNodeY) {
        let destFlowNode = null;
        let sourceFlowNode = null;

        // Get the coordinates of the start and end nodes
        let groupX = this.currentFlowDrawing.flowGroup.getAttr("x");
        let groupY = this.currentFlowDrawing.flowGroup.getAttr("y");

        let startX = startNode.marker.getAttr("x") + groupX;
        let startY = startNode.marker.getAttr("y") + groupY;
        let endX = endNode.marker.getAttr("x") + groupX;
        let endY = endNode.marker.getAttr("y") + groupY;

        if (sourceNodeX != -1) {
            let d1 = Math.sqrt((sourceNodeX - startX) ** 2 + (sourceNodeY - startY) ** 2);
            let d2 = Math.sqrt((sourceNodeX - endX) ** 2 + (sourceNodeY - endY) ** 2);
            if (d1 < d2) {
                sourceFlowNode = startNode;
                destFlowNode = endNode;
            }
            else {
                sourceFlowNode = endNode;
                destFlowNode = startNode;
            }
        }
        else if (destNodeX != -1) {
            let d1 = Math.sqrt((destNodeX - startX) ** 2 + (destNodeY - startY) ** 2);
            let d2 = Math.sqrt((destNodeX - endX) ** 2 + (destNodeY - endY) ** 2);
            if (d1 < d2) {
                destFlowNode = startNode;
                sourceFlowNode = endNode;
            }
            else {
                destFlowNode = endNode;
                sourceFlowNode = startNode;
            }
        }
        return {sourceFlowNode, destFlowNode};
    }

    /** Get the coordinates of the line ends defined in node which are most
     * closely linked to the source or destination nodes
     * 
     * @param {*} flowNode 
     * @param {*} sourceFlowNode 
     * @param {*} destFlowNode 
     */
    getSourceFlowLineEnds(flowNode, sourceFlowNode) {
        let sourceEndX = -1;
        let sourceEndY = -1;
        let destEndX = -1;
        let destEndY = -1;

        // Get the node prior to flowNode
        // let {itemNum, flowNodeItem} = findFlowNode(node.prevNodeNum);

        // From the flow node, track to the sourceFlowNode and count the number of nodes
        let sourceNodeNum = sourceFlowNode.marker.getAttr("nodeNum");
        let count = 0;
        let done = false;
        let found = false;
        let currentNode = flowNode;
        while (!done) {
            if (currentNode.marker.getAttr("nodeNum") === sourceNodeNum) {
                found = true;
                break;
            }
            if (currentNode.nextNodeNum === null) {
                done = true;
                break;
            }
            let nextNodeNum = currentNode.nextNodeNum;
            let nextNodeObj = this.findFlowNode(nextNodeNum);
            currentNode = nextNodeObj.flowNodeItem;
            ++count;
        }
        
        let prevNodeObj = this.findFlowNode(flowNode.prevNodeNum);
        let prevNode = prevNodeObj.flowNodeItem;
        if (found && (count <= this.currentFlowDrawing.points.length / 2)) {
            sourceEndX = flowNode.marker.getAttr("x");
            sourceEndY = flowNode.marker.getAttr("y");
            destEndX = prevNode.marker.getAttr("x");
            destEndY = prevNode.marker.getAttr("y");
        }
        else {
            destEndX = flowNode.marker.getAttr("x");
            destEndY = flowNode.marker.getAttr("y");
            sourceEndX = prevNode.marker.getAttr("x");
            sourceEndY = prevNode.marker.getAttr("y");
        }

        return {sourceEndX, sourceEndY, destEndX, destEndY};
    }

    flowArrowClicked(e) {
        e.cancelBubble = true;
        if (this.flowArrowClickTime > 0 && Date.now() - this.flowArrowClickTime) {
            this.flowArrowClickTime = 0;
            this.currentFlowDrawing.flowArrow.destroy();
            this.flowArrowAdded = false;
        }
        else {
            this.flowArrowClickTime = Date.now();
        }
    }

    /* This function withdrawn as too awkward for the user

    insertFlowNode(flowNodeNum, x, y) {
        x = x / dfm.scaleX - this.currentFlowDrawing.flowGroup.getAttr('x');
        y = y - this.currentFlowDrawing.flowGroup.getAttr('y');
        let newFlowNodeNum = this.getNextFlowNodeNum(); 
        let marker = new Konva.Circle({
            x: x,
            y: y,
            radius: dfm.flowMarkerWidth / 2,
            fill: 'white',
            stroke: 'black',
            strokeWidth: 1,
            strokeScaleEnabled: false,
            nodeNum: newFlowNodeNum
        });
        marker.setAttr("draggable", true);
        marker.on("click", (e) => this.flowNodeClicked(e));
        marker.on("dragstart", (e) => this.flowNodeDragStart(e));
        marker.on("dragmove", (e) => this.flowNodeDragged(e));
        marker.on("dragend", (e) => this.flowNodeDragEnd(e));

        // **
        // Add the new line to the next node
        let nextNodeObj = this.findFlowNode(flowNodeNum);
        let x1 = x;
        let y1 = y;
        let x2 = nextNodeObj.flowNodeItem.marker.getAttr("x");
        let y2 = nextNodeObj.flowNodeItem.marker.getAttr("y");
        nextNodeObj.flowNodeItem.line.destroy();
        let line = this.drawFlowLine(x1, y1, x2, y2, flowNodeNum);
        nextNodeObj.flowNodeItem.line = line;
        let prevNodeNum = nextNodeObj.flowNodeItem.prevNodeNum;
        nextNodeObj.flowNodeItem.prevNodeNum = newFlowNodeNum;

        // Get the line to the previous node
        let prevNodeObj = this.findFlowNode(prevNodeNum);
        prevNodeObj.flowNodeItem.nextNodeNum = newFlowNodeNum;
        x1 = prevNodeObj.flowNodeItem.marker.getAttr("x");
        y1 = prevNodeObj.flowNodeItem.marker.getAttr("y");
        x2 = x;
        y2 = y;
        line = this.drawFlowLine(x1, y1, x2, y2, newFlowNodeNum);
        // Insert into points list
        let flowNodeItem = {};
        this.currentFlowDrawing.flowGroup.add(marker);
        marker.setZIndex(0.2);
        flowNodeItem.prevNodeNum = prevNodeNum;
        flowNodeItem.nextNodeNum = flowNodeNum;
        flowNodeItem.marker = marker;
        flowNodeItem.line = line;
        this.currentFlowDrawing.points.push(flowNodeItem);
        this.currentFlowDrawing.flowGroup.draw();
    }
    */

    getFlow(flowNum) {
        let found = false;
        let flow = null;
        for (flow of this.flows) {
            if (flow.flowNum === flowNum) {
                found = true;
                break;
            }
        }
        if (!found) return null;
        return flow;
    }

    getNextFlowNodeNum() {
        if (this.flowNodeCount === 0 || this.currentFlowDrawing.points.length === 0) {
            return 0;
        }
        let flowNodeNum = -1;
        let lastFlowNodeNum = 0;
        let count = 0;
        let numList = [];
        for (let item of this.currentFlowDrawing.points) {
            let nodeNum = item.marker.getAttr('nodeNum');
            numList.push(nodeNum);
        }
        numList = numList.sort();
        for (let nodeNum of numList) { 
            if (count === 0) {
                if (nodeNum > 0) {
                    flowNodeNum = 0;
                    break;
                }
            }
            else {
                if (nodeNum > lastFlowNodeNum + 1) {
                    flowNodeNum = lastFlowNodeNum + 1;
                    break;
                }
                lastFlowNodeNum = nodeNum;
            }
            ++count;
        }
        if (flowNodeNum === -1) flowNodeNum = numList.length;
        return flowNodeNum;
    }

    findFlowNode(flowNodeNum) {
        let flowNodeItem = null;
        let found = false;
        let count = 0;
        let itemNum = -1;
        for (flowNodeItem of this.currentFlowDrawing.points) {
            if (flowNodeItem.marker.getAttr("nodeNum") === flowNodeNum) {
                found = true;
                break;
            }
            ++count;
        }
        if (!found) {
            flowNodeItem = null;
        }
        else {
            itemNum = count;
        }
        return {itemNum: itemNum, flowNodeItem: flowNodeItem};
    }

    findFlowTerminators() {
        let startIndex = -1;
        let endIndex = -1;
        let startNode = null;
        let endNode = null;
        let count = 0;
        for (let node of this.currentFlowDrawing.points) {
            if (node.prevNodeNum === null) {
                startIndex = count;
                startNode = node;
            }
            else if(node.nextNodeNum === null) {
                endIndex = count;
                endNode = node;
            }
            if (endNode != null && startNode != null) {
                break;
            }
            ++count;
        }
        return {startIndex, startNode, endIndex, endNode};
    }

    findFlowNodeAtXY(x, y) {
        let flowNodeItem = null;
        let found = false;
        let count = 0;
        let itemNum = -1;
        for (flowNodeItem of this.currentFlowDrawing.points) {
            if (flowNodeItem.marker.getAttr("x") === x && flowNodeItem.marker.getAttr("y") === y) {
                found = true;
                break;
            }
            ++count;
        }
        if (!found) {
            flowNodeItem = null;
        }
        else {
            itemNum = count;
        }
        return {itemNum: itemNum, flowNodeItem: flowNodeItem};
    }

}
