
/* This file is copyright (c) 20015-2020 Vincent Raveneau
* 
* This file is part of the PPMT software.
* 
* PPMT is free software: you can redistribute it and/or modify it under the
* terms of the GNU General Public License as published by the Free Software
* Foundation, either version 3 of the License, or (at your option) any later
* version.
* PPMT is distributed in the hope that it will be useful, but WITHOUT ANY
* WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
* A PARTICULAR PURPOSE. See the GNU General Public License for more details.
* You should have received a copy of the GNU General Public License along with
* PPMT. If not, see <http://www.gnu.org/licenses/>.
*/

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