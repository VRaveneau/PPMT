// Creates a list with the default d3.js symbols and the extended list
//	works with the content of d3-symbol-extra.js
//  from https://github.com/YellowTugboat/d3-symbol-extra


var symbolList = d3.symbols;
var symbolNames = ["Circle",
					"Cross",
					"Diamond",
					"Square",
					"Star",
					"Triangle up",
					"Y"]; // default symbol types

symbolList.push(d3.symbolPentagon);
symbolNames.push("Pentagon");
symbolList.push(d3.symbolTriangleDown);
symbolNames.push("Triangle down");
symbolList.push(d3.symbolTriangleLeft);
symbolNames.push("Triangel left");
symbolList.push(d3.symbolTriangleRight);
symbolNames.push("Triangle right");
symbolList.push(d3.symbolDiamondAlt);
symbolNames.push("Diamond alt");
symbolList.push(d3.symbolDiamondSquare);
symbolNames.push("Diamond square");
symbolList.push(d3.symbolHexagon);
symbolNames.push("Hexagon");
symbolList.push(d3.symbolHexagonAlt);
symbolNames.push("Hexagon alt");
//extendedSymbolTypes.push(d3.symbolOctagon);
//extendedSymbolTypes.push(d3.symbolOctagonAlt);
symbolList.push(d3.symbolCrossAlt);
symbolNames.push("Cross alt");


var extendedSymbolTypes = [symbolList, symbolNames];

/*
var symbolRowSvg = d3.select('body').append("svg")
.attr("width", 4000)
.attr("height", 200);
extendedSymbolTypes.forEach( function(s,i) {
  symbolRowSvg.append("path")
  .attr("d",d3.symbol().type(s).size(200))
  .attr("transform","translate("+(i+1)*30+",50)")
  .attr("fill","rgb(135, 198, 105)");
});*/