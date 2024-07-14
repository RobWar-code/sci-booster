// The flow diagram visual data and processing class
dfm.FlowVisuals = class {
    constructor() {
        this.active = false;
        this.flowDrawMode = false;
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
        this.lastX = 0;
        this.lastY = 0;
        this.flowLabelSet = false;
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
        this.destroyCurrentPage();
        this.redoNodes();
        this.redoFlows();
    }

    redoNodes() {
        for (let node of dfm.currentPage.page.nodes) {
            let nodeNum = node.node_num;
            let label = node.label;
            let x = node.x;
            let y = node.y;
            this.addNode(nodeNum, label, x, y);
        }
    }

    redoFlows() {
        this.flows = [];
        for (let flow of dfm.currentPage.page.flows) {
            console.log("redoFlows - flow:", flow);
            let visualFlowDrawing = this.makeVisualFlow(flow);           
            // Add the flow line drawing to the visual data
            this.flows.push(visualFlowDrawing);
        }
        console.log ("redoFlows, flows:", this.flows);
    }

    destroyCurrentPage() {
        this.nodeLayer.destroy();
        this.setStageDetails();
        this.nodes = [];
        this.flows = [];
    }

    addNode(label, nodeNum, x, y) {
        let node = Misc.copyObject(this.nodeTemplate);
        node.active = true;
        node.nodeNum = nodeNum;
        node.label = label;
        node.nodeGroup = new Konva.Group({
            x: x / dfm.scaleX,
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
        this.nodes.push(node);
    }

    nodeDragStart(event) {
        event.cancelBubble = true;
    }

    nodeDragMove(event) {
        event.cancelBubble = true;
    }

    nodeDragEnd(event) {
        let nodeNum = event.target.getAttr("nodeNum");
        let x = event.target.getAttr("x");
        let y = event.target.getAttr("y");
        // Update the page data
        let node = dfm.currentPage.getNode(nodeNum);
        if (node != null) {
            node.x = x;
            node.y = y;
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
        console.log("CurrentFlow in initialiseFlowEdit:", this.currentFlow);
        // Remove the non-editable version of the flow line
        let flowNum = flowDetails.flow_num;
        let flow = this.getFlow(flowNum);
        if (flow === null) {
            console.error("Visual flow details for flow not found:", flowNum);
            console.log(this.flows)
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
        dfm.modelEditMode = true;

        document.getElementById("flowDoneButton").style.display = "none";
        document.getElementById("cancelFlowDrawButton").style.display = "none";
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
        let label = flowDetailsItem.label;
        x = flowDetailsItem.label_x;
        y = flowDetailsItem.label_y;
        let width = flowDetailsItem.label_width;
        let rect = new Konva.Rect({
            x: x,
            y: y,
            width: width,
            height: dfm.nodeTemplate.fontSize + 6,
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
            text: flowDetailsItem.label,
            fontFamily: dfm.nodeTemplate.fontFamily,
            fontSize: dfm.nodeTemplate.fontSize,
            fill: 'black'
        });
        visualFlowItem.flowGroup.add(text);
        this.nodeLayer.add(visualFlowItem.flowGroup);
        return visualFlowItem;
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
        };
        let flowNode = {};
        x = x - this.currentFlowDrawing.flowGroup.getAttr('x');
        y = y - this.currentFlowDrawing.flowGroup.getAttr('y');
        flowNode.marker = new Konva.Circle({
            x: x,
            y: y,
            radius: 4,
            fill: 'white',
            stroke: 'black',
            strokeWidth: 1,
            nodeNum: flowNodeNum
        });
        flowNode.marker.setAttr("draggable", true);
        flowNode.marker.on("click", (e) => this.flowNodeClicked(e));
        flowNode.marker.on("dragstart", (e) => this.flowNodeDragStart(e));
        flowNode.marker.on("dragmove", (e) => this.flowNodeDragged(e));
        flowNode.marker.on("dragend", (e) => this.flowNodeDragEnd(e));
        if (this.currentFlowDrawing.points.length > 0) {
            flowNode.line = new Konva.Line({
                points: [this.lastX, this.lastY, x, y],
                stroke: 'black',
                strokeWidth: 2,
                nodeNum: flowNodeNum
            })
            flowNode.line.on("click", (e) => this.flowLineClicked(e));
            this.currentFlowDrawing.flowGroup.add(flowNode.line);
            flowNode.line.setZIndex(0.1);
        }
        this.currentFlowDrawing.points.push(flowNode);
        this.currentFlowDrawing.flowGroup.add(flowNode.marker);
        flowNode.marker.setZIndex(0.2);
        this.currentFlowDrawing.flowGroup.draw();
        ++this.flowNodeCount;
        this.lastX = x;
        this.lastY = y;
    }

    addFlowLabel() {
        if (this.flowLabelSet) return;

        let x = this.flowClickX / dfm.scaleX;
        let y = this.flowClickY;
        x = x - this.currentFlowDrawing.flowGroup.getAttr('x');
        y = y - this.currentFlowDrawing.flowGroup.getAttr('y');

        let label = this.currentFlow.label;
        let labelWidth = label.length * 9 + 6;
        this.currentFlow.label_width = labelWidth;
        let leftXOffset = label.length / 2 * 9 + 3;
        let rect = new Konva.Rect({
            x: x - leftXOffset,
            y: y - 3,
            width: labelWidth,
            height: dfm.nodeTemplate.fontSize + 6,
            stroke: 'black',
            strokeWidth: 1,
            fill: 'white',
            flowNum: this.currentFlow.flow_num
        });
        let text = new Konva.Text({
            x: x - leftXOffset + 3,
            y: y,
            text: label,
            fontFamily: dfm.nodeTemplate.fontFamily,
            fontSize: dfm.nodeTemplate.fontSize,
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
        this.currentFlow.labelX = x - leftXOffset;
        this.currentFlow.labelY = y - 3;
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
        console.log("got to flowNodeClicked", flowNodeNum);
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
        let {itemNum, flowNodeItem} = this.findCurrentFlowDrawingFlowNode(flowNodeNum);
        console.log("itemNum, flowNodeNum", itemNum, flowNodeNum);
        if (itemNum === -1) {
            console.log("Could not find flow node to delete");
            return;
        }
        if (itemNum === 0) {
            this.currentFlowDrawing.points[itemNum].marker.destroy();
        }
        if (this.currentFlowDrawing.points.length === 1) {
            this.currentFlowDrawing.points = [];
        }
        else if (this.currentFlowDrawing.points.length === 2) {
            if (itemNum === 1) {
                this.currentFlowDrawing.points[itemNum].line.destroy();
                this.currentFlowDrawing.points[itemNum].marker.destroy();
                this.lastX = this.currentFlowDrawing.points[itemNum - 1].marker.getAttr("x");
                this.lastY = this.currentFlowDrawing.points[itemNum - 1].marker.getAttr("y");
            }
            else {
                this.currentFlowDrawing.points[itemNum].line.destroy();
            }
        }
        else if (itemNum === 0) {
            this.currentFlowDrawing.points[itemNum + 1].line.destroy();
        }
        else if (itemNum === this.currentFlowDrawing.points.length - 1) {
            this.currentFlowDrawing.points[itemNum].line.destroy();
            this.currentFlowDrawing.points[itemNum].marker.destroy();
            this.lastX = this.currentFlowDrawing.points[itemNum - 1].marker.getAttr('x');
            this.lastY = this.currentFlowDrawing.points[itemNum - 1].marker.getAttr('y');
        }
        else {
            let x = this.currentFlowDrawing.points[itemNum - 1].marker.getAttr("x");
            let y = this.currentFlowDrawing.points[itemNum - 1].marker.getAttr("y");
            let x1 = this.currentFlowDrawing.points[itemNum + 1].marker.getAttr("x");
            let y1 = this.currentFlowDrawing.points[itemNum + 1].marker.getAttr("y");
            this.currentFlowDrawing.points[itemNum + 1].line.setAttr("points", [x, y, x1, y1]);
            this.currentFlowDrawing.points[itemNum].line.destroy();
            this.currentFlowDrawing.points[itemNum].marker.destroy();
        }
        if (pointsLen >= 2) {
            // Remove the deleted item
            let newPoints = [];
            let count = 0;
            for (let item of this.currentFlowDrawing.points) {
                if (count != itemNum) newPoints.push(item);
                ++count;
            }
            this.currentFlowDrawing.points = newPoints;
        }
        this.currentFlowDrawing.flowGroup.draw();
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
            console.log("Drag end - could not find flowNodeItem")
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
                console.log("timeOut, flowNodeNum:", flowNodeNum);
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
            console.log("addFlowArrow could find flowNodeNum:", flowNodeNum);
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
                console.log("addFlowArrow could not find source node:", sourceNodeNum);
                return;
            }
            sourceNodeX = node.rect.getAttr('x');
            sourceNodeY = node.rect.getAttr('y');
        }
        if (this.currentFlow.destination_node_num != "") {
            let destNodeNum = this.currentFlow.destination_node_num;
            let {found, node, index} = this.getNode(destNodeNum);
            if (!found) {
                console.log("addFlowArrow could not find source node:", destNodeNum);
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
            if (d1 < d2) flowDirection = -1;
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
        console.log("got to insertFlowNode");
        x = x / dfm.scaleX - this.currentFlowDrawing.flowGroup.getAttr('x');
        y = y - this.currentFlowDrawing.flowGroup.getAttr('y');
        let newFlowNodeNum = this.getNextFlowNodeNum(); 
        let marker = new Konva.Circle({
            x: x,
            y: y,
            radius: 4,
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

        let {itemNum, flowNodeItem} = this.findCurrentFlowDrawingFlowNode(flowNodeNum);
        console.log("insertFlowNode, item:", flowNodeNum, itemNum, flowNodeItem);
        let x1 = flowNodeItem.marker.getAttr("x");
        let y1 = flowNodeItem.marker.getAttr("y");
        flowNodeItem.line.setAttr("points", [x, y, x1, y1]);
        let prevFlowItem = this.currentFlowDrawing.points[itemNum - 1];
        x1 = prevFlowItem.marker.getAttr("x");
        y1 = prevFlowItem.marker.getAttr("y");
        let line = new Konva.Line({
                points: [x1, y1, x, y],
                stroke: 'black',
                strokeWidth: 2,
                nodeNum: newFlowNodeNum
            })
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

    findCurrentFlowDrawingFlowNode(flowNodeNum) {
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

}
