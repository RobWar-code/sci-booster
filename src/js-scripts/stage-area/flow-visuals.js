// The flow diagram visual data and processing class
dfm.FlowVisuals = class {
    constructor() {
        this.active = false;
        this.drawFlowNum = "";
        this.flowNodeCount = 0;
        this.drawFlowClickTime = 0;
        this.flowNodeClickTime = 0;
        this.lastFlowNodeClicked = -1;
        this.flowLineClickTime = 0;
        this.flowLineClickTimer = null;
        this.lastFlowLineClicked = -1;
        this.flowArrowClickTime = 0;
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
        this.nodeLayer = new Konva.Layer();
        dfm.stageApp.add(this.nodeLayer);
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
            let label = node.label;
            let x = node.x;
            let y = node.y;
            this.addNode(label, nodeNum, x, y);
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

    addNode(label, nodeNum, x, y) {
        let node = Misc.copyObject(this.nodeTemplate);
        node.active = true;
        node.nodeNum = nodeNum;
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
        node.detailsOpt = new Konva.Image({
            x: dfm.nodeTemplate.optionLeft,
            y: dfm.nodeTemplate.optionTop,
            image: dfm.nodeGraphics.details,
            width: dfm.nodeTemplate.optionWidth,
            height: dfm.nodeTemplate.optionHeight,
            nodeNum: nodeNum,
            hoverText: "Node Details"
        });
        node.zoomDetailsOpt = new Konva.Image({
            x: dfm.nodeTemplate.width/2 - dfm.nodeTemplate.optionWidth - dfm.nodeTemplate.optionLeft/2,
            y: dfm.nodeTemplate.optionTop,
            image: dfm.nodeGraphics.zoomDetails,
            width: dfm.nodeTemplate.optionWidth,
            height: dfm.nodeTemplate.optionHeight,
            nodeNum: nodeNum,
            hoverText: "Zoom Page"
        });
        node.flowLinkOpt = new Konva.Image({
            x: dfm.nodeTemplate.width/2 + dfm.nodeTemplate.optionLeft/2,
            y: dfm.nodeTemplate.optionTop,
            image: dfm.nodeGraphics.flowLink,
            width: dfm.nodeTemplate.optionWidth,
            height: dfm.nodeTemplate.optionHeight,
            nodeNum: nodeNum,
            hoverText: "Flow Link"
        });
        node.hyperlinkOpt = new Konva.Image({
            x: dfm.nodeTemplate.width - dfm.nodeTemplate.optionWidth - dfm.nodeTemplate.optionLeft,
            y: dfm.nodeTemplate.optionTop,
            image: dfm.nodeGraphics.hyperlink,
            width: dfm.nodeTemplate.optionWidth,
            height: dfm.nodeTemplate.optionHeight,
            nodeNum: nodeNum,
            hoverText: "Hyperlink"
        });

        // Events
        node.detailsOpt.on("click", (event) => nodeDetails.viewNodeDetails(event));
        node.detailsOpt.on("mouseover", (event) => nodeDetails.doHoverText(event));
        node.zoomDetailsOpt.on("click", (event) => flowModelPage.zoomPage(event));
        node.zoomDetailsOpt.on("mouseover", (event) => nodeDetails.doHoverText(event));
        node.flowLinkOpt.on("click", (event) => flowDetails.addNewFlow(event));
        node.flowLinkOpt.on("mouseover", (event) => nodeDetails.doHoverText(event));
        node.hyperlinkOpt.on("click", (event) => nodeDetails.doHyperLink(event));
        node.hyperlinkOpt.on("mouseover", (event) => nodeDetails.doHoverText(event));

        // Assemble items
        node.nodeGroup.add(node.rect);
        node.nodeGroup.add(node.labelText);
        node.nodeGroup.add(node.detailsOpt);
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
        if (nodeObj.found) {
            nodeObj.node.label = label;
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
        flow.flowGroup.remove();
        // Create the editable flow group
        this.makeEditFlowGraphic(this.currentFlow);
        // Set the initial edit states
        this.flowNodeCount = flowDetails.points.length;
        this.flowLabelSet = true;
        this.currentFlowDrawing.flowNum = flowDetails.flow_num;
        this.flowDrawStarted = true;
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
            this.currentFlowDrawing = {};
        }
        let flowNum = this.currentFlow.flow_num;
        // Check whether a flow line has already been defined
        let flow = dfm.currentPage.getFlow(flowNum);
        if (flow != null) {
            if (flow.points.length != 0) {
                // Reconstruct the original flow line drawing.
                this.currentFlow = flow;
                this.makeVisualFlow(this.currentFlow);
            }
            else {
                dfm.currentPage.deleteFlow(flowNum);
            }
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
                nodeNum: count
            });
            marker.setAttr("draggable", true);
            marker.on("click", (e) => this.flowNodeClicked(e));
            marker.on("dragstart", (e) => this.flowNodeDragStart(e));
            marker.on("dragmove", (e) => this.flowNodeDragged(e));
            marker.on("dragend", (e) => this.flowNodeDragEnd(e));
            let line = {};
            if (count > 0) {
                line = new Konva.Line({
                    points: [lastX, lastY, x, y],
                    stroke: 'black',
                    strokeWidth: 2,
                    nodeNum: count
                })
                line.on("click", (e) => this.flowLineClicked(e));
                this.currentFlowDrawing.flowGroup.add(line);
                line.setZIndex(0.1);
            }
            if (count === 0) {
                this.currentFlowDrawing.points.push({marker: marker});
            }
            else {
                this.currentFlowDrawing.points.push({marker: marker, line: line});
            }
            this.currentFlowDrawing.flowGroup.add(marker);
            marker.setZIndex(0.2);
            lastX = x;
            lastY = y;
            ++count;
        }
        // Add the flow arrow
        let points = [];
        for (let coords of flowDetails.arrow_points) {
            points.push(coords.x);
            points.push(coords.y);
        }
        this.currentFlowDrawing.flowArrow = new Konva.Line({
            points: points,
            stroke: 'red',
            strokeWidth: 2
        })
        this.currentFlowDrawing.flowArrow.on("click", (e) => this.flowArrowClicked(e));
        this.currentFlowDrawing.flowGroup.add(this.currentFlowDrawing.flowArrow);
        // Add the flow label
        let rect = new Konva.Rect({
            x: flowDetails.label_x,
            y: flowDetails.label_y,
            width: flowDetails.label_width,
            height: dfm.nodeTemplate.fontSize + 6,
            stroke: 'black',
            strokeWidth: 1,
            fill: 'white',
            flowNum: this.currentFlow.flow_num
        });
        let text = new Konva.Text({
            x: flowDetails.label_x + 3,
            y: flowDetails.label_y + 3,
            text: flowDetails.label,
            fontFamily: dfm.nodeTemplate.fontFamily,
            fontSize: dfm.nodeTemplate.fontSize,
            fill: 'black',
            flowNum: flowDetails.flow_num
        });
        text.on('click', (e) => flowDetails.viewFlowDetails(e));
        rect.on('click', (e) => flowDetails.viewFlowDetails(e));
        rect.setAttr("draggable", true);
        rect.on('dragstart', (e) => this.flowLabelDragStart(e));
        rect.on('dragmove', (e) => this.flowLabelDragMove(e));
        rect.on('dragend', (e) => this.flowLabelDragEnd(e));
        this.currentFlowDrawing.graphicLabel = {};
        this.currentFlowDrawing.graphicLabel.rect = rect;
        this.currentFlowDrawing.graphicLabel.text = text;
        this.currentFlowDrawing.flowGroup.add(rect);
        this.currentFlowDrawing.flowGroup.add(text);
        rect.setZIndex(0.5);
        text.setZIndex(1);
        this.nodeLayer.add(this.currentFlowDrawing.flowGroup);
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
        let x = this.currentFlowDrawing.graphicLabel.rect.getAttr('x');
        let y = this.currentFlowDrawing.graphicLabel.rect.getAttr('y');
        this.currentFlow.label_x = x;
        this.currentFlow.label_y = y;
        
        // Destroy the current flow graphic
        this.destroyCurrentFlowGraphic();

        // Create the non-edit version of the flow drawing
        let visualFlowDrawing = this.makeVisualFlow(this.currentFlow);

        // Add the flow line drawing to the visual data
        this.flows.push(visualFlowDrawing);

        // Add the flow details to the current page
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
                strokeWidth: 2
            });
            visualFlowItem.flowGroup.add(flowArrow);
        }
        // Add the label
        // Determine text width
        // Calculate text width / height
        let textItem = flowDetailsItem.label;
        let fontSize = dfm.nodeTemplate.fontSize;
        let fontFamily = dfm.nodeTemplate.fontFamily; 
        let textWidth = this.calculateTextWidth(textItem, fontSize, fontFamily);
        let rectHeight = fontSize + 6;
        if (textWidth > dfm.maxFlowLabelWidth) {
            textWidth = dfm.maxFlowLabelWidth;
            rectHeight = this.calculateTextHeight(textItem, textWidth, fontSize, fontFamily) + 6;
        }
        let labelWidth = textWidth + 13;

        x = flowDetailsItem.label_x;
        y = flowDetailsItem.label_y;
        let rect = new Konva.Rect({
            x: x,
            y: y,
            width: labelWidth,
            height: rectHeight,
            stroke: 'black',
            strokeWidth: 1,
            fill: 'white',
            flowNum: flowDetailsItem.flow_num
        });
        rect.on("click", (e) => flowDetails.viewFlowDetails(e));
        visualFlowItem.flowGroup.add(rect);
        let text = new Konva.Text({
            x: x + 3,
            y: y + 3,
            text: textItem,
            width: textWidth,
            fontFamily: fontFamily,
            fontSize: fontSize,
            fill: 'black'
        });
        visualFlowItem.flowGroup.add(text);
        this.nodeLayer.add(visualFlowItem.flowGroup);
        return visualFlowItem;
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

        // Get the height of the text
        var textHeight = tempText.getClientRect().height;

        textLayer.destroy();

        // Return the width
        return textHeight;
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
                this.addFlowLabel();
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
            flowNodeItem.marker.setAttr("nextNodeNum", this.terminatingFlowNodeNum);
        }
        let flowNode = {};
        x = x - this.currentFlowDrawing.flowGroup.getAttr('x');
        y = y - this.currentFlowDrawing.flowGroup.getAttr('y');
        flowNode.marker = new Konva.Circle({
            x: x,
            y: y,
            radius: dfm.flowMarkerWidth / 2,
            fill: 'white',
            stroke: 'black',
            strokeWidth: 1,
            nodeNum: flowNodeNum,
            prevNodeNum: prevNodeNum,
            nextNodeNum: null
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
        this.currentFlowDrawing.points.push(flowNode);
        this.currentFlowDrawing.flowGroup.add(flowNode.marker);
        flowNode.marker.setZIndex(0.2);
        this.currentFlowDrawing.flowGroup.draw();
        ++this.flowNodeCount;
        this.lastX = x;
        this.lastY = y;
        this.terminatingFlowNodeNum = flowNodeNum;
    }

    drawFlowLine(x1, y1, x2, y2, flowNodeNum) {
        // Calculate angle of the line
        let lineAngle = this.calculateLineAngle(x1, y1, x2, y2);
        let line = new Konva.Rect({
            x: x1,
            y: y1,
            width: dfm.flowLineWidth,
            height: Math.sqrt((x1 - x2)**2 + (y1 - y2)**2),
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
        this.currentFlowDrawing.flowGroup.add(flowNode.line);
        line.setZIndex(0.1);
        return line;
    }

    addFlowLabel() {
        if (this.flowLabelSet) return;

        // Calculate text width / height
        let textItem = this.currentFlow.label;
        let fontSize = dfm.nodeTemplate.fontSize;
        let fontFamily = dfm.nodeTemplate.fontFamily; 
        let textWidth = this.calculateTextWidth(textItem, fontSize, fontFamily);
        let rectHeight = fontSize + 6;
        if (textWidth > dfm.maxFlowLabelWidth) {
            textWidth = dfm.maxFlowLabelWidth;
            rectHeight = this.calculateTextHeight(textItem, textWidth, fontSize, fontFamily) + 6;
        }
        let labelWidth = textWidth + 13;

        let x = this.flowClickX / dfm.scaleX;
        let y = this.flowClickY;
        x = x - this.currentFlowDrawing.flowGroup.getAttr('x');
        y = y - this.currentFlowDrawing.flowGroup.getAttr('y');

        let label = this.currentFlow.label;
        this.currentFlow.label_width = labelWidth;
        let leftXOffset = labelWidth / 2;
        let rect = new Konva.Rect({
            x: x - leftXOffset,
            y: y - 3,
            width: labelWidth,
            height: rectHeight,
            stroke: 'black',
            strokeWidth: 1,
            fill: 'white',
            flowNum: this.currentFlow.flow_num
        });
        let text = new Konva.Text({
            x: x - leftXOffset + 3,
            y: y,
            text: textItem,
            width: textWidth,
            fontFamily: fontFamily,
            fontSize: fontSize,
            fill: 'black',
            flowNum: this.currentFlow.flow_num
        });
        text.on('click', (e) => flowDetails.viewFlowDetails(e));
        rect.on('click', (e) => flowDetails.viewFlowDetails(e));
        rect.setAttr("draggable", true);
        rect.on('dragstart', (e) => this.flowLabelDragStart(e));
        rect.on('dragmove', (e) => this.flowLabelDragMove(e));
        rect.on('dragend', (e) => this.flowLabelDragEnd(e));
        this.currentFlowDrawing.graphicLabel = {};
        this.currentFlowDrawing.graphicLabel.rect = rect;
        this.currentFlowDrawing.graphicLabel.text = text;
        this.currentFlowDrawing.flowGroup.add(rect);
        this.currentFlowDrawing.flowGroup.add(text);
        rect.setZIndex(0.5);
        text.setZIndex(1);
        this.currentFlowDrawing.flowGroup.draw();
        this.currentFlow.label_x = x - leftXOffset;
        this.currentFlow.label_y = y - 3;
        this.flowLabelSet = true;
    }

    flowLabelDragStart(e) {
        e.cancelBubble = true;
    }

    flowLabelDragMove(e) {
        e.cancelBubble = true;
        let x = this.currentFlowDrawing.graphicLabel.rect.getAttr('x');
        let y = this.currentFlowDrawing.graphicLabel.rect.getAttr('y');
        this.currentFlowDrawing.graphicLabel.text.setAttr('x', x + 3);
        this.currentFlowDrawing.graphicLabel.text.setAttr('y', y + 3);
    }

    flowLabelDragEnd(e) {
        let x = this.currentFlowDrawing.graphicLabel.rect.getAttr('x');
        let y = this.currentFlowDrawing.graphicLabel.rect.getAttr('y');
        this.currentFlowDrawing.graphicLabel.text.setAttr('x', x + 3);
        this.currentFlowDrawing.graphicLabel.text.setAttr('y', y + 3);
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
            if (flowNodeItem.marker.getAttr("prevNodeNum") === null) {
                let nextNodeNum = flowNodeItem.marker.getAttr("nextNodeNum");
                let flowNodeObj = this.findFlowNode(nextNodeNum);
                flowNodeObj.flowNodeItem.line.destroy();
                flowNodeObj.flowNodeItem.marker.setAttr("prevNodeNum", null);
                flowNodeItem.marker.destroy();
                this.currentFlowDrawing.points.splice(itemNum, 1);
            }
            else if (flowNodeItem.marker.getAttr("nextNodeNum") === null) {
                let prevNodeNum = flowNodeItem.marker.getAttr("prevNodeNum");
                let flowNodeObj = this.findFlowNode(prevNodeNum);
                flowNodeObj.flowNodeItem.marker.setAttr("nextNodeNum", null);
                flowNodeItem.marker.destroy();
                flowNodeItem.line.destroy();
                this.currentFlowDrawing.points.splice(itemNum, 1);
            }
            else {
                let prevNodeNum = flowNodeItem.marker.getAttr("prevNodeNum");
                let nextNodeNum = flowNodeItem.marker.getAttr("nextNodeNum");
                let prevNodeObj = this.findFlowNode(prevNodeNum);
                prevNodeObj.flowNodeItem.marker.setAttr("nextNodeNum", nextNodeNum);
                let nextNodeObj = this.findFlowNode(nextNodeNum);
                nextNodeObj.flowNodeItem.marker.setAttr("prevNodeNum", prevNodeNum);
                nextNodeObj.flowNodeItem.line.destroy();
                let x1 = prevNodeObj.flowNodeItem.marker.getAttr("x");
                let y1 = prevNodeObj.flowNodeItem.marker.getAttr("y");
                let x2 = nextNodeObj.flowNodeItem.marker.getAttr("x");
                let y2 = nextNodeObj.flowNodeItem.marker.getAttr("y");
                let line = this.drawFlowLine(x1, y1, x2, y2);
                nextNodeObj.flowNodeItem.line = line;
                this.currentFlowDrawing.nodeGroup.add(line);
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
        let {itemNum, flowNodeItem} = this.findCurrentFlowDrawingFlowNode(flowNodeNum);
        if (flowNodeItem != null) {
            if (itemNum > 0) {
                let x1 = this.currentFlowDrawing.points[itemNum - 1].marker.getAttr("x");
                let y1 = this.currentFlowDrawing.points[itemNum - 1].marker.getAttr("y");
                this.currentFlowDrawing.points[itemNum].line.setAttr("points", [x1, y1, x, y]);
                if (itemNum === this.currentFlowDrawing.points.length - 1) {
                    this.lastX = x;
                    this.lastY = y;
                }
            }
            if (itemNum < this.currentFlowDrawing.points.length - 1) {
                let x1 = this.currentFlowDrawing.points[itemNum + 1].marker.getAttr("x");
                let y1 = this.currentFlowDrawing.points[itemNum + 1].marker.getAttr("y");
                this.currentFlowDrawing.points[itemNum + 1].line.setAttr("points", [x, y, x1, y1]);
            }
        }
        else {
            console.error("Drag end - could not find flowNodeItem")
        }
    }

    flowLineClicked(e) {
        e.cancelBubble = true;
        let flowNodeNum = e.target.getAttr("nodeNum");
        let {x, y} = dfm.stageApp.getPointerPosition();
        if (this.flowLineClickedTime - Date.now() < 500 && this.lastFlowLineClicked === flowNodeNum) {
            clearTimeout(this.flowLineClickTimer);
            this.addFlowArrow(flowNodeNum, x, y);
            this.flowLineClickedTime = 0;
            this.lastFlowLineClicked = -1;
        }
        else {
            this.lastFlowLineClicked = flowNodeNum;
            this.flowLineClickedTime = Date.now();
            this.flowLineClickTimer = setTimeout(() => {
                this.insertFlowNode(flowNodeNum, x, y);
                this.flowLineClickedTime = 0;
                this.lastFlowLineClicked = -1;
            }, 600);
        }
    }

    addFlowArrow(flowNodeNum, x, y) {
        if (this.flowArrowAdded) return;
        x = x/dfm.scaleX - this.currentFlowDrawing.flowGroup.getAttr('x');
        y = y - this.currentFlowDrawing.flowGroup.getAttr('y');

        // Determine the vector of the line
        let {itemNum, flowNodeItem} = this.findCurrentFlowDrawingFlowNode(flowNodeNum);
        if (itemNum === -1) {
            console.error("addFlowArrow could find flowNodeNum:", flowNodeNum);
            return;
        }
        let points = flowNodeItem.line.getAttr("points");
        let [x1, y1, x2, y2] = points;
        let sourceNodeX = -1;
        let sourceNodeY = -1;
        let destNodeX = -1;
        let destNodeY = -1;
        // Determine vector of source to node
        if (this.currentFlow.source_node_num != "") {
            let sourceNodeNum = this.currentFlow.source_node_num;
            let {found, node, index} = this.getNode(sourceNodeNum);
            if (!found) {
                console.error("addFlowArrow could not find source node:", sourceNodeNum);
                return;
            }
            sourceNodeX = node.rect.getAttr('x');
            sourceNodeY = node.rect.getAttr('y');
        }
        if (this.currentFlow.destination_node_num != "") {
            let destNodeNum = this.currentFlow.destination_node_num;
            let {found, node, index} = this.getNode(destNodeNum);
            if (!found) {
                console.error("addFlowArrow could not find source node:", destNodeNum);
                return;
            }
            destNodeX = node.rect.getAttr('x');
            destNodeY = node.rect.getAttr('y');
        }

        // Get the flow lines start and end nodes
        let lineStartX = this.currentFlowDrawing.points[0].marker.getAttr('x');
        let lineStartY = this.currentFlowDrawing.points[0].marker.getAttr('y');
        let finalFlowNode = this.currentFlowDrawing.points.length - 1;
        let lineEndX = this.currentFlowDrawing.points[finalFlowNode].marker.getAttr('x');
        let lineEndY = this.currentFlowDrawing.points[finalFlowNode].marker.getAttr('y');

        // Determine the start and end points of the flow direction
        let flowDirection = 1;
        if (sourceNodeX != -1) {
            let d1 = Math.sqrt((sourceNodeX - lineStartX)**2 + (sourceNodeY - lineStartY)**2);
            let d2 = Math.sqrt((sourceNodeX - lineEndX)**2 + (sourceNodeY - lineEndY)**2);
            if (d1 > d2) flowDirection = -1;
        }
        else if (destNodeX != -1) {
            let d1 = Math.sqrt((destNodeX - lineStartX)**2 + (destNodeY - lineStartY)**2);
            let d2 = Math.sqrt((destNodeX - lineEndX)**2 + (destNodeY - lineEndY)**2);
            if (d1 > d2) flowDirection = -1;
        }

        // Get the line direction
        let l1 = {}
        let d2 = 0;
        if (flowDirection === 1) {
            l1 = new patternArt.Geo.Line({x: x1, y: y1}, {x: x2, y: y2});
            d2 = Math.sqrt((x - x1)**2 + (y - y1)**2);
        }
        else {
            l1 = new patternArt.Geo.Line({x: x2, y: y2}, {x: x1, y: y1});
            d2 = Math.sqrt((x - x2)**2 + (y - y2)**2);
        }
        let d = Math.sqrt((x2 - x1)**2 + (y2 - y1)**2);
        let pointOffset = (d2 - 15) / d;
        let l2 = patternArt.Geo.perpendicularLine(l1, pointOffset, 10, patternArt.Geo.LEFT);
        let l3 = patternArt.Geo.perpendicularLine(l1, pointOffset, 10, patternArt.Geo.RIGHT);
        
        // Determine the arrow points
        let p1x = l2.b.x;
        let p1y = l2.b.y;
        let p2x = l3.b.x;
        let p2y = l3.b.y;

        // Add the arrow to the line
        let line = new Konva.Line({
            points: [p1x, p1y, x, y, p2x, p2y],
            stroke: 'red',
            strokeWidth: 2
        });
        line.on("click", (e) => this.flowArrowClicked(e));
        this.currentFlowDrawing.flowArrow = line;
        this.currentFlowDrawing.flowGroup.add(line);
        this.flowArrowAdded = true;
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
            nodeNum: newFlowNodeNum
        });
        marker.setAttr("draggable", true);
        marker.on("click", (e) => this.flowNodeClicked(e));
        marker.on("dragstart", (e) => this.flowNodeDragStart(e));
        marker.on("dragmove", (e) => this.flowNodeDragged(e));
        marker.on("dragend", (e) => this.flowNodeDragEnd(e));

        // **
        let {itemNum, flowNodeItem} = this.findCurrentFlowDrawingFlowNode(flowNodeNum);
        console.log("insertFlowNode: flowNodeNum, itemNum, flowNodeItem - ", flowNodeNum, itemNum, flowNodeItem);
        let x1 = flowNodeItem.marker.getAttr("x");
        let y1 = flowNodeItem.marker.getAttr("y");
        let [prevX, prevY] = flowNodeItem.line.points;
        let {prevItemNum, prevNode} = this.findFlowNodeAtXY(prevX, prevY);
        flowNodeItem.line.setAttr("points", [x, y, x1, y1]);
        flowNodeItem.line.setAttr("x", x);
        flowNodeItem.line.setAttr("y", y);
        let prevFlowItem = this.currentFlowDrawing.points[itemNum - 1];
        x1 = prevX;
        y1 = prevY;
        let x2 = x;
        let y2 = y;
        // Calculate angle of the line
        let lineAngle = this.calculateLineAngle(x1, y1, x2, y2);
        let line = new Konva.Rect({
            x: x1,
            y: y1,
            width: dfm.flowLineWidth,
            height: Math.sqrt((x1 - x2)**2 + (y1 - y2)**2),
            stroke: 'black',
            strokeWidth: 1,
            fill: '#a0a0a0',
            offsetX: dfm.flowLineWidth / 2,
            offsetY: 0,
            rotation: lineAngle,
            points: [x1, y1, x2, y2],
            nodeNum: flowNodeNum
        });
        line.on("click", (e) => this.flowLineClicked(e));
        this.currentFlowDrawing.flowGroup.add(marker);
        this.currentFlowDrawing.flowGroup.add(line);
        marker.setZIndex(0.2);
        line.setZIndex(0.1);
        let points = [];
        let count = 0;
        for (let item of this.currentFlowDrawing.points) {
            if (count === itemNum) {
                points.push({marker: marker, line: line})
            }
            points.push(item);
            ++count;
        }
        this.currentFlowDrawing.points = points;
    }

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
