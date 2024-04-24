
const startStageApp = async () => {
    console.log ("Got to startApp");
    stageApp = new PIXI.Application();

    let response = await stageApp.init({width: stageWidth, height: stageHeight, backgroundColor: 0xd0d0d0});
    if (response) {
        let stageElem = document.getElementById("flowModelStageDiv");

        stageElem.appendChild(stageApp.canvas);
    }

    nodeTexture = await PIXI.Assets.load("../../images/node.png");
}