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
//var timelineItems = new vis.DataSet([]);

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
var shapes = d3.symbols;
var itemShapes = {};	// TODO request a list of shapes from the server to populate this list
var datasetInfo = {};
var availableColors = [];

var history = [];

var datasetInfoIsDefault = true;
var historyDisplayIsDefault = true;
var eventDisplayIsDefault = true;


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
	requestDatasetInfo("Agavue");	// TODO request the information on the dataset to the server
	requestEventTypes("Agavue");	// TODO provide info about the event types
	requestDataset("Agavue");	// TODO request the data to the server
	//timelineOverview();	// TODO Check if still necessary after the new timeline, if so comment it out
}

/**
 * Handling the reception of a message from the server
 */

function processMessage(message) {
	//console.log("Receive from server => " + message.data + "\n");
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
	
	resetDatasetInfo();	// Set the display of information on the dataset
	resetHistory();	// Reset the history display
	
	/*function getRootUri() {
		var h = document.location.hostname == "" ? "localhost" : document.location.hostname;
		var p = document.location.port == "" ? "8080" : document.location.port;
		console.log("ws://" + h + ":" +p);
		return "ws://" + h + ":" +p;
	}*/
	
	//websocket = new WebSocket(getRootUri() + "/ppmt/wsppmt");
	//webSocket = new WebSocket("ws://localhost:8080/ppmt/wsppmt");
	webSocket = new WebSocket("ws://localhost:8080/ppmt/wsppmt");
	//webSocket = new WebSocket("ws://ppmt.univ-nantes.fr/ProgressivePatternMiningTool/wsppmt");
	//webSocket = new WebSocket("ws://localhost:8080/ppmt/serverendpointppmt");

	webSocket.onopen = processOpen;
	webSocket.onmessage = processMessage;
	webSocket.onclose = processClose;
	webSocket.onerror = processError;
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

function addPatternToList(pattern) {
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
	for (var i = 0; i < nbUsers; i++) {
		// Add the user to the list
		var userRow = d3.select("#userTableBody").append("tr");
		var userInfo = message[i.toString()].split(";");
		// Renaming the user for a nicer display
		userRow.append("td")
			.text("User"+(i+1).toString()/*userInfo[0]*/)
			.attr("class","userColumn")
			.attr("sorttable_customkey",i+1);
		userRow.append("td").text(userInfo[1]);
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
		var startDateFormated = part1[1]+"/"+part1[2]+"/"+part1[0].substring(2,4)+" "+part2[0]+":"+part2[1]+":"+part2[2];
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
		var endDateFormated = part1[1]+"/"+part1[2]+"/"+part1[0].substring(2,4)+" "+part2[0]+":"+part2[1]+":"+part2[2];
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
		}
		if (Math.floor(timeDiff / days) > 0) {
			tmpValue = Math.floor(timeDiff / days);
			result += tmpValue+"d ";
			timeDiff = timeDiff - tmpValue*days;
		}
		if (Math.floor(timeDiff / hours) > 0) {
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
		result += tmpValue+"s";
		
		td.text(result);
		userRow.append("td").text(startDateFormated).attr("sorttable_customkey",startCustomKey);
		userRow.append("td").text(endDateFormated).attr("sorttable_customkey",endCustomKey);
		
		let userName = userInfo[0];
		userRow.on("click", function(){
			//console.log(userName);
			requestUserTrace(userName, "Agavue");
			d3.event.stopPropagation();
		});
	}
	// sorting by event per user
	var userTH = document.getElementById("eventsPerUserColumn");
	sorttable.innerSortFunction.apply(userTH, []);
}

var colorList = {};

function receiveEventTypes(message) {
	//var typeList = message.types.split(";");
	var nbEvents = parseInt(message.size);
	console.log("Receiving "+nbEvents+" event types");
	// Starting to generate the symbols and colors associated to the event types
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
				.attr("stroke", d3.hsl(parseFloat(eColor),100,50))
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

function selectColor(colorNum, colors){
    if (colors < 1) colors = 1; // defaults to one color - avoid divide by zero
    return colorNum * (360 / colors) % 360;
    //return "hsl(" + (colorNum * (360 / colors) % 360) + ",100%,50%)";
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