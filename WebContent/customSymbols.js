// Creates a list with the default d3.js symbols and the extended list
//	works with the content of d3-symbol-extra.js
//  from https://github.com/YellowTugboat/d3-symbol-extra

var extendedSymbolTypes = d3.symbols;

extendedSymbolTypes.push(d3.symbolPentagon);
extendedSymbolTypes.push(d3.symbolTriangleDown);
extendedSymbolTypes.push(d3.symbolTriangleLeft);
extendedSymbolTypes.push(d3.symbolTriangleRight);
extendedSymbolTypes.push(d3.symbolDiamondAlt);
extendedSymbolTypes.push(d3.symbolDiamondSquare);
extendedSymbolTypes.push(d3.symbolPentagon);
extendedSymbolTypes.push(d3.symbolHexagon);
extendedSymbolTypes.push(d3.symbolHexagonAlt);
extendedSymbolTypes.push(d3.symbolOctagon);
extendedSymbolTypes.push(d3.symbolOctagonAlt);
extendedSymbolTypes.push(d3.symbolCrossAlt);

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