function setupHoverText() {
    	// Hover Set-up
	dfm.hoverLayer = new Konva.Layer();

	dfm.hoverGroup = new Konva.Group({
		x: 70,
		y: 70
	});

	dfm.hoverBox = new Konva.Rect({
		x: 0,
		y: 0,
		width: 100,
		height: 30,
		fill: '#d0d060',
		stroke: 'black'
	});

	// Setup the hover text
	dfm.hoverText = new Konva.Text({
		x: 2,
		y: 2,
		text: "Some Hover Text",
		fontFamily: 'Calibri',
		style: 'italic',
		fontSize: 12,
		fill: 'black'
	});

	dfm.hoverGroup.add(dfm.hoverBox);
	dfm.hoverGroup.add(dfm.hoverText);
	dfm.hoverText.setZIndex(1);
	dfm.stageApp.add(dfm.hoverLayer);
	dfm.hoverLayer.add(dfm.hoverGroup);

}

function displayHoverText(message, x, y) {
    dfm.hoverGroup.absolutePosition({x: x, y: y});
    dfm.hoverText.setAttr('text', message);
    dfm.hoverLayer.draw();
}