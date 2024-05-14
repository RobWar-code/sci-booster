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
            x: x,
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
            height: dfm.nodeTemplate.optionHeight
        });
        node.zoomDetailsOpt = new Konva.Image({
            x: dfm.nodeTemplate.width/2 - dfm.nodeTemplate.optionWidth - dfm.nodeTemplate.optionLeft/2,
            y: dfm.nodeTemplate.optionTop,
            image: dfm.nodeGraphics.zoomDetails,
            width: dfm.nodeTemplate.optionWidth,
            height: dfm.nodeTemplate.optionHeight
        });
        node.flowLinkOpt = new Konva.Image({
            x: dfm.nodeTemplate.width/2 + dfm.nodeTemplate.optionLeft/2,
            y: dfm.nodeTemplate.optionTop,
            image: dfm.nodeGraphics.flowLink,
            width: dfm.nodeTemplate.optionWidth,
            height: dfm.nodeTemplate.optionHeight
        });
        node.hyperlinkOpt = new Konva.Image({
            x: dfm.nodeTemplate.width - dfm.nodeTemplate.optionWidth - dfm.nodeTemplate.optionLeft,
            y: dfm.nodeTemplate.optionTop,
            image: dfm.nodeGraphics.hyperlink,
            width: dfm.nodeTemplate.optionWidth,
            height: dfm.nodeTemplate.optionHeight
        });
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
}
