window.addEventListener ? 
		window.addEventListener("load", init, false) : 
		window.attachEvent && window.attachEvent("onload", init);

var isLive = false;	// Switch between live and dev socket adress
//isLive = true;	// Uncomment for the live version

var servletAdress = isLive ?
		"http://ppmt.univ-nantes.fr/ppmt/datasetProvider" :
		"http://localhost:8080/ppmt/datasetProvider";

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
	let datasetNb = parseInt(message.size);
	
	for (let i = 0; i < datasetNb; i++) {
		let dsName = message[i.toString()];
		let dsParams = JSON.parse(message["param"+i.toString()]);

		// Create the card for the dataset
		let card = dsList.append("div")
			.classed("datasetCard", true)
			.classed("clickable", true);
		card.on("click",function() {
			// Redirect to the tool with the selected dataset
			location.href = "tool.html?ds="+dsName;
		});
		card.append("p")
			.classed("name", true)
			.text(dsName);
		
		// Add more information to the card if they are available
		if (dsParams.nbUsers) {
			card.append("p")
				.classed("nbUsers", true)
				.classed("datasetParameter", true)
				.text("Users : " + dsParams.nbUsers);
		}
		if (dsParams.nbEvents) {
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
		if (dsParams.nbEventTypes) {
			card.append("p")
				.classed("nbEventTypes", true)
				.classed("datasetParameter", true)
				.text("Event types : " + dsParams.nbEventTypes);
		}
		if (dsParams.duration) {
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

