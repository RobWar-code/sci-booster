function getNodeStats() {
    nodeData.width = stageWidth/GLOBALS.minStageWidth * GLOBALS.minNodeWidth;
    nodeData.height = GLOBALS.nodeHeight;
    nodeData.scale = stageWidth/GLOBALS.minStageWidth;
}

function addNode() {
    getNodeStats();
    let nodeX = 100;
    let nodeY = 100;
    let nodeSprite = new PIXI.Sprite(nodeTexture);
    nodeSprite.anchor.set({x: 0, y: 0});
    nodeSprite.scale.set({x: nodeData.scale, y: 1});
    nodeSprite.x = nodeX;
    nodeSprite.y = nodeY;
    stageApp.stage.addChild(nodeSprite);
}
