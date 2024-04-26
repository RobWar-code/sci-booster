function getNodeStats() {
    nodeData.width = stageWidth/GLOBALS.minStageWidth * GLOBALS.minNodeWidth;
    nodeData.height = GLOBALS.nodeHeight;
    nodeData.scale = stageWidth/GLOBALS.minStageWidth;
}

function addNode() {
    /*
    console.log ("got to addNode");
    getNodeStats();
    let nodeX = 100;
    let nodeY = 100;
    let nodeSprite = new PIXI.Sprite(nodeTexture);
    console.log("nodeSprite:", nodeSprite);
    nodeSprite.anchor.set({x: 0, y: 0});
    nodeSprite.x = nodeX;
    nodeSprite.y = nodeY;
    stageApp.stage.addChild(nodeSprite);
    */
}

function buildNodeGraphic() {
    dfm.nodeGroup = new Konva.Group({x: 50, y: 50});
    var node = new Konva.Image({
        x: 0,
        y: 0,
        image: dfm.nodeGraphics.node,
        width: GLOBALS.minNodeWidth,
        height: GLOBALS.nodeHeight
    });

    var nodeText = new Konva.Text({
        x: 2,
        y: 2,
        text: 'Petrol Station',
        fontSize: 13,
        fontFamily: 'Calibri',
        fill: 'black'
    });

    var detailsButton = new Konva.Image({
        x: 2,
        y: GLOBALS.nodeButtonTop,
        image: dfm.nodeGraphics.details,
        width: GLOBALS.nodeOptionWidth,
        height: GLOBALS.nodeOptionHeight
    });

    detailsButton.on('mouseover', () => {
        doMouseOver("Details", dfm.nodeGroup.absolutePosition().x + 25, dfm.nodeGroup.absolutePosition().y + 38)});

    var flowLinkButton = new Konva.Image({
        x: 28,
        y: GLOBALS.nodeButtonTop,
        image: dfm.nodeGraphics.flowLink,
        width: GLOBALS.nodeOptionWidth,
        height: GLOBALS.nodeOptionHeight
    });

    var zoomDetailsButton = new Konva.Image({
        x: 52,
        y: GLOBALS.nodeButtonTop,
        image: dfm.nodeGraphics.zoomDetails,
        width: GLOBALS.nodeOptionWidth,
        height: GLOBALS.nodeOptionHeight
    });

    var webLinkButton = new Konva.Image({
        x: 78,
        y: GLOBALS.nodeButtonTop,
        image: dfm.nodeGraphics.webLink,
        width: GLOBALS.nodeOptionWidth,
        height: GLOBALS.nodeOptionHeight
    });

    dfm.nodeGroup.add(node);
    dfm.nodeGroup.add(nodeText);
    dfm.nodeGroup.add(detailsButton);
    dfm.nodeGroup.add(flowLinkButton);
    dfm.nodeGroup.add(zoomDetailsButton);
    dfm.nodeGroup.add(webLinkButton);
    nodeText.setZIndex(1);
    detailsButton.setZIndex(1);
    flowLinkButton.setZIndex(1);
    zoomDetailsButton.setZIndex(1);
    webLinkButton.setZIndex(1);

}

function doMouseOver(message, x, y) {
    displayHoverText(message, x, y);
}