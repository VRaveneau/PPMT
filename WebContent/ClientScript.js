console.log("start");

window.addEventListener ? 
		window.addEventListener("load",init,false) : 
		window.attachEvent && window.attachEvent("onload",init);

var webSocket = null;
var timeline = null;
var timelineXAxis = null;
var timelineOverview = null;
var timelineOverviewXAxis = null;
var timelineIds = 0;

var patternsLoaded = false;
var patternsReceived = false;

// Timeline brushing
var brush = null;
var zoom = null;
var x = null;
var xOverview = null;
var xAxis = null;
var xAxisOverview = null;
var y = null;
var yOverview = null;
var area = null;
var area2 = null;
var tlHeight = null;

var patterns = {};
var occurrences = {}
var patternProbabilities = {};
var itemColors = {};
var shapes = extendedSymbolTypes;
var itemShapes = {};	// TODO request a list of shapes from the server to populate this list
var datasetInfo = {};
var availableColors = [];

var highlightedUsers = [];

var history = [];

var datasetInfoIsDefault = true;
var historyDisplayIsDefault = true;
var eventDisplayIsDefault = true;

var userTraces = {};
var userList = [];

var numberOfPattern = 0;

/************************************************************/
/*															*/
/*						Old functions						*/
/*															*/
/************************************************************/


/************************************/
/*				Kept				*/
/************************************/

/**
 * Handling the connection to the server
 */
function processOpen(message) {
	console.log("Server connected." + "\n");
	
	// For test purpose
	/*var action = {
			action: "testFileReading"
	};
	webSocket.send(JSON.stringify(action));*/
	
	requestDatasetInfo("Agavue");	// TODO request the information on the dataset to the server
	requestEventTypes("Agavue");	// TODO provide info about the event types
	requestUserList("Agavue");
	console.log("requesting the dataset");
	enableCentralOverlay("The dataset is loading...");
	requestDataset("Agavue");	// TODO request the data to the server
	requestYearBins("Agavue");
	//requestPatterns("Agavue");
	//timelineOverview();	// TODO Check if still necessary after the new timeline, if so comment it out
}

function requestPatterns(datasetName) {
	var action = {
			action: "request",
			object: "allPatterns",
			dataset: datasetName
	};
	webSocket.send(JSON.stringify(action));
}

function requestYearBins(datasetName) {
	var action = {
			action: "request",
			object: "data",
			shape: "bin",
			scale: "year",
			dataset: datasetName
	};
	webSocket.send(JSON.stringify(action));
}

function requestMonthBins(datasetName) {
	var action = {
			action: "request",
			object: "data",
			shape: "bin",
			scale: "month",
			dataset: datasetName
	};
	webSocket.send(JSON.stringify(action));
}

function requestHalfMonthBins(datasetName) {
	var action = {
			action: "request",
			object: "data",
			shape: "bin",
			scale: "halfMonth",
			dataset: datasetName
	};
	webSocket.send(JSON.stringify(action));
}

function requestDayBins(datasetName) {
	var action = {
			action: "request",
			object: "data",
			shape: "bin",
			scale: "day",
			dataset: datasetName
	};
	webSocket.send(JSON.stringify(action));
}

function requestHalfDayBins(datasetName) {
	var action = {
			action: "request",
			object: "data",
			shape: "bin",
			scale: "halfDay",
			dataset: datasetName
	};
	webSocket.send(JSON.stringify(action));
}

/**
 * Handling the reception of a message from the server
 */

function processMessage(message/*Compressed*/) {
	//console.log("Receive from server => " + message.data + "\n");
	//var message = LZString.decompressFromUTF16(messageCompressed.data);
	var msg = JSON.parse(message.data);
	
	if (msg.action === "add") {
		addPattern(msg);
		addPatternToList(msg);
	}
	if (msg.action === "remove") {
		console.log("removing id "+msg.id);
		removePatternFromList(msg.id);
	}
	if (msg.action === "newEvent") {
		/*
		if (msg.end.length > 0) {
			addToTimeline(msg.type, msg.start, msg.quantity, msg.end);
		} else {
			addToTimeline(msg.type, msg.start, msg.quantity);
		}*/
	}
	if (msg.action === "refresh") {
	  	console.log("Refresh received, but the handling of such message is disabled");
		//timeline.setItems(timelineItems);
	}
	if (msg.action === "datasetInfo") {	// Reception of information about the dataset
		receiveDatasetInfo(msg);
	}
	if (msg.action === "data") {	// Reception of data
		if (msg.type === "userList")
			receiveUserList(msg);
		if (msg.type === "userTrace")
			receiveUserTrace(msg);
		if (msg.type === "bin")
			receiveDataBins(msg);
		if (msg.type === "patterns")
			receiveAllPatterns(msg);
		if (msg.type === "events")
			receiveEvents(msg);
		if (msg.type === "patternOccs")
			receivePatternOccurrences(msg);
	}
	if (msg.action === "eventTypes") {	// Reception of data on the event types
		receiveEventTypes(msg);
	}
	if (msg.action === "trace") {	// Reception of a trace
		displayUserTrace(msg);
	}
	if (msg.action === "patterns") {	// Reception of patterns
		displayUserPatterns(msg);
	}
	if (msg.action === "debug") {	// Receiving a debug message from the server
		displayServerDebugMessage(msg);
	}
	if (msg.action === "startLoading") {		// The server starts to load the dataset
		displayDatasetLoading();
	}
	if (msg.action === "info") {
		if (msg.object === "newPattern") {
			addPatternToList(msg);
		}
	}
	if (msg.action === "signal") {
		if (msg.type === "start")
			startAlgorithmRuntime(parseInt(msg.time));
		if (msg.type === "end")
			stopAlgorithmRuntime(parseInt(msg.time));
		if (msg.type === "newLevel")
			handleNewLevelSignal(parseInt(msg.level));
		if (msg.type === "loading")
			handleLoadingSignal();
		if (msg.type === "loaded")
			handleLoadedSignal();
	}
}

function receiveDataBins(message) {
	//if (message.scale === "year") {
		var bins = [];
		var pBins = [];
		
		var binNumber = parseInt(message.number);
		for (var i = 0; i < binNumber; i++) {
			let bin = [];
			let pbin = [];
			bin.push(message["year"+i]);
			bin.push(message["start"+i]);
			bin.push(message["end"+i]);
			bin.push(message["value"+i]);
			bin.push(message["users"+i]);
			bin.push(message["events"+i]);
			bin.push(message["occs"+i]);
			
			pbin.push(message["year"+i]);
			pbin.push(message["start"+i]);
			pbin.push(message["end"+i]);
			pbin.push(message["value"+i]);
			pbin.push(message["users"+i]);
			pbin.push(message["events"+i]);
			pbin.push(message["occs"+i]);
			
			bins.push(bin);
			pBins.push(pbin);
		}
		
		timeline.setBins(bins);
		timeline.displayData();
		timeline.binTransformed = false;
		if (patternsReceived)
			timeline.drawPatternBins(pBins);
	/*} else
	if (message.scale === "month") {
		var bins = [];
		var pBins = [];
		
		var binNumber = parseInt(message.number);
		for (var i = 0; i < binNumber; i++) {
			let bin = [];
			let pbin = [];
			bin.push(message["year"+i]);
			bin.push(message["start"+i]);
			bin.push(message["end"+i]);
			bin.push(message["value"+i]);
			
			pbin.push(message["year"+i]);
			pbin.push(message["start"+i]);
			pbin.push(message["end"+i]);
			pbin.push(message["value"+i]);
			
			bins.push(bin);
			pBins.push(pbin);
		}
		
		timeline.drawBins(bins);
		timeline.binTransformed = false;
		if (patternsReceived)
			timeline.drawPatternBins(pBins);
	} else
	if (message.scale === "day") {
		var bins = [];
		let pBins = [];
		
		var binNumber = parseInt(message.number);
		for (var i = 0; i < binNumber; i++) {
			let bin = [];
			let pbin = [];
			bin.push(message["year"+i]);
			bin.push(message["start"+i]);
			bin.push(message["end"+i]);
			bin.push(message["value"+i]);
			
			pbin.push(message["year"+i]);
			pbin.push(message["start"+i]);
			pbin.push(message["end"+i]);
			pbin.push(message["value"+i]);
			
			bins.push(bin);
			pBins.push(pbin);
		}
		
		timeline.drawBins(bins);
		timeline.binTransformed = false;
		if (patternsReceived)
			timeline.drawPatternBins(pBins);
	} else
	if (message.scale === "halfDay") {
		var bins = [];
		let pBins = [];
		
		var binNumber = parseInt(message.number);
		for (var i = 0; i < binNumber; i++) {
			let bin = [];
			let pbin = [];
			bin.push(message["year"+i]);
			bin.push(message["start"+i]);
			bin.push(message["end"+i]);
			bin.push(message["value"+i]);
			
			pbin.push(message["year"+i]);
			pbin.push(message["start"+i]);
			pbin.push(message["end"+i]);
			pbin.push(message["value"+i]);
			
			bins.push(bin);
			pBins.push(pbin);
		}
		
		timeline.drawBins(bins);
		timeline.binTransformed = false;
		if (patternsReceived)
			timeline.drawPatternBins(pBins);
	}*/
}

function receivePatternOccurrences(message) {
	var pId = message.patternId;
	var count = parseInt(message.count);
	
	for (var i=0; i < count; i++) {
		timeline.addPatternOccurrence(pId, message[i.toString()]);
	}
	console.log("Received "+count+" occurrences of pattern "+pId);
	timeline.displayPatternOccurrences(pId);
}

/**
 * Handling the disconnection with the server
 */
function processClose(message) {
	console.log("Server disconnected." + "\n");
}

/**
 * Handling error messages from the server
 */
function processError(message) {
	console.log("Error" + "\n");
}

/**
 * Initializing the system at the start
 */
function init() {
	//setReadyToStart();				Commented out while updating the app
	
	console.log("init");
	
	document.getElementById("defaultControlTab").click();	// Set the "trace" tab active by default
	document.getElementById("defaultPatternTab").click();	// Set the "list" pattern-tab active by default

	createTimeline();	// TODO Initialize the timeline
	
	setupAlgorithmSliders();
	
	resetDatasetInfo();	// Set the display of information on the dataset
	resetHistory();	// Reset the history display
	
	/*function getRootUri() {
		var h = document.location.hostname == "" ? "localhost" : document.location.hostname;
		var p = document.location.port == "" ? "8080" : document.location.port;
		console.log("ws://" + h + ":" +p);
		return "ws://" + h + ":" +p;
	}*/
	
	//webSocket = new WebSocket("ws://localhost:8080/ppmt/wsppmt");
	webSocket = new WebSocket("ws://ppmt.univ-nantes.fr/ppmt/wsppmt");

	webSocket.onopen = processOpen;
	webSocket.onmessage = processMessage;
	webSocket.onclose = processClose;
	webSocket.onerror = processError;
}

/**
 * 
 * @returns
 */
function enableCentralOverlay(message) {
	console.log("Enable central overlay");
	var node = d3.select("#centerOverlay")
				.style("visibility","initial")
				.text(message);
}

/**
 * 
 * @returns
 */
function disableCentralOverlay() {
	console.log("Disable central overlay");
	d3.select("#centerOverlay")
		.style("visibility","hidden");
}

/**
 * Requests a dataset to the server
 */
function requestDataset(datasetName) {
	var action = {
			action: "request",
			object: "dataset",
			dataset: datasetName
	};
	webSocket.send(JSON.stringify(action));
}

/**
 * Requests information about a dataset to the server
 */
function requestDatasetInfo(datasetName) {
	var action = {
			action: "request",
			object: "datasetInfo",
			dataset: datasetName
	};
	webSocket.send(JSON.stringify(action));
}

/**
 * Requests the events of the trace of a given user
 * @param user The user 
 * @returns
 */
function requestUserTrace(user, datasetName) {
	var action = {
			action: "request",
			object: "trace",
			user: user,
			dataset: datasetName
	};
	webSocket.send(JSON.stringify(action));
	requestUserPatterns(user, datasetName);
}

/**
 * Requests the patterns of a given user
 * @param user The user 
 * @returns
 */
function requestUserPatterns(user, datasetName) {
	var action = {
			action: "request",
			object: "patterns",
			user: user,
			dataset: datasetName
	};
	webSocket.send(JSON.stringify(action));
}

/**
 * Requests information about the events of a dataset
 * @param datasetName
 * @returns
 */
function requestEventTypes(datasetName) {
	var action = {
			action: "request",
			object: "eventTypes",
			dataset: datasetName
	};
	webSocket.send(JSON.stringify(action));
}

/**
 * Requests the list of users in the dataset
 * @param datasetName
 * @returns
 */
function requestUserList(datasetName) {
	var action = {
			action: "request",
			object: "userList",
			dataset: datasetName
	};
	webSocket.send(JSON.stringify(action));
}

/**
 * Receives information about a dataset from the server
 * @param message The message containing the information
 * @returns
 */
function receiveDatasetInfo(message) {
	console.log("number of sequences : " + message.numberOfSequences);
	datasetInfo["numberOfSequences"] = parseInt(message.numberOfSequences);
	datasetInfo["numberOfDifferentEvents"] = parseInt(message.numberOfDifferentEvents);
	datasetInfo["numberOfEvents"] = parseInt(message.nbEvents);
	var userList = [];
	for (var i=0; i < datasetInfo["numberOfSequences"];i++)
		userList.push(message["user"+i.toString()]);
	datasetInfo["users"] = userList;
	datasetInfo["firstEvent"] = message.firstEvent;
	datasetInfo["lastEvent"] = message.lastEvent;
	datasetInfo["name"] = message.name;
	
	displayDatasetInfo();
	addToHistory('Dataset loaded');
	
	timeline.updateContextBounds(datasetInfo["firstEvent"], datasetInfo["lastEvent"]);
	
	/*updateTimelineBounds(datasetInfo["firstEvent"], datasetInfo["lastEvent"]);
	updateTimelineOverviewBounds(datasetInfo["firstEvent"], datasetInfo["lastEvent"]);*/
	
	// Maj des bornes de la timeline
	//d3.select
	
	// Old content
	/*var node = document.getElementById("nbDiffEvents");
	node.textContent = message.nbDifferentEvents;
	
	// generate a color for each event
	availableColors = generateColors(datasetInfo["numberOfDifferentEvents"]);
	console.log("color: "+availableColors[0]);
	
	// display the available users
	node = document.getElementById("nbUsers");
	node.textContent = datasetInfo["users"].split(';').length;*/
}

/************************************/
/*				Pending				*/
/************************************/


function startMining() {
	setReadyToStop();
	var action = {
			action: "startMining"
	};
	webSocket.send(JSON.stringify(action));
}

function stopMining() {
	setReadyToStart();
	var action = {
			action: "stopMining"
	};
	webSocket.send(JSON.stringify(action));

	resetPatternsData();
}

function resetPatternsData() {
	var node = document.getElementById("patterns");
	while (node.lastChild) {
		node.removeChild(node.lastChild);
	}
	
	patterns = {};
	patternProbabilities = {};
}

function createTimeline() {
	var container = document.getElementById('timeline');
	timeline = new Timeline("timeline",{});
	
}

function addToTimeline(type, start, quantity, end) {
	//console.log("{id: "+timelineIds+", content: "+type+", start: "+start+", end: "+end+"}");
	timelineItems.add({id: timelineIds, content: type+" : "+quantity, start: start, end: end});
	timelineIds = timelineIds + 1;
}

function addToTimeline(type, start, quantity) {
	timelineItems.add({id: timelineIds, content: type+" : "+quantity, start: start});
  	timelineIds = timelineIds + 1;
}

function setReadyToStart() {
	document.getElementById("startMining").style.display = "";
	document.getElementById("stopMining").style.display = "none";
	document.getElementById("startMining").style.backgroundColor = "#2eb82e";
}

function setReadyToStop() {
	document.getElementById("startMining").style.display = "none";
	document.getElementById("stopMining").style.display = "";
	document.getElementById("stopMining").style.backgroundColor = "#cc0000";
}

function addPattern(pattern) {
	// getting the pattern's items
	//console.log(pattern.items);
	var items = JSON.parse(pattern.items);
	var sequences = pattern.sequences;
	sequences = sequences.split(' ');
	
	// checking if the pattern is already known
	var items_str = JSON.parse(pattern.items) + "";
	var array = items_str.split(',');
	var str = "";
	for (var i = 0 ; i < pattern.size ; i++) {
		str += array[i] + " ";
	}
	str = str.trim();
	
	var potentialNode = document.getElementById("pattern_"+str);
	if (potentialNode == null) {
	//console.log("items : " + items);
	//console.log("seqs : " + sequences);
	//if (Object.keys(patterns).indexOf(items) == -1) {
		patterns[items] = sequences;
		patternProbabilities[items] = sequences.length / datasetInfo["numberOfSequences"];
		
		// affects the first available color to the item
		if (array.length == 1 && itemColors[items] == null) {
			var color = availableColors.shift();
			itemColors[items] = 'rgb('+color+')';
			console.log(items + " : " + itemColors[items]);
			
			// look for the occurrences
			/*var occs = pattern.occs.split(';');
			occurrences[items] = []
			for (var i=0;i<occs.length;i++) {
				occurrences[items].push(occs.split('-'));
			}*/
			//console.log(items + " : " +occurrences[items][0][0] + "-" + occurrences[items][0][1]);
		}
		
		updatePatternInfos(items[0]);
		
	//} else {
		//console.log("pattern "+items+" already known");
	//}
	}
}

function addPatternToListOld(pattern) {
	// getting the pattern's items
	//console.log(pattern.items);
	
	var items = JSON.parse(pattern.items) + "";
	var array = items.split(',');
	//console.log(" it : " + array);
	
	var li = document.createElement("li");
	li.setAttribute("class","pattern");
	
	//console.log(items);
	var str = "";
	var firstItem = "";
	for (var i = 0 ; i < pattern.size ; i++) {
		var span = document.createElement("span");
		span.setAttribute("class","item");
		span.appendChild(document.createTextNode(array[i]));
		span.style.backgroundColor = itemColors[array[i]];
		li.appendChild(span);
		str += array[i] + " ";
		if (firstItem == "")
			firstItem = array[i];
	}
	str = str.trim();
	li.setAttribute("id","pattern_"+str);
	li.setAttribute("title", "Support : " + patterns[items].length + "; Proba : " + patternProbabilities[items].toFixed(2));
	li.onclick = function(event) {
		switchSelectedLi(li, firstItem, event);
	};
	
	var potentialNode = document.getElementById("pattern_"+str);
	if (potentialNode == null) {
		var node = getParentNode(str, pattern.size);
		if (pattern.size == 1) {
			node = document.getElementById("patterns");
		} else {
			node = getParentNode(str);
		}
		node.appendChild(li);
	} else {
		console.log("/!\ pattern "+str+" already exists in the list");
	}
}

function updatePatternInfos(firstItem) {
	var node = document.getElementById("nb"+firstItem);
	
	if (node == null) {
		var liste = document.getElementById("listNbPatternsStartingBy");
		var li = document.createElement("li");
		var spanNb = document.createElement("span");
		spanNb.setAttribute("id","nb"+firstItem);
		spanNb.appendChild(document.createTextNode("1"));
		var spanItem = document.createElement("span");
		spanItem.onclick = function(event) {
			switchSelectedLi(spanItem, firstItem, event);
		};
		spanItem.appendChild(document.createTextNode(firstItem));
		console.log(firstItem + " - " + itemColors[firstItem]);
		spanItem.style.backgroundColor = itemColors[firstItem];
		li.appendChild(document.createTextNode("Starting by "));
		li.appendChild(spanItem);
		li.appendChild(document.createTextNode(" : "));
		li.appendChild(spanNb);
		liste.appendChild(li);
		
	} else {
		
		var text = node.textContent;
		node.textContent = Number(text) + 1;
	}
	node = document.getElementById("nbTotal");
	text = node.textContent;
	if (text == "") {
		node.textContent = "1";
	} else {
		node.textContent = Number(text) + 1;
	}
}

function switchSelectedLi(li, pattern, ev) {

	if (ev.ctrlKey)
		requestSteering(pattern);
	console.log("selecting "+pattern);
	/*if (li.style.backgroundColor === "rgb(255,255,255)") {
		li.style.backgroundColor = "rgb(255,255,51)";
	} else {
		//li.style.backgroundColor = "rgb(255,255,255)";
	}*/
}

function getParentNode(pattern, size) {
	if (size == 1) {
		return document.getElementById("patterns");
	} else {
		var candidate = null;
		var lastSpace = pattern.lastIndexOf(" ");
		var prefix = pattern.substring(0,lastSpace);
		candidate = document.getElementById("pattern_"+prefix);
		if (candidate == null) {
			return getParentNode(prefix, size-1);
		} else {
			return candidate;
		}
	}
}

function removePatternFromList(id) {
	document.getElementById("pattern"+id).remove();
}


function goToTimelineStart() {
	var start = timeline.getItemRange();
	timeline.moveTo(start.min);
}

function timelineOverview() {
	timeline.fit();
}

function getProbabilityOfIntersection(A, B) {	
	var seqs = [patterns[A], patterns[B]];
	// get the intersection of the arrays
	var intersection = seqs.shift().filter(function(v) {
		return seqs.every(function(a) {
			return a.indexOf(v) !== -1;
		});
	});
	
	return intersection.length / datasetInfo["numberOfSequences"];
}

function getLift(A, B) {
	var lift = getProbabilityOfIntersection(A, B) / (patternProbabilities[A] * patternProbabilities[B])
	return lift;
}

//function getColorGradiant(v, min, max) {
//	var step = 255.0 / (max - min);
//	return v*step;
//}
function getColorGradiant(v) {
	var step = 255.0;
	return Math.round(255-(v-1)*step);
}

function drawLift() {
	var div = document.getElementById("chart-lift");
	while (div.firstChild) {
		div.removeChild(div.firstChild);
	}
	var orderedPatterns = Object.keys(patterns).sort(function(a,b) {
		return a < b;
	});
	
	// Creating the top header row
	var headerDiv = document.createElement("div");
	headerDiv.setAttribute("class","liftCell");
	headerDiv.style.backgroundColor = "white";
	div.appendChild(headerDiv);
	orderedPatterns.forEach(function(p) {
		if (p.split(',').length == 1) {
			var headerDiv = document.createElement("div");
			headerDiv.setAttribute("class","liftCell");
			headerDiv.style.backgroundColor = itemColors[p.split(',')[0]];
			headerDiv.setAttribute("title",p.split(',')[0]);
			div.appendChild(headerDiv);
		}
	})
	// Creating the matrix and the header column
	orderedPatterns.forEach(function(p) {
		if (p.split(',').length == 1) {
			fantomDiv = document.createElement("div");
			div.appendChild(fantomDiv);
			var headerDiv = document.createElement("div");
			headerDiv.setAttribute("class","liftCell");
			headerDiv.style.backgroundColor = itemColors[p.split(',')[0]];
			headerDiv.setAttribute("title",p.split(',')[0]);
			div.appendChild(headerDiv);
			orderedPatterns.forEach(function(p2) {
				if (p2.split(',').length == 1) {
					var divCell = document.createElement("div");
					var lift = getLift(p,p2);
					var color = getColorGradiant(lift);
					divCell.setAttribute("title","lift( "+p+" ; "+p2+" ) = "+lift.toFixed(2));
					//console.log("bg : "+ "rgb("+color.toString()+","+color.toString()+","+color.toString()+")");
					divCell.style.backgroundColor = "rgb("+color.toString()+","+color.toString()+","+color.toString()+")";
					divCell.setAttribute("class", "liftCell");
					div.appendChild(divCell);
				}
			})
		}
	})
	
	
}

// partie D3, pour la matrice de lift
function drawLiftD3() {
	var div = document.getElementById("chart-lift");
	while (div.firstChild) {
		div.removeChild(div.firstChild);
	}
	
	var width = Object.keys(patterns).length*12,
		height = width,
		div = d3.select('#chart-lift'),
		svg = div.append('svg')
		    .attr('width', width)
		    .attr('height', height),
		rw = 10,
		rh = 10;
	var data = [];
//	var orderedPatterns = Object.keys(patterns).sort(function(a,b) {
//		return a < b;
//	});
//	orderedPatterns.forEach(function(p) {
//		orderedPatterns.forEach(function(p2) {
//			data.push(getLift(p,p2));
//		})
//	})
	
	for (var k = 0; k < Object.keys(patterns).length; k += 1) {
		data.push(d3.range(Object.keys(patterns).length));
	}
	
	//Create a group for each row in the data matrix and
	//translate the group vertically
	var grp = svg.selectAll('g')
		.data(data)
		.enter()
		.append('g')
		.attr('transform', function(d, i) {
		    return 'translate(0, ' + (rh + 2) * i + ')';
		});
	
	//For each group, create a set of rectangles and bind 
	//them to the inner array (the inner array is already
	//binded to the group)
	grp.selectAll('rect')
		.data(function(d) { return d; })
		.enter()
		.append('rect')
	    .attr('x', function(d, i) { return (rw + 2) * i; })
	    .attr('width', rw)
	    .attr('height', rh);
	
//	var xAxis = d3.svg.axis()
//		.scale()
//		.orient("top");
	
}

function requestSteering(patternRequested) {
	var action = {
			action: "steerOnPattern",
			pattern: patternRequested
	};
	webSocket.send(JSON.stringify(action));
}


// Generates nbColors different RGB colors
function generateColors(nbColors) {
    var i = 360 / (nbColors - 1); // distribute the colors evenly on the hue range
    var r = []; // hold the generated colors
    for (var x=0; x<nbColors; x++)
    {
        r.push(hsvToRgb(i * x, 100, 100)); // Todo? : alternate the saturation and value for even more contrast between the colors
    }
    return r;
}

/**
 * HSV to RGB color conversion
 *
 * H runs from 0 to 360 degrees
 * S and V run from 0 to 100
 * 
 * Ported from the excellent java algorithm by Eugene Vishnevsky at:
 * http://www.cs.rit.edu/~ncs/color/t_convert.html
 */
function hsvToRgb(h, s, v) {
	var r, g, b;
	var i;
	var f, p, q, t;
 
	// Make sure our arguments stay in-range
	h = Math.max(0, Math.min(360, h));
	s = Math.max(0, Math.min(100, s));
	v = Math.max(0, Math.min(100, v));
 
	// We accept saturation and value arguments from 0 to 100 because that's
	// how Photoshop represents those values. Internally, however, the
	// saturation and value are calculated from a range of 0 to 1. We make
	// That conversion here.
	s /= 100;
	v /= 100;
 
	if(s == 0) {
		// Achromatic (grey)
		r = g = b = v;
		return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
	}
 
	h /= 60; // sector 0 to 5
	i = Math.floor(h);
	f = h - i; // factorial part of h
	p = v * (1 - s);
	q = v * (1 - s * f);
	t = v * (1 - s * (1 - f));
 
	switch(i) {
		case 0:
			r = v;
			g = t;
			b = p;
			break;
 
		case 1:
			r = q;
			g = v;
			b = p;
			break;
 
		case 2:
			r = p;
			g = v;
			b = t;
			break;
 
		case 3:
			r = p;
			g = q;
			b = v;
			break;
 
		case 4:
			r = t;
			g = p;
			b = v;
			break;
 
		default: // case 5:
			r = v;
			g = p;
			b = q;
	}
 
	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/************************************************************/
/*															*/
/*						New functions						*/
/*															*/
/************************************************************/

function addToHistory(action) {
	var history = d3.select("#history");
	if (historyDisplayIsDefault) {
		history.text("");
		historyDisplayIsDefault = false;
	}
	var formatTime = d3.timeFormat("%b %d, %Y, %H:%M:%S");
	var now = formatTime(new Date());
	history.append("p").text(now.toString()+" : "+action);
}

/****************************************************/
/*				Data handling functions				*/
/****************************************************/

function receiveUserList(message) {
	console.log("Receiving a list of users")
	var nbUsers = parseInt(message.size);
	console.log("Adding "+message.size+" users");
	for (var i = 0; i < Math.min(nbUsers,10000); i++) {	// Line for a reduced test set
	//for (var i = 0; i < nbUsers; i++) {				  // Normal line
		let iClick = i;
		// Add the user to the list
		var userRow = d3.select("#userTableBody").append("tr");
		var userInfo = message[i.toString()].split(";");
		userList.push(userInfo[0]);
		userRow.append("td")
			.text(userInfo[0])
			.attr("class","userColumn")
			.attr("sorttable_customkey",i+1);
		userRow.append("td").text(userInfo[1]);
		userRow.attr("id","User"+(i+1).toString());
		// Date format : yyyy-MM-dd HH:mm:ss
		var startDate = userInfo[2].split(" ");
		var part1 = startDate[0].split("-");
		var part2 = startDate[1].split(":");
		var d1 = new Date(parseInt(part1[0]),
				parseInt(part1[1]),
				parseInt(part1[2]),
				parseInt(part2[0]),
				parseInt(part2[1]),
				parseInt(part2[2]));
		var startCustomKey = part1[0]+part1[1]+part1[2]+part2[0]+part2[1]+part2[2];
		var startDateFormated = part1[1]+"/"+part1[2]+"/"+part1[0].substring(2,4);//+" "+part2[0]+":"+part2[1]+":"+part2[2];
		var endDate = userInfo[3].split(" ");
		part1 = endDate[0].split("-");
		part2 = endDate[1].split(":");
		var d2 = new Date(parseInt(part1[0]),
				parseInt(part1[1]),
				parseInt(part1[2]),
				parseInt(part2[0]),
				parseInt(part2[1]),
				parseInt(part2[2]));
		var endCustomKey = part1[0]+part1[1]+part1[2]+part2[0]+part2[1]+part2[2];
		var endDateFormated = part1[1]+"/"+part1[2]+"/"+part1[0].substring(2,4);//+" "+part2[0]+":"+part2[1]+":"+part2[2];
		// Calculates the duration of the trace
		var minutes = 1000 * 60;
		var hours = minutes * 60;
		var days = hours * 24;
		var years = days * 365;
		var endTime = d2.getTime();
		var startTime = d1.getTime();
		var timeDiff = endTime-startTime;
		
		var td = userRow.append("td").attr("sorttable_customkey",timeDiff);
		
		var result = "";
		var tmpValue = 0;
		if (Math.floor(timeDiff / years) > 0) {
			tmpValue = Math.floor(timeDiff / years);
			result += tmpValue+"y ";
			timeDiff = timeDiff - tmpValue*years;
			td.text("> "+result);
		}
		if (result == "") {
			if (Math.floor(timeDiff / days) > 0) {
				tmpValue = Math.floor(timeDiff / days);
				result += tmpValue+"d ";
				timeDiff = timeDiff - tmpValue*days;
				td.text(result);
			} else {
				td.text("< 1d");
			}
			/*if (Math.floor(timeDiff / hours) > 0) {
				tmpValue = Math.floor(timeDiff / hours);
				result += tmpValue+"h ";
				timeDiff = timeDiff - tmpValue*hours;
			}
			if (Math.floor(timeDiff / minutes) > 0) {
				tmpValue = Math.floor(timeDiff / minutes);
				result += tmpValue+"m ";
				timeDiff = timeDiff - tmpValue*minutes;
			}
			tmpValue = Math.floor(timeDiff / 1000);
			result += tmpValue+"s";*/
		}
		
		//td.text(result);		// Complete display of the duration 1y 2d 3h 4m 5s
		
		userRow.append("td").text(startDateFormated).attr("sorttable_customkey",startCustomKey);
		userRow.append("td").text(endDateFormated).attr("sorttable_customkey",endCustomKey);
		
		let userName = userInfo[0];
		userRow.on("click", function(){
			//console.log(userName);
			setHighlights("User"+(iClick+1).toString());
			highlightUserRow("User"+(iClick+1).toString())
			//requestUserTrace(userName, "Agavue");
			d3.event.stopPropagation();
		});
		// Request the display of the trace
		//requestUserTrace(userName, "Agavue");
	}
	// sorting by event per user
	var userTH = document.getElementById("eventsPerUserColumn");
	sorttable.innerSortFunction.apply(userTH, []);
	
	// Calling the display of the trace
}

function setHighlights(username) {
	d3.select("#userHighlight").text(username);
}

function highlightUserRow(rowId) {
	// Highlights the user
	var row = d3.select("#userTableBody").select("#"+rowId);
	if (row.attr("class") === null)
		row.attr("class", "selectedUserRow");
	else
		row.attr("class", row.attr("class")+" selectedUserRow");
	// De-highlights the previously highlighted users
	for (var i = 0; i < highlightedUsers.length; i++) {
		row = d3.select("#userTableBody").select("#"+highlightedUsers[i]);
		if (row.attr("class") !== null)
			row.attr("class", row.attr("class").replace("selectedUserRow",""));
	}
	// Empty the list of highlighted users
	highlightedUsers = [];
	// Adds the newly highlighted user to the list
	highlightedUsers.push(rowId);
}

var colorList = {};
var eventDisplayHeight = {};

function receiveEventTypes(message) {
	//var typeList = message.types.split(";");
	var nbEvents = parseInt(message.size);
	console.log("Receiving "+nbEvents+" event types");
	// Starting to generate the symbols and colors associated to the event types
	/*if (message.dataset == "Agavue") {
		associateColorAndShapeToEventForAgavue(message);
	} else {
		
	}*/
	var nbColors = Math.ceil(nbEvents/shapes.length);
	var colors = [];
	for (var i = 1; i <= nbColors; i++)
		colors.push(selectColor(i, nbColors));
		//colors.push(selectColor(i, nbColors));
	// Symbols and colors are generated
	if (nbEvents > 0)
		document.getElementById("noEvent").textContent = "";
	for (var i = 0; i< nbEvents; i++) {
		var eventRow = d3.select("#eventTableBody").append("tr");
		var eventInfo = message[i.toString()].split(";");
		var eType = "";
		var eCode = "";
		var eNbOccs = "";
		var eColor;
		for (var j=0; j < eventInfo.length;j++) {
			var info = eventInfo[j].split(":");
			if (info[0] === "code")
				eCode = shapes[i%shapes.length];
			else if (info[0] === "type")
				eType = info[1];
			else if (info[0] === "nbOccs")
				eNbOccs = info[1];
		}
		if (message.dataset == "Agavue") {
			eColor = getEventColorForAgavue(eType);
			eCode = getEventShapeForAgavue(eType);
			colorList[eType] = eColor;
			itemShapes[eType] = eCode;
		} else {
			eColor = colors[i%colors.length];
			colorList[eType] = eColor;//colors[i%colors.length];
			itemShapes[eType] = eCode;//shapes[i%shapes.length];
		}
		eventDisplayHeight[eType] = i+1;
		//var eColor = colors[i%colors.length];
		eventRow.append("td").text(eType);
		eventRow.append("td").text(eNbOccs);
		var symbolRow = eventRow.append("td")
					.attr("sorttable_customkey", (i%shapes.length)*100+i%colors.length);
		var symbolRowSvg = symbolRow.append("svg")
			.attr("width", 20)
			.attr("height", 20);
		/*switch (itemShapes[eType]) {
			case "circle":
				symbolRowSvg.append("circle")
				.attr("cx",Math.floor(10))
				.attr("cy",Math.floor(10))
				.attr("transform","translate(20,0)")
				.attr("r", 5)
				.style("stroke", d3.hsl(parseFloat(eColor),100,50))
				.
				.style("fill","none");
				break;
			case "square":
				symbolRowSvg.append("rect")
				.attr("x",Math.floor(5))
				.attr("y",Math.floor(5))
				.attr("transform","translate(20,0)")
				.attr("width", 10)
				.attr("height",10)
				.style("stroke", d3.hsl(parseFloat(eColor),100,50))
				.style("fill","none");
				break;
			case "triangle":*/
				symbolRowSvg.append("path")
				.attr("d",d3.symbol().type(itemShapes[eType]).size(function(d) {return 100;}))
				.attr("transform","translate(10,10)")
				.attr("stroke", "hsl("+colorList[eType]+",100%,50%)"/*d3.hsl(parseFloat(eColor),100,50).rgb()*/)
				.attr("fill","none");
		//};
	}
	
	/*for (var type in typeList) {
		var eventRow = d3.select("#eventTableBody").append("tr");
		eventRow.append("td").text(type);
		eventRow.append("td").text("");
		eventRow.append("td").text("");
	}*/
	// sorting by occurrences
	var userTH = document.getElementById("eventsOccurrencesColumn");
	sorttable.innerSortFunction.apply(userTH, []);
	
}

/**
 * Returns a color specific color contained in a list of distinct colors
 * If the list has less items in it than the presetList, the preset list is used
 * otherwise, the color is computed
 * 
 * PresetList : red - orange - lightBlue - darkBlue - purple
 * 
 * @param colorNum The index of the color we want in the list (starts at 1)
 * @param colors The size of the color list
 * @returns the first parameter for generating an HSL color (second and third are respectively supposed to be 100% and 50%)
 */
function selectColor(colorNum, colors){
	var presetList = [0,38,191,241,297];
	if (colors <= presetList.length) {
		console.log("Selecting number "+colorNum+" out of 5 preset colors");
		return presetList[colorNum-1];
	} else {
		console.log("Selecting number "+colorNum+" out of "+colors+" generated colors");
	    if (colors < 1) colors = 1; // defaults to one color - avoid divide by zero
	    return colorNum * (360 / colors) % 360;
	    //return "hsl(" + (colorNum * (360 / colors) % 360) + ",100%,50%)";
	}
}

function getEventColorForAgavue(eventType) {
	console.log("Getting event Colors for agavue");
	var colors = [0,124,168,204,241,297];		// red - orange - lightBlue - darkBlue - purple
	switch(eventType.trim()) {
	// App related events
	case "appInit" :
	case "error" :
	case "warning" :
	case "bindFromPrompt" : // (?)
		return colors[0];
		break;
	// Data related events
	case "readBoundData" :
	case "load" :
	case "setData" :
	case "treeStats" :
	case "writeSampleData" :
	case "writeSampleData2"	:
		return colors[1];
		break;
	// IHM related events
	case "resize" :
	case "toolTip" :
	case "toolBarToggle" :
	case "btSetData" :
	case "slider" :
	case "btColor" :
	case "closeColorPicker" :
	case "hasColumnHeadersToggle" :
		return colors[2];
		break;
	// IHM/Error related events
	case "closeErrorBox" :
	case "aboutBox" :
	case "closeAboutBox" :
		return colors[3];
		break;
	// Dataviz related events (à scinder ?)
	case "create" :
	case "setTitle" :
	case "pickedColor" :
	case "setStackType" :
	case "cbCategory" :
	case "xCbCategory" :
	case "yCbCategory" :
	case "cbPercent" :
	case "xSlider" :
	case "ySlider" :
	case "tbBins" :
	case "xTbBins" :
	case "yTbBins" :
		return colors[4];
		break;
	default:
		return colors[5];
	}
}

function getEventShapeForAgavue(eventType) {
	var index = -1;
	switch(eventType.trim()) {
	// 1st in category
	case "appInit" :
	case "readBoundData" :
	case "resize" :
	case "closeErrorBox" :
	case "create" :
		index = 0;
		break;
	// 2nd in category
	case "error" :
	case "load" :
	case "toolTip" :
	case "aboutBox" :
	case "setTitle" :
		index = 1;
		break;
	// 3rd in category
	case "warning" :
	case "setData" :
	case "toolBarToggle" :
	case "closeAboutBox" :
	case "pickedColor" :
		index = 2;
		break;
	// 4th in category
	case "bindFromPrompt" : // (?)
	case "treeStats" :
	case "btSetData" :
	case "setStackType" :
		index = 3;
		break;
	// 5th in category
	case "writeSampleData" :
	case "slider" :
	case "cbCategory" :
		index = 4;
		break;
	// 6th in category
	case "writeSampleData2"	:
	case "btColor" :
	case "xCbCategory" :
		index = 5;
		break;
	// 7th in category
	case "closeColorPicker" :
	case "yCbCategory" :
		index = 6;
		break;
	// 8th in category
	case "hasColumnHeadersToggle" :
	case "cbPercent" :
		index = 7;
		break;
	// 9th in category
	case "xSlider" :
		index = 8;
		break;
	// 10th in category
	case "ySlider" :
		index = 9;
		break;
	// 11th in category
	case "tbBins" :
		index = 10;
		break;
	// 12th in category
	case "xTbBins" :
		index = 11;
		break;
	// 13th in category
	case "yTbBins" :
		index = 12;
		break;
	default :
		index = 13;
	}
	if (index >= 0)
		return shapes[index%shapes.length]; // %shapes.length to ensure that we do not go out of bounds
	return null;
}

/**
 * Associate a color and a symbol to each event type
 */
function associateColorAndShapeToEventForAgavue(message) {
	var colors = [0,38,191,241,297];		// red - orange - lightBlue - darkBlue - purple
	/*
	 * APP
		appInit
		error
		warning
		bindFromPrompt (?)
		
		DATA
		readBoundData
		load	
		setData	
		writeSampleData
		writeSampleData2	
		
		IHM 
		resize
		toolTip
		toolBarToggle
		btSetData
		slider
		btColor
		closeColorPicker
		hasColumnHeadersToggle
		
		IHM / ERROR
		closeErrorBox
		aboutBox
		closeAboutBox
		
		DATAVIZ (à scinder ?)
		create
		setTitle
		treeStats
		pickedColor
		setStackType	
		cbCategory
		xCbCategory	
		yCbCategory
		cbPercent
		xSlider		
		ySlider
		tbBins
		xTbBins
		yTbBins
	 */
	
	
	var nbEvents = parseInt(message.size);
	// Symbols and colors are generated
	if (nbEvents > 0)
		document.getElementById("noEvent").textContent = "";
	for (var i = 0; i< nbEvents; i++) {
		var eventRow = d3.select("#eventTableBody").append("tr");
		var eventInfo = message[i.toString()].split(";");
		var eType = "";
		var eCode = "";
		var eNbOccs = "";
		for (var j=0; j < eventInfo.length;j++) {
			var info = eventInfo[j].split(":");
			if (info[0] === "code")
				eCode = shapes[i%shapes.length];
				//eCode = info[1];
			else if (info[0] === "type")
				eType = info[1];
			else if (info[0] === "nbOccs")
				eNbOccs = info[1];
		}
		colorList[eType] = colors[i%colors.length];
		itemShapes[eType] = shapes[i%shapes.length];
		eventDisplayHeight[eType] = i+1;
		var eColor = colors[i%colors.length];
		eventRow.append("td").text(eType);
		eventRow.append("td").text(eNbOccs);
		var symbolRow = eventRow.append("td")
					.attr("sorttable_customkey", (i%shapes.length)*100+i%colors.length);
		var symbolRowSvg = symbolRow.append("svg")
			.attr("width", 20)
			.attr("height", 20);
		/*switch (itemShapes[eType]) {
			case "circle":
				symbolRowSvg.append("circle")
				.attr("cx",Math.floor(10))
				.attr("cy",Math.floor(10))
				.attr("transform","translate(20,0)")
				.attr("r", 5)
				.style("stroke", d3.hsl(parseFloat(eColor),100,50))
				.
				.style("fill","none");
				break;
			case "square":
				symbolRowSvg.append("rect")
				.attr("x",Math.floor(5))
				.attr("y",Math.floor(5))
				.attr("transform","translate(20,0)")
				.attr("width", 10)
				.attr("height",10)
				.style("stroke", d3.hsl(parseFloat(eColor),100,50))
				.style("fill","none");
				break;
			case "triangle":*/
				symbolRowSvg.append("path")
				.attr("d",d3.symbol().type(itemShapes[eType]).size(function(d) {return 100;}))
				.attr("transform","translate(10,10)")
				.attr("stroke", "hsl("+colorList[eType]+",100%,50%)"/*d3.hsl(parseFloat(eColor),100,50).rgb()*/)
				.attr("fill","none");
		//};
	}
}

var userTracesNb = 0;
var firstTraceReceived = null;
var lastTraceReceived = null;
var allEvents = []
/**
 * Receives the trace of a user
 * @param trace
 * @returns
 */
function receiveUserTrace(trace) {
	var traceSize = parseInt(trace.numberOfEvents);
	if (userTracesNb == 0)
		firstTraceReceived = new Date();
	userTracesNb = userTracesNb + 1;
	var user = trace.user;
	userTraces[user] = [];
	for(var i=0; i < traceSize; i++) {
		allEvents.push([trace[i.toString()]]);
		userTraces[user].push(allEvents[allEvents.length-1]);
	}
	//userTraces[trace.user] = data;
	//console.log("Trace received : "+new Date());
	if (userTracesNb == 31575) {
		lastTraceReceived = new Date();
		console.log("31575 traces received between");
		console.log(firstTraceReceived);
		console.log("and");
		console.log(lastTraceReceived);
		userTracesNb = 0;
		console.log("sending the data to the timeline");
		timeline.setEventsReady();
	}
}

var nbEventsReceived = 0;
var timeOrderedEvents = [];
var firstEventReceived = null;
var lastEventReceived = null;

var eventAccessor = {};
var maxEventAtOneTime = 0;

function receiveEvents(eventsCompressed) {
	
	//var dataCompressed = LZString.decompressFromUTF16(eventsCompressed.data);
	//var events = JSON.parse(dataCompressed);
	
	var events = eventsCompressed;//JSON.parse(eventsCompressed.data);
	
	var nbEventsInMessage = parseInt(events.numberOfEvents);
	if (nbEventsReceived == 0)
		firstEventReceived = new Date();
	var formatFirstLevel = d3.timeFormat("%Y%j");
	var formatSecondLevel = d3.timeFormat("%H%M");
	for (var i=0; i < nbEventsInMessage; i++) {
		var user = events[i.toString()].split(";")[3];
		timeOrderedEvents.push([events[i.toString()]]);
		// Adding the event to its user
		if(typeof(userTraces[user]) == typeof([]))
			userTraces[user].push(timeOrderedEvents[timeOrderedEvents.length-1]);
		else
			userTraces[user] = [timeOrderedEvents[timeOrderedEvents.length-1]];
		// Setting the accessor if necessary
		var time = d3.timeParse('%Y-%m-%d %H:%M:%S')(events[i.toString()].split(";")[1]);
		if (!eventAccessor.hasOwnProperty(formatFirstLevel(time))) {
			eventAccessor[formatFirstLevel(time)] = {};
			eventAccessor[formatFirstLevel(time)][formatSecondLevel(time)] = timeOrderedEvents.length-1;
		} else {
			if (!eventAccessor[formatFirstLevel(time)].hasOwnProperty(formatSecondLevel(time))) {
				eventAccessor[formatFirstLevel(time)][formatSecondLevel(time)] = timeOrderedEvents.length-1;
			}
		}
	}
	nbEventsReceived += nbEventsInMessage;
	enableCentralOverlay("Receiving all the events... ("+nbEventsReceived+" out of "+datasetInfo["numberOfEvents"]+")");
	
	// All events of the dataset are received
	if (datasetInfo["numberOfEvents"] == nbEventsReceived) {
		lastEventReceived = new Date();
		console.log(nbEventsReceived+" events received between");
		console.log(firstEventReceived);
		console.log("and");
		console.log(lastEventReceived);
		computeMaxEventAtOneTime();
		timeline.setEventsReady();
		disableCentralOverlay();
		startInitialMining();
	}
	/*nbEventsReceived += 1000;
	if (nbEventsReceived > datasetInfo["numberOfEvents"]) {
		lastEventReceived = new Date();
		console.log(nbEventsReceived+" events received between");
		console.log(firstEventReceived);
		console.log("and");
		console.log(lastEventReceived);
	}*/
}

function computeMaxEventAtOneTime() {
	
}

/**
 * Receives the trace of a user
 * @param trace
 * @returns
 */
function receiveUserTraceOld(trace) {
	/*if (userList.indexOf(trace.user) == -1)
		userList.push(trace.user);
	console.log(userList.length +" users");*/
	var traceSize = parseInt(trace.numberOfEvents);
	if (userTracesNb == 0)
		firstTraceReceived = new Date();
	userTracesNb = userTracesNb + 1;
	//console.log(traceSize+" events in the trace :");
	var data = [];
	for(var i=0; i < traceSize; i++) {
		//data.push(trace[i.toString().split(';')]);
		var tmpValue = trace[i.toString().split(';')];
		data.push({"user":trace.user,
			"data":tmpValue+";"+colorList[tmpValue.split(";")[0]],
			"shape":+itemShapes[tmpValue.split(";")[0]]
		});
	}
	userTraces[trace.user] = data;
	//console.log("Trace received : "+new Date());
	if (userTracesNb == 31575) {
		lastTraceReceived = new Date();
		console.log("31575 traces received between");
		console.log(firstTraceReceived);
		console.log("and");
		console.log(lastTraceReceived);
		userTracesNb = 0;
		console.log("sending the data to the timeline");
		//timeline.addDataset(userTraces);
	}
	/*var dataColored = [];
	for(var i=0; i < data.length; i++) {
		dataColored.push({"user":trace.user,"data":data[i]+";"+colorList[data[i].split(";")[0]],"shape":+itemShapes[data[i].split(";")[0]]});
	}
	//console.log("Trace given to timeline : "+new Date());
	timeline.addData(dataColored);*/
}

/************************************************/
/*				Display functions				*/
/************************************************/

/**
 * Requests the trace of a user and display it
 */
function displayUserTrace(trace) {
	var traceSize = parseInt(trace.numberOfEvents);
	console.log(traceSize+" events in the trace :");
	
	var data = [];
	for(var i=0; i < traceSize; i++) {
		data.push(trace[i.toString().split(';')]);
	}
	var dataColored = [];
	for(var i=0; i < data.length; i++) {
		dataColored.push({"data":data[i]+";"+colorList[data[i].split(";")[0]],"shape":+itemShapes[data[i].split(";")[0]]});
	}
	
	timeline.addData(dataColored);
	return;
	
	timeline.moveFocus(trace.first, trace.last);
	return;
	updateTimelineBounds(trace.first, trace.last);
	
	

	var area = d3.area()
	    .curve(d3.curveMonotoneX)
	    .x(function(d) { return x(d[1]); })
	    .y0(tlHeight)
	    .y(function(d) { return y(1); });


	  timeline.append("path")
	      .datum(data)
	      .attr("class", "area")
	      .attr("d", area);
}

function displayUserPatterns(patterns) {
	var size = parseInt(patterns.numberOfPatterns);
	console.log(size+" patterns obtenus");
	
	var sizes = {};
	var lengths = [];
	for (var i=0; i<size; i++) {
		var p = patterns[i.toString()].split(" ");
		if (sizes.hasOwnProperty(p.length.toString()))
			sizes[p.length.toString()].push(p);
		else {
			lengths.push(p.length);
			sizes[p.length.toString()] = [];
			sizes[p.length.toString()].push(p);
		}
	}
	lengths = lengths.sort(sortNumber);
	resetUserPatterns();
	for (var i = 0; i<lengths.length;i++) {
		for (var j=0; j < sizes[lengths[i].toString()].length; j++) {
			//addToPatterns(sizes[lengths[i].toString()][j], lengths[i]);
			var patternList = d3.select("#List");
			var sz = lengths[i];
			var ptrn = sizes[lengths[i].toString()][j];
			if (sz == 1) {
				patternList.append("div")
				.attr("class",sz+"-pattern")
				.attr("id", ptrn[0].trim())
				.text(ptrn[0].trim());
			} else {
				patternList.select("#"+ptrn.slice(0,sz-1).join(" ").trim()).append("div")
				.attr("class",sz+"-pattern")
				.attr("id", ptrn.join(" ").trim())
				.style("padding-left",sz*3+"px")
				.text(ptrn.join(" ").trim());
			}
		}
	}
}

function receiveAllPatterns(message) {
	var size = parseInt(message.number);
	var patternList = d3.select("#List");
	var patternSizes = {};
	
	for (var i=0; i<size; i++) {
		var p = message[i.toString()];
		p = p.replace(/,/g,"");
		p = p.replace(/\[/g,"");
		p = p.replace(/\]/g,"");
		var pSize = parseInt(message[i.toString()+"size"]);
		
		if (!patternSizes.hasOwnProperty(pSize))
			patternSizes[pSize] = [];
		patternSizes[pSize].push(p);
	}
	
	for (var i=2; i<=Object.keys(patternSizes).sort()[Object.keys(patternSizes).length-1]; i++) {
		var patterns = patternSizes[i];
		for (var j = 0; j < patterns.length; j++) {
			let p = patterns[j];
			var pItems = p.split(" ");
			var pDiv = patternList.append("div");
			var pSvg = pDiv.append("svg")
				.attr("width", 20*pItems.length)
				.attr("height", 20);
			pDiv.append("span")
				.text(p);
			for (var k = 0; k < pItems.length; k++) {
				pSvg.append("path")
					.attr("d",d3.symbol().type(itemShapes[pItems[k]]).size(function(d) {return 100;}))
					.attr("transform","translate("+(10+20*k)+",10)")
					.attr("stroke", "hsl("+colorList[pItems[k]]+",100%,50%)"/*d3.hsl(parseFloat(eColor),100,50).rgb()*/)
					.attr("fill","none");
			}
			/*patternList.append("div")
				.text("- "+p)
				.on("click", function() {
					requestPatternDistribution(p, "Agavue");
					d3.event.stopPropagation();
				});*/
		}
	}
	patternsReceived = true;
	
	timeline.drawPatternBinsFromData();
	// update the metrics tab
}

function addPatternToList(message) {
	var patternList = d3.select("#List");
	var pSize = parseInt(message.size);
	var pSupport = parseInt(message.support);
	var pString = "";
	
	console.log("receiving Pattern "+pString);
	
	for (var i = 0; i < pSize; i++) {
		pString += message[i];
		if (i <= (pSize-1))
			pString += " ";
	}
	
	var pDiv = patternList.append("div");
	var pSvg = pDiv.append("svg")
		.attr("width", 20*pSize)
		.attr("height", 20);
	let txtSpan = pDiv.append("span")
		.style("font-weight","normal")
		.text(pString+" ("+message.support+")")
		.attr("patternId",message.id)
		.on("click", function() {
			if (timeline.hasPatternOccurrences(message.id) == false)
				requestPatternOccurrences(message.id, "Agavue");
			else
				timeline.displayPatternOccurrences(message.id);
			if (txtSpan.style("font-weight") == "normal")
				txtSpan.style("font-weight","bold");
			else
				txtSpan.style("font-weight","normal");
			d3.event.stopPropagation();
			console.log("click on "+message.id)
		});
	for (var k = 0; k < pSize; k++) {
		pSvg.append("path")
			.attr("d",d3.symbol().type(itemShapes[message[k]]).size(function(d) {return 100;}))
			.attr("transform","translate("+(10+20*k)+",10)")
			.attr("stroke", "hsl("+colorList[message[k]]+",100%,50%)"/*d3.hsl(parseFloat(eColor),100,50).rgb()*/)
			.attr("fill","none");
	}
	
	numberOfPattern++;
	
	// Update the number of patterns in the tab name
	d3.select(".patternTabs")	// first tab in the right panel
		.select("li").select("a")
		.text("Full list ("+numberOfPattern+")");
	// update the metrics tab
}

function requestPatternOccurrences(patternId, datasetName) {
	var action = {
			action: "request",
			object: "patternOccs",
			dataset: datasetName,
			patternId: patternId
	};
	webSocket.send(JSON.stringify(action));
}

function requestPatternDistribution(patternRequested, datasetName) {
	var action = {
			action: "request",
			object: "patternDistribution",
			dataset: datasetName,
			pattern: patternRequested
	};
	webSocket.send(JSON.stringify(action));
}

function sortNumber(a,b) {
	return a-b;
}

function resetUserPatterns() {
	d3.select("#List").selectAll("div").remove();
}

function addToPatterns(pattern, size) {
	var patternList = d3.select("#List");
	if (size == 1) {
		patternList.append("div")
		.attr("class",size+"-pattern")
		.attr("id", pattern[0])
		.text(pattern[0]);
	} else {
		patternList.select("#"+pattern.slice(0,size-1).join(" ")).append("div")
		.attr("class",size+"-pattern")
		.attr("id", pattern.join(" "))
		.style("padding-left",size*3+"px")
		.text(pattern.join(" "));
	}
}

/**
 * Updates the start and end date of the timeline
 */
function updateTimelineBounds(start, end) {
	return;
	var margin = {top: 20, right: 30, bottom: 30, left: 30},
    width = d3.select("#timeline").node().getBoundingClientRect().width - margin.left - margin.right;
	// set the ranges
	console.log("updating the timeline bounds :"+start+" to "+end);
	
	var startDate = start.split(" ");
	var endDate = end.split(" ");
	var startString = startDate[0]+" "
			+startDate[1]+" "
			+startDate[2]+" "
			+startDate[3]+" "
			+startDate[5];
	var endString = endDate[0]+" "
			+endDate[1]+" "
			+endDate[2]+" "
			+endDate[3]+" "
			+endDate[5];
	
	var timeFormat = d3.timeParse('%a %b %d %H:%M:%S %Y');
	
	var x = d3.scaleTime()
			.domain([timeFormat(startString),timeFormat(endString)])
			.range([0,width]);
	
	console.log("Range setup");
	var xAxis = d3.axisBottom(x);
	console.log("Calling the axis");

	timelineXAxis.call(xAxis);
}

/**
 * Updates the start and end date of the timeline overview
 */
function updateTimelineOverviewBounds(start, end) {
	return;
	var margin = {top: 20, right: 30, bottom: 30, left: 30},
    width = d3.select("#timelineOverview").node().getBoundingClientRect().width - margin.left - margin.right;
	// set the ranges
	console.log("updating the timeline overview bounds :"+start+" to "+end);
	
	var startDate = start.split(" ");
	var endDate = end.split(" ");
	var startString = startDate[0]+" "
			+startDate[1]+" "
			+startDate[2]+" "
			+startDate[3]+" "
			+startDate[5];
	var endString = endDate[0]+" "
			+endDate[1]+" "
			+endDate[2]+" "
			+endDate[3]+" "
			+endDate[5];
	
	var timeFormat = d3.timeParse('%a %b %d %H:%M:%S %Y');
	
	var x = d3.scaleTime()
			.domain([timeFormat(startString),timeFormat(endString)])
			.range([0,width]);
	
	console.log("Range setup");
	var xAxis = d3.axisBottom(x);
	console.log("Calling the axis");

	timelineOverviewXAxis.call(xAxis);
}

/**
 * Display information on the dataset when there is no dataset
 */
function resetDatasetInfo() {
	var infoDiv;
	
	console.log("info reset");
	infoDiv = document.getElementById("datasetInfo");
	infoDiv.textContent = "No dataset selected, select a dataset to display more information";
	
	datasetInfoIsDefault = true;
}

/**
 * Reset the display of the history of actions
 */
function resetHistory() {
	var historyDiv;
	
	console.log("history reset");
	historyDiv = document.getElementById("history");
	historyDiv.textContent = "No history to display";
	
	historyDisplayIsDefault = true;
}

/**
 * Reset the display of events
 */
function resetEvents() {	
	console.log("Event list reset");
	document.getElementById("noEvent").style.display = "initial";
	
	eventDisplayIsDefault = true;
}

/** Displays a debug message sent by the server
 * 
 */
function displayServerDebugMessage(message) {
	var debugSize = parseInt(message.size);
	console.log("===== Server debug =====");
	for (var i=0;i<debugSize;i++)
		console.log(message["msg"+i.toString()]);
	console.log("========================");
}

/**
 * Display information on the dataset in the "Trace" control tab. TODO Make it do something
 */
function displayDatasetInfo() {
	var infoDiv = document.getElementById("datasetInfo");
	infoDiv.textContent = "";
	
	var pStartSpan = document.createElement("p");
	var txtStartSpan = document.createTextNode("First event: "+formatDate(datasetInfo["firstEvent"]));
	var pEndSpan = document.createElement("p");
	var txtEndSpan = document.createTextNode("Last event: "+formatDate(datasetInfo["lastEvent"]));
	var pNbEvent = document.createElement("p");
	var txtNbEvent = document.createTextNode("Number of events: "+datasetInfo["numberOfEvents"]);
	var pNbEvent = document.createElement("p");
	var txtNbEvent = document.createTextNode("Number of event types: "+datasetInfo["numberOfDifferentEvents"]);
	var pNbUsers = document.createElement("p");
	var txtNbUsers = document.createTextNode("Number of users: "+datasetInfo["users"].length)	
	
	//d3.select("#datasetName").text(datasetInfo["name"]);
	
	pNbEvent.appendChild(txtNbEvent);
	infoDiv.appendChild(pNbEvent);

	pNbUsers.appendChild(txtNbUsers);
	infoDiv.appendChild(pNbUsers);
	
	pStartSpan.appendChild(txtStartSpan);
	infoDiv.appendChild(pStartSpan);
	pEndSpan.appendChild(txtEndSpan);
	infoDiv.appendChild(pEndSpan);
	
	datasetInfoIsDefault = false;
	
	console.log("Info displayed");
}

function formatDate(date) {
	// Agavue format : Sun Mar 31 01:32:10 CET 2013
	var parts = date.split(" ");
	if (parts.length != 6)
		return date;
	var month = "";
	switch(parts[1]) {
		case "Jan":
			return " January "+parts[2]+", "+parts[5]+", "+parts[3];
		case "Feb":
			return " February "+parts[2]+", "+parts[5]+", "+parts[3];
		case "Mar":
			return " March "+parts[2]+", "+parts[5]+", "+parts[3];
		case "Apr":
			return " April "+parts[2]+", "+parts[5]+", "+parts[3];
		case "May":
			return " May "+parts[2]+", "+parts[5]+", "+parts[3];
		case "Jun":
			return " June "+parts[2]+", "+parts[5]+", "+parts[3];
		case "Jul":
			return " July "+parts[2]+", "+parts[5]+", "+parts[3];
		case "Aug":
			return " August "+parts[2]+", "+parts[5]+", "+parts[3];
		case "Sep":
			return " September "+parts[2]+", "+parts[5]+", "+parts[3];
		case "Oct":
			return " October "+parts[2]+", "+parts[5]+", "+parts[3];
		case "Nov":
			return " November "+parts[2]+", "+parts[5]+", "+parts[3];
		case "Dec":
			return " December "+parts[2]+", "+parts[5]+", "+parts[3];
		default:
			return parts[1]+" "+parts[2]+", "+parts[5]+", "+parts[3];
	}
}

/************************************************/
/*				Handling the tabs				*/
/************************************************/

/**
 * Manage the left-side (control) tabs
 */
function openControlTab(evt, tabName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="controlTabContent" and hide them
    tabcontent = document.getElementsByClassName("controlTabContent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="controlTabLink" and remove the class "active"
    tablinks = document.getElementsByClassName("controlTabLink");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the link that opened the tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

/**
 * Manage the right-side (patterns) tabs
 */
function openPatternTab(evt, tabName) {
	// Declare all variables
	var i, tabcontent, tablinks;
	
	// Get all elements with class="patternTabContent" and hide them
	tabcontent = document.getElementsByClassName("patternTabContent");
	for (i = 0; i < tabcontent.length; i++) {
		tabcontent[i].style.display = "none";
	}
	
	// Get all elements with class="patternTabLink" and remove the class "active"
	tablinks = document.getElementsByClassName("patternTabLink");
	for (i = 0; i < tablinks.length; i++) {
		tablinks[i].className = tablinks[i].className.replace(" active", "");
	}
	
	// Show the current tab, and add an "active" class to the link that opened the tab
	document.getElementById(tabName).style.display = "block";
	evt.currentTarget.className += " active";
}

/**
 * Displays that the server is loading the dataset
 * @returns
 */
function displayDatasetLoading() {
	var infoDiv = document.getElementById("datasetInfo");
	
	infoDiv.textContent = "Dataset loading"; // TODO replace with an animation or an estimate
}

function getEventAccessorAtDate(date) {
	var formatFirstLevel = d3.timeFormat("%Y%j");
	var formatSecondLevel = d3.timeFormat("%H%M");
	var result = eventAccessor[formatFirstLevel(date)][formatSecondLevel(date)];
	while (result === undefined) {
		date = d3.timeMinute.offset(date,1);
		result = eventAccessor[formatFirstLevel(date)][formatSecondLevel(date)];
	}
	return result;
}

/***************************************************************
 * 
 * 					Displaying that a task is running
 * 						(disabled for now)
 * 
 **************************************************************/

var runningTaskIndicator;
var runningTaskIndicatorSvg = d3.select("#top").select("svg").select("circle");
var runningTaskIndicatorNumber = 0;
var runningTaskIndicatorState = false;

function startRunningTaskIndicator() {
	if (runningTaskIndicatorState == false) {
		runningTaskIndicator = setInterval(function() {
			// TODO display an indication that something is running
			if (runningTaskIndicatorSvg.style("fill") == "rgb(0, 204, 0)")
				runningTaskIndicatorSvg.style("fill","rgb(0, 179, 0)");
			else
				runningTaskIndicatorSvg.style("fill","rgb(0, 204, 0)");
		}, 200);
		runningTaskIndicatorState = true;
	}
	runningTaskIndicatorNumber++;
	console.log("RunningTasks increase to "+runningTaskIndicatorNumber);
}

function stopRunningTaskIndicator() {
	if (runningTaskIndicatorState == true) {
		runningTaskIndicatorNumber--;
		console.log("RunningTasks decrease to "+runningTaskIndicatorNumber);
		if (runningTaskIndicatorNumber == 0) {
			clearInterval(runningTaskIndicator);
			runningTaskIndicatorSvg.style("fill","grey");
			runningTaskIndicatorState = false;
			console.log("Running task indicator stopped");
		}
	}
}

/***************************************************************
 * 
 * 					Running the algorithm
 * 
 **************************************************************/

/**
 * 
 */
function runAlgoToFile() {
	var action = {
			action: "run",
			object: "algoToFile"
	};
	webSocket.send(JSON.stringify(action));
}

function runAlgorithm() {
	// Clears the previously obtained patterns
	var patternList = d3.select("#List");
	patternList.selectAll("div").remove();
	timeline.resetPatterns();
	
	// Gather the parameter's values
	var minSup = document.getElementById("inputMinSup").value;
	var windowSize = document.getElementById("inputWindowSize").value;
	var maxSize = document.getElementById("inputMaxSize").value;
	var maxGap = document.getElementById("inputMaxGap").value;
	
	// Update the display of the algorithm's current parameters
	d3.select("#currentMinSup").text(minSup);
	d3.select("#currentWindowSize").text(windowSize);
	d3.select("#currentMaxSize").text(maxSize);
	d3.select("#currentMaxGap").text(maxGap);
	
	// Tell the server to start mining
	requestAlgorithmStart(minSup, windowSize, maxSize, maxGap);
	
	return false; // To stay on the same page
}

function requestAlgorithmStart(minSupport, windowSize, maxSize, minGap, maxGap, maxDuration) {
	console.log("Requesting algorithm start:");
	console.log("   minSup: "+minSupport+", windowSize: "+windowSize+", maxSize: "+maxSize+", minGap: "+minGap+", maxGap: "+maxGap+", maxDuration: "+maxDuration);
	
	var action = {
			action: "run",
			object: "algorithm",
			minSup: minSupport,
			windowSize: windowSize,
			maxSize: maxSize,
			minGap: minGap,
			maxGap: maxGap,
			maxDuration: maxDuration
	};
	webSocket.send(JSON.stringify(action));
	// Start the timer independently from the server
	//stopAlgorithmRuntime();
	//startAlgorithmRuntime();
}

/**
 * Starts the algorithm with default values at the start of the session
 * @returns
 */
function startInitialMining() {
	var defaultMinSupport = "500";
	var defaultWindowSize = "60";
	var defaultMaxSize = "5";
	var defaultMinGap = "0";
	var defaultMaxGap = "2";
	var defaultMaxDuration = "30000";
	
	requestAlgorithmStart(defaultMinSupport, defaultWindowSize, defaultMaxSize, defaultMinGap, defaultMaxGap, defaultMaxDuration);
}

var algorithmTimer;
var algorithmStartTime = -1;
var startDelayFromServer = 0;

/**
 * Start the algorithm runtime counter, updates it every second
 * @returns
 */
function startAlgorithmRuntime(time) {
	var clientTime = new Date();
	algorithmStartTime = new Date(time);
	startDelayFromServer = algorithmStartTime - clientTime;
	algorithmTimer = setInterval(function() {
		var thisTime = new Date();
		var elapsedTime = thisTime - algorithmStartTime;
		elapsedTime += startDelayFromServer;	// Compensate for the delay between the two clocks
		var elapsedMinutes = Math.floor(elapsedTime/60000);
		elapsedTime = elapsedTime%60000;
		var elapsedSeconds = Math.floor(elapsedTime/1000);
		// Update the display of the runtime
		var text = "";
		if (elapsedMinutes < 10)
			text = "0"+elapsedMinutes+":";
		else
			text = elapsedMinutes+":";
		if (elapsedSeconds < 10)
			text += "0"+elapsedSeconds;
		else
			text += elapsedSeconds;
		d3.select("#runtime")
			.text(text);
	},1000);
}

/**
 * Stop the algorithm runtime counter
 * @returns
 */
function stopAlgorithmRuntime(time) {
	if (algorithmStartTime > 0) {
		clearInterval(algorithmTimer);
		// checks if the timer is coherent with the server's
		var thisDate = new Date(time);
		var elapsedTime = thisDate - algorithmStartTime;
		var elapsedMinutes = Math.floor(elapsedTime/60000);
		elapsedTime = elapsedTime%60000;
		var elapsedSeconds = Math.floor(elapsedTime/1000);
		// Update the display of the runtime
		var text = "";
		if (elapsedMinutes < 10)
			text = "0"+elapsedMinutes+":";
		else
			text = elapsedMinutes+":";
		if (elapsedSeconds < 10)
			text += "0"+elapsedSeconds;
		else
			text += elapsedSeconds;
		console.log("Algo server timer: "+text);
		// Reset the startTime
		algorithmStartTime = -1;
	}
	
	d3.select("#currentAlgorithmWork")
		.text("Algorithm ended");
}

/**
 * Displays the current pattern-size the algorithm is working on
 * @param level The pattern size
 * @returns
 */
function handleNewLevelSignal(level) {
	d3.select("#currentAlgorithmWork")
		.text("Currently working on: Size "+level);
}

var loadingAlgorithmDataAnimation;
var loadingAlgorithmDataAnimationState = 1;

/**
 * Displays that the algorithm is loading its data
 * @returns
 */
function handleLoadingSignal() {
	loadingAlgorithmDataAnimation = setInterval(function() {
		var dots;
		switch(loadingAlgorithmDataAnimationState) {
		case 1:
			dots=".";
			loadingAlgorithmDataAnimationState++;
			break;
		case 2:
			dots="..";
			loadingAlgorithmDataAnimationState++;
			break;
		case 3:
			dots = "...";
			loadingAlgorithmDataAnimationState = 1;
			break;
		default:
			dots = "";
		}
		d3.select("#currentAlgorithmWork")
			.text("Algorithm loading data"+dots);
		}, 1000);
}

/**
 * Displays that the algorithm has loaded its data
 * @returns
 */
function handleLoadedSignal() {
	clearInterval(loadingAlgorithmDataAnimation);
	loadingAlgorithmDataAnimationState = 1;
	d3.select("#currentAlgorithmWork")
		.text("Data loaded");
	console.log("Dataset loaded on server");
}

/**
 * Setup the sliders that control the algorithm
 */
function setupAlgorithmSliders() {
	setupAlgorithmSupportSlider();
	setupAlgorithmWindowSizeSlider();
	setupAlgorithmMaximumSizeSlider();
	setupAlgorithmGapSlider();
}

var supportSlider = null;

/**
 * Slider dedicated to the support
 */
function setupAlgorithmSupportSlider() {
	supportSlider = new SupportSlider("sliderSupport");
}

/**
 * Slider dedicated to the window size
 * TODO replace with the maximum duration
 */
function setupAlgorithmWindowSizeSlider() {
	
}

/**
 * Slider dedicated to the maximum size
 */
function setupAlgorithmMaximumSizeSlider() {
	
}

var gapSlider = null;

/**
 * Slider dedicated to the gap
 */
function setupAlgorithmGapSlider() {
	gapSlider = new GapSlider("sliderGap");
}

function updateAlgorithmGapSlider() {
	
}

/************************************************************************************************************/
/*
												Support slider
																											*/
/************************************************************************************************************/

var SupportSlider = function(elemId) {
	var self = this;
	self.parentNodeId = elemId;
	
	self.svg = d3.select("#"+self.parentNodeId).append("svg")
		.attr("class","slider")
		.attr("width","256")//TODO change hardcoding of the width
		.attr("height","50");
	
	self.margin = {right: 10, left: 10};
	self.width = +self.svg.attr("width") - self.margin.left - self.margin.right;
	self.height = +self.svg.attr("height");	
	
	self.domain = [1,10000];
	self.currentMinValue = self.domain[0];
	self.currentMaxValue = self.domain[1];
	self.currentHandleMinValue = self.currentMinValue;
	self.currentHandleMaxValue = self.currentMaxValue;
	
	self.axis = d3.scaleLinear()
		.domain(self.domain)
		.range([0,self.width])
		.clamp(true);
	
	self.slider = self.svg.append("g")
		.attr("class","slider")
		.attr("transform","translate("+self.margin.left+","+ self.height / 2 +")");
	
	self.line = self.slider.append("line")
		.attr("class","track")
		.attr("x1",self.axis.range()[0])
		.attr("x2",self.axis.range()[1])
		.attr("stroke", "black");
	
	self.blueLine = self.slider.append("line")
		.attr("class","bluetrack")
		.attr("x1",self.axis(self.currentHandleMinValue))
		.attr("x2",self.axis(self.currentHandleMaxValue))
		.attr("stroke", "lightblue");
	
	self.slider.insert("g",".track-overlay")
		.attr("class","ticks")
		.attr("transform", "translate(0,"+18+")")
		.selectAll("text")
		.data(self.axis.ticks((self.domain[1]-self.domain[0])/1000))
		.enter().append("text")
			.attr("x",self.axis)
			.attr("text-anchor","middle")
			.text(function(d) { return d; });
	
	self.currentMin = self.slider.insert("rect", ".track-overlay")
		.attr("class","boundary")
		.attr("x",self.axis(self.currentMinValue))
		.attr("y",-5)
		.attr("width",2)
		.attr("height",10);
	
	self.currentMax = self.slider.insert("rect", ".track-overlay")
		.attr("class","boundary")
		.attr("x",self.axis(self.currentMaxValue))
		.attr("y",-5)
		.attr("width",2)
		.attr("height",10);
	
	self.handle1 = self.slider.insert("circle", ".track-overlay")
		.attr("class","handleSlider")
		.attr("r",5)
		.attr("cx",self.axis(self.currentMinValue))
		.call(d3.drag()
				.on("start.interrupt", function() { self.slider.interrupt(); })
				.on("start drag", function() {
					var roundedPos = Math.round(self.axis.invert(d3.event.x));
					self.moveHandle1To(roundedPos);
					}));
	
	self.handle2 = self.slider.insert("circle", ".track-overlay")
		.attr("class","handleSlider")
		.attr("r",5)
		.attr("cx",self.axis(self.currentMaxValue))
		.call(d3.drag()
				.on("start.interrupt", function() { self.slider.interrupt(); })
				.on("start drag", function() {
					var roundedPos = Math.round(self.axis.invert(d3.event.x));
					self.moveHandle2To(roundedPos);
					}));
	
	self.updateCurrentValues = function(min, max) {
		self.currentMinValue = min;
		self.currentMaxValue = max;
		self.handle1.attr("cx",self.axis(self.current))
	};
	
	self.moveCurrentMinTo = function(value) {
		if (value >= self.currentMinValue)
			self.currentMin.attr("x",self.axis(Math.round(value)));
	};
	
	self.moveCurrentMaxTo = function(value) {
		if (value <= self.currentMaxValue)
			self.currentMax.attr("x",self.axis(Math.round(value)));
	};
	
	self.moveHandle1To = function(value) {
		if (value >= self.currentMinValue && value <= self.currentMaxValue) {
			self.handle1.attr("cx",self.axis(Math.round(value)));
			var otherValue = self.axis.invert(self.handle2.attr("cx"));	
			self.currentHandleMinValue = Math.min(value, otherValue);
			self.currentHandleMaxValue = Math.max(value, otherValue);
	
			self.blueLine.attr("x1",self.axis(self.currentHandleMinValue))
				.attr("x2",self.axis(self.currentHandleMaxValue));
		}
			
		/*self.blueLine.attr("x1",self.axis(self.currentHandleMinValue))
			.attr("x2",self.handle2.attr("cx"));*/
	};
	
	self.moveHandle2To = function(value) {
		if (value >= self.currentMinValue && value <= self.currentMaxValue) {
			self.handle2.attr("cx",self.axis(Math.round(value)));
			var otherValue = self.axis.invert(self.handle1.attr("cx"));	
			self.currentHandleMinValue = Math.min(value, otherValue);
			self.currentHandleMaxValue = Math.max(value, otherValue);
	
			self.blueLine.attr("x1",self.axis(self.currentHandleMinValue))
				.attr("x2",self.axis(self.currentHandleMaxValue));
		}
		/*self.blueLine.attr("x1",)
			.attr("x2",self.axis(Math.round(value)));*/
	};
}

/************************************************************************************************************/
/*
												Gap slider
																											*/
/************************************************************************************************************/

var GapSlider = function(elemId) {
	var self = this;
	self.parentNodeId = elemId;
	
	self.svg = d3.select("#"+self.parentNodeId).append("svg")
		.attr("class","slider")
		.attr("width","256")//TODO change hardcoding of the width
		.attr("height","50");
	
	self.margin = {right: 10, left: 10};
	self.width = +self.svg.attr("width") - self.margin.left - self.margin.right;
	self.height = +self.svg.attr("height");	
	
	self.domain = [0,20];
	self.currentMinValue = self.domain[0];
	self.currentMaxValue = self.domain[1];
	self.currentHandleMinValue = self.currentMinValue;
	self.currentHandleMaxValue = self.currentMaxValue;
	
	self.axis = d3.scaleLinear()
		.domain(self.domain)
		.range([0,self.width])
		.clamp(true);
	self.slider = self.svg.append("g")
		.attr("class","slider")
		.attr("transform","translate("+self.margin.left+","+ self.height / 2 +")");
	
	self.line = self.slider.append("line")
		.attr("class","track")
		.attr("x1",self.axis.range()[0])
		.attr("x2",self.axis.range()[1])
		.attr("stroke", "black");
	
	self.blueLine = self.slider.append("line")
		.attr("class","bluetrack")
		.attr("x1",self.axis(self.currentHandleMinValue))
		.attr("x2",self.axis(self.currentHandleMaxValue))
		.attr("stroke", "lightblue");
	
	self.slider.insert("g",".track-overlay")
		.attr("class","ticks")
		.attr("transform", "translate(0,"+18+")")
		.selectAll("text")
		.data(self.axis.ticks(self.domain[1]-self.domain[0]))
		.enter().append("text")
			.attr("x",self.axis)
			.attr("text-anchor","middle")
			.text(function(d) { return d; });
	
	self.currentMin = self.slider.insert("rect", ".track-overlay")
		.attr("class","boundary")
		.attr("x",self.axis(self.currentMinValue))
		.attr("y",-5)
		.attr("width",2)
		.attr("height",10);
	
	self.currentMax = self.slider.insert("rect", ".track-overlay")
		.attr("class","boundary")
		.attr("x",self.axis(self.currentMaxValue))
		.attr("y",-5)
		.attr("width",2)
		.attr("height",10);
	
	self.handle1 = self.slider.insert("circle", ".track-overlay")
		.attr("class","handleSlider")
		.attr("r",5)
		.attr("cx",self.axis(self.currentMinValue))
		.call(d3.drag()
				.on("start.interrupt", function() { self.slider.interrupt(); })
				.on("start drag", function() {
					var roundedPos = Math.round(self.axis.invert(d3.event.x));
					self.moveHandle1To(roundedPos);
					}));
	
	self.handle2 = self.slider.insert("circle", ".track-overlay")
		.attr("class","handleSlider")
		.attr("r",5)
		.attr("cx",self.axis(self.currentMaxValue))
		.call(d3.drag()
				.on("start.interrupt", function() { self.slider.interrupt(); })
				.on("start drag", function() {
					var roundedPos = Math.round(self.axis.invert(d3.event.x));
					self.moveHandle2To(roundedPos);
					}));
	
	self.updateCurrentValues = function(min, max) {
		self.currentMinValue = min;
		self.currentMaxValue = max;
		self.handle1.attr("cx",self.axis(self.current))
	};
	
	self.moveCurrentMinTo = function(value) {
		if (value >= self.currentMinValue)
			self.currentMin.attr("x",self.axis(Math.round(value)));
	};
	
	self.moveCurrentMaxTo = function(value) {
		if (value <= self.currentMaxValue)
			self.currentMax.attr("x",self.axis(Math.round(value)));
	};
	
	self.moveHandle1To = function(value) {
		if (value >= self.currentMinValue && value <= self.currentMaxValue) {
			self.handle1.attr("cx",self.axis(Math.round(value)));
			var otherValue = self.axis.invert(self.handle2.attr("cx"));	
			self.currentHandleMinValue = Math.min(value, otherValue);
			self.currentHandleMaxValue = Math.max(value, otherValue);

			self.blueLine.attr("x1",self.axis(self.currentHandleMinValue))
				.attr("x2",self.axis(self.currentHandleMaxValue));
		}
			
		/*self.blueLine.attr("x1",self.axis(self.currentHandleMinValue))
			.attr("x2",self.handle2.attr("cx"));*/
	};
	
	self.moveHandle2To = function(value) {
		if (value >= self.currentMinValue && value <= self.currentMaxValue) {
			self.handle2.attr("cx",self.axis(Math.round(value)));
			var otherValue = self.axis.invert(self.handle1.attr("cx"));	
			self.currentHandleMinValue = Math.min(value, otherValue);
			self.currentHandleMaxValue = Math.max(value, otherValue);

			self.blueLine.attr("x1",self.axis(self.currentHandleMinValue))
				.attr("x2",self.axis(self.currentHandleMaxValue));
		}
		/*self.blueLine.attr("x1",)
			.attr("x2",self.axis(Math.round(value)));*/
	};
}

/************************************************************************************************************/
/*
												Timeline
																											*/
/************************************************************************************************************/

var Timeline = function(elemId, options) {
	var self = this;
	self.userData = 0;
	self.parentNode = document.getElementById(elemId);

	self.bins = [];
	self.patternBins = [];
	
	self.patternOccs = {};
	self.displayPatternOccs = {};
	
	self.hasPatternOccurrences = function(id) {
		return self.patternOccs.hasOwnProperty(id);
	}
	
	self.displayPatternOccurrences = function(id) {
		if (self.displayPatternOccs[id] == true) {
			self.displayPatternOccs[id] = false;
		} else {
			self.displayPatternOccs[id] = true;
		}
		self.drawPatternOccurrences();
	}
	
	self.addPatternOccurrence = function(id, occ) {
		if (self.patternOccs.hasOwnProperty(id) == false) {
			self.patternOccs[id] = [];
			self.displayPatternOccs[id] = false;
		}
		self.patternOccs[id].push(occ);
	}
	
	self.resetPatterns = function() {
		self.patternOccs = {};
		self.displayPatternOccs = {};
	}
	
	self.drawEvents = function() {
		console.log("Calling temporary draw events");
	}
	
	self.zoomed = function() {
		//console.log("zooming");
		if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
		var t = d3.event.transform;
		self.xFocus.domain(t.rescaleX(self.xContext).domain());
		self.xPatterns.domain(t.rescaleX(self.xContext).domain());
		/*self.focus.select(".area")
			.attr("d", self.areaFocus);*/
		self.focus.select(".axis--x")
			.call(self.xAxisFocus);
		self.patterns.select(".axis--x")
			.call(self.xAxisPatterns);
		/*self.focus.selectAll(".dot")
			.attr("transform",function(d) {return "translate("+self.xFocus(d.time)+","+self.yFocus(d.height)+")"});*/
		//self.drawCurrentBins();
		self.displayData();
		self.context.select(".brush")
			.call(self.brush.move, self.xFocus.range().map(t.invertX, t));
	};
	
	self.drawPatternOccurrences = function() {
		
		console.log("Starting to draw patterns");
		var idsToDraw = [];
		
		for (var key in self.displayPatternOccs) {
		  if (self.displayPatternOccs.hasOwnProperty(key)) {
		    if (self.displayPatternOccs[key] == true)
		    	idsToDraw.push(key);
		  }
		}
		
		self.yPatterns.domain([0.0, idsToDraw.length+2.0]);
		/*self.focus.select(".axis--y")
	      .call(self.yAxisPatterns)
			.selectAll(".tick line").attr("stroke","lightblue").attr("stroke-width","0.5");*/
		

		self.canvasPatternsContext.fillStyle = "#fff";
		self.canvasPatternsContext.rect(0,0,self.canvasPatterns.attr("width"),self.canvasPatterns.attr("height"));
		self.canvasPatternsContext.fill();
		
		for (var i = 0; i < idsToDraw.length; i++) {// Draw each pattern
			for (var j=0; j < self.patternOccs[idsToDraw[i]].length; j++) {// Draw each occurrence
				console.log("Ids to draw: "+idsToDraw)
				var occ = self.patternOccs[idsToDraw[i]][j].split(";");
				var x1 = self.xPatterns(new Date(parseInt(occ[1])));
				var x2 = self.xPatterns(new Date(parseInt(occ[2])));
				var y = self.yPatterns(i+1);
				self.canvasPatternsContext.beginPath();
				if (x1 == x2) {
					self.canvasPatternsContext.fillStyle = "blue";
					self.canvasPatternsContext.arc(x1,y,3,0,2*Math.PI, false)
					self.canvasPatternsContext.fill();
					self.canvasPatternsContext.closePath();
				} else {
					self.canvasPatternsContext.lineWidth = 3;
					self.canvasPatternsContext.moveTo(x1,y);
					self.canvasPatternsContext.lineTo(x2,y);
					self.canvasPatternsContext.lineCap = "round";
					self.canvasPatternsContext.stroke();
				    self.canvasPatternsContext.closePath();
				}
			}
		}
		console.log(idsToDraw.length+" occurrences drawn")
	}
	
	self.setBins = function(bins) {
		self.bins = bins;
	}
	
	self.drawBins = function(bins) {
		// draw the year bins
		console.log("drawing bins");
		//console.log(bins);
		self.setBins(bins);
		//[[year,start,end,value]...]
		
		// Adjust the focus part of the timeline to the new data
		//self.xFocus.domain(d3.extent(csvData, function(d) { return d.time; }));
		var maxBin = 0.0;//1999999.0;
		for (var iBin=0; iBin < bins.length; iBin++) {
			if (parseInt(bins[iBin][3]) > maxBin)
				maxBin = parseFloat(bins[iBin][3]);
		}
		
		self.yFocus.domain([0.0, maxBin+1.0]);
		self.focus.select(".axis--y")
	      .call(self.yAxisFocus)
			.selectAll(".tick line").attr("stroke","lightblue").attr("stroke-width","0.5");
		

		self.canvasContext.fillStyle = "#fff";
		self.canvasContext.rect(0,0,self.canvas.attr("width"),self.canvas.attr("height"));
		self.canvasContext.fill();
		
		self.hiddenCanvasContext.fillStyle = "#fff";
		self.hiddenCanvasContext.fillRect(0,0,self.hiddenCanvas.attr("width"),self.hiddenCanvas.attr("height"));
		
		self.colorToData = {};
		let nextColor = 1;
		
		for (var iBin=0; iBin < bins.length; iBin++) {
			self.canvasContext.beginPath();
		    var x = self.xFocus(d3.timeParse('%Y-%m-%d %H:%M:%S')(bins[iBin][1]));
		    var x2 = self.xFocus(d3.timeParse('%Y-%m-%d %H:%M:%S')(bins[iBin][2]));
		    /*
		     * Deduce the decomposition in multiple bars from bins[iBin]
		     * Structure : [year,start,end,nbEvents,user1;user2;...,???,type1:nbOcc;type2:nbOcc;...]
		     */
		    var colorsProportion = {}; // nbOccs for each color
		    var eventsInfo = bins[iBin][6].split(";");
		    for (var t=0 ; t < eventsInfo.length ; t++) {
		    	var details = eventsInfo[t].split(":");
		    	var eColor = getEventColorForAgavue(details[0]);
		    	if (!colorsProportion[eColor])
		    		colorsProportion[eColor] = parseInt(details[1]);
		    	else
		    		colorsProportion[eColor] += parseInt(details[1]);
		    }
		    var evtNbr = parseInt(bins[iBin][3]);
		    var colorsFound = Object.keys(colorsProportion);
		    /*for (var t =0; t < colorsFound.length; t++) {
		    	colorsProportion[colorsFound[t]] /= (evtNbr*0.1);
		    }*/
		    colorsFound.sort(function(a,b) {
		    	return colorsProportion[a] - colorsProportion[b];
		    });
		    
		    // draw each of the coloured sections of the bar
		    var cumulatedHeight = 0;
		    var y;
		    var binHeight;
		    for (var t = 0; t < colorsFound.length; t++) {
			    //var y = self.yFocus(maxBin-parseInt(bins[iBin][3]));
			    //var binHeight = self.yFocus(parseInt(bins[iBin][3]));
			    var y = self.yFocus(maxBin-colorsProportion[colorsFound[t]]);
			    var binHeight = self.yFocus(cumulatedHeight + colorsProportion[colorsFound[t]]);
			    //self.canvasContext.fillStyle = "lightblue";//node.attr("fillStyle");
			    self.canvasContext.fillStyle = "hsl("+colorsFound[t]+",100%,50%)";
			    self.canvasContext.fillRect(x, binHeight, x2-x, y);
			    self.canvasContext.lineWidth = 0.25;
			    self.canvasContext.strokeStyle = "black";
			    self.canvasContext.stroke();
			    //  self.canvasContext.fillRect(x, binHeight, x2-x, y);
			    self.canvasContext.closePath();
			    cumulatedHeight += colorsProportion[colorsFound[t]];
		    } 		    
		    
		    // Attributing a color to data link
		    var color = [];
		    // via http://stackoverflow.com/a/15804183
		    if(nextColor < 16777215){
		    	color.push(nextColor & 0xff); // R
		    	color.push((nextColor & 0xff00) >> 8); // G 
		    	color.push((nextColor & 0xff0000) >> 16); // B

		    	nextColor += 1;
		    }
		    self.colorToData["rgb("+color.join(',')+")"] = bins[iBin];
		    
		    // Drawing on the hiddenCanvas
		    y = self.yFocus(maxBin-parseInt(bins[iBin][3]));
		    binHeight = self.yFocus(parseInt(bins[iBin][3]));
		    
			self.hiddenCanvasContext.beginPath();
		    self.hiddenCanvasContext.fillStyle = "rgb("+color.join(',')+")";//node.attr("fillStyle");
		    self.hiddenCanvasContext.fillRect(x, binHeight, x2-x, y);
		    self.hiddenCanvasContext.closePath();
		    
		    // Drawing the text
		    /*self.canvasContext.fillStyle = "black";
		    self.canvasContext.textAlign = "center";
		    self.canvasContext.textBaseline = "middle";
		    self.canvasContext.fillText(
		    		bins[iBin][3],				// text
		    		x+(x2-x)/2,						// x
		    		binHeight+y/2);*/		// y
		}
		
		self.canvasOverviewContext.fillStyle = "#fff";
		self.canvasOverviewContext.rect(0,0,self.canvasOverview.attr("width"),self.canvasOverview.attr("height"));
		self.canvasOverviewContext.fill();

		self.yContext.domain([0.0, maxBin+1.0]);
		
		var area = d3.area()
		    .x(function(d) { return d[0]; })
		    .y0(self.heightContext)
		    .y1(function(d) { return d[1]; })
		    .context(self.canvasOverviewContext);
		
		var data = [];
		
		for (var iBin=0; iBin < bins.length; iBin++) {			
			var thisData = [];
			
			thisData.push(self.xContext(d3.timeParse('%Y-%m-%d %H:%M:%S')(bins[iBin][1])));
			thisData.push(self.yContext(parseInt(bins[iBin][3])));
			data.push(thisData);
			
			thisData = [];
			thisData.push(self.xContext(d3.timeParse('%Y-%m-%d %H:%M:%S')(bins[iBin][2])));
			thisData.push(self.yContext(parseInt(bins[iBin][3])));
			data.push(thisData);
		}
		
		self.canvasOverviewContext.beginPath();
		area(data);
		self.canvasOverviewContext.fillStyle = "darkturquoise";
		self.canvasOverviewContext.strokeStyle = "darkturquoise";
		self.canvasOverviewContext.fill();
	};
	
	self.drawCurrentBins = function() {
		self.drawBins(self.bins);
		self.drawPatternBins(self.patternBins);
	};
	
	self.binTransformed = false;
	
	self.drawPatternBinsFromData = function() {
		self.drawPatternBins(self.bins);
	};
	
	self.drawPatternBins = function(patternBinsReceived) {
		// draw the year bins
		console.log("drawing pattern bins");
		//console.log(bins);
		
		//[[year,start,end,value]...]
		
		// Adjust the focus part of the timeline to the new data
		//self.xFocus.domain(d3.extent(csvData, function(d) { return d.time; }));
		var maxBin = 0.0;//1999999.0;
		for (var iBin=0; iBin < self.bins.length; iBin++) {
			if (parseInt(self.bins[iBin][3]) > maxBin)
				maxBin = parseFloat(self.bins[iBin][3]);
		}
		

		if (!self.binTransformed) {
			self.patternBins = patternBinsReceived;

			for (var iBin=0; iBin < self.patternBins.length; iBin++) {
				if (parseFloat(self.patternBins[iBin][3]) > maxBin/2) {
					var nv = parseInt(self.patternBins[iBin][3]) - parseInt(self.patternBins[iBin][3])/2;
					self.patternBins[iBin][3] = nv.toString();
				} else {
					var nv = parseInt(self.patternBins[iBin][3]) + parseInt(self.patternBins[iBin][3])/2;
					self.patternBins[iBin][3] = nv.toString();
				}
			}
			self.binTransformed = true;
		}
		
		var pBins = self.patternBins;
		
		self.yPatterns.domain([0.0, maxBin+1.0]);
		/*self.focus.select(".axis--y")
	      .call(self.yAxisPatterns)
			.selectAll(".tick line").attr("stroke","lightblue").attr("stroke-width","0.5");*/
		

		self.canvasPatternsContext.fillStyle = "#fff";
		self.canvasPatternsContext.rect(0,0,self.canvasPatterns.attr("width"),self.canvasPatterns.attr("height"));
		self.canvasPatternsContext.fill();
		
		for (var iBin=0; iBin < pBins.length; iBin++) {
			self.canvasPatternsContext.beginPath();
		    var x = self.xPatterns(d3.timeParse('%Y-%m-%d %H:%M:%S')(pBins[iBin][1]));
		    var x2 = self.xPatterns(d3.timeParse('%Y-%m-%d %H:%M:%S')(pBins[iBin][2]));
		    var y = self.yPatterns(maxBin-parseInt(pBins[iBin][3]));
		    var binHeight = self.yPatterns(parseInt(pBins[iBin][3]));
		    self.canvasPatternsContext.rect(x, binHeight, x2-x, y);
		    self.canvasPatternsContext.fillStyle = "lightblue";//node.attr("fillStyle");
		    self.canvasPatternsContext.fill();
		    self.canvasPatternsContext.lineWidth = 0.25;
		    self.canvasPatternsContext.strokeStyle = "black";
		    self.canvasPatternsContext.stroke();
		  //  self.canvasContext.fillRect(x, binHeight, x2-x, y);
		    self.canvasPatternsContext.closePath();
		    
		    // Drawing the text
		    /*self.canvasContext.fillStyle = "black";
		    self.canvasContext.textAlign = "center";
		    self.canvasContext.textBaseline = "middle";
		    self.canvasContext.fillText(
		    		bins[iBin][3],				// text
		    		x+(x2-x)/2,						// x
		    		binHeight+y/2);*/		// y
		}
		/*
		self.canvasOverviewContext.fillStyle = "#fff";
		self.canvasOverviewContext.rect(0,0,self.canvasOverview.attr("width"),self.canvasOverview.attr("height"));
		self.canvasOverviewContext.fill();

		self.yContext.domain([0.0, maxBin+1.0]);
		
		var area = d3.area()
		    .x(function(d) { return d[0]; })
		    .y0(self.heightContext)
		    .y1(function(d) { return d[1]; })
		    .context(self.canvasOverviewContext);
		
		var data = [];
		
		for (var iBin=0; iBin < bins.length; iBin++) {			
			var thisData = [];
			
			thisData.push(self.xContext(d3.timeParse('%Y-%m-%d %H:%M:%S')(bins[iBin][1])));
			thisData.push(self.yContext(parseInt(bins[iBin][3])));
			data.push(thisData);
			
			thisData = [];
			thisData.push(self.xContext(d3.timeParse('%Y-%m-%d %H:%M:%S')(bins[iBin][2])));
			thisData.push(self.yContext(parseInt(bins[iBin][3])));
			data.push(thisData);
		}
		
		self.canvasOverviewContext.beginPath();
		area(data);
		self.canvasOverviewContext.fillStyle = "lightblue";
		self.canvasOverviewContext.strokeStyle = "lightblue";
		self.canvasOverviewContext.fill();*/
	};
	
	self.brushed = function() {
		console.log("brushing");
		if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
		var s = d3.event.selection || self.xContext.range();
		self.xFocus.domain(s.map(self.xContext.invert, self.xContext));
		self.xPatterns.domain(s.map(self.xContext.invert, self.xContext));
		/*self.focus.select(".area")
			.attr("d", self.areaFocus);*/
		self.focus.select(".axis--x")
			.call(self.xAxisFocus);
		self.patterns.select(".axis--x")
			.call(self.xAxisPatterns);
		/*self.focus.selectAll(".dot")
			.attr("transform",function(d) {return "translate("+self.xFocus(d.time)+","+self.yFocus(d.height)+")"});*/
		//self.drawCurrentBins();
		self.displayData();
		self.svg.select(".zoom")
			.call(self.zoom.transform, d3.zoomIdentity.scale(self.width / (s[1] - s[0]))
			.translate(-s[0], 0));
	};

	self.typeHeight = {};
	self.detachedContainer = document.createElement("custom");
	self.dataContainer = d3.select(self.detachedContainer);
	self.displayMode = "distributions";
	self.distributionScale = "year";
	
	
	// Adding the control buttons over the timeline
	self.changeDisplayMode = function() {
	    if (this.value === "distributions") {
	    	self.displayMode = "distributions";

			/*self.focus.select(".axis--y")
				.style("visibility","initial");*/
	    } else {
    		self.displayMode = "events";

    		/*self.focus.select(".axis--y")
    			.style("visibility","hidden");*/
	    }
	    self.switchScaleFormVisibility();
	    self.switchEventDisplayStyleFormVisibility();
	    self.displayData();
	};
	
	self.displayData = function() {
		//startRunningTaskIndicator();
		//console.log("----DisplayData----");
		// check if we need to adapt the semantic zoom
		var displaySeconds = (self.xFocus.domain()[1] - self.xFocus.domain()[0])/1000;
		var displayIsFine = false;
		switch(self.displayMode) {
		case "distributions":
			switch(self.distributionScale) {
			case "year":
				if (displaySeconds > 60*60*24*365*3 )	// more than 3 years
					displayIsFine = true;
				break;
			case "month":
				if (displaySeconds < 60*60*24*365*3 && displaySeconds > 60*60*24*365)	// between 1 year and 3 years
					displayIsFine = true;
				break;
			case "halfMonth":
				if (displaySeconds < 60*60*24*365 && displaySeconds > 60*60*24*31*3)	// between 3 months and 1 year
					displayIsFine = true;
				break;
			case "day":
				if (displaySeconds < 60*60*24*31*3 && displaySeconds > 60*60*24*7*3)	// between 3 months and 3 weeks
					displayIsFine = true;
				break;
			case "halfDay":
				console.log("Time (s): "+displaySeconds);
				console.log("Bounds (s): "+60*60*24*7*3+" - "+60*60*24*3);
				if (displaySeconds < 60*60*24*7*3 && displaySeconds > 60*60*24*3) {	// between 3 weeks and 3 days
					displayIsFine = true;
					//console.log("==== Distributions over halfDay");
				}
				break;
			default:
				console.log("Trying to scale distributions in an unknown way. distributionScale = "+self.distributionScale);
				break;
			}
			break;
		case "events":
			if (displaySeconds < 60*60*24*3 ) {	// less than 3 days
				//console.log("Event mode, time (s): "+displaySeconds);
				//console.log("Display mode: "+self.displayMode);
				displayIsFine = true;
			}
			break;
		default:
			console.log("Trying to display data in an unknown way. displayMode = "+self.displayMode);
		}
		
		// Adapt the semantic zoom if needed
		console.log("DisplayIsFine: "+displayIsFine);
		if (displayIsFine == false) {
			console.log("semantic zoom not fine : "+self.displayMode);
			d3.selectAll(".zoomInfoSpan").attr("class", "zoomInfoSpan");
			if (displaySeconds < 60*60*24*3 ) {	// less than 3 days
				self.displayMode = "events";
				d3.select("#zoomInfoEvent").attr("class","zoomInfoSpan currentZoom");
				console.log("Going to event display mode");
				self.switchEventDisplayStyleFormVisibility();
			} else  {
				if (self.displayMode == "events") {
					self.displayMode = "distributions";
					self.switchEventDisplayStyleFormVisibility();
					console.log("Going from events to distributions");
				}
				if (displaySeconds < 60*60*24*7*3 )	{// less than 3 weeks
					requestHalfDayBins("Agavue");
					self.distributionScale = "halfDay";
					d3.select("#zoomInfoHalfDay").attr("class","zoomInfoSpan currentZoom");
				} else if (displaySeconds < 60*60*24*31*3 )	{// less than 3 months
					requestDayBins("Agavue");
					self.distributionScale = "day";
					d3.select("#zoomInfoDay").attr("class","zoomInfoSpan currentZoom");
				} else if (displaySeconds < 60*60*24*365 ) {// less than 1 year
					requestHalfMonthBins("Agavue");
					self.distributionScale = "halfMonth";
					d3.select("#zoomInfoHalfMonth").attr("class","zoomInfoSpan currentZoom");
				} else if (displaySeconds < 60*60*24*365*3 ) {// less than 3 years
					requestMonthBins("Agavue");
					self.distributionScale = "month";
					d3.select("#zoomInfoMonth").attr("class","zoomInfoSpan currentZoom");
				} else {// more than 3 years
					requestYearBins("Agavue");
					self.distributionScale = "year";
					d3.select("#zoomInfoYear").attr("class","zoomInfoSpan currentZoom");
				}
			}
		}
		
		
		switch(self.displayMode) {
		case "distributions":
			//self.displayDistributions();
			self.drawBins(self.bins);
			self.drawPatternOccurrences();
			break;
		case "events":
			//self.displayEvents();
			console.log("----Draw Events");
			self.drawEvents();
			self.drawPatternOccurrences();
			break;
		default:
			console.log("Trying to display data in an unknown way. displayMode = "+self.displayMode);
		}
		//self.drawPatternBins(self.patternBins);
		//stopRunningTaskIndicator();
	};
	
	self.zoomClick = function() {
		self.zoomRect.call(self.zoom.transform, d3.zoomIdentity.scale(0.2));
		
		//var t = d3.zoomTransforme(self.zoomRect.node());
		//var x = t.x;
		
		
		/*
		var clicked = d3.event.target,
			direction = 1,
	        factor = 0.2,
	        target_zoom = 1,
	        center = [self.widthFocus / 2, self.heightFocus / 2],
	        extent = self.zoom.scaleExtent(),
	        translate = self.zoom.translateExtent(),
	        translate0 = [],
	        l = [],
	        view = {x: translate[0], y: translate[1], k: self.zoom.scale()};

	    d3.event.preventDefault();
	    direction = (this.id === 'zoomIn') ? 1 : -1;
	    target_zoom = self.zoom.scale() * (1 + factor * direction);

	    if (target_zoom < extent[0] || target_zoom > extent[1]) { return false; }

	    translate0 = [(center[0] - view.x) / view.k, (center[1] - view.y) / view.k];
	    view.k = target_zoom;
	    l = [translate0[0] * view.k + view.x, translate0[1] * view.k + view.y];

	    view.x += center[0] - l[0];
	    view.y += center[1] - l[1];
	    
	    self.zoomed();*/
	}
	
	self.controls = d3.select(self.parentNode).append("div");
	
	// Adding the zoom option (+ / -)
	self.currentZoomScale = 1.0;
	
	self.zoomForm = self.controls.append("form")
		.attr("class","displayZoomForm");
	self.zoomForm.append("input")
		.attr("type","button")
		.attr("name","zoom")
		.attr("value","+")
		.attr("id", "zoomIn")
		.on("click", function() {
			console.log("zoomedIn");
			self.currentZoomScale += 0.05;
			self.currentZoomScale = Math.max(0.05, self.currentZoomScale);
			self.zoomRect.call(self.zoom.scaleBy, 1.1);
			console.log("Zoom: "+self.currentZoomScale);
		});
	self.zoomForm.append("input")
		.attr("type","button")
		.attr("name","zoom")
		.attr("value","-")
		.attr("id", "zoomOut")
		.on("click", function() {
			console.log("zoomedOut");
			self.currentZoomScale -= 0.05;
			self.currentZoomScale = Math.max(1.0, self.currentZoomScale);
			self.zoomRect.call(self.zoom.scaleBy, 0.9);
			console.log("Zoom: "+self.currentZoomScale);
		});
	
	// Adding the zoom's granularity information
	self.zoomInfo = self.controls.append("div")
		.attr("style","float:left;")
		.html("Data grouped by: <span>" +
				"<span id='zoomInfoYear'>year<span> \> " +
				"<span id='zoomInfoMonth'>month</span> \> " +
				"<span id='zoomInfoHalfMonth'>half month</span> \> " +
				"<span id='zoomInfoDay'>day</span> \> " +
				"<span id='zoomInfoHalfDay'>half day</span> \> " +
				"<span id='zoomInfoEvent'>event</span>" +
				"</span>");
	self.zoomInfo.selectAll("span").attr("class","zoomInfoSpan");
	
	// Adding the display options (bins / discrete)
	/*self.controlForm = self.controls.append("form")
		.attr("class","displayControlForm");
	self.controlForm.append("label")
		.text("Distributions")
		.append("input")
		.attr("type","radio")
		.attr("name","mode")
		.property("checked",true)
		.attr("value","distributions");
	self.controlForm.append("label")
		.text("Events")
		.append("input")
		.attr("type","radio")
		.attr("name","mode")
		.attr("value","events")
		.attr("id","eventDisplay")
		.property("disabled", true);
	self.controlForm.selectAll("input").on("change", self.changeDisplayMode);*/
	
	self.setEventsReady = function() {
		/*self.controlForm.select("input#eventDisplay")
			.property("disabled", false);*/
		// TODO delete the function (useless)
	};
	
	self.changeDistributionScale = function() {
	    if (this.value === "year")
	    	self.distributionScale = "year";
    	else if (this.value === "month")
    		self.distributionScale = "month";
    	else if (this.value === "day")
    		self.distributionScale = "day";
    	else
    		self.distributionScale = "halfDay";
	    self.scaleDistribution();
	};

	self.scaleDistribution = function() {
		switch(self.distributionScale) {
		case "year":
			requestYearBins("Agavue");
			break;
		case "month":
			requestMonthBins("Agavue");
			break;
		case "day":
			requestDayBins("Agavue");
			break;
		case "halfDay":
			requestHalfDayBins("Agavue");
			break;
		default:
			console.log("Trying to scale distributions in an unknown way. distributionScale = "+self.distributionScale);
		}
	};
	/*self.scaleForm = self.controls.append("form")
						.style("margin-left","15px")
						.attr("class","displayControlForm");
	self.scaleForm.append("label")
		.text("Year")
		.append("input")
		.attr("type","radio")
		.attr("name","scale")
		.property("checked",true)
		.attr("value","year");
	self.scaleForm.append("label")
		.text("Month")
		.append("input")
		.attr("type","radio")
		.attr("name","scale")
		.attr("value","month");
	self.scaleForm.append("label")
		.text("Day")
		.append("input")
		.attr("type","radio")
		.attr("name","scale")
		.attr("value","day");
	self.scaleForm.append("label")
		.text("12 hours")
		.append("input")
		.attr("type","radio")
		.attr("name","scale")
		.attr("value","halfDay");
	self.scaleForm.selectAll("input").on("change", self.changeDistributionScale);*/
	
	self.switchScaleFormVisibility = function() {
		var currentVisibility = self.scaleForm.style("visibility");
		switch(currentVisibility) {
			case "hidden":
				self.scaleForm.style("visibility","initial");
				break;
			default:
				self.scaleForm.style("visibility","hidden");
		}
	}
	
	self.eventDisplayStyle = "type";
	
	self.changeEventDisplayStyle = function() {
	    if (this.value === "type")
	    	self.eventDisplayStyle = "type";
    	else if (this.value === "time")
    		self.eventDisplayStyle = "time";
    	else
    		self.eventDisplayStyle = "user";
	    self.displayData();
	};
	
	self.eventDisplayStyleForm = self.controls.append("form")
						.style("margin-left","15px")
						.attr("class","displayControlForm")
						.style("visibility","hidden")
						.style("float","right");
	self.eventDisplayStyleForm.append("label")
		.text("Order events by: ");
	self.eventDisplayStyleForm.append("label")
		.text("Type")
		.append("input")
		.attr("type","radio")
		.attr("name","scale")
		.property("checked",true)
		.attr("value","type");
	self.eventDisplayStyleForm.append("label")
		.text("Time")
		.append("input")
		.attr("type","radio")
		.attr("name","scale")
		.attr("value","time");
	/*self.eventDisplayStyleForm.append("label")		// TODO Uncomment when correctly implemented
		.text("User")
		.append("input")
		.attr("type","radio")
		.attr("name","scale")
		.attr("value","user");*/
	self.eventDisplayStyleForm.selectAll("input").on("change", self.changeEventDisplayStyle);
	
	self.switchEventDisplayStyleFormVisibility = function() {
		var currentVisibility = self.eventDisplayStyleForm.style("visibility");
		switch(currentVisibility) {
			case "hidden":
				self.eventDisplayStyleForm.style("visibility","initial");
				break;
			default:
				self.eventDisplayStyleForm.style("visibility","hidden");
		}
	}
	
	self.displayToolTip = function(data) {
		var message = "";
		
		switch(self.displayMode) {
		case "distributions":
			switch(self.distributionScale) {
			case "year":
				//message = "Year "+data[0]+"<br>"+"("+data[1]+" to "+data[2]+")"+"<br>"+data[3]+" events";
			case "month":
			case "halfMonth":
			case "day":
			case "halfDay":
				var nbUsers = data[4].split(";").length;
				var nbOccs = data[6].split(';');
				//console.log("pre-sort: "+nbOccs);
				nbOccs.sort(function(a,b) {
					var aVal = parseInt(a.split(":")[1]);
					var bVal = parseInt(b.split(":")[1]);
					return bVal - aVal;	// sort in descending order
				});
				//console.log("post-sort: "+nbOccs);
				message = "From "+data[1]+" to "+data[2]+"<br>";
				message += nbUsers+" users<br>";
				message += data[3]+" events:";
				for (var i = 0; i < nbOccs.length; i++) {
					if (i == 10) {
						message += "<br>&nbsp;&nbsp;...";
						break;
					}
					var occ = nbOccs[i].split(":");
					var percentage = parseInt(occ[1])/parseInt(data[3]);
					message += "<br>&nbsp;&nbsp;"+occ[0]+" : "+occ[1]+" ("+(percentage*100).toPrecision(3)+"%)";
				}
			}
			break;
		case "events":
				splitData = data.split(";");
				message = "Type: " + splitData[0] + "<br>";
				message += "Time: " + splitData[1] + "<br>";
				message += "User: " + splitData[3] + "<br>";
				message += "Chart: " + splitData[4] + "<br>";
				message += "Version: " + splitData[5] + "<br>";
				message += "Properties:";
				for(var i = 6; i < splitData.length; i++)
					message += "<br>&nbsp;&nbsp;&nbsp;&nbsp;"+splitData[i];
		}
		tooltip.show(message, 400);
	}
	
	// Parameters about size and margin of the timeline's parts
	self.marginFocus = {"top": 20,"right": 20,"bottom": 300,"left": 40}; // bottom 110
	self.marginContext = {"top": 330,"right": 20,"bottom": 230,"left": 40};// bottom 30
	self.marginPatterns = {"top": 400,"right": 20,"bottom": 30,"left": 40};
	self.width = +self.parentNode.clientWidth
			- Math.max(self.marginFocus.left, self.marginContext.left)
			- Math.max(self.marginFocus.right, self.marginContext.right);
	self.heightFocus = +self.parentNode.clientHeight
			- self.marginFocus.top - self.marginFocus.bottom -5;
	self.heightContext = +self.parentNode.clientHeight
			- self.marginContext.top - self.marginContext.bottom -5;
	self.heightPatterns = +self.parentNode.clientHeight
			- self.marginPatterns.top - self.marginPatterns.bottom -5;
	
	// The timeline's parts
	self.canvas = d3.select(self.parentNode).append("canvas")
		.attr("width",self.width)
		.attr("height",self.heightFocus)
		.style("position","absolute")
		.style("top",(self.marginFocus.top + 15).toString()+"px")
		.style("left",self.marginFocus.left.toString()+"px");	
	self.canvasContext = self.canvas.node().getContext("2d");

	self.canvasOverview = d3.select(self.parentNode).append("canvas")
		.attr("width",self.width)
		.attr("height",self.heightContext)
		.style("position","absolute")
		.style("top",(self.marginContext.top + 15).toString()+"px")
		.style("left",self.marginContext.left.toString()+"px");	
	self.canvasOverviewContext = self.canvasOverview.node().getContext("2d");

	self.canvasPatterns = d3.select(self.parentNode).append("canvas")
		.attr("width",self.width)
		.attr("height",self.heightPatterns)
		.style("position","absolute")
		.style("top",(self.marginPatterns.top + 15).toString()+"px")
		.style("left",self.marginPatterns.left.toString()+"px");	
	self.canvasPatternsContext = self.canvasPatterns.node().getContext("2d");
	
	self.hiddenCanvas = d3.select(self.parentNode).append("canvas")
		.attr("width",self.width)
		.attr("height",self.heightFocus)
		.style("position","absolute")
		.style("top",(self.marginFocus.top + 15).toString()+"px")
		.style("left",self.marginFocus.left.toString()+"px")
		.style("display","none");
	self.hiddenCanvasContext = self.hiddenCanvas.node().getContext("2d");

	self.hiddenCanvasPatterns = d3.select(self.parentNode).append("canvas")
		.attr("width",self.width)
		.attr("height",self.heightPatterns)
		.style("position","absolute")
		.style("top",(self.marginPatterns.top + 15).toString()+"px")
		.style("left",self.marginPatterns.left.toString()+"px");	
	self.hiddenCanvasPatternsContext = self.hiddenCanvasPatterns.node().getContext("2d");
	
	self.colorToData = {}; // Binding between the hidden canvas and the drawn one
	
	self.svg = d3.select(self.parentNode).append("svg")
		.attr("width",self.parentNode.clientWidth)
		.attr("height",self.parentNode.clientHeight-15)
		.style("position","absolute")
		.style("top","15")
		.style("left","0");

	// Parameters for the various axis
	self.parseDate = d3.timeParse("%Y-%M-%d %H:%m:%s");
	self.xFocus = d3.scaleTime().range([0, self.width]);
	self.xContext = d3.scaleTime().range([0,self.width]);
	self.yFocus = d3.scaleLinear().range([self.heightFocus,0]);
	self.yContext = d3.scaleLinear().range([self.heightContext,0]);
	self.xPatterns = d3.scaleTime().range([0, self.width]);
	self.yPatterns = d3.scaleLinear().range([self.heightPatterns,0]);
	self.xAxisFocus = d3.axisBottom(self.xFocus);
	self.xAxisContext = d3.axisBottom(self.xContext);
	self.yAxisFocus = d3.axisLeft(self.yFocus).tickSizeInner(-self.width);
	self.xAxisPatterns = d3.axisBottom(self.xPatterns);
	// The brush component of the context part
	self.brush = d3.brushX()
		.extent([[0, 0], [self.width, self.heightContext]])
		.on("brush end", self.brushed);
	// The zoomable rectangle on the focus part
	self.zoom = d3.zoom()
		.scaleExtent([1, Infinity])
		.translateExtent([[0, 0], [self.width, self.heightFocus]])
		.extent([[0, 0], [self.width, self.heightFocus]])
		.on("zoom", self.zoomed);
	
	// Adding the axis to the svg area
	// focus part of the timeline
	self.focus = self.svg.append("g")
	    .attr("class", "focus")
	    .attr("transform", "translate("+self.marginFocus.left+","+self.marginFocus.top+")");
	// Creating the context part of the timeline
	self.context = self.svg.append("g")
	    .attr("class", "context")
	    .attr("transform", "translate("+self.marginContext.left+","+self.marginContext.top+")");
	// Creating the pattern part for the timeline
	self.patterns = self.svg.append("g")
	    .attr("class", "patterns")
	    .attr("transform", "translate("+self.marginPatterns.left+","+self.marginPatterns.top+")");
	// Creating the xAxis and yAxis for the focus part of the timeline
	self.focus.append("g")
		.attr("class","axis axis--x")
		.attr("transform", "translate(0," + self.heightFocus + ")")
		.call(self.xAxisFocus);
	self.focus.append("g")
		.attr("class", "axis axis--y")
		.call(self.yAxisFocus)
		.selectAll(".tick line").attr("stroke","lightblue").attr("stroke-width","0.5");
	// Creating the xAxis for the context part of the timeline
	self.context.append("g")
		.attr("class","axis axis--x")
		.attr("transform", "translate(0," + self.heightContext + ")")
		.call(self.xAxisContext);
	// Creating the xAxis for the pattern part of the timeline
	self.patterns.append("g")
		.attr("class","axis axis--x")
		.attr("transform", "translate(0," + self.heightPatterns + ")")
		.call(self.xAxisPatterns);
	// Adding the brush to the context part
	self.context.append("g")
		.attr("class", "brush")
		.call(self.brush)
		.call(self.brush.move, self.xFocus.range());
	
	self.tooltipCreated = false;
	// Creating the zoomable rectangle on the focus part of the timeline
	self.zoomRect = self.svg.append("rect")
		.attr("class", "zoom")
		.attr("width", self.width)
		.attr("height", self.heightFocus)
		.attr("transform", "translate(" + self.marginFocus.left + "," + self.marginFocus.top + ")")
		.call(self.zoom)
		.on("mousemove", function(){	// Handling picking
			var coords = d3.mouse(this);
			var pixelColor = self.hiddenCanvasContext.getImageData(coords[0], coords[1],1,1).data;
			if (pixelColor[0] != 255 && pixelColor[1] != 255 && pixelColor[2] != 255) {
				var colorString = "rgb("+pixelColor[0]+","+pixelColor[1]+","+pixelColor[2]+")";
				var data = self.colorToData[colorString];
				/*console.log("coords: "+coords);
				console.log("colorString: "+colorString);
				console.log(data);*/
				if (typeof data !== 'undefined') {
					self.displayToolTip(data);
					/*var message = "Year "+data[0]+"<br>"+"("+data[1]+" to "+data[2]+")"+"<br>"+data[3]+" events";
					tooltip.show(message,600);*/
				}
				self.tooltipCreated = true;
			} else {
				if (self.tooltipCreated == true)
					tooltip.hide();
			}
		})
		.on("mouseout", function(){
			if (self.tooltipCreated == true)
				tooltip.hide();
		});
	
	self.context.select(".brush").select(".selection")
		.attr("fill","white")
		.attr("stroke","black")
		.attr("stroke-width","1")
		.attr("fill-opacity","0.2");
	
	/****************************/
	/*			Methods			*/
	/****************************/
	
	self.updateContextBounds = function(start, end) {
		// Extract information from the date, for the Agavue date format
		// 	This format is "Sun Mar 31 01:32:10 CET 2013"
		var startDate = start.split(" ");
		var endDate = end.split(" ");
		var startString = startDate[0]+" "
			+startDate[1]+" "
			+startDate[2]+" "
			+startDate[3]+" "
			+startDate[5];
		var endString = endDate[0]+" "
			+endDate[1]+" "
			+endDate[2]+" "
			+endDate[3]+" "
			+endDate[5];
		var timeFormat = d3.timeParse('%a %b %d %H:%M:%S %Y'); // See if the timeline's timeParse can be used instead ?
		var startTime = d3.timeSecond.offset(timeFormat(startString),-1);
		var endTime = d3.timeSecond.offset(timeFormat(endString),1);
		self.xFocus = d3.scaleTime()
			.domain([startTime,endTime])
			.range([0,self.width]);
		self.xContext = d3.scaleTime()
		.domain([startTime,endTime])
			.range([0,self.width]);
		self.xPatterns = d3.scaleTime()
		.domain([startTime,endTime])
			.range([0,self.width]);
			
		self.xAxisFocus = d3.axisBottom(self.xFocus);
		self.xAxisContext = d3.axisBottom(self.xContext);
		self.xAxisPatterns = d3.axisBottom(self.xPatterns);

		self.focus.select(".axis--x").call(self.xAxisFocus);
		self.context.select(".axis--x").call(self.xAxisContext);
		self.patterns.select(".axis--x").call(self.xAxisPatterns);
	};
	
	self.addDataset = function(data) {
		
		self.displayData();
		/*
		for (var user in data) {
			if (data.hasOwnProperty(user)) {
				self.displayData();
				//self.addToDataBinding(data[user]);
			}
		}*/
	};
	
	self.addToDataBinding = function(data) {
		//var csvData = data.map(self.prepareEvent);
		
		var customClass = "custom."+data.user;
		
		var dataBinding = self.dataContainer.selectAll(customClass)
			.data(data, function(d) {return d.data.split(";");})
			.enter()
			.append("custom")
			.classed(function(d) {return data.user;}, true)
			.classed("rect",true)
			.attr("x", function(d) {
				var timeFormat = d3.timeParse('%Y-%m-%d %H:%M:%S');
				return self.xFocus(timeFormat(d[1]));
				})
			.attr("y", function(d) {
				if(!self.typeHeight.hasOwnProperty(d[1]))
					self.typeHeight[d[1]] = 0.01;
				else
					self.typeHeight[d[1]] = self.typeHeight[d[1]]+0.01;
				return self.yFocus(self.typeHeight[d[1]])})
			.attr("size", 5)
			.attr("fillStyle","green");
		
		self.userData = self.userData + 1;
		//console.log("Custom object built : "+new Date());
		if (self.userData == 31575)
			self.displayData();
		else if (self.userData % 10000 == 0)
			console.log(self.userData);
	};
	
	self.addData = function(data) {
		//console.log("data received");
		var csvData = data.map(self.prepareEvent);
		//console.log("data mapped");

		//console.log(csvData);
		
		// Adjust the focus part of the timeline to the new data
		//self.xFocus.domain(d3.extent(csvData, function(d) { return d.time; }));
		//self.yFocus.domain([0.0, 20.0]);
		
		var customClass = "custom."+csvData.user;
		
		//var dataBinding = self.dataContainer.selectAll("custom.rect")
		var dataBinding = self.dataContainer.selectAll(customClass)
			.data(csvData/*, function(d) {return d;}*/);
		/*console.log(dataBinding);*/
		dataBinding.enter()
			.append("custom")
			//.classed("rect", true)
			.classed(function(d) {return d.user;}, true)
			.classed("rect",true)
			.attr("x", function(d) {return self.xFocus(d.time)})
			.attr("y", function(d) {return self.yFocus(d.height)})
			.attr("size", 5)
			.attr("fillStyle","green");
		
		dataBinding.exit()
			.attr("size",5)
			.attr("fillStyle","red");
		//console.log("data bound");
		
		/*self.focus.selectAll(".dot").remove()
			.data(csvData)
			.enter().append("path")
			.attr("d",d3.symbol().type(function(d) {return itemShapes[d.type];d3.symbol().type(d.shape);d3.symbolStar;d3.symbol().type(d.shape);d3.symbolStar;d.shape;})
								.size(function(d) {return 50;}))
			.attr("transform",function(d) {return "translate("+self.xFocus(d.time)+","+self.yFocus(d.height)+")"})
			.attr("stroke", function(d) {return d3.hsl(d.color,100,50)})
			.attr("fill","none")
			.attr("class","dot");*/
		
		/*self.focus.append("path")			ALREADY COMMENTED OUT
	      .datum(csvData)
	      .attr("class", "area")
	      .attr("d", self.areaFocus);*/

		self.focus.select(".axis--x")/*
	      .attr("transform", "translate(0," + height + ")")*/
	      .call(self.xAxisFocus);

		self.focus.select(".axis--y")
	      .call(self.yAxisFocus)
			.selectAll(".tick line").attr("stroke","lightblue").attr("stroke-width","0.5");

		/*self.context.append("path")			ALREADY COMMENTED OUT
	      .datum(csvData)
	      .attr("class", "area")
	      .attr("d", self.areaContext);*/

		self.context.select(".axis--x");/*
	      .attr("transform", "translate(0," + this.heightContext + ")")
	      .call(this.xAxisContext);*/

		// Moving the brush on the data
		var dataExtent = d3.extent(csvData, function(d) { return d.time; });
		self.context.select(".brush")
	      .call(self.brush)
	      //.call(self.brush.move, [self.xFocus(dataExtent[0]), self.xFocus(dataExtent[1])]);
	      .call(self.brush.move, self.xFocus.range());

		// Focusing on the data
		/*self.svg.select(".zoom")/*
	      .attr("width", this.width)
	      .attr("height", this.heightFocus)
	      .attr("transform", "translate(" + self.marginFocus.left + "," + self.marginFocus.top + ")")
	      .call(self.zoom);*/
	/*self.svg.append("rect")
		.attr("class", "zoom")
		.attr("width", self.width)
		.attr("height", self.heightFocus)
		.attr("transform", "translate(" + self.marginFocus.left + "," + self.marginFocus.top + ")")
		.call(self.zoom);*/
		//self.drawCanvas();
		self.userData = self.userData + 1;
		//console.log("Custom object built : "+new Date());
		if (self.userData == 31575)
			self.displayData();
		else if (self.userData % 10000 == 0)
			console.log(self.userData);
		//self.drawCanvas();
	};
	
	self.addDataToSVG = function(data) {
		var csvData = data.map(self.prepareEvent);
		//console.log(csvData);
		
		// Adjust the focus part of the timeline to the new data
		/*self.xFocus.domain(d3.extent(csvData, function(d) { return d.time; }));
		self.yFocus.domain([0.0, 20.0]);*/

		self.focus.selectAll(".dot").remove()
			.data(csvData)
			.enter().append("path")
			.attr("d",d3.symbol().type(function(d) {return itemShapes[d.type];d3.symbol().type(d.shape);d3.symbolStar;d3.symbol().type(d.shape);d3.symbolStar;d.shape;})
								.size(function(d) {return 50;}))
			.attr("transform",function(d) {return "translate("+self.xFocus(d.time)+","+self.yFocus(d.height)+")"})
			.attr("stroke", function(d) {return d3.hsl(d.color,100,50)})
			.attr("fill","none")
			.attr("class","dot");
		
		/*self.focus.append("path")
	      .datum(csvData)
	      .attr("class", "area")
	      .attr("d", self.areaFocus);*/

		self.focus.select(".axis--x")/*
	      .attr("transform", "translate(0," + height + ")")*/
	      .call(this.xAxisFocus);

		self.focus.select(".axis--y")
	      .call(self.yAxisFocus)
			.selectAll(".tick line").attr("stroke","lightblue").attr("stroke-width","0.5");

		/*self.context.append("path")
	      .datum(csvData)
	      .attr("class", "area")
	      .attr("d", self.areaContext);*/

		self.context.select(".axis--x");/*
	      .attr("transform", "translate(0," + this.heightContext + ")")
	      .call(this.xAxisContext);*/

		// Moving the brush on the data
		var dataExtent = d3.extent(csvData, function(d) { return d.time; });
		self.context.select(".brush")
	      .call(self.brush)
	      //.call(self.brush.move, [self.xFocus(dataExtent[0]), self.xFocus(dataExtent[1])]);
	      .call(self.brush.move, self.xFocus.range());

		// Focusing on the data
		/*self.svg.select(".zoom")/*
	      .attr("width", this.width)
	      .attr("height", this.heightFocus)
	      .attr("transform", "translate(" + self.marginFocus.left + "," + self.marginFocus.top + ")")
	      .call(self.zoom);*/
	/*self.svg.append("rect")
		.attr("class", "zoom")
		.attr("width", self.width)
		.attr("height", self.heightFocus)
		.attr("transform", "translate(" + self.marginFocus.left + "," + self.marginFocus.top + ")")
		.call(self.zoom);*/
		//self.drawCanvas();
	};

	// Prepare data that arrives as a list of pairs [eventType,time]
	// to be displayed
	self.prepareEvent = function(e) {
		var splitted = e.data.split(";");
		if(!self.typeHeight.hasOwnProperty(splitted[1]))
  			self.typeHeight[splitted[1]] = 0.01;
		else
			self.typeHeight[splitted[1]] = self.typeHeight[splitted[1]]+0.01;
		var shapeHeight = self.typeHeight[splitted[1]];
  		var timeFormat = d3.timeParse('%Y-%m-%d %H:%M:%S');
  		//console.log("prep:\n"+"time: "+splitted[1]+"\nparsed: "+timeFormat(splitted[1]));
		return {"type":splitted[0],
				"time":timeFormat(splitted[1]),
				"height": shapeHeight,
				"color":parseFloat(splitted[2]),
				"shape":e.shape,
				"user":e.user};
	};
		
	self.displayDistributions = function() {
		console.log("Display distributions");
		self.drawCanvas();	// Replace with a drawing function handling distributions
		// Code for a transition
		/*var t = svg.transition().duration(750),
			g = t.selectAll(".group").attr("transform", function(d) { return "translate(0," + y0(d.key) + ")"; });
		g.selectAll("rect").attr("y", function(d) { return y1(d.value); });
		g.select(".group-label").attr("y", function(d) { return y1(d.values[0].value / 2); })*/
	};
	
	self.displayEvents = function() {
		console.log("Display events");
		self.drawCanvas();	// Replace with a drawing function handling events
		// Code for a transition
		/*var t = svg.transition().duration(750),
			g = t.selectAll(".group").attr("transform", "translate(0," + y0(y0.domain()[0]) + ")");
		g.selectAll("rect").attr("y", function(d) { return y1(d.value + d.valueOffset); });
		g.select(".group-label").attr("y", function(d) { return y1(d.values[0].value / 2 + d.values[0].valueOffset); })*/
	};
	
	self.drawCanvas = function() {
		console.log("Drawing canvas");
		self.canvasContext.fillStyle = "#fff";
		self.canvasContext.rect(0,0,self.canvas.attr("width"),self.canvas.attr("height"));
		self.canvasContext.fill();
		
		for (var user in userTraces) {
			if (userTraces.hasOwnProperty(user)) {
				for (var id=0; id < userTraces[user].length; id++) {
					self.canvasContext.beginPath();
				    self.canvasContext.fillStyle = "green";//node.attr("fillStyle");
				    var splitEvent = userTraces[user][id].data.split(";");
				    var x = self.xFocus(d3.timeParse('%Y-%m-%d %H:%M:%S')(splitEvent[1]));
				    if(!self.typeHeight.hasOwnProperty(splitEvent[1]))
						self.typeHeight[splitEvent[1]] = 0.01;
					else
						self.typeHeight[splitEvent[1]] = self.typeHeight[splitEvent[1]]+0.01;
				    var y = self.yFocus(self.typeHeight[splitEvent[1]]);
				    var size = 5;
				    self.canvasContext.fillRect(x, y, size, size);
				    //console.log("x: "+node.attr("x")+" ;y :"+node.attr("y")+" ;size :"+node.attr("size"));
				    //self.canvasContext.fill();
				    self.canvasContext.closePath();
				}
			}
		}
		
		console.log("data drawn");
	};
	
	self.drawCanvasOld = function() {
		console.log("Drawing canvas");
		self.canvasContext.fillStyle = "#fff";
		self.canvasContext.rect(0,0,self.canvas.attr("width"),self.canvas.attr("height"));
		self.canvasContext.fill();
		
		var elts = self.dataContainer.selectAll("custom.rect");
		elts.each(function(d) {
		    var node = d3.select(this);
		    self.canvasContext.beginPath();
		    self.canvasContext.fillStyle = node.attr("fillStyle");
		    //self.canvasContext.fillRect(0,0,50,50);
		    self.canvasContext.fillRect(node.attr("x"), node.attr("y"), node.attr("size"), node.attr("size"));
		    //console.log("x: "+node.attr("x")+" ;y :"+node.attr("y")+" ;size :"+node.attr("size"));
		    //self.canvasContext.fill();
		    self.canvasContext.closePath();
		});
		
		/*var elts = self.focus.selectAll(".dot");
		elts.each(function(d) {
			var node = d3.select(this);
			console.log("drawing node");
			self.canvasContext.beginPath();
			self.canvasContext.fillStyle = node.attr("fillStyle");
			self.canvasContext.strokeStyle = node.attr("strokeStyle");
			self.canvasContext.rect(node.attr("x"), node.attr("y"),node.attr("size"),node.attr("size"));
			self.canvasContext.fill();
			self.canvasContext.stroke();
			self.canvasContext.closePath();
		});*/
		console.log("data drawn");
	};
	
	self.drawEvents = function() {
		switch(self.eventDisplayStyle) {
		case "type":
			self.drawEventsByType();
			break;
		case "time":
			self.drawEventsByTime();
			break;
		case "user":
			self.drawEventsByUser();
			break;
		default:
			
		}
	}
		
	self.drawEventsByType = function() {
		console.log("drawing events");
		
		/*var maxBin = 0.0;//1999999.0;
		for (var iBin=0; iBin < bins.length; iBin++) {
			if (parseInt(bins[iBin][3]) > maxBin)
				maxBin = parseFloat(bins[iBin][3]);
		}*/
		
		/*self.yFocus.domain([0.0, datasetInfo["numberOfDifferentEvents"]+2]);
		self.focus.select(".axis--y")
	      	.call(self.yAxisFocus);*/
		var displayStep = (self.yFocus.domain()[1] - self.yFocus.domain()[0] - 2) / datasetInfo["numberOfDifferentEvents"];

		self.canvasContext.fillStyle = "#fff";
		self.canvasContext.rect(0,0,self.canvas.attr("width"),self.canvas.attr("height"));
		self.canvasContext.fill();
		var drawCount = 0;
		
		self.hiddenCanvasContext.fillStyle = "#fff";
		self.hiddenCanvasContext.fillRect(0,0,self.hiddenCanvas.attr("width"),self.hiddenCanvas.attr("height"));
		
		self.colorToData = {};
		let nextColor = 1;
		
		// get the last accessor point before the time-span start
		var firstIndex = getEventAccessorAtDate(self.xFocus.domain()[0]);
		console.log("Retreived first index is "+firstIndex);
		// find the real first index
		var startFound = false;
		var startingIndex = firstIndex;
		while (!startFound) {
			var info = timeOrderedEvents[firstIndex+1][0].split(";");
			var time = d3.timeParse('%Y-%m-%d %H:%M:%S')(info[1]);
			if (time < self.xFocus.domain()[0])
				firstIndex++;
			else
				startFound = true;
		}
		console.log("drawing from event "+firstIndex);
		var endReached = false;
		while (!endReached) {
			var info = timeOrderedEvents[firstIndex][0].split(";");
			var time = d3.timeParse('%Y-%m-%d %H:%M:%S')(info[1]);
			if (time > self.xFocus.domain()[1])
				endReached = true;
			else {
				drawCount++;
				
				// Attributing a color to data link
			    var color = [];
			    // via http://stackoverflow.com/a/15804183
			    if(nextColor < 16777215){
			    	color.push(nextColor & 0xff); // R
			    	color.push((nextColor & 0xff00) >> 8); // G 
			    	color.push((nextColor & 0xff0000) >> 16); // B

			    	nextColor += 1;
			    }
			    self.colorToData["rgb("+color.join(',')+")"] = timeOrderedEvents[firstIndex][0];
				
				var x = self.xFocus(d3.timeParse('%Y-%m-%d %H:%M:%S')(info[1]));				
				var y = self.yFocus(eventDisplayHeight[info[0]]*displayStep);
				
				var symbolGenerator = d3.symbol().type(itemShapes[info[0]])
										.size(50)
										//.attr("transform","translate("+x+","+y+")")
										.context(self.canvasContext);
/*.attr("transform",function(d) {return "translate("+self.xFocus(d.time)+","+self.yFocus(d.height)+")"})
.attr("stroke", function(d) {return d3.hsl(d.color,100,50)})*/
				var hiddenSymbolGenerator = d3.symbol().type(itemShapes[info[0]])
										.size(50)
										//.attr("transform","translate("+x+","+y+")")
										.context(self.hiddenCanvasContext);
				
				//self.canvasContext.rect(x-2.5,y-2.5,5,5);
				self.canvasContext.beginPath();
				self.canvasContext.translate(x,y);
				self.canvasContext.strokeStyle = "hsl("+colorList[info[0]]+",100%,50%)";//d3.hsl(parseInt(colorList[info[0]]),100,50).rgb();//"green";
				symbolGenerator();
				self.canvasContext.stroke();
				self.canvasContext.translate(-x,-y);
			    self.canvasContext.closePath();
			    
			    self.hiddenCanvasContext.beginPath();
				self.hiddenCanvasContext.translate(x,y);
				self.hiddenCanvasContext.fillStyle = "rgb("+color.join(',')+")";//d3.hsl(parseInt(colorList[info[0]]),100,50).rgb();//"green";
				hiddenSymbolGenerator();
				self.hiddenCanvasContext.fill();
				self.hiddenCanvasContext.translate(-x,-y);
			    self.hiddenCanvasContext.closePath();
			    
			    firstIndex++;
			}
		}
		console.log("to event "+firstIndex);
		/*for (var i=firstIndex; i <= lastIndex; i++) {
			var info = timeOrderedEvents[i][0].split(";");
			
			var time = d3.timeParse('%Y-%m-%d %H:%M:%S')(info[1]);
			drawCount++;
			var x = self.xFocus(d3.timeParse('%Y-%m-%d %H:%M:%S')(info[1]));				
			var y = self.yFocus(yPoint);
			self.canvasContext.beginPath();
			self.canvasContext.rect(x,y,10,10);
			self.canvasContext.fillStyle = d3.hsl(parseInt(colorList[info[0]]),100,50);//"green";
			self.canvasContext.fill();
		    self.canvasContext.closePath();
		}*/
		
		/*for (var i=0; i<userList.length; i++) {
			for (var j=0;j<userTraces[userList[i]].length;j++) {
				var info = userTraces[userList[i]][j][0].split(";");
				
				var time = d3.timeParse('%Y-%m-%d %H:%M:%S')(info[1]);
				if (time <= self.xFocus.domain()[1] && time >= self.xFocus.domain()[0]) {
					drawCount++;
					var x = self.xFocus(d3.timeParse('%Y-%m-%d %H:%M:%S')(info[1]));				
					var y = self.yFocus(yPoint);
					self.canvasContext.beginPath();
					self.canvasContext.rect(x,y,10,10);
					self.canvasContext.fillStyle = d3.hsl(parseInt(colorList[info[0]]),100,50);//"green";
					self.canvasContext.fill();
				    self.canvasContext.closePath();
				}
			}
		}*/
		var nbEventsChecked = firstIndex-startingIndex;
		console.log(drawCount+" events drawn, "+nbEventsChecked+" events checked");
		/*
		for (var iBin=0; iBin < bins.length; iBin++) {
			self.canvasContext.beginPath();
		    var x = self.xFocus(d3.timeParse('%Y-%m-%d %H:%M:%S')(bins[iBin][1]));
		    var x2 = self.xFocus(d3.timeParse('%Y-%m-%d %H:%M:%S')(bins[iBin][2]));
		    var y = self.yFocus(maxBin-parseInt(bins[iBin][3]));
		    var binHeight = self.yFocus(parseInt(bins[iBin][3]));
		    self.canvasContext.rect(x, binHeight, x2-x, y);
		    self.canvasContext.fillStyle = "lightblue";//node.attr("fillStyle");
		    self.canvasContext.fill();
		    self.canvasContext.lineWidth = 0.25;
		    self.canvasContext.strokeStyle = "black";
		    self.canvasContext.stroke();
		  //  self.canvasContext.fillRect(x, binHeight, x2-x, y);
		    self.canvasContext.closePath();
		    
		    // Drawing the text
		    /*self.canvasContext.fillStyle = "black";
		    self.canvasContext.textAlign = "center";
		    self.canvasContext.textBaseline = "middle";
		    self.canvasContext.fillText(
		    		bins[iBin][3],				// text
		    		x+(x2-x)/2,						// x
		    		binHeight+y/2);*/		// y
		//}
		
		/*self.canvasOverviewContext.fillStyle = "#fff";
		self.canvasOverviewContext.rect(0,0,self.canvasOverview.attr("width"),self.canvasOverview.attr("height"));
		self.canvasOverviewContext.fill();

		self.yContext.domain([0.0, maxBin+1.0]);
		
		var area = d3.area()
		    .x(function(d) { return d[0]; })
		    .y0(self.heightContext)
		    .y1(function(d) { return d[1]; })
		    .context(self.canvasOverviewContext);
		
		var data = [];
		
		for (var iBin=0; iBin < bins.length; iBin++) {			
			var thisData = [];
			
			thisData.push(self.xContext(d3.timeParse('%Y-%m-%d %H:%M:%S')(bins[iBin][1])));
			thisData.push(self.yContext(parseInt(bins[iBin][3])));
			data.push(thisData);
			
			thisData = [];
			thisData.push(self.xContext(d3.timeParse('%Y-%m-%d %H:%M:%S')(bins[iBin][2])));
			thisData.push(self.yContext(parseInt(bins[iBin][3])));
			data.push(thisData);
		}
		
		self.canvasOverviewContext.beginPath();
		area(data);
		self.canvasOverviewContext.fillStyle = "lightblue";
		self.canvasOverviewContext.strokeStyle = "lightblue";
		self.canvasOverviewContext.fill();*/
		
		console.log("events drawn");
	}
	
	self.drawEventsByTime = function() {
		console.log("drawing events");
		
		// get the last accessor point before the time-span start
		var firstIndex = getEventAccessorAtDate(self.xFocus.domain()[0]);
		console.log("Retreived first index is "+firstIndex);
		// find the real first index
		var startFound = false;
		var startingIndex = firstIndex;
		while (!startFound) {
			var info = timeOrderedEvents[firstIndex+1][0].split(";");
			var time = d3.timeParse('%Y-%m-%d %H:%M:%S')(info[1]);
			if (time < self.xFocus.domain()[0])
				firstIndex++;
			else
				startFound = true;
		}
		console.log("drawing from event "+firstIndex);
		// get the last accessor point for the end of the time-span
		var lastIndex = getEventAccessorAtDate(self.xFocus.domain()[1]);

		/*self.yFocus.domain([0.0, lastIndex-firstIndex+2]);
		self.focus.select(".axis--y")
	      	.call(self.yAxisFocus);*/

		self.canvasContext.fillStyle = "#fff";
		self.canvasContext.rect(0,0,self.canvas.attr("width"),self.canvas.attr("height"));
		self.canvasContext.fill();
		var drawCount = 0;
		
		self.hiddenCanvasContext.fillStyle = "#fff";
		self.hiddenCanvasContext.fillRect(0,0,self.hiddenCanvas.attr("width"),self.hiddenCanvas.attr("height"));
		
		self.colorToData = {};
		let nextColor = 1;
		
		var endReached = false;
		var previousTime = undefined;
		var previousType = "";
		var currentHeight = 600;
		while (!endReached) {
			var info = timeOrderedEvents[firstIndex][0].split(";");
			var time = d3.timeParse('%Y-%m-%d %H:%M:%S')(info[1]);
			var type = info[0];
			if (!(typeof(previousTime) === "undefined")) {
				if (time.valueOf() == previousTime.valueOf()) {
					if (type == previousType) {	// Jittering
						currentHeight = currentHeight + 100;
						//console.log("Jitter");
					} else {	// Increment
						currentHeight = currentHeight + 600;
						//console.log("    Increment");
					}
				} else {
					currentHeight = 600;
					//console.log("                Reset")
				}
			}
			previousTime = time;
			previousType = type;
			if (time > self.xFocus.domain()[1])
				endReached = true;
			else {
				drawCount++;
				
				// Attributing a color to data link
			    var color = [];
			    // via http://stackoverflow.com/a/15804183
			    if(nextColor < 16777215){
			    	color.push(nextColor & 0xff); // R
			    	color.push((nextColor & 0xff00) >> 8); // G 
			    	color.push((nextColor & 0xff0000) >> 16); // B

			    	nextColor += 1;
			    }
			    self.colorToData["rgb("+color.join(',')+")"] = timeOrderedEvents[firstIndex][0];
				
				var x = self.xFocus(d3.timeParse('%Y-%m-%d %H:%M:%S')(info[1]));				
				var y = self.yFocus(currentHeight);
				
				var symbolGenerator = d3.symbol().type(itemShapes[info[0]])
										.size(50)
										.context(self.canvasContext);
				
				var hiddenSymbolGenerator = d3.symbol().type(itemShapes[info[0]])
										.size(50)
										.context(self.hiddenCanvasContext);
				
				self.canvasContext.beginPath();
				self.canvasContext.translate(x,y);
				self.canvasContext.strokeStyle = "hsl("+colorList[info[0]]+",100%,50%)";//d3.hsl(parseInt(colorList[info[0]]),100,50).rgb();//"green";
				symbolGenerator();
				self.canvasContext.stroke();
				self.canvasContext.translate(-x,-y);
			    self.canvasContext.closePath();
			    
			    self.hiddenCanvasContext.beginPath();
				self.hiddenCanvasContext.translate(x,y);
				self.hiddenCanvasContext.fillStyle = "rgb("+color.join(',')+")";//d3.hsl(parseInt(colorList[info[0]]),100,50).rgb();//"green";
				hiddenSymbolGenerator();
				self.hiddenCanvasContext.fill();
				self.hiddenCanvasContext.translate(-x,-y);
			    self.hiddenCanvasContext.closePath();
			    
			    firstIndex++;
			}
		}
		console.log("to event "+firstIndex);
		
		var nbEventsChecked = firstIndex-startingIndex;
		console.log(drawCount+" events drawn, "+nbEventsChecked+" events checked");
		
		console.log("events drawn");
	}
	
	self.drawEventsByUser= function() {
		console.log("drawing events");
		
		self.yFocus.domain([0.0, datasetInfo["numberOfDifferentEvents"]+2]);
		self.focus.select(".axis--y")
	      	.call(self.yAxisFocus);

		self.canvasContext.fillStyle = "#fff";
		self.canvasContext.rect(0,0,self.canvas.attr("width"),self.canvas.attr("height"));
		self.canvasContext.fill();
		var drawCount = 0;
		
		self.hiddenCanvasContext.fillStyle = "#fff";
		self.hiddenCanvasContext.fillRect(0,0,self.hiddenCanvas.attr("width"),self.hiddenCanvas.attr("height"));
		
		self.colorToData = {};
		let nextColor = 1;
		
		// get the last accessor point before the time-span start
		var firstIndex = getEventAccessorAtDate(self.xFocus.domain()[0]);
		console.log("Retreived first index is "+firstIndex);
		// find the real first index
		var startFound = false;
		var startingIndex = firstIndex;
		while (!startFound) {
			var info = timeOrderedEvents[firstIndex+1][0].split(";");
			var time = d3.timeParse('%Y-%m-%d %H:%M:%S')(info[1]);
			if (time < self.xFocus.domain()[0])
				firstIndex++;
			else
				startFound = true;
		}
		console.log("drawing from event "+firstIndex);
		var endReached = false;
		while (!endReached) {
			var info = timeOrderedEvents[firstIndex][0].split(";");
			var time = d3.timeParse('%Y-%m-%d %H:%M:%S')(info[1]);
			if (time > self.xFocus.domain()[1])
				endReached = true;
			else {
				drawCount++;
				
				// Attributing a color to data link
			    var color = [];
			    // via http://stackoverflow.com/a/15804183
			    if(nextColor < 16777215){
			    	color.push(nextColor & 0xff); // R
			    	color.push((nextColor & 0xff00) >> 8); // G 
			    	color.push((nextColor & 0xff0000) >> 16); // B

			    	nextColor += 1;
			    }
			    self.colorToData["rgb("+color.join(',')+")"] = timeOrderedEvents[firstIndex][0];
				
				var x = self.xFocus(d3.timeParse('%Y-%m-%d %H:%M:%S')(info[1]));				
				var y = self.yFocus(eventDisplayHeight[info[0]]);
				
				var symbolGenerator = d3.symbol().type(itemShapes[info[0]])
										.size(50)
										.context(self.canvasContext);
				
				var hiddenSymbolGenerator = d3.symbol().type(itemShapes[info[0]])
										.size(50)
										.context(self.hiddenCanvasContext);
				
				self.canvasContext.beginPath();
				self.canvasContext.translate(x,y);
				self.canvasContext.strokeStyle = d3.hsl(parseInt(colorList[info[0]]),100,50).rgb();//"green";
				symbolGenerator();
				self.canvasContext.stroke();
				self.canvasContext.translate(-x,-y);
			    self.canvasContext.closePath();
			    
			    self.hiddenCanvasContext.beginPath();
				self.hiddenCanvasContext.translate(x,y);
				self.hiddenCanvasContext.fillStyle = "rgb("+color.join(',')+")";//d3.hsl(parseInt(colorList[info[0]]),100,50).rgb();//"green";
				hiddenSymbolGenerator();
				self.hiddenCanvasContext.fill();
				self.hiddenCanvasContext.translate(-x,-y);
			    self.hiddenCanvasContext.closePath();
			    
			    firstIndex++;
			}
		}
		console.log("to event "+firstIndex);
		
		var nbEventsChecked = firstIndex-startingIndex;
		console.log(drawCount+" events drawn, "+nbEventsChecked+" events checked");
		
		console.log("events drawn");
	}
	
};