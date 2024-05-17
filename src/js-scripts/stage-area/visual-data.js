// The flow diagram visual data and processing class
dfm.FlowVisuals = class {
    constructor() {
        this.active = false;
        this.flowDrawMode = false;
        this.nodeLayer = null;
        this.nodeTemplate =  {
            active: false,
            nodeNum: "00",
            label: "",
            nodeGroup: null
        }
        this.nodes = []
        this.flowTemplate = {
            active: false,
            flowNum: "00",
            label: "",
            flowGroup: null,
            points: [] // [{x:, y:}]
        }
        this.flows= []
        this.setStageDetails();
    }

    setStageDetails() {
        this.nodeLayer = new Konva.Layer();
        dfm.stageApp.add(this.nodeLayer);
    }

    addNode(label, nodeNum, x, y) {
        let node = Misc.copyObject(this.nodeTemplate);
        node.active = true;
        node.nodeNum = nodeNum;
        node.label = label;
        node.nodeGroup = new Konva.Group({
            x: x / dfm.scaleX,
            y: y
        });
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
        nodeObj = this.getNode(nodeNum);
        if (!nodeObj.found) return;
        node = nodeObj.node;
        index = nodeObj.index;
        node.nodeObject.delete();
        this.nodeLayer.draw();
        this.nodes.splice(index, 1);
    }

}
