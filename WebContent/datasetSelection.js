
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

window.addEventListener ? 
		window.addEventListener("load", init, false) : 
		window.attachEvent && window.attachEvent("onload", init);

var servletAdress = config.servletAdress;

/**
 * Initializes the system at the start
 */
function init() {
	
	fetch(servletAdress)
		.then( (response) => response.json() )
		.then( function(json) {
			receiveDatasetList(json);
		});
}

/**
 * Displays the list of available datasets
 * @param {JSON} message - The list of datasets, with information about them
 */
function receiveDatasetList(message) {
	let messageTag = document.getElementById("message");
	
	messageTag.textContent = "Select the dataset you want to use";
	
	let dsList = d3.select("#datasetList");
	let datasetNb = message.size;
	console.log(datasetNb);
	for (let i = 0; i < datasetNb; i++) {
		let dsName = message[i.toString()];
		let dsParams = message["param"+i.toString()];
		console.log(dsParams);

		// Create the card for the dataset
		let card = dsList.append("div")
			.classed("datasetCard", true)
			.classed("clickable", true);
		card.on("click",function() {
			// Redirect to the tool with the selected dataset
			location.href = "tool.html?data="+dsName;
		});
		card.append("p")
			.classed("name", true)
			.text(dsName);
		
		// Add more information to the card if they are available
		if (dsParams.nbUsers > 0) {
			card.append("p")
				.classed("nbUsers", true)
				.classed("datasetParameter", true)
				.text("Users : " + dsParams.nbUsers);
		}
		if (dsParams.nbEvents > 0) {
			// Display large numbers with a space every 3 digit
			let nbE = dsParams.nbEvents
				.toString().split('').reverse().reduce(function(acc,val) {
					if (acc.size % 3 == 0) {
						acc.val.push(" ");
					}
					acc.val.push(val);
					acc.size += 1;
					return acc;
				}, {"val":[], "size" :0})
				.val.reverse().join('').trim();
			card.append("p")
				.classed("nbEvents", true)
				.classed("datasetParameter", true)
				.text("Events : " + nbE);
		}
		if (dsParams.nbEventTypes > 0) {
			card.append("p")
				.classed("nbEventTypes", true)
				.classed("datasetParameter", true)
				.text("Event types : " + dsParams.nbEventTypes);
		}
		if (dsParams.duration.length > 0) {
			card.append("p")
				.classed("duration", true)
				.classed("datasetParameter", true)
				.text("Duration : " + dsParams.duration);
		}
		
		// Prioritize the most used datasets
		switch(dsName) {
		case "coconotesPPMT":
			card.style("order","1");
			break;
		case "recsysSamplecategory":
			card.style("order","2");
			break;
		default:
		}
	}
}

