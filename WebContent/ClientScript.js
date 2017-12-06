console.log("start");

// live version
//var __websocketAdress__ = "ppmt.univ-nantes.fr/ppmt/wsppmt";
// local version
var __websocketAdress__ = "localhost:8080/ppmt/wsppmt";

window.addEventListener ? 
		window.addEventListener("load",init,false) : 
		window.attachEvent && window.attachEvent("onload",init);

var webSocket = null;
var timeline = null;
var timelineXAxis = null;
var timelineOverview = null;
var timelineOverviewXAxis = null;
var timelineIds = 0;

var defaultNbUserShown = 15;
var nbUserShown = defaultNbUserShown;

var currentDatasetName = "";

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
var colorPalet = [/*First color is brighter, to represent the unselected version */
	["#e41a1c","#fbb4ae"], 
	["#377eb8","#b3cde3"],
	["#4daf4a","#ccebc5"],
	["#984ea3","#decbe4"],
	["#ff7f00","#fed9a6"],
	["#a65628","#e5d8bd"],
	["#f781bf","#fddaec"],
	["#999999","#f2f2f2"],
	["#ffff33","#ffffcc"]];
var shapesDraw = extendedSymbolTypes[0];
var shapesAlpha = [
	"A",
	"B",
	"C",
	"D",
	"E",
	"F",
	"G",
	"H",
	"I",
	"J",
	"K",
	"L",
	"M",
	"N",
	"O",
	"P",
	"Q",
	"R",
	"S",
	"T",
	"U",
	"V",
	"W",
	"X",
	"Y",
	"Z"
	];
var shapesWriteWhite = [
	"□",
	"△",
	"▷",
	"▽",
	"◁",
	"◇",
	"○",
	"☆",
	"▱",
	"♡",
	"♤",
	"♧",
	"⇦",
	"⇧",
	"⇨",
	"⇩"];
var shapesWriteBlack = [
	"■",
	"▲",
	"▶",
	"▼",
	"◀",
	"♦",
	"●",
	"★",
	"▰",
	"♥",
	"♠",
	"♣",
	"←",
	"↑",
	"→",
	"↓"
];
var shapes = shapesWriteBlack;
var shapeNamesDraw = extendedSymbolTypes[1];
var shapeNamesAlpha = [
	"A",
	"B",
	"C",
	"D",
	"E",
	"F",
	"G",
	"H",
	"I",
	"J",
	"K",
	"L",
	"M",
	"N",
	"O",
	"P",
	"Q",
	"R",
	"S",
	"T",
	"U",
	"V",
	"W",
	"X",
	"Y",
	"Z"
	];
var shapeNamesWrite = [
	"square",
	"triangleUp",
	"triangelRight",
	"triangleDown",
	"triangelLeft",
	"diamond",
	"circle",
	"star",
	"rectangle",
	"heart",
	"spade",
	"clover",
	"arrowLeft",
	"arrowUp",
	"arrowRight",
	"arrowDown"];
var shapeNames = shapeNamesWrite;
var unselectedColorFading = 5;
var itemShapes = {};	// TODO request a list of shapes from the server to populate this list
var datasetInfo = {};
var availableColors = [];

var eventTypeCategories = [];
var eventTypesByCategory = {};
var eventTypeCategoryColors = {};

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

/**
 * 
 */
function handleKeyPress() {
	let kc = d3.event.key;
	console.log(kc)
	switch(kc) {
	case "f":
		if (tooltipHasContent) {
			tooltipIsFixed = !tooltipIsFixed;
			updateTooltipLockMessage();
		}
		break;
	default:
	}
}

/**
 * Activate or deactivate debug tools
 */
function debug() {
	timeline.showTarget();
	timeline.showPosition();
}


/************************************/
/*				Kept				*/
/************************************/

/**
 * Handling the connection to the server
 */
function processOpen(message) {
	console.log("Server connected." + "\n");
	
	//requestDatasetList();   automatically sent by the server upon connection
}

function selectDataset(datasetName) {
	// For test purpose
	/*var action = {
			action: "testFileReading"
	};
	webSocket.send(JSON.stringify(action));*/
	
	currentDatasetName = datasetName;
	
	requestDatasetLoad(datasetName);
	
	requestDatasetInfo(datasetName);	// TODO request the information on the dataset to the server
	requestEventTypes(datasetName);	// TODO provide info about the event types
	requestUserList(datasetName);
	//console.log("requesting the dataset "+datasetName);
	enableCentralOverlay("The dataset is loading...");
	requestDataset(datasetName);	// TODO request the data to the server
	
	switch(currentDatasetName) {
		case "Agavue":
		case "MiniAgavue":
			requestYearBins(datasetName);
			break;
		case "recsysSamplecategory":
			requestHalfDayBins(datasetName);
			break;
		case "coconotesPPMT":
			requestHalfMonthBins(datasetName);
			break;
		default:
			
	}
	
	/* For Agavue when it was hardcoded
	
	requestDatasetInfo("Agavue");	// TODO request the information on the dataset to the server
	requestEventTypes("Agavue");	// TODO provide info about the event types
	requestUserList("Agavue");
	console.log("requesting the dataset");
	enableCentralOverlay("The dataset is loading...");
	requestDataset("Agavue");	// TODO request the data to the server
	requestYearBins("Agavue");
	*/
	
}

function requestDatasetLoad(datasetName) {
	var action = {
			action: "load",
			object: "dataset",
			dataset: datasetName
	};
	webSocket.send(JSON.stringify(action));
}

function requestDatasetList() {
	var action = {
			action: "request",
			object: "datasetList"
	};
	webSocket.send(JSON.stringify(action));
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
/*
function requestUsersPatternOccurrences(userList) {
	var action = {
			action: "request",
			object: "occurrences",
			shape: "bin",
			scale: "halfDay",
			dataset: datasetName
	}
}*/

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
		//console.log("removing id "+msg.id);
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
		if (msg.type === "patternDistribPerUser")
			receivePatternDistributionPerUser(msg);
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
			drawPatternSizesChart();
			requestUserDistributionForPattern(msg);
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
		if (msg.type === "steeringStart")
			handleSteeringStartSignal(msg.steeringType, msg.value);
		if (msg.type === "steeringStop")
			handleSteeringStopSignal();
	}
	if (msg.action === "datasetList") {
		receiveDatasetList(msg);
	}
}

function handleSteeringStartSignal(type, value) {
	var displaySpan = d3.select("#focus")
		.text(type+" starting with: "+value);
}

function handleSteeringStopSignal() {
	var displaySpan = d3.select("#focus")
	.text("");
}

var userPatternDistrib = {};
// Duration of a session in ms
var sessionDuration = 3*60*60*1000;

/**
 * Updates the pattern counts in the users sessions
 * @param message
 * @returns
 */
function receivePatternDistributionPerUser(message) {
	//console.log("Receiving distrib message")
	let users = message.users.split(";");
	users.forEach(function(u) {
		let thisUserSessions = userSessions[u];
		let theseOccs = message[u].split(";");
		
		theseOccs.forEach(function(o) {
			let idx = 0;
			for (idx = 0; idx < thisUserSessions.length; idx++) {
				if (thisUserSessions[idx].start <= Number(o) && thisUserSessions[idx].end >= Number(o)) {
					if (thisUserSessions[idx].count.hasOwnProperty(message.patternId)) {
						thisUserSessions[idx].count[message.patternId] += 1;
					} else {
						thisUserSessions[idx].count[message.patternId] = 1;
					}
					break;
				}
			}
		});
		
	});
	
	timeline.drawUsersPatterns(); // TODO redraw only if visible changes (text displayed)
}

var sessionInactivityLimit = 30*60*1000; // 30 minutes
var userSessions = {};
/**
 * Builds the user sessions based on the given inactivity duration to end a session
 * A session has a start and an end (in milliseconds) and a pattern count
 * @returns
 */
function buildUserSessions() {
	for (var userIdx = 0; userIdx < userList.length; userIdx++) {
		let u = userList[userIdx];
		let lastEventDate = d3.timeParse('%Y-%m-%d %H:%M:%S')(userTraces[u][0][0].split(";")[1]).getTime();
		userSessions[u] = [{start: Number(lastEventDate), end: Number(lastEventDate), count: {}}];
		let idx = 1;
		
		for ( idx = 1; idx < userTraces[u].length; idx++) {
			let thisEventDate = d3.timeParse('%Y-%m-%d %H:%M:%S')(userTraces[u][idx][0].split(";")[1]).getTime();
			if (lastEventDate + sessionInactivityLimit > thisEventDate) { // keeping the current session
				userSessions[u][userSessions[u].length - 1].end = Number(thisEventDate);
			} else { // Create a new session
				userSessions[u].push({start: Number(thisEventDate), end: Number(thisEventDate), count: {}});
			}
			lastEventDate = thisEventDate;
		}
	}
}

function receiveDatasetList(message) {
	
	//console.log("Receiving dataset list of size "+message.size);
	
	var dsList = d3.select("#datasetList");
	var datasetNb = parseInt(message.size);
	
	for (datasetNb; datasetNb > 0;) {
		datasetNb--;
		let dsName = message[datasetNb.toString()];
		var item = dsList.append("li")
			.text(dsName)
			.classed("clickable", true);
		item.on("click",function() {
			startTool(dsName);
		});
		
		switch(dsName) {
		case "coconotesPPMT":
			item.style("order","1");
			break;
		case "recsysSamplecategory":
			item.style("order","2");
			break;
		default:
		}
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
	//console.log("Received "+count+" occurrences of pattern "+pId);
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
	d3.select("#tool")
		.style("display","none");
	
	//webSocket = new WebSocket("ws://localhost:8080/ppmt/wsppmt");
	webSocket = new WebSocket("ws://"+__websocketAdress__);

	webSocket.onopen = processOpen;
	webSocket.onmessage = processMessage;
	webSocket.onclose = processClose;
	webSocket.onerror = processError;
}

var showUserSessionOption = "all";
var firstUserShown = 0;

function showUserSessions(arg) {
	let eventsShown = true;
	switch (arg) {
	case "all":
		if (showUserSessionOption != "all") {
			d3.selectAll("#showUserSessionsSwitch button")
			.each(function(d, i) {
				let elt = d3.select(this);
				if (elt.attr("value") == "all") {
					elt.classed("selectedOption", true);
				} else {
					elt.classed("selectedOption", false);
				}
			});
			showUserSessionOption = "all";
			
			d3.select("#shownUserSessionsControl")
				.classed("hidden", true);
			d3.select("#showOnlyHighlightedInSessions")
				.classed("hidden", true);
		}
		break;
	case "selected":
		if (showUserSessionOption != "selected") {
			d3.selectAll("#showUserSessionsSwitch button")
			.each(function(d, i) {
				let elt = d3.select(this);
				if (elt.attr("value") == "selected") {
					elt.classed("selectedOption", true);
				} else {
					elt.classed("selectedOption", false);
				}
			});
			showUserSessionOption = "selected";
		}
		
		d3.select("#shownUserSessionsControl")
			.classed("hidden", true);
		eventsShown = d3.select("#drawIndividualEventsInput").property("checked");
		d3.select("#showOnlyHighlightedInSessions")
			.classed("hidden", !eventsShown);
		break;
	case "some":
		if (showUserSessionOption != "some") {
			d3.selectAll("#showUserSessionsSwitch button")
			.each(function(d, i) {
				let elt = d3.select(this);
				if (elt.attr("value") == "some") {
					elt.classed("selectedOption", true);
				} else {
					elt.classed("selectedOption", false);
				}
			});
			showUserSessionOption = "some";
		}
		
		d3.select("#shownUserSessionsControl")
			.classed("hidden", false);
		eventsShown = d3.select("#drawIndividualEventsInput").property("checked");
		d3.select("#showOnlyHighlightedInSessions")
			.classed("hidden", !eventsShown);
		break;
	default:
	}
	timeline.drawUsersPatterns();
}

function setupTool() {
	setupAlgorithmSearchField();
	setupUserSearchField();
	
	// Add event listeners to table headers so that they stay visible
	//document.getElementById("userTableArea").addEventListener("scroll",keepTableHeaderInSight);
	
	// Setup the input for the number of users to display
	d3.select("#showAllUserSessionsInput")
		.on("change", function() {
			d3.select("#shownUserSessionsControl")
				.classed("hidden", d3.select("#showAllUserSessionsInput").property("checked"));
		});
	
	d3.select("#nbUserShownInput")
		.attr("min", "0")
		.attr("value", firstUserShown)
		.on("input", function() {
			firstUserShown = Number(this.value);
			/*d3.select("#nbUserShownValue")
				.text(nbUserShown);*/
			timeline.drawUsersPatterns();
		});
	
	d3.select("#nbUserShownValue")
		.text(nbUserShown);
	
	createTimeline();	// TODO Initialize the timeline
	setupHelpers();
	
	setupAlgorithmSliders();
	setupPatternSizesChart();
	
	d3.select("body").on("keyup", handleKeyPress);
	
	resetDatasetInfo();	// Set the display of information on the dataset
	resetHistory();	// Reset the history display
}

let currentUserSearchInput = "";
let currentUserSearchSuggestionIdx = -1;
let relatedUsers = [];
let currentKeyDownUser = "";

function setupUserSearchField() {
	let searchField = d3.select("#Users").select("input.searchField");
	let suggestionField = d3.select("#Users").select("input.suggestionField");
	searchField.on("input", function() {
		let currentValue = searchField.property("value");
		currentUserSearchInput = currentValue;
		
		if(currentValue.length > 0) {
			relatedUsers = userList.filter(function(d, i) {
				return d.includes(currentValue);
			});
			relatedUsers.sort();
			
			if (relatedUsers.length > 0) {
				currentUserSearchSuggestionIdx = 0;
				suggestionField.property("value",relatedUsers[0]);
			} else {
				currentUserSearchSuggestionIdx = -1;
				suggestionField.property("value","");
			}
		} else {
			currentUserSearchInput = "";
			currentUserSearchSuggestionIdx = -1;
			relatedUsers = [];
			suggestionField.property("value","");
		}
		createUserListDisplay();
	});
	searchField.on("keydown", function() {
		let keyName = d3.event.key;
		// Don't trigger if the user keeps the key down
		if (currentKeyDownUser == keyName)
			return;
		currentKeyDownUser = keyName;
		switch(keyName) {
		case "ArrowRight":
			if (currentUserSearchSuggestionIdx >= 0) {
				currentUserSearchInput = relatedUsers[currentUserSearchSuggestionIdx];
				searchField.property("value",relatedUsers[currentUserSearchSuggestionIdx]);
				// Updates the suggestion list
				relatedUsers = userList.filter(function(d, i) {
					return d.includes(relatedUsers[currentUserSearchSuggestionIdx]);
				});
				relatedUsers.sort();

				if (relatedUsers.length > 0) {
					currentUserSearchSuggestionIdx = 0;
					suggestionField.property("value",relatedUsers[0]);
				} else {
					currentUserSearchSuggestionIdx = -1;
					suggestionField.property("value","");
				}
			}
			createUserListDisplay();
			break;
		case "ArrowUp":
			if (currentUserSearchSuggestionIdx > 0) {
				currentUserSearchSuggestionIdx--;
				suggestionField.property("value",relatedUsers[currentUserSearchSuggestionIdx]);
			}
			break;
		case "ArrowDown":
			if (currentUserSearchSuggestionIdx < relatedUsers.length - 1) {
				currentUserSearchSuggestionIdx++;
				suggestionField.property("value",relatedUsers[currentUserSearchSuggestionIdx]);
			}
			break;
		default:
		}
		currentKeyDownUser = "";
	});
}

let currentPatternSearchInput = ""; // The current value in the search field
let currentPatternSearchFragment = ""; // The current fragment of the value (what follows the last space)
let currentPatternSearchSuggestionIdx = -1;
let relatedEventTypes = [];
let currentKeyDown = "";

function setupAlgorithmSearchField() {
	let searchField = d3.select("#patternListArea").select("input.searchField");
	let suggestionField = d3.select("#patternListArea").select("input.suggestionField");
	searchField.on("input", function() {
		let currentValue = searchField.property("value");
		currentPatternSearchInput = currentValue;
		currentPatternSearchFragment = currentValue.split(" ").pop();
		
		if(currentPatternSearchFragment.length > 0) {
			let baseLength = currentPatternSearchInput.length - currentPatternSearchFragment.length;
			let baseValue = currentPatternSearchInput.substr(0, baseLength);
			relatedEventTypes = eventTypes.filter(function(d, i) {
				return d.includes(currentPatternSearchFragment);
			});
			relatedEventTypes.sort();
			
			if (relatedEventTypes.length > 0) {
				currentPatternSearchSuggestionIdx = 0;
				suggestionField.property("value", baseValue + relatedEventTypes[0]);
			} else {
				currentPatternSearchSuggestionIdx = -1;
				suggestionField.property("value","");
			}
		} else {
			currentPatternSearchInput = "";
			currentPatternSearchSuggestionIdx = -1;
			currentPatternSearchFragment = "";
			relatedEventTypes = [];
			suggestionField.property("value","");
		}

		createPatternListDisplay();
	});
	searchField.on("keydown", function() {
		let keyName = d3.event.key;
		// Don't trigger if the user keeps the key down
		if (currentKeyDown == keyName)
			return;
		currentKeyDown = keyName;
		switch(keyName) {
		case "ArrowRight":
			if (currentPatternSearchSuggestionIdx >= 0) {
				let baseLength = currentPatternSearchInput.length - currentPatternSearchFragment.length;
				let baseValue = currentPatternSearchInput.substr(0, baseLength);
				currentPatternSearchInput = baseValue + relatedEventTypes[currentPatternSearchSuggestionIdx];
				currentPatternSearchFragment = relatedEventTypes[currentPatternSearchSuggestionIdx];
				searchField.property("value", currentPatternSearchInput);
				// Updates the suggestion list
				relatedEventTypes = eventTypes.filter(function(d, i) {
					return d.includes(currentPatternSearchFragment);
				});
				relatedEventTypes.sort();

				if (relatedEventTypes.length > 0) {
					currentPatternSearchSuggestionIdx = 0;
					suggestionField.property("value",currentPatternSearchInput);
				} else {
					currentPatternSearchSuggestionIdx = -1;
					suggestionField.property("value","");
				}
				
				createPatternListDisplay();
			}
			break;
		case "ArrowUp":
			if (currentPatternSearchSuggestionIdx > 0) {
				let baseLength = currentPatternSearchInput.length - currentPatternSearchFragment.length;
				let baseValue = currentPatternSearchInput.substr(0, baseLength);
				currentPatternSearchSuggestionIdx--;
				suggestionField.property("value",baseValue + relatedEventTypes[currentPatternSearchSuggestionIdx]);
			}
			break;
		case "ArrowDown":
			if (currentPatternSearchSuggestionIdx < relatedEventTypes.length - 1) {
				let baseLength = currentPatternSearchInput.length - currentPatternSearchFragment.length;
				let baseValue = currentPatternSearchInput.substr(0, baseLength);
				currentPatternSearchSuggestionIdx++;
				suggestionField.property("value",baseValue + relatedEventTypes[currentPatternSearchSuggestionIdx]);
			}
			break;
		default:
		}
		currentKeyDown = "";
	});
}

var helperTooltipVisible = false;

function setupHelpers() {
	d3.select("#helpSupport")
		.attr("title", "Minimim number of occurrences to be considered frequent");
	/*d3.select("#helpGap")
		.attr("title", "Number of events in the pattern that don't belong to it");*/
	d3.select("#helpWindow")
		.attr("title", "The minimal support for a pattern to be frequent");
	d3.select("#helpSize")
		.attr("title", "Maximum number of event in a pattern");
}

function startTool(datasetName) {
	d3.select("#datasetSelection")
		.style("display","none");
	d3.select("#tool")
		.style("display","flex");
	
	setupTool();
	selectDataset(datasetName);
}

/**
 * 
 * @returns
 */
function enableCentralOverlay(message) {
	//console.log("Enable central overlay");
	var node = d3.select("#centerOverlay")
				.style("visibility","initial")
				.text(message);
}

/**
 * 
 * @returns
 */
function disableCentralOverlay() {
	//console.log("Disable central overlay");
	d3.select("#centerOverlay")
		.style("visibility","hidden");
}

function requestUserDistributionForPattern(message) {
	var action = {
			action: "request",
			object: "userDistributionForPattern",
			pattern: message.id,
			dataset: currentDatasetName
	};
	webSocket.send(JSON.stringify(action));
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
	//console.log("number of sequences : " + message.numberOfSequences);
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
	addToHistory('Dataset '+message.name+' loaded');

	// Update the max number of users to display their sessions
	d3.select("#nbUserShownInput")
		.attr("max", datasetInfo.numberOfSequences-nbUserShown)
		.attr("value", firstUserShown);
	timeline.drawUsersPatterns();
		
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
			//console.log(items + " : " + itemColors[items]);
			
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
		//console.log(firstItem + " - " + itemColors[firstItem]);
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
		requestSteeringOnPattern(pattern);
	//console.log("selecting "+pattern);
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

function requestSteeringOnPattern(patternId) {
	console.log('requesting steering on patternId '+patternId);
	var action = {
			action: "steerOnPattern",
			patternId: patternId
	};
	webSocket.send(JSON.stringify(action));
}

function requestSteeringOnUser(userId) {
	console.log('requesting steering on user '+userId);
	var action = {
			action: "steerOnuser",
			userId: userId
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
	//var formatTime = d3.timeFormat("%b %d, %Y, %H:%M:%S");
	var formatTime = d3.timeFormat("%H:%M:%S");
	var now = formatTime(new Date());
	history.append("p")
		.text("- "+action)
	  .append("span")
		.classed("timestamp", true)
		.text(" "+now.toString());
}

/****************************************************/
/*				Data handling functions				*/
/****************************************************/

var userInformations = [];

function receiveUserList(message) {
	//console.log("Receiving a list of users")
	var nbUsers = parseInt(message.size);
	//console.log("Adding "+message.size+" users");
	for (var i = 0; i < Math.min(nbUsers,10000); i++) {	// Line for a reduced test set
	//for (var i = 0; i < nbUsers; i++) {				  // Normal line
		let userInfo = message[i.toString()].split(";");
		let infoToSave = [userInfo[0], userInfo[1]]; // name and nbEvents
		userList.push(userInfo[0]);
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
		
		infoToSave.push(timeDiff, userInfo[2], userInfo[3]); // trace duration, start, end
		
		userInformations.push(infoToSave);	// Add this user to the list of already known ones
	}
	// sorting by event per user, in descending order
	sortUsersByNbEvents(true);
	
	// Creating the table
	createUserListDisplay();
}

function createUserListDisplay() {
	// removing the old users
	var userRowsRoot = document.getElementById("userTableBody");
	while (userRowsRoot.firstChild) {
		userRowsRoot.removeChild(userRowsRoot.firstChild);
	}
	
	// Adding the new ones
	for (var u= 0; u < userInformations.length; u++) {
		let thisUser = userInformations[u];
		let thisUserName = thisUser[0];
		
		// Only add the user if:
		// - it is selected (always displayed)
		// - the filter is empty or accepts the user
		if (highlightedUsers.includes(thisUserName) == false) {
			if (relatedUsers.length == 0) {
				if (currentUserSearchInput.length > 0)
					continue; // The filter accepts nothing
			} else {
				if (!relatedUsers.includes(thisUserName))
					continue; // The filter rejects the user
			}
		}
		
		let userRow = d3.select("#userTableBody").append("tr")
			.classed("clickable", true);
		
		userRow.append("td").text(thisUser[0]); // name
		userRow.append("td").text(thisUser[1]); // nbEvents
		
		// Display the duration of the trace
		var minutes = 1000 * 60;
		var hours = minutes * 60;
		var days = hours * 24;
		var years = days * 365;
		var timeDiff = parseInt(thisUser[2]);
		
		var result = "";
		var tdText = "";
		var tmpValue = 0;
		if (Math.floor(timeDiff / years) > 0) {
			tmpValue = Math.floor(timeDiff / years);
			result += tmpValue+"y ";
			timeDiff = timeDiff - tmpValue*years;
			tdText = "> "+result;
		}
		if (result == "") {
			if (Math.floor(timeDiff / days) > 0) {
				tmpValue = Math.floor(timeDiff / days);
				result += tmpValue+"d ";
				timeDiff = timeDiff - tmpValue*days;
				tdText = result;
			} else {
				tdText = "< 1d";
			}
		}
		userRow.append("td").text(tdText); // traceDuration

		// Date format : yyyy-MM-dd HH:mm:ss
		var startDate = thisUser[3].split(" ");
		var part1 = startDate[0].split("-");
		var part2 = startDate[1].split(":");
		var d1 = new Date(parseInt(part1[0]),
				parseInt(part1[1]),
				parseInt(part1[2]),
				parseInt(part2[0]),
				parseInt(part2[1]),
				parseInt(part2[2]));
		var startDateFormated = part1[1]+"/"+part1[2]+"/"+part1[0].substring(2,4);//+" "+part2[0]+":"+part2[1]+":"+part2[2];
		var endDate = thisUser[4].split(" ");
		part1 = endDate[0].split("-");
		part2 = endDate[1].split(":");
		var d2 = new Date(parseInt(part1[0]),
				parseInt(part1[1]),
				parseInt(part1[2]),
				parseInt(part2[0]),
				parseInt(part2[1]),
				parseInt(part2[2]));
		var endDateFormated = part1[1]+"/"+part1[2]+"/"+part1[0].substring(2,4);//+" "+part2[0]+":"+part2[1]+":"+part2[2];
		
		userRow.append("td").text(startDateFormated);  // start
		userRow.append("td").text(endDateFormated); // end

		userRow.attr("id","u"+thisUserName);
		
		if (highlightedUsers.includes(thisUser[0])) {
			userRow.attr("class", "selectedUserRow");
		}
		
		userRow.on("click", function(){
			if (d3.event.shiftKey) { // Shift + click, steering
				requestSteeringOnUser(userInfo[0]);
				d3.event.stopPropagation();
			} else { // normal click, highlight
				//console.log(userName);
				highlightUserRow(thisUserName);
				setHighlights();
				timeline.displayData();
				d3.event.stopPropagation();
			}
		});
	}
	
	// Calling the display of the trace
	//timeline.drawUsersTraces();  Keep commented until the function really draws the user traces
}

var lastUserSort = "";

function sortUsersByNbEvents(decreasing=false) {
	userInformations.sort(function(a, b) {
		var nbA = parseInt(a[1]);
		var nbB = parseInt(b[1]);
		
		return nbA-nbB;
	});
	
	if (decreasing == true) {
		userInformations.reverse();
		lastUserSort = "nbEventsDown";
	} else {
		lastUserSort = "nbEventsUp";
	}
}

function sortUsersByName(decreasing=false) {
	userInformations.sort(function(a, b) {
		var nameA = a[0];
		var nameB = b[0];
		
		if (nameA < nameB)
			return -1;
		else if (nameA > nameB)
			return 1;
		else
			return 0;
	});
	
	if (decreasing == true) {
		userInformations.reverse();
		lastUserSort = "nameDown";
	} else {
		lastUserSort = "nameUp";
	}
}

function sortUsersByTraceDuration(decreasing=false) {
	userInformations.sort(function(a, b) {
		var durationA = parseInt(a[2]);
		var durationB = parseInt(b[2]);
		
		return durationA-durationB;
	});
	
	if (decreasing == true) {
		userInformations.reverse();
		lastUserSort = "durationDown";
	} else {
		lastUserSort = "durationUp";
	}
}

function sortUsersByStartDate(decreasing=false) {
	userInformations.sort(function(a, b) {
		var startA = a[3];
		var startB = b[3];
		
		if (startA < startB)
			return -1;
		else if (startA > startB)
			return 1;
		else
			return 0;
	});
	
	if (decreasing == true) {
		userInformations.reverse();
		lastUserSort = "startDown";
	} else {
		lastUserSort = "startUp";
	}
}

function sortUsersByEndDate(decreasing=false) {
	userInformations.sort(function(a, b) {
		var endA = a[4];
		var endB = b[4];
		
		if (endA < endB)
			return -1;
		else if (endA > endB)
			return 1;
		else
			return 0;
	});
	
	if (decreasing == true) {
		userInformations.reverse();
		lastUserSort = "endDown";
	} else {
		lastUserSort = "endUp";
	}
}

function clickOnUserNameHeader() {
	let header = null;
	let txt = "";
	// Remove the sorting indicators
	d3.select("#userTable").selectAll("th")
		.each(function(d, i) {
			let colName = d3.select(this).text().split(/\s/);
			colName.pop();
			colName = colName.join("\u00A0").trim();
			if (colName == "User") {
				header = this;
				txt = colName;
			} else
				d3.select(this).text(colName+"\u00A0\u00A0");
		});
	if (lastUserSort == "nameDown") {
		d3.select(header).text(txt + "\u00A0↓");
		sortUsersByName();
	} else {
		d3.select(header).text(txt + "\u00A0↑");
		sortUsersByName(true);
	}
	
	createUserListDisplay();
	timeline.drawUsersPatterns();
}

function clickOnUserNbEventsHeader() {
	let header = null;
	let txt = "";
	// Remove the sorting indicators
	d3.select("#userTable").selectAll("th")
		.each(function(d, i) {
			let colName = d3.select(this).text().split(/\s/);
			colName.pop();
			colName = colName.join("\u00A0").trim();
			if (colName == "Nb\u00A0events") {
				header = this;
				txt = colName;
			} else
				d3.select(this).text(colName+"\u00A0\u00A0");
		});
	if (lastUserSort == "nbEventsDown") {
		d3.select(header).text(txt + "\u00A0↓");
		sortUsersByNbEvents();
	} else {
		d3.select(header).text(txt + "\u00A0↑");
		sortUsersByNbEvents(true);
	}
	
	createUserListDisplay();
	timeline.drawUsersPatterns();
}

function clickOnUserDurationHeader() {
	let header = null;
	let txt = "";
	// Remove the sorting indicators
	d3.select("#userTable").selectAll("th")
		.each(function(d, i) {
			let colName = d3.select(this).text().split(/\s/);
			colName.pop();
			colName = colName.join("\u00A0").trim();
			if (colName == "Duration") {
				header = this;
				txt = colName;
			} else
				d3.select(this).text(colName+"\u00A0\u00A0");
		});
	if (lastUserSort == "durationDown") {
		d3.select(header).text(txt + "\u00A0↓");
		sortUsersByTraceDuration();
	} else {
		d3.select(header).text(txt + "\u00A0↑");
		sortUsersByTraceDuration(true);
	}
	
	createUserListDisplay();
	timeline.drawUsersPatterns();
}

function clickOnUserStartHeader() {
	let header = null;
	let txt = "";
	// Remove the sorting indicators
	d3.select("#userTable").selectAll("th")
		.each(function(d, i) {
			let colName = d3.select(this).text().split(/\s/);
			colName.pop();
			colName = colName.join("\u00A0").trim();
			if (colName == "Start") {
				header = this;
				txt = colName;
			} else
				d3.select(this).text(colName+"\u00A0\u00A0");
		});
	if (lastUserSort == "startDown") {
		d3.select(header).text(txt + "\u00A0↓");
		sortUsersByStartDate();
	} else {
		d3.select(header).text(txt + "\u00A0↑");
		sortUsersByStartDate(true);
	}
	
	createUserListDisplay();
	timeline.drawUsersPatterns();
}

function clickOnUserEndHeader() {
	let header = null;
	let txt = "";
	// Remove the sorting indicators
	d3.select("#userTable").selectAll("th")
		.each(function(d, i) {
			let colName = d3.select(this).text().split(/\s/);
			colName.pop();
			colName = colName.join("\u00A0").trim();
			if (colName == "End") {
				header = this;
				txt = colName;
			} else
				d3.select(this).text(colName+"\u00A0\u00A0");
		});
	if (lastUserSort == "endDown") {
		d3.select(header).text(txt + "\u00A0↓");
		sortUsersByEndDate();
	} else {
		d3.select(header).text(txt + "\u00A0↑");
		sortUsersByEndDate(true);
	}
	
	createUserListDisplay();
	timeline.drawUsersPatterns();
}

function sortUsersAccordingToTable() {
	let newUserList = [];
	d3.select("#userTableBody")
		.selectAll("tr")
		.each(function(d, i) {
			newUserList.push(this.id);
		});
	userList = newUserList;
}

var numberOfDetailedHighlights = 5;

function setHighlights() {
	// removing the potential old event type highlights
	let userDisplayArea = document.getElementById("userHighlight");
	while (userDisplayArea.firstChild) {
		userDisplayArea.removeChild(userDisplayArea.firstChild);
	}
	userDisplayArea = d3.select("#userHighlight");
	
	if (highlightedUsers.length == 0) {
		userDisplayArea.text("No user");
	} else {
		if (highlightedUsers.length <= numberOfDetailedHighlights) {
			userDisplayArea.text("Users ");
			for (let i = 0; i < highlightedUsers.length; i++) {
				let thisUser = highlightedUsers[i];
				userDisplayArea.append("span")
					.classed("clickable", true)
					.text(thisUser)
					.on("click", function() {
						highlightUserRow(thisUser);
						setHighlights();
						timeline.displayData();
						d3.event.stopPropagation();
					});
				if (i < highlightedUsers.length - 1)
					userDisplayArea.append("span")
						.text(", ");
			}
		} else {
			userDisplayArea.text(highlightedUsers.length +" users");
		}
	}
	

	// removing the potential old event type highlights
	let eventTypeDisplayArea = document.getElementById("eventTypeHighlight");
	while (eventTypeDisplayArea.firstChild) {
		eventTypeDisplayArea.removeChild(eventTypeDisplayArea.firstChild);
	}
	eventTypeDisplayArea = d3.select(eventTypeDisplayArea);
	
	if (highlightedEventTypes.length == 0) {
		eventTypeDisplayArea.text("No event type");
	} else {
		if (highlightedEventTypes.length <= numberOfDetailedHighlights) {
			eventTypeDisplayArea.text("Events ");
			for (let i = 0; i < highlightedEventTypes.length; i++) {
				let thisEventType = highlightedEventTypes[i];
				eventTypeDisplayArea.append("span")
					.classed("clickable", true)
					.style("color", colorList[highlightedEventTypes[i]][0].toString())
					.text(itemShapes[highlightedEventTypes[i]])
					.on("click", function() {
						highlightEventTypeRow(thisEventType);
						setHighlights();
						timeline.displayData();
						d3.event.stopPropagation();
					})
				  .append("span")
					.style("color", "black")
					.text("\u00A0"+highlightedEventTypes[i]);

				if (i < highlightedEventTypes.length - 1)
					eventTypeDisplayArea.append("span")
						.text(", ");
			}
		} else {
			eventTypeDisplayArea.text(highlightedEventTypes.length +" event types");
		}
	}

}

var highlightedEventTypes = [];

function highlightEventTypeRow(eType) {
	// Highlights the row
	var row = d3.select("#eventTableBody").select("#"+eType);
	
	if (row.attr("class") === null) {
		row.attr("class", "selectedEventTypeRow");
		// Adds the newly highlighted event type to the list
		highlightedEventTypes.push(eType);
		addToHistory("Highlight event type "+eType);
	} else {
		if (row.attr("class").indexOf("selectedEventTypeRow") == -1) {// the row isn't already selected
			row.attr("class", row.attr("class")+" selectedEventTypeRow");
			// Adds the newly highlighted user to the list
			highlightedEventTypes.push(eType);
			addToHistory("Highlight event type "+eType);
		} else {
			row.attr("class", row.attr("class").replace("selectedEventTypeRow", ""));
			// Remove this event type from the list of highlighted event types
			let eventIdx = highlightedEventTypes.indexOf(eType);
			highlightedEventTypes.splice(eventIdx, 1);
			addToHistory("Unhighlight event type "+eType);
		}
	
	}
}

function highlightUserRow(userName) {
	// Highlights the user
	var row = d3.select("#userTableBody").select("#u"+userName);
	
	
	if (row.attr("class") === null) {
		//console.log("adding from null "+rowId);
		row.attr("class", "selectedUserRow");
		// Adds the newly highlighted user to the list
		highlightedUsers.push(userName);
		// Updates the displays of the number of selected users
		d3.select("#showSelectedUserSessionsButton")
			.text("Selected users ("+highlightedUsers.length+")");
		addToHistory("Highlight user "+userName);
	} else {
		if (row.attr("class").indexOf("selectedUserRow") == -1) {// the row isn't already selected
			//console.log("adding "+rowId);
			row.attr("class", row.attr("class")+" selectedUserRow");
			// Adds the newly highlighted user to the list
			highlightedUsers.push(userName);
			// Updates the displays of the number of selected users
			d3.select("#showSelectedUserSessionsButton")
				.text("Selected users ("+highlightedUsers.length+")");
			addToHistory("Highlight user "+userName);
		} else {
			row.attr("class", row.attr("class").replace("selectedUserRow", ""));
			// Remove this user from the list of highlighted users
			let userIdx = highlightedUsers.indexOf(userName);
			highlightedUsers.splice(userIdx, 1);
			// Updates the displays of the number of selected users
			d3.select("#showSelectedUserSessionsButton")
				.text("Selected users ("+highlightedUsers.length+")");
			addToHistory("Deselect user "+userName);
			// If a filter is being applied, removes the row if necessary
			if (relatedUsers.length == 0) {
				if (currentUserSearchInput.length > 0)
					row.remove(); // The filter accepts nothing
			} else {
				if (!relatedUsers.includes(userName))
					row.remove(); // The filter rejects the user
			}
		}
	
	}
}

function getNextCategoryColor() {
	return colorPalet[eventTypeCategories.length -1];
}

var showEventTypeDescription = true;

function switchShowEventTypeDescription() {
	if (showEventTypeDescription == true) {
		showEventTypeDescription = false;
		d3.selectAll(".eventTypeDescription")
			.style("display", "none");
	} else {
		showEventTypeDescription = true;
		d3.selectAll(".eventTypeDescription")
			.style("display", "initial");
	}
}

var showPatternText = true;

function switchShowPatternText() {
	if (showPatternText == true) {
		showPatternText = false;
		d3.selectAll(".patternText")
			.style("display", "none");
	} else {
		showPatternText = true;
		d3.selectAll(".patternText")
			.style("display", "initial");
	}
}

var lastEventTypeSort = "";

function sortEventTypesByName(decreasing=false) {
	eventTypes.sort();
	
	if (decreasing == true) {
		eventTypes.reverse();
		lastEventTypeSort = "nameDown";
	} else {
		lastEventTypeSort = "nameUp";
	}
}

function sortEventTypesByNbEvents(decreasing=false) {
	eventTypes.sort(function(a,b) {
		return eventTypeInformations[a].nbOccs - eventTypeInformations[b].nbOccs;
	});
	
	if (decreasing == true) {
		eventTypes.reverse();
		lastEventTypeSort = "nbEventsDown";
	} else {
		lastEventTypeSort = "nbEventsUp";
	}
}

function sortEventTypesByCategory(decreasing=false) {
	eventTypes.sort(function(a,b) {
		if (eventTypeInformations[a].category <= eventTypeInformations[b].category)
			return -1;
		else
			return 1;
	});
	
	if (decreasing == true) {
		eventTypes.reverse();
		lastEventTypeSort = "categoryDown";
	} else {
		lastEventTypeSort = "categoryUp";
	}
}

function clickOnEventTypeNameHeader() {
	let header = null;
	let txt = "";
	// Remove the sorting indicators
	d3.select("#eventTable").selectAll("th")
		.each(function(d, i) {
			let colName = d3.select(this).text().split(/\s/);
			colName.pop();
			colName = colName.join("\u00A0").trim();
			if (colName == "Event\u00A0type") {
				header = this;
				txt = colName;
			} else
				d3.select(this).text(colName+"\u00A0\u00A0");
		});
	if (lastEventTypeSort == "nameDown") {
		d3.select(header).text(txt + "\u00A0↓");
		sortEventTypesByName();
	} else {
		d3.select(header).text(txt + "\u00A0↑");
		sortEventTypesByName(true);
	}
	
	createEventTypesListDisplay();
	if (timeline.displayMode == "events")
		timeline.displayData();
}

function clickOnEventTypeNbEventsHeader() {
	let header = null;
	let txt = "";
	// Remove the sorting indicators
	d3.select("#eventTable").selectAll("th")
		.each(function(d, i) {
			let colName = d3.select(this).text().split(/\s/);
			colName.pop();
			colName = colName.join("\u00A0").trim();
			if (colName == "Nb\u00A0events") {
				header = this;
				txt = colName;
			} else
				d3.select(this).text(colName+"\u00A0\u00A0");
		});
	if (lastEventTypeSort == "nbEventsDown") {
		d3.select(header).text(txt + "\u00A0↓");
		sortEventTypesByNbEvents();
	} else {
		d3.select(header).text(txt + "\u00A0↑");
		sortEventTypesByNbEvents(true);
	}
	
	createEventTypesListDisplay();
	if (timeline.displayMode == "events")
		timeline.displayData();
}

function clickOnEventTypeCategoryHeader() {
	let header = null;
	let txt = "";
	// Remove the sorting indicators
	d3.select("#eventTable").selectAll("th")
		.each(function(d, i) {
			let colName = d3.select(this).text().split(/\s/);
			colName.pop();
			colName = colName.join("\u00A0").trim();
			if (colName == "Category") {
				header = this;
				txt = colName;
			} else
				d3.select(this).text(colName+"\u00A0\u00A0");
		});
	if (lastEventTypeSort == "categoryDown") {
		d3.select(header).text(txt + "\u00A0↓");
		sortEventTypesByCategory();
	} else {
		d3.select(header).text(txt + "\u00A0↑");
		sortEventTypesByCategory(true);
	}
	
	createEventTypesListDisplay();
	if (timeline.displayMode == "events")
		timeline.displayData();
}

var colorList = {};
var eventTypes = [];
var eventTypeInformations = {};

function receiveEventTypes(message) {
	//var typeList = message.types.split(";");
	var nbEvents = parseInt(message.size);
	//console.log("Receiving "+nbEvents+" event types");
	// Starting to generate the symbols and colors associated to the event types
	/*if (message.dataset == "Agavue") {
		associateColorAndShapeToEventForAgavue(message);
	} else {
		
	}*/
	var nbColors = Math.ceil(nbEvents/shapes.length);
	var colors = [];
	for (let i = 1; i <= nbColors; i++)
		colors.push(selectColor(i, nbColors));
	// Symbols and colors are generated
	if (nbEvents > 0)
		document.getElementById("noEvent").textContent = "";

	for (let i = 0; i < nbEvents; i++) {
		let eventInfo = message[i.toString()].split(";");
		console.log(eventInfo);
		let eType = "";
		let eCode = "";
		var eNbOccs = "";
		let eCategory = "";
		let eDescription = "";
		let eColor;
		
		for (var j=0; j < eventInfo.length;j++) {
			let info = eventInfo[j].split(":");
			switch(info[0]) {
			case "code":
				eCode = shapes[i%shapes.length];
				break;
			case "type":
				eType = info[1];
				if (!eventTypes.includes(eType))
					eventTypes.push(eType);
				break;
			case "nbOccs":
				eNbOccs = info[1];
				break;
			case "category":
				eCategory = info[1];
				// Setup the category if it is a new one
				if (eventTypeCategories.includes(eCategory) == false) {
					eventTypesByCategory[eCategory] = [];
					eventTypeCategories.push(eCategory);
					let catColor = getNextCategoryColor();
					eventTypeCategoryColors[eCategory] = [d3.rgb(catColor[0]), d3.rgb(catColor[1])];
					
					let categoryRow = d3.select("#categoryTableBody").append("tr");
					categoryRow.append("td").text(eCategory);
					let categorySvg = categoryRow.append("td")
						.append("svg")
						.attr("width",60)
						.attr("height", 20);
					categorySvg.append("rect")
						.attr("width", 30)
						.attr("height", 20)
						.attr("fill",eventTypeCategoryColors[eCategory][0].toString());
					categorySvg.append("rect")
						.attr("width", 30)
						.attr("height", 20)
						.attr("x",30)
						.attr("fill",eventTypeCategoryColors[eCategory][1].toString());
				}
				break;
			case "description":
				eDescription = info[1];
				break;
			default:
			}
		}
		
		// Correct the event code now that we have the category
		eventTypesByCategory[eCategory].push(eType);
		eCode = shapes[(eventTypesByCategory[eCategory].length - 1)%shapes.length];
		
		eColor = eventTypeCategoryColors[eCategory];
		colorList[eType] = eColor;
		itemShapes[eType] = eCode;
		
		eventTypeInformations[eType] = {
				"category":eCategory,
				"description":eDescription,
				"nbOccs":eNbOccs,
				"code":eCode
		};
	}
	
	sortEventTypesByNbEvents(true);
	
	createEventTypesListDisplay();
}

function createEventTypesListDisplay() {
	// removing the old event types
	var eventTypeRowsRoot = document.getElementById("eventTableBody");
	while (eventTypeRowsRoot.firstChild) {
		eventTypeRowsRoot.removeChild(eventTypeRowsRoot.firstChild);
	}
	
	// Adding the new ones
	for(let i=0; i< eventTypes.length; i++) {
		let eType = eventTypes[i];
		let eventRow = d3.select("#eventTableBody").append("tr")
			.attr("id", eType)
			.classed("clickable", true)
			.on("click", function() {
				highlightEventTypeRow(eType);
				setHighlights();
				timeline.displayData();
				d3.event.stopPropagation();
			});
		let firstCell = eventRow.append("td");
		firstCell.append("span")
			.style("color",colorList[eType][0].toString())
			.text(itemShapes[eType]+"  ");
		firstCell.append("span")
			.text(eType);
		firstCell.append("br");
		firstCell.append("span")
			.style("color","grey")
			.classed("eventTypeDescription", true)
			.style("display", showEventTypeDescription == true ? "initial" : "none")
			.text(eventTypeInformations[eType].description);
		eventRow.append("td").text(eventTypeInformations[eType].nbOccs);
		eventRow.append("td")
			.style("color",colorList[eType][0].toString())
			.text(eventTypeInformations[eType].category);

		if (highlightedEventTypes.includes(eType)) {
			eventRow.classed("selectedEventTypeRow", true);
		}
		
		/* Old symbol cell, using svg
		var symbolRow = eventRow.append("td")
		.attr("sorttable_customkey", (eColor)*100+shapes.indexOf(eCode))
		.classed("dropdown", true);
		let symbolRowSvg = symbolRow.append("svg")
		.attr("width", 20)
		.attr("height", 20)
		.classed("dropbtn", true);
		symbolRowSvg.append("path")
		.attr("d",d3.symbol().type(itemShapes[eType]).size(function(d) {return 100;}))
		.attr("transform","translate(10,10)")
		.attr("stroke", colorList[eType].toString())
		.attr("fill","none");*/
		/* New symbol cell, using utf-8 symbols */
		/*var symbolRow = eventRow.append("td")
		.attr("sorttable_customkey", (eColor)*100+shapes.indexOf(eCode))
		.classed("dropdown", true);
		let symbolRowSvg = symbolRow.append("span")
		.style("color",colorList[eType][0].toString())
		.classed("dropbtn",true)
		.text(itemShapes[eType]);*/
		
		
		// Create the menu to customize the icon
		/*var dropMenuDiv = symbolRow.append("div")
		.classed("dropdown-content", true);
		let symbolP = dropMenuDiv.append("p")
		.text("Change symbol :");
		let symbolSelect = symbolP.append("select")
		.on("change", function() {
			if (changeEventTypeSymbol(eType, symbolSelect.property('value'))) {
				// Update the row id for the new color
				symbolRow.attr("sorttable_customkey", (d3.hsl(colorList[eType][0]).h)*100+shapes.indexOf(itemShapes[eType]));
				// draw the new symbol
				/* Old symbol, svg
				symbolRowSvg.selectAll("*").remove();
				symbolRowSvg.append("path")
					.attr("d",d3.symbol().type(itemShapes[eType]).size(function(d) {return 100;}))
					.attr("transform","translate(10,10)")
					.attr("stroke", colorList[eType].toString())
					.attr("fill","none"); */
				/* New symbol, utf-8 char */
				/*symbolRowSvg.style("color",colorList[eType][0].toString())
					.text(itemShapes[eType]);
				// refresh the changed displays
				timeline.displayData();
				createPatternListDisplay();
			}
		});
		for (var ishape=0; ishape < shapes.length; ishape++) {
		symbolSelect.append("option")
			.property("value",ishape)
			.text(shapeNames[ishape])
			.property("selected", function() {
				if (shapes[ishape] == itemShapes[eType])
					return true;
				return false;
			});
		}
		let colorP = dropMenuDiv.append("p")
		.text("Change color :");
		let colorInput = colorP.append("input")
		.style("width","60px");
		let picker = new jscolor(colorInput.node());
		picker.fromRGB(Number(colorList[eType][0].r), Number(colorList[eType][0].g), Number(colorList[eType][0].b));
		
		colorInput.on("change", function() {
		if (changeEventTypeColor(eType, picker.hsv[0])) {
			// Update the row id for the new color
			symbolRow.attr("sorttable_customkey", (d3.hsl(colorList[eType][0]).h)*100+shapes.indexOf(itemShapes[eType]));
			// draw the new symbol
			/* Old symbol, svg
			symbolRowSvg.selectAll("*").remove();
			symbolRowSvg.append("path")
				.attr("d",d3.symbol().type(itemShapes[eType]).size(function(d) {return 100;}))
				.attr("transform","translate(10,10)")
				.attr("stroke",colorList[eType].toString())
				.attr("fill","none");*/
			/* New symbol, UTF-8 */
			/*symbolRowSvg.style("color",colorList[eType][0].toString())
			// refresh the changed displays
			timeline.displayData();
			createPatternListDisplay();
		/*}
		});*/
		
	}	
}

function changeEventTypeSymbol(eventType, newShapeIndex) {
	itemShapes[eventType] = shapes[newShapeIndex];
	return true;
}

function changeEventTypeColor(eventType, newColor) {
	if (newColor != colorList[eventType][0]) {
		colorList[eventType][0] = newColor;
		return true;
	}
	return false;
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
	var presetList = [0,124,168,204,241,297];		// red - orange - lightBlue - darkBlue - purple
	if (colors <= presetList.length) {
		//console.log("Selecting number "+colorNum+" out of 6 preset colors");
		return presetList[colorNum-1];
	} else {
		//console.log("Selecting number "+colorNum+" out of "+colors+" generated colors");
	    if (colors < 1) colors = 1; // defaults to one color - avoid divide by zero
	    return colorNum * (360 / colors) % 360;
	    //return "hsl(" + (colorNum * (360 / colors) % 360) + ",100%,50%)";
	}
}

/**
 * Returns a set of colors tailored for the Agavue dataset
 * @returns
 */
function getAgavueColors() {
	return [0,124,168,204,241,297];		// red - orange - lightBlue - darkBlue - purple
}

/**
 * Returns the current color associated with an event type, depending on the current highlights
 * If 'user' is omitted, the current user selection is not taken into account 
 * @param eventType
 * @param user
 * @returns
 */
function getCurrentEventColor(eventType, user) {
	let typeHighlight = true;
	let userHighlight = true;
	if (highlightedEventTypes.length > 0 && !highlightedEventTypes.includes(eventType)) {
		typeHighlight = false;
	}
	if (user != null) {
		if (highlightedUsers.length > 0 && !highlightedUsers.includes(user))
			userHighlight = false;
	}
	
	if (userHighlight && typeHighlight)
		return colorList[eventType][0];
	else
		return colorList[eventType][1];
}

function getEventColor(eventType) {
	return colorList[eventType];
}

function getEventColorForAgavue(eventType) {
	//console.log("Getting event Colors for agavue");
	var colors = getAgavueColors();
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
		//console.log("sending the data to the timeline");
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
		buildUserSessions();
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
	let previousTime = "";
	let currentCount = 1;
	let maxCount = 1;
	for(let i=0; i < timeOrderedEvents.length; i++) {
		let thisTime = timeOrderedEvents[i][0].split(";")[1];
		if (thisTime == previousTime)
			currentCount++;
		else {
			previousTime = thisTime;
			if(currentCount > maxCount)
				maxCount = currentCount;
			currentCount = 1;
		}
	}
	if(currentCount > maxCount)
		maxCount = currentCount;
	maxEventAtOneTime = maxCount;
}

/************************************************/
/*				Display functions				*/
/************************************************/

/**
 * Requests the trace of a user and display it
 */
function displayUserTrace(trace) {
	var traceSize = parseInt(trace.numberOfEvents);
	//console.log(traceSize+" events in the trace :");
	
	var data = [];
	for(var i=0; i < traceSize; i++) {
		data.push(trace[i.toString().split(';')]);
	}
	var dataColored = [];
	for(var i=0; i < data.length; i++) {
		dataColored.push({"data":data[i]+";"+colorList[data[i].split(";")[0]][0],"shape":+itemShapes[data[i].split(";")[0]]});
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
	//console.log(size+" patterns obtenus");
	
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
					.attr("stroke", colorList[pItems[k]][0].toString())
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

function sortPatternsByName(decreasing=false) {
	patternIdList.sort(function(a, b) {
		var nameA = patternsInformation[a][0];
		var nameB = patternsInformation[b][0];
		
		if (nameA < nameB)
			return -1;
		else if (nameA > nameB)
			return 1;
		else
			return 0;
	});
	
	if (decreasing == true) {
		patternIdList.reverse();
		lastPatternSort = "nameDown";
	} else {
		lastPatternSort = "nameUp";
	}
}

function sortPatternsBySize(decreasing=false) {
	patternIdList.sort(function(a, b) {
		var sizeA = patternsInformation[a][1];
		var sizeB = patternsInformation[b][1];
		
		return sizeA - sizeB;
	});
	
	if (decreasing == true) {
		patternIdList.reverse();
		lastPatternSort = "sizeDown";
	} else {
		lastPatternSort = "sizeUp";
	}
}

function sortPatternsBySupport(decreasing=false) {
	patternIdList.sort(function(a, b) {
		var supportA = patternsInformation[a][2];
		var supportB = patternsInformation[b][2];
		
		return supportA - supportB;
	});
	
	if (decreasing == true) {
		patternIdList.reverse();
		lastPatternSort = "supportDown";
	} else {
		lastPatternSort = "supportUp";
	}
}

var lastPatternSort = "sizeUp";

function clickOnPatternNameHeader() {
	let nameHeader = null;
	let nameTxt = "";
	// Remove the sorting indicators
	d3.select("#patternTable").selectAll("th")
		.each(function(d, i) {
			let colName = d3.select(this).text().split(/\s/)[0];
			if (colName == "Name") {
				nameHeader = this;
				nameTxt = colName;
			} else
				d3.select(this).text(colName+"\u00A0\u00A0");
		});
	if (lastPatternSort == "nameDown") {
		d3.select(nameHeader).text(nameTxt + "\u00A0↓");
		sortPatternsByName();
	} else {
		d3.select(nameHeader).text(nameTxt + "\u00A0↑");
		sortPatternsByName(true);
	}
	
	createPatternListDisplay();
}

function clickOnPatternSizeHeader() {
	let sizeHeader = null;
	let sizeTxt = "";
	// Remove the sorting indicators
	d3.select("#patternTable").selectAll("th")
		.each(function(d, i) {
			let colName = d3.select(this).text().split(/\s/)[0];
			if (colName == "Size") {
				sizeHeader = this;
				sizeTxt = colName;
			} else
				d3.select(this).text(colName+"\u00A0\u00A0");
		});
	if (lastPatternSort == "sizeDown") {
		d3.select(sizeHeader).text(sizeTxt + "\u00A0↓");
		sortPatternsBySize();
	} else {
		d3.select(sizeHeader).text(sizeTxt + "\u00A0↑");
		sortPatternsBySize(true);
	}
	
	createPatternListDisplay();
}

function clickOnPatternSupportHeader() {
	let supportHeader = null;
	let supportTxt = "";
	// Remove the sorting indicators
	d3.select("#patternTable").selectAll("th")
		.each(function(d, i) {
			let colName = d3.select(this).text().split(/\s/)[0];
			if (colName == "Support") {
				supportHeader = this;
				supportTxt = colName;
			} else
				d3.select(this).text(colName+"\u00A0\u00A0");
		});
	if (lastPatternSort == "supportDown") {
		d3.select(supportHeader).text(supportTxt + "\u00A0↓");
		sortPatternsBySupport();
	} else {
		d3.select(supportHeader).text(supportTxt + "\u00A0↑");
		sortPatternsBySupport(true);
	}
	
	createPatternListDisplay();
}

function findNewPatternIndex(patternInfos) {
	switch(lastPatternSort) {
	case "nameDown":
		return patternIdList.findIndex(function(elt, idx) {
			return patternsInformation[elt][0] < patternInfos[0];
		});
	case "nameUp":
		return patternIdList.findIndex(function(elt, idx) {
			return patternsInformation[elt][0] > patternInfos[0];
		});
	case "sizeDown":
		return patternIdList.findIndex(function(elt, idx) {
			return patternsInformation[elt][1] < patternInfos[1];
		});
	case "sizeUp":
		return patternIdList.findIndex(function(elt, idx) {
			return patternsInformation[elt][1] > patternInfos[1];
		});
	case "supportDown":
		return patternIdList.findIndex(function(elt, idx) {
			return patternsInformation[elt][2] < patternInfos[2];
		});
	case "supportUp":
		return patternIdList.findIndex(function(elt, idx) {
			return patternsInformation[elt][2] > patternInfos[2];
		});
	}
}

var patternsInformation = {};
var patternIdList = [];

var patternMetrics = {"sizeDistribution":{}};

function addPatternToList(message) {
	
	let pSize = parseInt(message.size);
	let pSupport = parseInt(message.support);
	let pId = message.id;
	let pItems = [];
	for (let k = 0; k < pSize; k++) {
		pItems.push(message[k]);
	}
	let pString = pItems.join(" ");
	
	//console.log("receiving Pattern "+pString);
	/*
	for (var i = 0; i < pSize; i++) {
		pString += message[i];
		if (i <= (pSize-1))
			pString += " ";
	}*/

	patternsInformation[pId] = [pString, pSize, pSupport, pItems];
	
	let correctPositionInList = findNewPatternIndex(patternsInformation[pId]);
	
	if (correctPositionInList == -1)
		patternIdList.push(pId);
	else
		patternIdList.splice(correctPositionInList, 0, pId);
	
	numberOfPattern++;
	// Update the number of pattern pages
	let newPatternPageNumber = Math.ceil(numberOfPattern*1.0 / patternPageSize);
	if (newPatternPageNumber != patternPageNumber || numberOfPattern == 1) {
		patternPageNumber = newPatternPageNumber;
		updatePatternPageNumberDisplay();
	}
	
	// Update the number of patterns display
	d3.select("#patternNumberSpan").text(numberOfPattern);
	
	// Only add the pattern to the list if:
	// - No filter is applied
	// - The applied filter accepts the pattern
	let properPatternSearchInput = currentPatternSearchInput.split(" ")
		.filter(function(d,i) {
			return d.length > 0;
		}).join(" ");
	if (pString.includes(properPatternSearchInput) == true) {
		if (correctPositionInList == -1) { // append at the end of the list
			let patternList = d3.select("#patternTableBody");
			let thisRow = patternList.append("tr")
				.style("font-weight", "normal")
				.attr("id","pattern"+pId)
				.classed("clickable", true)
				.on("click", function() {
					if (d3.event.shiftKey) { // Shift + click, steering
						requestSteeringOnPattern(pId);
						d3.event.stopPropagation();
					} else { // Normal click, displays the occurrences
						if (timeline.hasPatternOccurrences(pId) == false)
							requestPatternOccurrences(pId, currentDatasetName);
						else
							timeline.displayPatternOccurrences(pId);
						if (thisRow.style("font-weight") == "normal") {
							selectedPatternIds.push(pId);
							//thisRow.style("font-weight","bold");
						} else {
							var index = selectedPatternIds.indexOf(pId);
							if (index >= 0)
								selectedPatternIds.splice(index, 1);
							//thisRow.style("font-weight","normal");
						}
						d3.event.stopPropagation();
						console.log("click on "+pId);
						createPatternListDisplay();
						timeline.displayData(); // TODO optimize by just displaying the pattern occurrences
						timeline.drawUsersPatterns();
						
						// Update the number of selected patterns display
						d3.select("#selectedPatternNumberSpan").text(selectedPatternIds.length);
					}
				});
			var thisNameCell = thisRow.append("td");
			
			for (var k=0; k < pSize; k++) {
				thisNameCell.append("span")
					.style("color",colorList[pItems[k]][0].toString())
					.text(itemShapes[pItems[k]]);
			}
			thisNameCell.append("span")
				.text(" "+pString)
				.attr("patternId",pId)
				.classed("patternText", true)
				.style("display", showPatternText ? "initial" : "none");
				//.classed("dropdown", true);
			/*var pSvg = thisNameCell.append("svg")
				.attr("width", 20*pSize)
				.attr("height", 20);*/
	
			// Create the menu
			/*
			var dropMenuDiv = thisNameCell.append("div")
				.classed("dropdown-content", true)
				.style("left","0");
			let steeringP = dropMenuDiv.append("p")
				.text("Steer on this pattern")
				.on("click", function() {
					requestSteeringOnPattern(pId);
					d3.event.stopPropagation();
				});*/
			
			thisRow.append("td")
				.text(pSize);
			thisRow.append("td")
				.text(pSupport);
		} else { // append at the right position in the list
			let firstUnselectedId = findFirstFilteredUnselectedId(correctPositionInList + 1);
			//console.log("First unselectedId: "+firstUnselectedId);
			let patternList = d3.select("#patternTableBody");
			let firstUnselectedNode = d3.select("#pattern"+patternIdList[firstUnselectedId]).node();
			
			let thisRow = d3.select(document.createElement("tr"))
				.style("font-weight","normal")
				.attr("id","pattern"+pId)
				.classed("clickable", true)
				.on("click", function() {
					if (d3.event.shiftKey) { // Shift + click, steering
						requestSteeringOnPattern(pId);
						d3.event.stopPropagation();
					} else { // Normal click, displays the occurrences
						if (timeline.hasPatternOccurrences(pId) == false)
							requestPatternOccurrences(pId, currentDatasetName);
						else
							timeline.displayPatternOccurrences(pId);
						if (thisRow.style("font-weight") == "normal") {
							selectedPatternIds.push(pId);
							//thisRow.style("font-weight","bold");
						} else {
							var index = selectedPatternIds.indexOf(pId);
							if (index >= 0)
								selectedPatternIds.splice(index, 1);
							//thisRow.style("font-weight","normal");
						}
						d3.event.stopPropagation();
						console.log("click on "+pId);
						timeline.displayData(); // TODO optimize by just displaying the pattern occurrences
						createPatternListDisplay();
						timeline.drawUsersPatterns();
	
						// Update the number of selected patterns display
						d3.select("#selectedPatternNumberSpan").text(selectedPatternIds.length);
					}
				});
			let thisNameCell = thisRow.append("td");
			for (var k=0; k < pSize; k++) {
				thisNameCell.append("span")
					.style("color",colorList[pItems[k]][0].toString())
					.text(itemShapes[pItems[k]]);
			}
			thisNameCell.append("span")
				.text(" "+pString)
				.attr("patternId",pId)
				.classed("patternText", true)
				.style("display", showPatternText ? "initial" : "none");
				//.classed("dropdown", true);
			/*var pSvg = thisNameCell.append("svg")
				.attr("width", 20*pSize)
				.attr("height", 20);*/
	
			// Create the menu
			/*let dropMenuDiv = thisNameCell.append("div")
				.classed("dropdown-content", true)
				.style("left","0");
			let steeringP = dropMenuDiv.append("p")
				.text("Steer on this pattern")
				.on("click", function() {
					requestSteeringOnPattern(pId);
					d3.event.stopPropagation();
				});*/
			
			thisRow.append("td")
				.text(pSize);
			thisRow.append("td")
				.text(pSupport);
			
			firstUnselectedNode.parentNode.insertBefore(thisRow.node(), firstUnselectedNode);
		}
	}
	// Update the number of filtered patterns if necessary
	
	// Update the relevant metrics
	if (patternMetrics["sizeDistribution"][pSize])
		patternMetrics["sizeDistribution"][pSize] = patternMetrics["sizeDistribution"][pSize] + 1;
	else
		patternMetrics["sizeDistribution"][pSize] = 1;
	
	// Display the new metrics
	//createPatternMetricsDisplay();  Removed since the barchart displays the same information
}

function updatePatternPageNumberDisplay() {
	let displayDiv = d3.select("#patternPageNumbers");
	displayDiv.html("");
	let firstShawnNumber = Math.max(1, currentPatternPage-4);
	let lastShawnNumber = Math.min(patternPageNumber, currentPatternPage+4);
	
	if (firstShawnNumber > 1) {
		displayDiv.append("span").text(" ...");
	}
	
	for(let i=firstShawnNumber; i<=lastShawnNumber; i++) {
		let currentSpan = displayDiv.append("button")
			.classed("textButton", true)
			.text(" "+i)
			.on("click", function() {
				displayPatternPage(i);
			});
		if (i == currentPatternPage) {
			currentSpan.classed("currentPatternPageButton", true)
				.property("disabled", true)
				.on("click", null);
		}
	}
	
	if (lastShawnNumber < patternPageNumber) {
		displayDiv.append("span").text(" ... ");
	}
	
	updatePatternPageNavigationButtons();
}

function updatePatternPageNavigationButtons() {
	d3.select("#previousPatternPage").property("disabled", false);
	d3.select("#firstPatternPage").property("disabled", false);
	d3.select("#nextPatternPage").property("disabled", false);
	d3.select("#lastPatternPage").property("disabled", false);
	
	if (currentPatternPage == 1) {
		d3.select("#previousPatternPage").property("disabled", true);
		d3.select("#firstPatternPage").property("disabled", true);
	}
	if (currentPatternPage == patternPageNumber) {
		d3.select("#nextPatternPage").property("disabled", true);
		d3.select("#lastPatternPage").property("disabled", true);
	}
}

function displayPatternPage(pageNumber) {
	currentPatternPage = pageNumber;
	updatePatternPageNumberDisplay();
	createPatternListDisplay();
}

function displayFirstPatternPage() {
	displayPatternPage(1);
}

function displayPreviousPatternPage() {
	displayPatternPage(currentPatternPage - 1);
}

function displayNextPatternPage() {
	displayPatternPage(currentPatternPage + 1);
}

function displayLastPatternPage() {
	displayPatternPage(patternPageNumber);
}

function updatePatternPageSize() {
	patternPageSize = Number(d3.select("#patternPageSizeInput")
							.property("value"));
	currentPatternPage = 1;
	patternPageNumber = Math.ceil(numberOfPattern*1.0 / patternPageSize);
	updatePatternPageNumberDisplay();
	createPatternListDisplay();
}

/*
 * Finds the first id in the list of a pattern not selected by the user
 * 	starting at a given index
 * 
 * Returns the new index in patternIdList
 * or -1 if no index is suitable
 * */
function findFirstUnselectedId(startIdx) {
	let newIdx = startIdx;
	if (newIdx > patternIdList.length)
		return -1;
	while(selectedPatternIds.indexOf(patternIdList[newIdx]) != -1) {
		newIdx++;
		if (newIdx > patternIdList.length)
			return -1;
	}
	return newIdx;
}

/*
 * Finds the first id in the list of a pattern not selected by the user
 * 	starting at a given index
 *  and accepted by the current pattern filter
 * 
 * Returns the new index in patternIdList
 * or -1 if no index is suitable
 * */
function findFirstFilteredUnselectedId(startIdx) {
	let newIdx = startIdx;
	let properPatternSearchInput = currentPatternSearchInput.split(" ")
		.filter(function(d,i) {
			return d.length > 0;
		}).join(" ");
	if (newIdx > patternIdList.length)
		return -1;
	while(selectedPatternIds.indexOf(patternIdList[newIdx]) != -1
			&& patternInformations[patternIdList[newIdx]][0].includes(properPatternSearchInput)) {
		newIdx++;
		if (newIdx > patternIdList.length)
			return -1;
	}
	return newIdx;
}

/*
 * Add a pattern to the table containing the list of all patterns
 */
function addPatternListItemBeforeId(id, information, idx ) {
	var patternList = d3.select("#patternTableBody");
	
}

var selectedPatternIds = [];
var patternPageSize = 2000;
var patternPageNumber = 1;
var currentPatternPage = 1;

function createPatternListDisplay() {
	// removing the old patterns
	var patternRowsRoot = document.getElementById("patternTableBody");
	while (patternRowsRoot.firstChild) {
		patternRowsRoot.removeChild(patternRowsRoot.firstChild);
	}
	// removing the old selected patterns
	patternRowsRoot = document.getElementById("selectedPatternTableBody");
	while (patternRowsRoot.firstChild) {
		patternRowsRoot.removeChild(patternRowsRoot.firstChild);
	}

	// display the separator only if needed
	if (selectedPatternIds.length > 0) {
		d3.select("#patternListSeparator")
			.style("visibility","initial");
	} else {
		d3.select("#patternListSeparator")
		.style("visibility","hidden");
	}
	
	var patternList = d3.select("#patternTableBody");
	let properPatternSearchInput = currentPatternSearchInput.split(" ")
		.filter(function(d,i) {
			return d.length > 0;
		}).join(" ");
	let filteredPatterns = 0;
	
	// display the new ones
	for (var i=0; i < patternIdList.length; i++) {
		
		let pSize = patternsInformation[patternIdList[i]][1]
		let pSupport = patternsInformation[patternIdList[i]][2]
		let pId = patternIdList[i];
		let pString = patternsInformation[patternIdList[i]][0];
		let pItems = patternsInformation[patternIdList[i]][3];
		
		let index = selectedPatternIds.indexOf(pId);
		
		// Only add the pattern if:
		// - it is selected (always displayed)
		// - the filter is empty or accepts the pattern
		if (selectedPatternIds.includes(pId) == false) {
			if (pString.includes(properPatternSearchInput) == false) {
				continue; // The filter rejects the pattern
			}
		}
		
		filteredPatterns++;
		
		let fontWeight = "normal";
		patternList = d3.select("#patternTableBody");
		
		if (index >= 0) {
			fontWeight = "bold";
			patternList = d3.select("#selectedPatternTableBody");
		} else {
			if ((i < (currentPatternPage - 1)*patternPageSize) // before the current page
				|| (i >= (currentPatternPage)*patternPageSize)) { // after the current page
				continue;
			}
		}
		
		let thisRow = patternList.append("tr")
			.style("font-weight",fontWeight)
			.attr("id","pattern"+pId)
			.classed("clickable",true)
			.on("click", function() {
				if (d3.event.shiftKey) { // Shift + click, steering
					requestSteeringOnPattern(pId);
					d3.event.stopPropagation();
				} else { // Normal click, displays the occurrences
					if (timeline.hasPatternOccurrences(pId) == false)
						requestPatternOccurrences(pId, currentDatasetName);
					else
						timeline.displayPatternOccurrences(pId);
					if (thisRow.style("font-weight") == "normal") {
						selectedPatternIds.push(pId);
						//thisRow.style("font-weight","bold");
					} else {
						var index = selectedPatternIds.indexOf(pId);
						if (index >= 0)
							selectedPatternIds.splice(index, 1);
						//thisRow.style("font-weight","normal");
					}
					d3.event.stopPropagation();
					console.log("click on "+pId);
					createPatternListDisplay();
					timeline.displayData(); // TODO optimize by just displaying the pattern occurrences
					timeline.drawUsersPatterns();
					
					// Update the number of selected patterns display
					d3.select("#selectedPatternNumberSpan").text(selectedPatternIds.length);
				}
			});
		var thisNameCell = thisRow.append("td");
			//.classed("dropdown", true);
		/*var pSvg = thisNameCell.append("svg")
			.attr("width", 20*pSize)
			.attr("height", 20);*/
		for (var k=0; k < pSize; k++) {
			thisNameCell.append("span")
				.style("color",colorList[pItems[k]][0].toString())
				.text(itemShapes[pItems[k]]);
		}
		thisNameCell.append("span")
			.text(" "+pString)
			.attr("patternId",pId)
			.classed("patternText", true)
			.style("display", showPatternText ? "initial" : "none");

		// Create the menu
		/*var dropMenuDiv = thisNameCell.append("div")
			.classed("dropdown-content", true)
			.style("left","0");
		let steeringP = dropMenuDiv.append("p")
			.text("Steer on this pattern")
			.on("click", function() {
				requestSteeringOnPattern(pId);
				d3.event.stopPropagation();
			});*/
		
		thisRow.append("td")
			.text(pSize);
		thisRow.append("td")
			.text(pSupport);
		/*
		for (var k = 0; k < pSize; k++) {
			pSvg.append("path")
				.attr("d",d3.symbol().type(itemShapes[pItems[k]]).size(function(d) {return 100;}))
				.attr("transform","translate("+(10+20*k)+",10)")
				.attr("stroke", "hsl("+colorList[pItems[k]]+",100%,50%)")//d3.hsl(parseFloat(eColor),100,50).rgb())
				.attr("fill","none");
		}*/
	}
	
	d3.select("#highlightedPatternNumberSpan").text(filteredPatterns);
	
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

function createPatternMetricsDisplay() {
	/************ Creating the display of the pattern'sizes distributions ****************/
	// removing the old patterns
	var sizeDistributionNode = document.getElementById("patternSizeDistribution");
	while (sizeDistributionNode.firstChild) {
		sizeDistributionNode.removeChild(sizeDistributionNode.firstChild);
	}
	
	var patternSizeDistributionDiv = d3.select("#patternSizeDistribution");
	
	for (var e in patternMetrics["sizeDistribution"]) {
	  if (patternMetrics["sizeDistribution"].hasOwnProperty(e)) {
		  patternSizeDistributionDiv.append("p")
			.text("Size "+e+": "+patternMetrics["sizeDistribution"][e]);
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
	
	//console.log("Range setup");
	var xAxis = d3.axisBottom(x);
	//console.log("Calling the axis");

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
	
	//console.log("Range setup");
	var xAxis = d3.axisBottom(x);
	//console.log("Calling the axis");

	timelineOverviewXAxis.call(xAxis);
}

/**
 * Display information on the dataset when there is no dataset
 */
function resetDatasetInfo() {
	var infoDiv;
	
	//console.log("info reset");
	infoDiv = document.getElementById("datasetInfo");
	infoDiv.textContent = "No dataset selected, select a dataset to display more information";
	
	datasetInfoIsDefault = true;
}

/**
 * Reset the display of the history of actions
 */
function resetHistory() {
	var historyDiv;
	
	//console.log("history reset");
	historyDiv = document.getElementById("history");
	historyDiv.textContent = "No history to display";
	
	historyDisplayIsDefault = true;
}

/**
 * Reset the display of events
 */
function resetEvents() {	
	//console.log("Event list reset");
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
	
	//console.log("Info displayed");
}

var monthsNames = [
	"January", "February", "March",
	"April", "May", "June",
	"July", "August", "September",
	"October", "November", "December"];

function formatDate(date) {
	if (typeof date == "string") {
		// Create from the format inherited from Agavue
		// Agavue format : Sun Mar 31 01:32:10 CET 2013
		let parts = date.split(" ");
		if (parts.length != 6)
			return date;
		let month = "";
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
	} else {
		let day = date.getDate();
		let monthIdx = date.getMonth();
		let year = date.getFullYear();
		let hour = date.getHours();
		let minutes = date.getMinutes();
		let seconds = date.getSeconds();
		
		return " "+monthsNames[monthIdx]+" "+day+", "+year+", "+hour+":"+minutes+":"+seconds;
	}
}

/************************************************/
/*				Handling the tabs				*/
/************************************************/

function keepTableHeaderInSight() {
	let translate = "translate(0,"+this.scrollTop+"px)";
	this.querySelector("thead").style.transform = translate;
}

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
    document.getElementById(tabName).style.display = "flex";
    evt.currentTarget.className += " active";
}

/**
 * Manage the right-side (algorithm) tabs
 */
function openAlgorithmTab(evt, tabName) {
	// Declare all variables
	var i, tabcontent, tablinks;
	
	// Get all elements with class="algorithmTabContent" and hide them
	tabcontent = document.getElementsByClassName("algorithmTabContent");
	for (i = 0; i < tabcontent.length; i++) {
		tabcontent[i].style.display = "none";
	}
	
	// Get all elements with class="algorithmTabLink" and remove the class "active"
	tablinks = document.getElementsByClassName("algorithmTabLink");
	for (i = 0; i < tablinks.length; i++) {
		tablinks[i].className = tablinks[i].className.replace(" active", "");
	}
	
	// Show the current tab, and add an "active" class to the link that opened the tab
	document.getElementById(tabName).style.display = "flex";
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

// Not at all using the right version of requestAlgorithmStart
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

function requestAlgorithmStart(minSupport, windowSize, maxSize, minGap, maxGap, maxDuration, datasetName) {
	console.log("Requesting algorithm start:");
	console.log("   minSup: "+minSupport+", windowSize: "+windowSize+", maxSize: "+maxSize+", minGap: "+minGap+", maxGap: "+maxGap+", maxDuration: "+maxDuration+", datasetName: "+datasetName);
	
	var action = {
			action: "run",
			object: "algorithm",
			minSup: minSupport,
			windowSize: windowSize,
			maxSize: maxSize,
			minGap: minGap,
			maxGap: maxGap,
			maxDuration: maxDuration,
			datasetName: datasetName
	};
	webSocket.send(JSON.stringify(action));
	// Start the timer independently from the server
	//stopAlgorithmRuntime();
	//startAlgorithmRuntime();
	
	// Update the display of the current parameters in the Execution tab
	d3.select("#currentSupport").text(minSupport);
	d3.select("#currentGap").text(minGap+" to "+maxGap);
	d3.select("#currentWindow").text(windowSize);
	d3.select("#currentSize").text(maxSize);
	
}

/**
 * Starts the algorithm with default values at the start of the session
 * @returns
 */
function startInitialMining() {
	// TODO Stop using hard coded value depending on the dataset

	var defaultMinSupport = "500";
	var defaultWindowSize = "60";
	var defaultMaxSize = "10";
	var defaultMinGap = "0";
	var defaultMaxGap = "2";
	var defaultMaxDuration = "30000";
	var datasetName = currentDatasetName;
	
	switch(currentDatasetName) {
		case "recsysSamplecategory":
			defaultMinSupport = "10";
			defaultWindowSize = "60";
			defaultMaxSize = "20";
			defaultMinGap = "0";
			defaultMaxGap = "2";
			defaultMaxDuration = "30000";
			break;
		case "coconotesPPMT":
			defaultMinSupport = "150";
			defaultWindowSize = "60";
			defaultMaxSize = "20";
			defaultMinGap = "0";
			defaultMaxGap = "2";
			defaultMaxDuration = "30000";
			break;
		case "coconotesPPMTLarge":
			defaultMinSupport = "100";
			defaultWindowSize = "60";
			defaultMaxSize = "20";
			defaultMinGap = "0";
			defaultMaxGap = "2";
			defaultMaxDuration = "30000";
			break;
		default:
	}
	console.log("defaultMinSupport :"+defaultMinSupport);
	requestAlgorithmStart(defaultMinSupport, defaultWindowSize, defaultMaxSize, defaultMinGap, defaultMaxGap, defaultMaxDuration, datasetName);
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
		.text("(ended)");
}

/**
 * Displays the current pattern-size the algorithm is working on
 * @param level The pattern size
 * @returns
 */
function handleNewLevelSignal(level) {
	d3.select("#currentAlgorithmWork")
		.text("(working on size "+level+")");
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
			.text("(loading data"+dots+")");
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
		.text("(Data loaded)");
	console.log("Dataset loaded on server");
}

var patternSizesSvg = d3.select(d3.selectAll("#Execution > div").nodes()[1]).append("svg")
		.attr("width", "100%")
		.attr("height", "100%")
		.attr("id","patternSizesSvg");
//var patternSizesSvg = d3.select("#patternSizesSvg");
var patternSizesMargin = {top: 20, right: 0, bottom: 40, left: 30};
var patternSizesWidth = patternSizesSvg.node().getBoundingClientRect().width - patternSizesMargin.left - patternSizesMargin.right;
var patternSizesHeight = patternSizesSvg.node().getBoundingClientRect().height - patternSizesMargin.top - patternSizesMargin.bottom;

var patternSizesX = d3.scaleBand().rangeRound([0, patternSizesWidth]).padding(0.1);
var patternSizesY = d3.scaleLinear().rangeRound([patternSizesHeight, 0]);
var patternSizesXAxis = d3.axisBottom(patternSizesX);
var patternSizesYAxis = d3.axisLeft(patternSizesY).ticks(5);
	
var patternSizesG = patternSizesSvg.append("g")
		.attr("transform", "translate(" + patternSizesMargin.left + "," + patternSizesMargin.top + ")");
/**
 * Displays the barchart representing the pattern sizes
 */
function setupPatternSizesChart() {
	let data = Object.keys(patternMetrics.sizeDistribution);
	
	patternSizesX.domain(data.map(function(d) { return d; }));
	patternSizesY.domain([0, d3.max(data, function(d) { return patternMetrics.sizeDistribution[d]; })]);

	patternSizesG.append("g")
		.attr("class", "axis axis--x")
		.attr("transform", "translate(0," + patternSizesHeight + ")")
		.call(patternSizesXAxis);
	
	patternSizesG.append("g")
		.attr("class", "axis axis--y")
		.call(patternSizesYAxis)
		.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 6)
			.attr("dy", "0.71em")
			.attr("text-anchor", "end")
			.text("Frequency");
	
	patternSizesG.selectAll(".bar")
		.data(data)
		.enter().append("rect")
			.attr("class", "bar")
			.attr("x", function(d) { return patternSizesX(d); })
			.attr("y", function(d) { return patternSizesY(patternMetrics.sizeDistribution[d]); })
			.attr("width", patternSizesX.bandwidth())
			.attr("height", function(d) { return patternSizesHeight - patternSizesY(patternMetrics.sizeDistribution[d]); });
}

function drawPatternSizesChart() {
	let data = Object.keys(patternMetrics.sizeDistribution);
	
	// measure the domain (for x, unique letters) (for y [0,maxFrequency])
	// now the scales are finished and usable
	patternSizesX.domain(data.map(function(d) { return d; }));
	patternSizesY.domain([0, d3.max(data, function(d) { return patternMetrics.sizeDistribution[d]; })]);
	
	// another g element, this time to move the origin to the bottom of the svg element
	// someSelection.call(thing) is roughly equivalent to thing(someSelection[i])
	//   for everything in the selection\
	// the end result is g populated with text and lines!
	patternSizesG.select('.axis--x.axis').transition().duration(0).call(patternSizesXAxis);
	
	// same for yAxis but with more transform and a title
	patternSizesG.select(".axis--y.axis").transition().duration(0).call(patternSizesYAxis)
	
	// THIS IS THE ACTUAL WORK!
	let bars = patternSizesG.selectAll("rect.bar").data(data, function(d) { return d; }); // (data) is an array/iterable thing, second argument is an ID generator function
	let texts = patternSizesG.selectAll("text.bar").data(data, function(d) { return d; });

	bars.exit()
		.transition()
		.duration(0)
		.attr("y", patternSizesY(0))
		.attr("height", patternSizesHeight - patternSizesY(0))
		.style('fill-opacity', 1e-6)
		.remove();
	
	texts.exit()
		.transition()
		.duration(0)
		.attr("y", patternSizesY(0))
		.attr("height", patternSizesHeight - patternSizesY(0))
		.style('fill-opacity', 1e-6)
		.remove();
	
	// data that needs DOM = enter() (a set/selection, not an event!)
	bars.enter().append("rect")
		.attr("class", "bar")
		.attr("y", patternSizesY(0))
		.attr("height", patternSizesHeight - patternSizesY(0));
	
	texts.enter().append("text")
		.attr("class", "bar")
		.attr("text-anchor", "middle")
		.attr("x", function(d) { return patternSizesX(d) + patternSizesX.bandwidth()/2; })
		.attr("y", function(d) { return patternSizesY(patternMetrics.sizeDistribution[d]) - 5; })
		.text(function(d) { return patternMetrics.sizeDistribution[d]; });
		
	// the "UPDATE" set:
	bars.transition().duration(0)
		.attr("x", function(d) { return patternSizesX(d); }) // (d) is one item from the data array, x is the scale object from above
		.attr("width", patternSizesX.bandwidth()) // constant, so no callback function(d) here
		.attr("y", function(d) { return patternSizesY(patternMetrics.sizeDistribution[d]); })
		.attr("height", function(d) { return patternSizesHeight - patternSizesY(patternMetrics.sizeDistribution[d]); }); // flip the height, because y's domain is bottom up, but SVG renders top down
	
	texts.transition().duration(0)
		.attr("x", function(d) {return patternSizesX(d) + patternSizesX.bandwidth()/2; })
		.attr("y", function(d) { return patternSizesY(patternMetrics.sizeDistribution[d]) - 5; })
		.text(function(d) { return patternMetrics.sizeDistribution[d]; });
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
	//supportSlider = new SupportSlider("sliderSupportArea");
	supportSlider = document.getElementById("sliderSupport");
	noUiSlider.create(supportSlider, {
		range: {
			'min': 0,
			'max': 1000
		},
		orientation: 'horizontal',
		start: [200],
		pips: {
			mode: 'positions',
			values: [0, 25, 50, 75, 100],
			stepped: true,
			density: 3
		},
		tooltips: true,
		step: 1,
		format: {
			to: function (value ) {
				return value;
			},
			from: function ( value ) {
				return value.replace('.-', '');
			}
		}
	});
}

var windowSlider = null;

/**
 * Slider dedicated to the window size
 * TODO replace with the maximum duration
 */
function setupAlgorithmWindowSizeSlider() {
	windowSlider = document.getElementById("sliderWindow");
	noUiSlider.create(windowSlider, {
		range: {
			'min': 0,
			'max': 1000
		},
		orientation: 'horizontal',
		start: [200],
		pips: {
			mode: 'positions',
			values: [0, 25, 50, 75, 100],
			stepped: true,
			density: 3
		},
		tooltips: true,
		step: 1,
		format: {
			to: function (value ) {
				return value;
			},
			from: function ( value ) {
				return value.replace('.-', '');
			}
		}
	});
}

var sizeSlider = null;

/**
 * Slider dedicated to the maximum size
 */
function setupAlgorithmMaximumSizeSlider() {
	sizeSlider = document.getElementById("sliderSize");
	noUiSlider.create(sizeSlider, {
		range: {
			'min': 0,
			'max': 1000
		},
		orientation: 'horizontal',
		start: [200],
		pips: {
			mode: 'positions',
			values: [0, 25, 50, 75, 100],
			stepped: true,
			density: 3
		},
		tooltips: true,
		step: 1,
		format: {
			to: function (value ) {
				return value;
			},
			from: function ( value ) {
				return value.replace('.-', '');
			}
		}
	});
}

var gapSlider = null;

/**
 * Slider dedicated to the gap
 */
function setupAlgorithmGapSlider() {
	//gapSlider = new GapSlider("sliderGap");
	gapSlider = document.getElementById("sliderGap");
	noUiSlider.create(gapSlider, {
		range: {
			'min': 0,
			'max': 10
		},
		orientation: 'horizontal',
		start: [0, 2],
		connect: true,
		pips: {
			mode: 'steps',
			stepped: true,
			density: 3
		},
		tooltips: true,
		step: 1,
		format: {
			to: function (value ) {
				return value;
			},
			from: function ( value ) {
				return value.replace('.-', '');
			}
		}
	});
}

function updateAlgorithmGapSlider() {
	
}

function changeDrawIndividualEventsOnSessions() {
	let checked = d3.select("#drawIndividualEventsInput").property("checked");
	if (checked == true)
		d3.select("#showOnlyHighlightedInSessions").classed("hidden", false);
	else
		d3.select("#showOnlyHighlightedInSessions").classed("hidden", true);
	refreshUserPatterns();
}

function refreshUserPatterns() {
	timeline.drawUsersPatterns();
}

var tooltipIsFixed = false;
var tooltipHasContent = false;

/**
 * Origin can be either "general" or "session"
 */
function updateTooltip(data, origin) {
	// If using the tooltip.js tooltip :
	// tooltip.show(message, 400);
	if (!tooltipIsFixed) {
		
		let area = d3.select("#tooltip").select(".body");
		area.html("");
		
		switch(origin) {
		case "general":
			/* Structure : 
			 * [year,
		     * start,
		     * end,
		     * nbEventsInBin,
		     * user1;user2;...,
		     * type1;type2;...,
		     * type1:nbOcc;type2:nbOcc;...
		     * nbEventsInSubBin,
			 * type1:hslColorValue1;type2:hslColorValue1;...]
		   	 */
			switch(timeline.displayMode) {
			case "distributions":
				switch(timeline.distributionScale) {
				case "year":
					//message = "Year "+data[0]+"<br>"+"("+data[1]+" to "+data[2]+")"+"<br>"+data[3]+" events";
				case "month":
				case "halfMonth":
				case "day":
				case "halfDay":
					let nbUsers = data[4].split(";").length;
					let nbOccs = data[6].split(';');
					//console.log("pre-sort: "+nbOccs);
					nbOccs.sort(function(a,b) {
						let aVal = parseInt(a.split(":")[1]);
						let bVal = parseInt(b.split(":")[1]);
						return bVal - aVal;	// sort in descending order
					});
					//console.log("post-sort: "+nbOccs);
					area.append("p")
						.text("From "+data[1]+" to "+data[2]);
					area.append("p")
						.text(data[3]+" events across "+nbUsers+" users");
					area.append("p")
						.text(data[7]+" in this subpart:");
					
					let ttTable = area.append("table");
					let ttTableHead = ttTable.append("thead").append("tr");
					ttTableHead.append("th")
						.text("Event type");
					ttTableHead.append("th")
						.text("Support");
					ttTableHead.append("th")
						.text("% of this bin");
					let ttTableBody = ttTable.append("tbody");
					
					for (let i = 0; i < nbOccs.length; i++) {
						let ttTableRow = ttTableBody.append("tr");
						
						let occ = nbOccs[i].split(":");
						let percentage = parseInt(occ[1])/parseInt(data[3]);
						
						let hslValues = data[8].split(";");
						let hslValue = 0;
						for (let idx = 0; idx < hslValues.length; idx++) {
							if (hslValues[idx].split(":")[0] == occ[0]) {
								hslValue = parseInt(hslValues[idx].split(":")[1]);
								break;
							}
						}
						
						let ttFirstCell = ttTableRow.append("td");
						ttFirstCell.append("span")
							.style("color",colorList[occ[0]][0].toString())
							.text(itemShapes[occ[0]]);
						ttFirstCell.append("span").text(" "+occ[0]);
						ttTableRow.append("td").text(occ[1]);
						ttTableRow.append("td").text((percentage*100).toPrecision(3)+"%");
					}
				}
				break;
			case "events":
					splitData = data.split(";");
					
					area.append("p")
						.text("Type: " + splitData[0]);
					area.append("p")
						.text("Time: " + splitData[1]);
					area.append("p")
						.text("User: " + splitData[3]);
					area.append("p")
						.text("Properties:");
					for(var i = 4; i < splitData.length; i++)
						area.append("p")
							.classed("tooltipEventProperty", true)
							.text(splitData[i]);
			}
			break;
		case "session":
			/* Structure of data : 
			 * ["user",
			 * 	nbrOfPatternsInSession, (-1 if no session)
			 * 	sessionStart,
			 * 	sessionEnd,
			 * 	"name: number"]
		   	 */
			
			area.append("p")
				.text("User " + data[0]);
			
			let dateStart = "";
			let dateEnd = "";
			
			switch(data[1]) {
			case -1:/*
				area.append("p")
					.text("No session");*/
				break;
			case 0:
				dateStart = new Date(data[2]);
				dateEnd = new Date(data[3]);
				area.append("p")
					.text("Session start: "+formatDate(dateStart));
				area.append("p")
					.text("Session end: "+formatDate(dateEnd));
				area.append("p")
					.text("No pattern in this session");
				break;
			default:
				dateStart = new Date(data[2]);
				dateEnd = new Date(data[3]);
				area.append("p")
					.text("Session start: "+formatDate(dateStart));
				area.append("p")
					.text("Session end:  "+formatDate(dateEnd));
				
				let ttTable = area.append("table");
				let ttTableHead = ttTable.append("thead").append("tr");
				ttTableHead.append("th")
					.text("Pattern");
				ttTableHead.append("th")
					.text("Support");
				let ttTableBody = ttTable.append("tbody");
				for (let pIdx = 4; pIdx < data.length; pIdx++) {
					let thisData = data[pIdx].split(":");
					let ttTableRow = ttTableBody.append("tr");
					ttTableRow.append("td")
						.text(thisData[0].trim());
					ttTableRow.append("td")
						.text(thisData[1].trim());
				}
			}
			
			break;
		default:
		}
		
		tooltipHasContent = true;
		updateTooltipLockMessage();
	}
}

function clearTooltip() {
	// If using the tooltip.js tooltip :
	// tooltip.hide();
	if (!tooltipIsFixed) {
		d3.select("#tooltip").select(".body")
			.html("Hover over the visualizations to get more information");
		tooltipHasContent = false;
		updateTooltipLockMessage();
	}
}

function updateTooltipLockMessage() {
	let tt = d3.select("#tooltip");
	if (tooltipHasContent) {
		if (tooltipIsFixed) {
			tt.select(".subtitle").text("Press f to unlock the tooltip");
			tt.select(".title").text("Tooltip 🔒");
		} else {
			tt.select(".subtitle").text("Press f to lock the tooltip");
			tt.select(".title").text("Tooltip 🔓");
		}
	} else {
		tt.select(".subtitle").text("");
		tt.select(".title").text("Tooltip");
	}
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
	self.nodeFocusControl = document.getElementById('tl_focusControl');
	self.nodeOverview = document.getElementById('tl_overview');
	self.nodeFocus = document.getElementById('tl_focus');
	self.nodeUsers = document.getElementById('tl_users');
	self.nodeSelectedUsers = document.getElementById('tl_selectedUsers');

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
		//self.drawPatternOccurrences();  Prefered to displaying the old data, only when the patterns will always be drawn on their specific layer
		timeline.displayData(); // TODO optimize by just displaying the pattern occurrences
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
		if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") {
			return; // ignore zoom-by-brush
		}
		var t = d3.event.transform;
		self.xFocus.domain(t.rescaleX(self.xContext).domain());
		self.xPatterns.domain(t.rescaleX(self.xContext).domain());
		self.xUsers.domain(t.rescaleX(self.xContext).domain());
		/*self.focus.select(".area")
			.attr("d", self.areaFocus);*/
		self.focus.select(".axis--x")
			.call(self.xAxisFocus);
		self.users.select(".axis--x")
			.call(self.xAxisUsers);
		/*self.focus.selectAll(".dot")
			.attr("transform",function(d) {return "translate("+self.xFocus(d.time)+","+self.yFocus(d.height)+")"});*/
		//self.drawCurrentBins();
		self.displayData();
		self.context.select(".brush")
			.call(self.brush.move, self.xFocus.range().map(t.invertX, t));
		self.zoomRectUsers.property("__zoom", t);  // Manually save the transform to clear the saved old transform
		console.log(this);
	};
	
	self.zoomedUsers = function() {
		if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") {
			return; // ignore zoom-by-brush
		}
		var t = d3.event.transform;
		self.xFocus.domain(t.rescaleX(self.xContext).domain());
		self.xPatterns.domain(t.rescaleX(self.xContext).domain());
		self.xUsers.domain(t.rescaleX(self.xContext).domain());
		/*self.focus.select(".area")
			.attr("d", self.areaFocus);*/
		self.focus.select(".axis--x")
			.call(self.xAxisFocus);
		self.users.select(".axis--x")
			.call(self.xAxisUsers);
		/*self.focus.selectAll(".dot")
			.attr("transform",function(d) {return "translate("+self.xFocus(d.time)+","+self.yFocus(d.height)+")"});*/
		//self.drawCurrentBins();
		self.displayData();
		self.context.select(".brush")
			.call(self.brush.move, self.xUsers.range().map(t.invertX, t));
		self.zoomRect.property("__zoom", t);  // Manually save the transform to clear the saved old transform
	};
	
	// Probably to be deleted, only called from drawUsersTraces, which should not be used
	self.updateUserList = function() {
		
		let shownUsersNames = []; 
		
		if (showUserSessionOption == "all") {
			shownUsersNames = userInformations.map(function(uI) {
				return uI[0]; // Only get the userName
			});
		} else {
			shownUsersNames = userInformations.slice(firstUserShown, firstUserShown + nbUserShown)
				.map(function(uI) {
					return uI[0]; // Only get the userName
				});
		}
		
		self.yUsers.domain(shownUsersNames);
		
		self.yAxisUsers = d3.axisLeft(self.yUsers)
	        .tickValues(self.yUsers.domain().filter(function(d, i) {
	        	// Ensures a readable size of tick label
	        	if (self.yUsers.bandwidth() >= 9)
	        		return true;
	        	else
	        		return false;
	        }));
	        /*.tickFormat(function(d, i) {
	        	return d;
	        });*/
		self.users.select(".axis--y").call(self.yAxisUsers);
		
		//console.log("User List updated on the timeline");
		
		//requestUsersPatternOccurrences(userInformations.slice(0,nbUserShown));
	}
	
	self.drawUsersTraces = function() {
		console.log("Starting to draw users traces");
		
		self.updateUserList();
		
		// get the 10 first users in the list
		//console.log("UI size : "+userInformations.length);
		var shownUsers = userInformations.slice(0).splice(0, 10).map(function(x) {
			return x[0];
		});
		//console.log("UI size after : "+userInformations.length);
		
		self.canvasUsersContext.fillStyle = "#fff";
		self.canvasUsersContext.rect(0,0,self.canvasUsers.attr("width"),self.canvasUsers.attr("height"));
		self.canvasUsersContext.fill();
		
		for (var i=0; i < shownUsers.length; i++) {
			let userName = shownUsers[i];
			//console.log("drawing user "+userName);
			for (var j = 0; j < userTraces[userName].length; j++) {
				var event = userTraces[userName][j];
				var eventData = event[0].split(";");
				
				var x = self.xUsers(new Date(eventData[1].replace(" ","T")+"Z"));
				var y = self.yUsers(userName);
				self.canvasUsersContext.beginPath();
				self.canvasUsersContext.fillStyle = "blue";
				self.canvasUsersContext.arc(x,y,3,0,2*Math.PI, false)
				self.canvasUsersContext.fill();
				self.canvasUsersContext.closePath();
			}
		}
		
		//console.log("User traces drawn");
	}
	
	self.colorToDataUserPatterns = {};
	
	self.drawUsersPatterns = function() {
		//console.log("Starting to draw users patterns");
		
		
		self.colorToDataUserPatterns = {};
		let nextColor = 1;
		
		// get the 10 first users in the list
		//console.log("UI size : "+userInformations.length);
		/*var shownUsers = userInformations.slice(0).splice(0, 10).map(function(x) {
			return x[0];
		});*/
		
		
		//console.log("UI size after : "+userInformations.length);
		
		self.canvasUsersContext.fillStyle = "#fff";
		self.canvasUsersContext.rect(0,0,self.canvasUsers.attr("width"),self.canvasUsers.attr("height"));
		self.canvasUsersContext.fill();
		
		self.hiddenCanvasUsersContext.fillStyle = "#fff";
		self.hiddenCanvasUsersContext.rect(0,0,self.hiddenCanvasUsers.attr("width"),self.hiddenCanvasUsers.attr("height"));
		self.hiddenCanvasUsersContext.fill();
		
		//let userNames = Object.keys(userSessions);
		
		let shownUsers = [];
		
		switch(showUserSessionOption) {
		case "all":
			shownUsers = userInformations.map(function(uI) {
				return uI[0]; // Only get the userName
			});
			break;
		case "selected":
			let hl = highlightedUsers;
			hl.sort(function(a, b) {
				let aIdx = userInformations.findIndex(function(elt) {
					return elt[0] == a;
				});
				let bIdx = userInformations.findIndex(function(elt) {
					return elt[0] == b;
				});
				return aIdx-bIdx;
			});
			shownUsers = hl;
			break;
		case "some":
			shownUsers = userInformations.slice(firstUserShown, firstUserShown + nbUserShown)
			.map(function(uI) {
				return uI[0]; // Only get the userName
			});
			break;
		default:
		}
		
		// Update the left axis
		self.yUsers.domain(shownUsers);
		
		self.yAxisUsers = d3.axisLeft(self.yUsers)
	        .tickValues(self.yUsers.domain().filter(function(d, i) {
	        	// Ensures a readable size of tick label
	        	if (self.yUsers.bandwidth() >= 9)
	        		return true;
	        	else
	        		return false;
	        }));
	        /*.tickFormat(function(d, i) {
	        	return d;
	        });*/
		self.users.select(".axis--y").call(self.yAxisUsers);

		// If there is enough space, show the option to draw the individual events and draw them accordingly
		let drawEvents = false;
		let drawOnlyHighlightedEvents = false;
		if (self.yUsers.bandwidth() >= 9) {
			d3.select("#drawIndividualEvents")
				.classed("hidden", false);
			drawEvents = d3.select("#drawIndividualEventsInput")
				.property("checked");
			drawOnlyHighlightedEvents = d3.select("#showOnlyHighlightedInSessionsInput")
				.property("checked");
		} else {
			d3.select("#drawIndividualEvents")
				.classed("hidden", true);
		}

		// To prevent an error at the start, when the call to getEventAccessorAtDate tries to access
		//  the eventAccessor before it has been populated
		//  TODO replace by a proper exception handling
		if (shownUsers.length == 0)
			return;
		
		
		let hasSelected = (selectedPatternIds.length > 0);
		
		for (var i=0; i < shownUsers.length; i++) {
			let userName = shownUsers[i];
			
			userSessions[userName].forEach(function(ses, sesIdx) {
				let color = "#04B7FB";
				if (hasSelected == true) {
					color = "#c8daea"; // lighter blue
					Object.keys(ses.count).forEach(function(id, idx) {
						if (selectedPatternIds.includes(Number(id))) {
							//console.log(id+" selected");
							color = "red";
						}
					});
				}
				
				/*var event = userTraces[userName][j];
				var eventData = event[0].split(";");*/
				
				self.canvasUsersContext.beginPath();
				
				let x1 = self.xUsers(new Date(ses.start));
				let x2 = self.xUsers(new Date(ses.end));
				let y1 = 0;
				let y2 = 0;
				if (x1 == x2) {
					y1 = self.yUsers(userName);
					y2 = self.yUsers(userName) + self.yUsers.bandwidth();
					self.canvasUsersContext.lineWidth = 1;
				} else {
					y1 = self.yUsers(userName) + self.yUsers.bandwidth()/2;
					y2 = y1;
					self.canvasUsersContext.lineWidth = self.yUsers.bandwidth();
				}

				self.canvasUsersContext.strokeStyle = color;
				self.canvasUsersContext.moveTo(x1,y1);
				self.canvasUsersContext.lineTo(x2,y2);
				self.canvasUsersContext.lineCap = "butt";
				self.canvasUsersContext.stroke();
			    self.canvasUsersContext.closePath();
			    
			    // Attributing a color to data link for the hidden canvas
			    //var hiddenColor = [];
			    // via http://stackoverflow.com/a/15804183
			    /*if(nextColor < 16777215){
			    	hiddenColor.push(nextColor & 0xff); // R
			    	hiddenColor.push((nextColor & 0xff00) >> 8); // G 
			    	hiddenColor.push((nextColor & 0xff0000) >> 16); // B

			    	nextColor += 1;
			    } else {
			    	console.log('Warning : too may colors needed for the user patterns hidden canvas');
			    }*/
			    
			    /* Create the info we want in the tooltip
			    * Structure : [year,
			    * start,
			    * end,
			    * nbEventsInBin,
			    * user1;user2;...,
			    * type1;type2;...,
			    * type1:nbOcc;type2:nbOcc;...
			    * nbEventsInSubBin,
			    * hslColorValue1]
			   	*/
			    /*
			    let ttInfo = [];
			    
			    for (var id in Object.keys(ses.count)) {
			    	ttInfo.push(patternsInformation[id][0]+": "+ses.count[id]);
			    }
			    self.colorToDataUserPatterns["rgb("+hiddenColor.join(',')+")"] = ttInfo;
			    */
			    // Drawing on the hidden canvas for the tooltip
			    /*self.hiddenCanvasUsersContext.lineWidth = 1.5;
				self.hiddenCanvasUsersContext.strokeStyle = "rgb("+hiddenColor.join(',')+")";
				self.hiddenCanvasUsersContext.moveTo(x1,y);
				self.hiddenCanvasUsersContext.lineTo(x2,y);
				self.hiddenCanvasUsersContext.lineCap = "round";
				self.hiddenCanvasUsersContext.stroke();
			    self.hiddenCanvasUsersContext.closePath();*/
			});
		}
		
		// Draw the event symbols if needed
		if (drawEvents == true) {
			// get the last accessor point before the time-span start
			let firstIndex = getEventAccessorAtDate(self.xUsers.domain()[0]);
			//console.log("Retreived first index is "+firstIndex);
			// find the real first index
			var startFound = false;
			var startingIndex = firstIndex; // to see how many events have been check vs how many have been drawn
			while (!startFound) {
				var info = timeOrderedEvents[firstIndex][0].split(";");
				var time = d3.timeParse('%Y-%m-%d %H:%M:%S')(info[1]);
				if (time < self.xFocus.domain()[0])
					firstIndex++;
				else
					startFound = true;
			}

			let drawCount = 0;
			var endReached = false;
			while (!endReached) {
				var info = timeOrderedEvents[firstIndex][0].split(";");
				// Only draw if the user is displayed
				if (shownUsers.includes(info[3])) {
					var time = d3.timeParse('%Y-%m-%d %H:%M:%S')(info[1]);
					if (time > self.xFocus.domain()[1] || firstIndex == timeOrderedEvents.length - 1)
						endReached = true;
					else {
					    firstIndex++;
					    // Don't draw if the event is not highlighted and we only want the highlighted ones
						if (drawOnlyHighlightedEvents == true) {
							if (getCurrentEventColor(info[0], info[3]) == colorList[info[0]][1]) {
								continue;
							}
						}
						drawCount++;
						
						// Attributing a color to data link
					    /*let color = [];
					    // via http://stackoverflow.com/a/15804183
					    if(nextColor < 16777215){
					    	let nextR = Math.max(0, Math.floor(Math.floor(nextColor / 255) / 255));
					    	let nextG = Math.max(0, Math.floor(nextColor / 255) % 255);
					    	let nextB = nextColor % 255;
					    	color = [nextR, nextG, nextB];

					    	nextColor += 1;
					    }
					    self.colorToData["rgb("+color.join(',')+")"] = timeOrderedEvents[firstIndex][0];*/
					    //console.log("event at index "+firstIndex+" gets color "+color.join(','));
					    
						let x = self.xUsers(d3.timeParse('%Y-%m-%d %H:%M:%S')(info[1]));				
						let y = self.yUsers(info[3]) + self.yUsers.bandwidth()/2;
						
						/* Draw the symbol when using svg for the event types
						var symbolGenerator = d3.symbol().type(itemShapes[info[0]])
												.size(self.yFocus.bandwidth())
												.context(self.canvasContext);
						var hiddenSymbolGenerator = d3.symbol().type(itemShapes[info[0]])
												.size(self.yFocus.bandwidth())
												.context(self.hiddenCanvasContext);
						
						//self.canvasContext.rect(x-2.5,y-2.5,5,5);
						self.canvasContext.beginPath();
						self.canvasContext.translate(x,y);
						self.canvasContext.strokeStyle = colorList[info[0]].toString();//d3.hsl(parseInt(colorList[info[0]]),100,50).rgb();//"green";
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
					    self.hiddenCanvasContext.closePath();*/
						
						let trueX = x - self.canvasUsersContext.measureText(itemShapes[info[0]]).width/2;
						let symbolColor = getCurrentEventColor(info[0], info[3]).toString();
						let symbolSize = Math.min(self.yUsers.bandwidth() * 0.8, 18);
						
					    self.canvasUsersContext.font = "bold "+symbolSize+"px Geneva";
					    self.canvasUsersContext.fillStyle = symbolColor;
					    self.canvasUsersContext.textBaseline="middle";
						self.canvasUsersContext.fillText(itemShapes[info[0]], trueX, y);
					    /*
						self.hiddenCanvasUsersContext.font = "bold "+symbolSize+"px Geneva";
					    self.hiddenCanvasUsersContext.fillStyle = "rgb("+color.join(',')+")";
					    self.hiddenCanvasUsersContext.textBaseline="middle";
						self.hiddenCanvasUsersContext.fillText(itemShapes[info[0]], trueX, y);
						*/
					}
				} else {
					if (time > self.xFocus.domain()[1] || firstIndex == timeOrderedEvents.length - 1)
						endReached = true;
					firstIndex++;
				}
			}
		}
		
		//console.log("User traces drawn");
	}
	
	self.drawPatternOccurrences = function() {
		
		//console.log("Starting to draw pattern occurrences");
		var idsToDraw = [];
		
		for (var key in self.displayPatternOccs) {
		  if (self.displayPatternOccs.hasOwnProperty(key)) {
		    if (self.displayPatternOccs[key] == true)
		    	idsToDraw.push(key);
		  }
		}
		
		//console.log("patterns to draw: "+listOfPatternsToDraw);
		
		let step = self.marginFocus.size / (idsToDraw.length + 1.0);
		let range = [];
		for (let i = 0; i< idsToDraw.length + 2; i++)
			range.push(i*step);
		
		
		self.yPatterns = d3.scaleOrdinal()
			.domain([""].concat(idsToDraw).concat([""]))
			.range(range);
	
		self.yAxisPatterns = d3.axisRight(self.yPatterns)
	        .tickValues(self.yPatterns.domain())
	        .tickFormat(function(d, i) {
	        	if (patternsInformation[d] && patternsInformation[d].length >= 0) {
	        		return patternsInformation[d][0];
	        	} else
	        		return d;
	        });
		self.focus.select("#focusRightAxis").call(self.yAxisPatterns);
		
		// Hide the axis if there is no selected pattern or if we are not in distribution mode
		if (self.displayMode != "distributions" || idsToDraw.length == 0) {
			d3.select("#focusRightAxis")
				.classed("hidden", true);
		} else {
			// Replace the event types in the patterns by their symbols
			d3.select("#focusRightAxis")
				.classed("hidden", false);
			d3.select("#focusRightAxis").selectAll(".tick text")
				.each(function(d) {
					let el = d3.select(this);
					let elts = el.text().split(' ');
					
					if (elts.length > 0 && elts[0].length > 0) {
						// erase the old text
						el.text("");
						// add a tspan for each event type symbol
						for (let symbolIdx = 0; symbolIdx < elts.length; symbolIdx++) {
							let evtName = elts[symbolIdx];
							el.append("tspan")
								.text(itemShapes[evtName])
								.style("fill", colorList[evtName][0].toString());
						}
					}
				});
		}
		
		switch(self.displayMode) {
		case "distributions": // Displays all occurrences of a pattern on a line
			for (var i = 0; i < idsToDraw.length; i++) {// Draw each pattern
				for (var j=0; j < self.patternOccs[idsToDraw[i]].length; j++) {// Draw each occurrence
					console.log("Ids to draw: "+idsToDraw);
					if (self.patternOccs[idsToDraw[i]][j]) {
						var occ = self.patternOccs[idsToDraw[i]][j].split(";");
						var x1 = self.xFocus(new Date(parseInt(occ[1])));
						var x2 = self.xFocus(new Date(parseInt(occ[occ.length-1]))); // Last timestamp in the occurrence
						var y = self.yPatterns(idsToDraw[i]);
						self.canvasContext.beginPath();
						if (x1 == x2) {
							self.canvasContext.fillStyle = "blue";
							self.canvasContext.arc(x1,y,3,0,2*Math.PI, false);
							self.canvasContext.fill();
							//self.canvasContext.closePath();
						} else {
							self.canvasContext.lineWidth = 3;
							self.canvasContext.moveTo(x1,y);
							self.canvasContext.lineTo(x2,y);
							self.canvasContext.lineCap = "round";
							self.canvasContext.stroke();
						    //self.canvasContext.closePath();
						}
					}
				}
			}
			break;
		case "events": // Displays occurrences by connecting their events
			for (var i = 0; i < idsToDraw.length; i++) {// Draw each pattern
				let patternItems = patternsInformation[idsToDraw[i]][3];
				for (var j=0; j < self.patternOccs[idsToDraw[i]].length; j++) {// Draw each occurrence
					console.log("Ids to draw: "+idsToDraw);
					if (self.patternOccs[idsToDraw[i]][j]) {
						var occ = self.patternOccs[idsToDraw[i]][j].split(";");
						self.canvasPatternContext.beginPath();
						self.canvasPatternContext.lineWidth = 5;
						self.canvasPatternContext.lineCap = "round";
						let x1 = self.xFocus(new Date(parseInt(occ[1])));
						let y1 = self.yFocus(patternItems[0]) + self.yFocus.bandwidth()/2;
						self.canvasPatternContext.moveTo(x1,y1);
						for (let evtIdx=2; evtIdx < occ.length; evtIdx++) { // for each event inside the occurrence
							let x2 = self.xFocus(new Date(parseInt(occ[evtIdx])));
							let y2 = self.yFocus(patternItems[evtIdx-1]) + self.yFocus.bandwidth()/2;
							self.canvasPatternContext.lineTo(x2,y2);
							x1 = x2;
							y1 = y2;
							/*if (x1 == x2) {
								self.canvasContext.fillStyle = "blue";
								//self.canvasContext.arc(x1,y,3,0,2*Math.PI, false);
								//self.canvasContext.arc(x1,y1,3,0,2*Math.PI, false);
								self.canvasContext.fill();
								self.canvasContext.closePath();
							} else {
							} */
						}
						self.canvasPatternContext.stroke();
						//self.canvasContext.closePath();
						
						/*var x1 = self.xFocus(new Date(parseInt(occ[1])));
						var x2 = self.xFocus(new Date(parseInt(occ[2])));
						var y1 = self.yFocus(patternItems[0]);
						var y2 = self.yFocus(patternItems[patternItems.length - 1]);
						self.canvasContext.beginPath();
						if (x1 == x2) {
							self.canvasContext.fillStyle = "blue";
							//self.canvasContext.arc(x1,y,3,0,2*Math.PI, false);
							//self.canvasContext.arc(x1,y1,3,0,2*Math.PI, false);
							self.canvasContext.fill();
							self.canvasContext.closePath();
						} else {
							self.canvasContext.lineWidth = 5;
							self.canvasContext.moveTo(x1,y1);
							self.canvasContext.lineTo(x2,y2);
							self.canvasContext.lineCap = "round";
							self.canvasContext.stroke();
						    self.canvasContext.closePath();
						}*/
					}
				}
			}
			break;
		default:
		}
		
		console.log(idsToDraw.length+" patterns drawn")
	}
	
	self.setBins = function(bins) {
		self.bins = bins;
	}
	
	self.displayColorsInBins = false;
	self.displayFullHeightBins = false;
	
	self.drawBins = function(bins) {
		
		console.log("drawing bins");
		self.setBins(bins);
		//[[year,start,end,value]...]
		
		// Adjust the focus part of the timeline to the new data
		//self.xFocus.domain(d3.extent(csvData, function(d) { return d.time; }));
		var maxHeight = 0.0;//1999999.0;
		
		// Adjust the y axis to the max height
		if (self.displayFullHeightBins == true) 
			maxHeight = 100.0;
		else {
			for (var iBin=0; iBin < bins.length; iBin++) {
				if (parseInt(bins[iBin][3]) > maxHeight)
					maxHeight = parseFloat(bins[iBin][3]);
			}
		}
		
		var maxBin = 0;
		for (var iBin=0; iBin < bins.length; iBin++) {
			if (parseInt(bins[iBin][3]) > maxBin)
				maxBin = parseFloat(bins[iBin][3]);
		}
		
		
		self.yFocus.domain([0.0, maxHeight/*+1.0*/]);
		self.focus.select(".axis--y")
	      .call(self.yAxisFocus);
			//.selectAll(".tick line").attr("stroke","lightblue").attr("stroke-width","0.5");
		
		/* commented since it is already done in displayData()
		self.canvasContext.fillStyle = "#fff";
		self.canvasContext.rect(0,0,self.canvas.attr("width"),self.canvas.attr("height"));
		self.canvasContext.fill();
		
		self.hiddenCanvasContext.fillStyle = "#fff";
		self.hiddenCanvasContext.fillRect(0,0,self.hiddenCanvas.attr("width"),self.hiddenCanvas.attr("height"));
		*/
		self.colorToData = {};
		let nextColor = 1;
		
		for (var iBin=0; iBin < bins.length; iBin++) {
			self.canvasContext.beginPath();
		    var x = self.xFocus(d3.timeParse('%Y-%m-%d %H:%M:%S')(bins[iBin][1]));
		    var x2 = self.xFocus(d3.timeParse('%Y-%m-%d %H:%M:%S')(bins[iBin][2]));
		    
		    if (self.displayColorsInBins == true) {
			    /*
			     * Deduce the decomposition in multiple bars from bins[iBin]
			     * Structure : [year,start,end,nbEvents,user1;user2;...,???,type1:nbOcc;type2:nbOcc;...]
			     */
			    var colorsProportion = {}; // nbOccs for each color
			    var eventTypesAssociatedToColor = {}; // nbOccs per event for each color
			    var eventsInfo = bins[iBin][6].split(";");
			    for (var t=0 ; t < eventsInfo.length ; t++) {
			    	var details = eventsInfo[t].split(":");
			    	// TODO fix the agavue situation
			    	var eColor = getCurrentEventColor(details[0]).toString();
			    	//var eColor = getEventColorForAgavue(details[0]);
			    	if (!colorsProportion[eColor]) {
			    		colorsProportion[eColor] = parseInt(details[1]);
			    		eventTypesAssociatedToColor[eColor] = [];
			    	} else {
			    		colorsProportion[eColor] += parseInt(details[1]);
			    	}
		    		eventTypesAssociatedToColor[eColor].push(eventsInfo[t]);
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
				    //var y = self.yFocus(maxHeight-parseInt(bins[iBin][3]));
				    //var binHeight = self.yFocus(parseInt(bins[iBin][3]));
				    var y = 0;
				    var binHeight = 0;
				    
				    if (self.displayFullHeightBins == true) {
				    	y = self.yFocus(maxHeight - (colorsProportion[colorsFound[t]] * maxHeight) / parseInt(bins[iBin][3]));
				    	binHeight = self.yFocus(cumulatedHeight + (colorsProportion[colorsFound[t]] * maxHeight) / parseInt(bins[iBin][3]));
				    } else {
				    	y = self.yFocus(maxHeight-colorsProportion[colorsFound[t]]);
					    binHeight = self.yFocus(cumulatedHeight + colorsProportion[colorsFound[t]]);
				    }
				    //self.canvasContext.fillStyle = "lightblue";//node.attr("fillStyle");
				    self.canvasContext.fillStyle = colorsFound[t].toString();
				    self.canvasContext.fillRect(x, binHeight, x2-x, y);
				    self.canvasContext.lineWidth = 0.25;
				    self.canvasContext.strokeStyle = "black";
				    self.canvasContext.stroke();
				    //  self.canvasContext.fillRect(x, binHeight, x2-x, y);
				    self.canvasContext.closePath();
				    
				    // Attributing a color to data link for the hidden canvas
				    var color = [];
				    // via http://stackoverflow.com/a/15804183
				    if(nextColor < 16777215){
				    	color.push(nextColor & 0xff); // R
				    	color.push((nextColor & 0xff00) >> 8); // G 
				    	color.push((nextColor & 0xff0000) >> 16); // B
	
				    	nextColor += 1;
				    } else {
				    	console.log('Warning : too many colors needed for the main hidden canvas');
				    }
				    
				    let eventTypesColors = [];
				    let splitEventTypes = bins[iBin][5].split(";");
				    for (let idx = 0 ; idx < splitEventTypes.length; idx++) {
				    	eventTypesColors.push(splitEventTypes[idx]+":"+colorsFound[t]);
				    }
				    
				    /* Create the info we want in the tooltip
				    * Structure : [year,
				    * start,
				    * end,
				    * nbEventsInBin,
				    * user1;user2;...,
				    * type1;type2;...,
				    * type1:nbOcc;type2:nbOcc;...
				    * nbEventsInSubBin,
				    * type1:hslColorValue1;type2:hslColorValue1;...]
				   	*/
				    let subBinInfo = [];
				    subBinInfo.push(bins[iBin][0]);
				    subBinInfo.push(bins[iBin][1]);
				    subBinInfo.push(bins[iBin][2]);
				    subBinInfo.push(bins[iBin][3]);
				    subBinInfo.push(bins[iBin][4]);
				    subBinInfo.push(bins[iBin][5]);
				    subBinInfo.push(eventTypesAssociatedToColor[colorsFound[t]].join(';'));
				    subBinInfo.push(colorsProportion[colorsFound[t]]);
				    subBinInfo.push(eventTypesColors.join(';'));//subBinInfo.push(colorsFound[t]);
				    self.colorToData["rgb("+color.join(',')+")"] = subBinInfo;//bins[iBin];
				    
				    // Drawing on the hidden canvas for the tooltip
					self.hiddenCanvasContext.beginPath();
				    self.hiddenCanvasContext.fillStyle = "rgb("+color.join(',')+")";//node.attr("fillStyle");
				    self.hiddenCanvasContext.fillRect(x, binHeight, x2-x, y);
				    self.hiddenCanvasContext.closePath();
				    
				    if (self.displayFullHeightBins == true) {
				    	cumulatedHeight += (colorsProportion[colorsFound[t]] * maxHeight) / parseInt(bins[iBin][3]);
				    } else {
				    	cumulatedHeight += colorsProportion[colorsFound[t]];
				    }
			    }
		    } else {
		    	y = self.yFocus(maxHeight-parseFloat(bins[iBin][3]));
		    	binHeight = self.yFocus(parseFloat(bins[iBin][3]));
			    self.canvasContext.fillStyle = "#04B7FB";
			    self.canvasContext.fillRect(x, binHeight, x2-x, y);
			    self.canvasContext.lineWidth = 0.25;
			    self.canvasContext.strokeStyle = "black";
			    self.canvasContext.stroke();
			    //  self.canvasContext.fillRect(x, binHeight, x2-x, y);
			    self.canvasContext.closePath();
			    
			    // Attributing a color to data link for the hidden canvas
			    var color = [];
			    // via http://stackoverflow.com/a/15804183
			    if(nextColor < 16777215){
			    	color.push(nextColor & 0xff); // R
			    	color.push((nextColor & 0xff00) >> 8); // G 
			    	color.push((nextColor & 0xff0000) >> 16); // B

			    	nextColor += 1;
			    } else {
			    	console.log('Warning : too many colors needed for the main hidden canvas');
			    }
			    
			    let eventTypesColors = [];
			    let splitEventTypes = bins[iBin][5].split(";");
			    for (let idx = 0 ; idx < splitEventTypes.length; idx++) {
			    	let thisEventColor = 
			    	eventTypesColors.push(splitEventTypes[idx]+":"+getEventColor(splitEventTypes[idx]));
			    }
			    
			    /* Create the info we want in the tooltip
			    * Structure : [year,
			    * start,
			    * end,
			    * nbEventsInBin,
			    * user1;user2;...,
			    * type1;type2;...,
			    * type1:nbOcc;type2:nbOcc;...
			    * nbEventsInSubBin,
			    * type1:hslColorValue1;type2:hslColorValue1;...]
			   	*/
			    let subBinInfo = [];
			    subBinInfo.push(bins[iBin][0]);
			    subBinInfo.push(bins[iBin][1]);
			    subBinInfo.push(bins[iBin][2]);
			    subBinInfo.push(bins[iBin][3]);
			    subBinInfo.push(bins[iBin][4]);
			    subBinInfo.push(bins[iBin][5]);
			    subBinInfo.push(bins[iBin][6]);// subBinInfo.push(eventTypesAssociatedToColor[colorsFound[t]].join(';'));
			    subBinInfo.push(bins[iBin][3]);// subBinInfo.push(colorsProportion[colorsFound[t]]);
			    subBinInfo.push(eventTypesColors.join(';'));//subBinInfo.push(colorsFound[t]);
			    self.colorToData["rgb("+color.join(',')+")"] = subBinInfo;//bins[iBin];
			    
			    // Drawing on the hidden canvas for the tooltip
				self.hiddenCanvasContext.beginPath();
			    self.hiddenCanvasContext.fillStyle = "rgb("+color.join(',')+")";//node.attr("fillStyle");
			    self.hiddenCanvasContext.fillRect(x, binHeight, x2-x, y);
			    self.hiddenCanvasContext.closePath();
		    }
		    /*
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
		    y = self.yFocus(maxHeight-parseInt(bins[iBin][3]));
		    binHeight = self.yFocus(parseInt(bins[iBin][3]));
		    
			self.hiddenCanvasContext.beginPath();
		    self.hiddenCanvasContext.fillStyle = "rgb("+color.join(',')+")";//node.attr("fillStyle");
		    self.hiddenCanvasContext.fillRect(x, binHeight, x2-x, y);
		    self.hiddenCanvasContext.closePath();*/
		    
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
		self.canvasOverviewContext.fillStyle = "#04B7FB";
		self.canvasOverviewContext.strokeStyle = "#04B7FB";
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
	
	self.brushed = function() {
		if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") {
			return; // ignore brush-by-zoom
		}
		var s = d3.event.selection || self.xContext.range();
		self.xFocus.domain(s.map(self.xContext.invert, self.xContext));
		self.xPatterns.domain(s.map(self.xContext.invert, self.xContext));
		self.xUsers.domain(s.map(self.xContext.invert, self.xContext));
		/*self.focus.select(".area")
			.attr("d", self.areaFocus);*/
		self.focus.select(".axis--x")
			.call(self.xAxisFocus);
		self.users.select(".axis--x")
			.call(self.xAxisUsers);
		/*self.focus.selectAll(".dot")
			.attr("transform",function(d) {return "translate("+self.xFocus(d.time)+","+self.yFocus(d.height)+")"});*/
		//self.drawCurrentBins();
		self.displayData();
		self.svgFocus.select(".zoom")
			.call(self.zoom.transform, d3.zoomIdentity.scale(self.width / (s[1] - s[0]))
			.translate(-s[0], 0));
		self.svgUsers.select(".zoom")
			.call(self.zoomUsers.transform, d3.zoomIdentity.scale(self.width / (s[1] - s[0]))
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
	    self.switchBinsDisplayStyleFormVisibility();
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
				//console.log("Time (s): "+displaySeconds);
				//console.log("Bounds (s): "+60*60*24*7*3+" - "+60*60*24*3);
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
		//console.log("DisplayIsFine: "+displayIsFine);
		if (displayIsFine == false) {
			//console.log("semantic zoom not fine : "+self.displayMode);
			d3.selectAll(".zoomInfoSpan").attr("class", "zoomInfoSpan");
			if (displaySeconds < 60*60*24*3 ) {	// less than 3 days
				self.displayMode = "events";
				d3.select("#zoomInfoEvent").attr("class","zoomInfoSpan currentZoom");
				//console.log("Going to event display mode");
				self.switchEventDisplayStyleFormVisibility();
				self.switchBinsDisplayStyleFormVisibility();
			} else  {
				if (self.displayMode == "events") {
					self.displayMode = "distributions";
					self.switchEventDisplayStyleFormVisibility();
					self.switchBinsDisplayStyleFormVisibility();
					//console.log("Going from events to distributions");
				}
				if (displaySeconds < 60*60*24*7*3 )	{// less than 3 weeks
					requestHalfDayBins(currentDatasetName);
					self.distributionScale = "halfDay";
					d3.select("#zoomInfoHalfDay").attr("class","zoomInfoSpan currentZoom");
				} else if (displaySeconds < 60*60*24*31*3 )	{// less than 3 months
					requestDayBins(currentDatasetName);
					self.distributionScale = "day";
					d3.select("#zoomInfoDay").attr("class","zoomInfoSpan currentZoom");
				} else if (displaySeconds < 60*60*24*365 ) {// less than 1 year
					requestHalfMonthBins(currentDatasetName);
					self.distributionScale = "halfMonth";
					d3.select("#zoomInfoHalfMonth").attr("class","zoomInfoSpan currentZoom");
				} else if (displaySeconds < 60*60*24*365*3 ) {// less than 3 years
					requestMonthBins(currentDatasetName);
					self.distributionScale = "month";
					d3.select("#zoomInfoMonth").attr("class","zoomInfoSpan currentZoom");
				} else {// more than 3 years
					requestYearBins(currentDatasetName);
					self.distributionScale = "year";
					d3.select("#zoomInfoYear").attr("class","zoomInfoSpan currentZoom");
				}
			}
		}
		self.setupFocusLeftAxis();
		
		// clear the focus canvas and hidden canvas
		self.canvasContext.clearRect(0,0,self.canvas.attr("width"),self.canvas.attr("height"));
		self.hiddenCanvasContext.clearRect(0,0,self.hiddenCanvas.attr("width"),self.hiddenCanvas.attr("height"));
		self.canvasPatternContext.clearRect(0,0,self.canvasPattern.attr("width"),self.canvasPattern.attr("height"));
		/*self.canvasContext.fillStyle = "#fff";
		self.canvasContext.rect(0,0,self.canvas.attr("width"),self.canvas.attr("height"));
		self.canvasContext.fill();
		self.hiddenCanvasContext.fillStyle = "#fff";
		self.hiddenCanvasContext.fillRect(0,0,self.hiddenCanvas.attr("width"),self.hiddenCanvas.attr("height"));*/
		
		switch(self.displayMode) {
		case "distributions":
			//self.displayDistributions();
			self.drawBins(self.bins);
			self.drawPatternOccurrences();
			break;
		case "events":
			//self.displayEvents();
			//console.log("----Draw Events");
			//self.drawPatternOccurrences();
			self.drawEvents();
			self.drawPatternOccurrences();
			break;
		default:
			console.log("Trying to display data in an unknown way. displayMode = "+self.displayMode);
		}
		
		self.drawUsersPatterns();
		
		//self.drawUsers();
		//self.drawPatternBins(self.patternBins);
		//stopRunningTaskIndicator();
	};
	
	self.zoomClick = function() {
		self.zoomRect.call(self.zoom.transform, d3.zoomIdentity.scale(0.2));
		self.zoomRectUsers.call(self.zoomUsers.transform, d3.zoomIdentity.scale(0.2));
		
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
	
	self.controls = d3.select(self.nodeFocusControl);
	
	// Adding the zoom option (+ / -)
	self.currentZoomScale = 1.0;
	
	self.zoomForm = self.controls.append("form")
		.attr("class","displayZoomForm");
	self.zoomForm.append("input")
		.attr("type","button")
		.attr("name","zoom")
		.attr("value","+")
		.classed("clickable", true)
		.attr("id", "zoomIn")
		.on("click", function() {
			console.log("zoomedIn");
			self.currentZoomScale += 0.05;
			self.currentZoomScale = Math.max(0.05, self.currentZoomScale);
			self.zoomRect.call(self.zoom.scaleBy, 1.1);
			self.zoomRectUsers.call(self.zoomUsers.scaleBy, 1.1);
			//console.log("Zoom: "+self.currentZoomScale);
		});
	self.zoomForm.append("input")
		.attr("type","button")
		.attr("name","zoom")
		.attr("value","-")
		.classed("clickable", true)
		.attr("id", "zoomOut")
		.on("click", function() {
			console.log("zoomedOut");
			self.currentZoomScale -= 0.05;
			self.currentZoomScale = Math.max(1.0, self.currentZoomScale);
			self.zoomRect.call(self.zoom.scaleBy, 0.9);
			self.zoomRectUsers.call(self.zoomUsers.scaleBy, 0.9);
			//console.log("Zoom: "+self.currentZoomScale);
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
	
	self.binsDisplayStyleForm = self.controls.append("form")
						.style("margin-left","15px")
						.attr("class","displayControlForm")
						.style("float","right");
	self.binsDisplayStyleForm.append("label")
		.text("Colors: ")
		.style("order","3");
	self.binsDisplayStyleForm.append("input")
		.attr("id","displayBinColorInput")
		.attr("type","checkbox")
		.attr("name","scale")
		.classed("clickable", true)
		.property("checked",false)
		.style("order","4")
		.attr("value","Colors")
		.on("change", function() {
			self.displayColorsInBins = this.checked;
			if (this.checked == true) {
				d3.select("#displayBinFullHeightInput").style("visibility","visible");
				d3.select(d3.select("#displayBinFullHeightInput").node().previousSibling).style("visibility","visible");
			} else {
				self.displayFullHeightBins = false;
				d3.select("#displayBinFullHeightInput").property("checked",false)
					.style("visibility","hidden");
				d3.select(d3.select("#displayBinFullHeightInput").node().previousSibling).style("visibility","hidden");
			}
			self.displayData();
	});
	self.binsDisplayStyleForm.append("label")
		.text("Full height: ")
		.style("order","1")
		.style("visibility","hidden");
	self.binsDisplayStyleForm.append("input")
		.attr("id","displayBinFullHeightInput")
		.attr("type","checkbox")
		.attr("name","scale")
		.classed("clickable", true)
		.property("checked",false)
		.style("visibility","hidden")
		.style("order","2")
		.attr("value","Full height")
		.on("change", function() {
			self.displayFullHeightBins = this.checked;
			if (this.checked == true) {
				/*d3.select("#displayBinColorInput").style("visibility","hidden");
				d3.select(d3.select("#displayBinColorInput").node().previousSibling).style("visibility","hidden");
			*/} else {
				d3.select("#displayBinColorInput").style("visibility","visible");
				d3.select(d3.select("#displayBinColorInput").node().previousSibling).style("visibility","visible");
			}
			self.displayData();
		});
	
	self.switchBinsDisplayStyleFormVisibility = function() {
		var currentVisibility = self.binsDisplayStyleForm.style("display");
		switch(currentVisibility) {
			case "none":
				self.binsDisplayStyleForm.style("display","flex");
				break;
			default:
				self.binsDisplayStyleForm.style("display","none");
		}
	}
	
	/**
	 * Displays the expected left axis for the focus view
	 * 	according to the displayMode and eventDisplayStyle parameters
	 */
	self.setupFocusLeftAxis = function() {
		switch(self.displayMode) {
		case "distributions":
			self.yFocus = d3.scaleLinear().range([self.marginFocus.size,0]);
			break;
		case "events":
			switch(self.eventDisplayStyle) {
			case "type":
				self.yFocus = d3.scaleBand()
		    		.range([0, self.marginFocus.size])
		    		.paddingInner(0.1);
				break;
			case "time":
				self.yFocus = d3.scaleLinear().range([self.marginFocus.size,0]);
				break;
			default:
			}
			break;
		default:
		}
		self.yAxisFocus = d3.axisLeft(self.yFocus);
		d3.select("#focusLeftAxis")
			.call(self.yAxisFocus);
	}
	
	self.customizeFocusLeftAxis = function() {
		d3.select("#focusLeftAxis")
			.selectAll(".tick text")
			.attr("fill", function(d,i) {
				return colorList[d][0].toString();
			})
			.text(function(d,i) {
				return itemShapes[d];
			});
	}
	
	self.eventDisplayStyle = "type";
	
	self.changeEventDisplayStyle = function() {
	    if (this.value === "type") {
	    	self.eventDisplayStyle = "type";
	    	// change the left axis
	    	self.yFocus = d3.scaleBand()
	    		.range([0, self.marginFocus.size])
	    		.paddingInner(0.1);
	    } else if (this.value === "time") {
    		self.eventDisplayStyle = "time";
    		
	    } else if (this.value === "user") {
    		self.eventDisplayStyle = "user";
	    } else if (this.value === "showOnlyHighlighted") {
	    	let optionChecked = self.showOnlyHighlightedInFocusForm.select("input").property("checked");
	    	self.showOnlyHighlightedInFocus = optionChecked;
	    }
	    self.displayData();
	};
	
	self.eventDisplayStyleForm = self.controls.append("form")
						.style("margin-left","15px")
						.attr("class","displayControlForm")
						.style("display","none")
						.style("float","right");
	self.eventDisplayStyleForm.append("label")
		.text("Order events by: ");
	self.eventDisplayStyleForm.append("label")
		.text("Type")
	  .append("input")
		.attr("type","radio")
		.attr("name","scale")
		.classed("clickable", true)
		.property("checked",true)
		.attr("value","type");
	self.eventDisplayStyleForm.append("label")
		.text("Time")
	  .append("input")
		.attr("type","radio")
		.attr("name","scale")
		.attr("value","time")
		.classed("clickable", true);
	self.eventDisplayStyleForm.selectAll("input").on("change", self.changeEventDisplayStyle);
	
	self.switchEventDisplayStyleFormVisibility = function() {
		var currentVisibility = self.eventDisplayStyleForm.style("display");
		switch(currentVisibility) {
			case "none":
				self.eventDisplayStyleForm.style("display","flex");
				self.showOnlyHighlightedInFocusForm.style("display", "flex");
				break;
			default:
				self.eventDisplayStyleForm.style("display","none");
				self.showOnlyHighlightedInFocusForm.style("display", "none");
		}
	}
	
	self.showOnlyHighlightedInFocus = false;
	
	self.showOnlyHighlightedInFocusForm = self.controls.append("form")
						.style("margin-left","15px")
						.attr("class","displayControlForm")
						.style("display","none")
						.style("float","right");
	self.showOnlyHighlightedInFocusForm.append("label")
		.text("Only show highlighted: ")
	  .append("input")
		.attr("type","checkbox")
		.attr("name","showOnlyHighlighted")
		.property("checked",false)
		.classed("clickable", true)
		.attr("value","showOnlyHighlighted");

	self.showOnlyHighlightedInFocusForm.selectAll("input").on("change", self.changeEventDisplayStyle);
	
	self.displayToolTipGeneral = function(data) {
		/* Structure : 
		 * [year,
	     * start,
	     * end,
	     * nbEventsInBin,
	     * user1;user2;...,
	     * type1;type2;...,
	     * type1:nbOcc;type2:nbOcc;...
	     * nbEventsInSubBin,
		 * type1:hslColorValue1;type2:hslColorValue1;...]
	   	 */
		/*var message = "";
		
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
				message += data[3]+" events across "+nbUsers+" users<br>";
				message += data[7]+" in this subpart:";
				for (var i = 0; i < nbOccs.length; i++) {
					var occ = nbOccs[i].split(":");
					var percentage = parseInt(occ[1])/parseInt(data[3]);
					
					let hslValues = data[8].split(";");
					let hslValue = 0;
					for (let idx = 0; idx < hslValues.length; idx++) {
						if (hslValues[idx].split(":")[0] == occ[0]) {
							hslValue = parseInt(hslValues[idx].split(":")[1]);
							break;
						}
					}
					
					
					
					//Create an svg node outside of the DOM to get its inner HTML
					var divOutsideOfDom = document.createElementNS("http://www.w3.org/1999/xhtml","div");
					divOutsideOfDom.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
					
					var div = d3.select(divOutsideOfDom);*/
					/* Create an event type line with svg for the event symbols
					var svg = div.append("svg")
						.attr("width", 16)
						.attr("height", 16);
					svg.append("path")
						.attr("d",d3.symbol().type(itemShapes[occ[0]]).size(60))
						.attr("transform","translate(8,8)")
						.attr("stroke", colorList[occ[0]].toString())
						.attr("fill","none");*/
					/* create an event type line with utf-8 for the event symbols */
					/*div.append("span")
						.style("color",colorList[occ[0]][0].toString())
						.text(itemShapes[occ[0]]);
					message += "<br>"+div.html()+"&nbsp;"+occ[0]+" : "+occ[1]+" ("+(percentage*100).toPrecision(3)+"%)";
					div.remove(); 
				}
			}
			break;
		case "events":
				splitData = data.split(";");
				message = "Type: " + splitData[0] + "<br>";
				message += "Time: " + splitData[1] + "<br>";
				message += "User: " + splitData[3] + "<br>";
				message += "Properties:";
				for(var i = 4; i < splitData.length; i++)
					message += "<br>&nbsp;&nbsp;&nbsp;&nbsp;"+splitData[i];
		}*/
		updateTooltip(data, "general");
	}
	
	self.displayToolTipForAgavue = function(data) {
		/* Structure : 
		 * [year,
	     * start,
	     * end,
	     * nbEventsInBin,
	     * user1;user2;...,
	     * type1;type2;...,
	     * type1:nbOcc;type2:nbOcc;...
	     * nbEventsInSubBin,
	     * hslColorValue1]
	   	 */
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
				message += data[3]+" events across "+nbUsers+" users<br>";
				message += data[7]+" in this subpart:";
				for (var i = 0; i < nbOccs.length; i++) {
					var occ = nbOccs[i].split(":");
					var percentage = parseInt(occ[1])/parseInt(data[3]);
					
					//Create an svg node outside of the DOM to get its inner HTML
					var divOutsideOfDom = document.createElementNS("http://www.w3.org/1999/xhtml","div");
					divOutsideOfDom.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
					
					var div = d3.select(divOutsideOfDom);
					var svg = div.append("svg")
						.attr("width", 16)
						.attr("height", 16);
					svg.append("path")
						.attr("d",d3.symbol().type(itemShapes[occ[0]]).size(60))
						.attr("transform","translate(8,8)")
						.attr("stroke", "hsl("+parseInt(data[8])+",100%,50%)"/*d3.rgb(parseInt(data[8][0]),parseInt(data[8][1]),parseInt(data[8][2]))/*"hsl("+colorList[occ[0]]+",100%,50%)"/*d3.hsl(parseFloat(eColor),100,50).rgb()*/)
						.attr("fill","none");
					//console.log("Html :");
					//console.log(svg.html());
					message += "<br>"+div.html()+"&nbsp;"+occ[0]+" : "+occ[1]+" ("+(percentage*100).toPrecision(3)+"%)";
					div.remove();
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
		updateTooltip(message, "agavue");
	}
	
	self.displayToolTip = function(data) {
		switch(currentDatasetName) {
		case "Agavue":
		case "miniAgavue":
			self.displayToolTipForAgavue(data);
			break;
		default:
			self.displayToolTipGeneral(data);
		}
	}
	
	self.displayToolTipSessionPatterns = function(data) {
		/* Structure : 
		 * ["name: number"]
	   	 */
		/*var message = "";
		
		if (data.length == 0)
			message = "No pattern in this session";
		else {
			for (let pIdx = 0; pIdx < data.length; pIdx++) {
				message += data[pIdx];
				if (pIdx + 1 < data.length)
					message += "<br>"
			}
		}*/
		updateTooltip(data, "session");
	}
	
	// Parameters about size and margin of the timeline's parts
	self.marginFocus = {"top": 0,"right": 40,"bottom": 20,"left": 50,"size": 250};
	self.marginContext = {"top": 0,"right": 40,"bottom": 20,"left": 50,"size": 50};
	self.marginUsers =  {"top": 0,"right": 40,"bottom": 20,"left": 50,"size": 250};
	
	self.width = +self.parentNode.clientWidth
			- Math.max(self.marginFocus.left, self.marginContext.left)
			- Math.max(self.marginFocus.right, self.marginContext.right);
	self.widthContext = +self.parentNode.clientWidth
			- self.marginContext.left
			- self.marginContext.right;
	self.heightFocus = self.marginFocus.size//+self.parentNode.clientHeight
			+ self.marginFocus.top + self.marginFocus.bottom;
	self.heightContext = self.marginContext.size//+self.parentNode.clientHeight
			+ self.marginContext.top + self.marginContext.bottom;
	self.heightUsers = self.marginUsers.size
			+ self.marginUsers.top + self.marginUsers.bottom;
	
	self.height = self.heightFocus
		+ self.heightContext
		+ self.heightUsers
		+ 5*20;
	
	// adjust the size of the whole timeline
	//d3.select(self.parentNode).style("height",self.height.toString()+"px");
	
	// The timeline's parts
	self.canvasPattern = d3.select(self.nodeFocus).append("canvas")
		.attr("width",self.width)
		.attr("height",self.marginFocus.size)
		.style("position","absolute")
		.style("top",(self.marginFocus.top).toString()+"px")
		.style("left",self.marginFocus.left.toString()+"px")
		.style("height", self.marginFocus.size+"px");	
	self.canvasPatternContext = self.canvasPattern.node().getContext("2d");
	
	self.canvas = d3.select(self.nodeFocus).append("canvas")
		.attr("width",self.width)
		.attr("height",self.marginFocus.size)
		.style("position","relative")
		.style("top",(self.marginFocus.top).toString()+"px")
		.style("left",self.marginFocus.left.toString()+"px")
		.style("height", self.marginFocus.size+"px");	
	self.canvasContext = self.canvas.node().getContext("2d");

	self.canvasOverview = d3.select(self.nodeOverview).append("canvas")
		.attr("width",self.widthContext)
		.attr("height",self.marginContext.size)
		.style("position","relative")
		.style("top",(self.marginContext.top).toString()+"px")
		.style("left",self.marginContext.left.toString()+"px")
		.style("height", self.marginContext.size+"px");	
	self.canvasOverviewContext = self.canvasOverview.node().getContext("2d");
	
	self.hiddenCanvas = d3.select(self.nodeFocus).append("canvas")
		.attr("width",self.width)
		.attr("height",self.marginFocus.size)
		.style("position","absolute")
		.style("top",self.marginFocus.top.toString()+"px")
		.style("left", (self.marginFocus.left - self.width).toString()+"px")
		.style("display","none");
	self.hiddenCanvasContext = self.hiddenCanvas.node().getContext("2d");

	self.hiddenCanvasPatterns = d3.select(self.nodeFocus).append("canvas")
		.attr("width",self.width)
		.attr("height",self.marginFocus.size)
		.style("position","absolute")
		.style("top", self.marginFocus.top.toString()+"px")
		.style("left", (self.marginFocus.left - self.width).toString()+"px")
		.style("display","none");	
	self.hiddenCanvasPatternsContext = self.hiddenCanvasPatterns.node().getContext("2d");
	
	self.canvasUsers = d3.select(self.nodeUsers).append("canvas")
		.attr("width",self.width)
		.attr("height",self.marginUsers.size)
		.style("position","relative")
		.style("top",(self.marginUsers.top).toString()+"px")
		.style("left",self.marginUsers.left.toString()+"px")
		.style("height", self.marginUsers.size+"px");	
	self.canvasUsersContext = self.canvasUsers.node().getContext("2d");
	
	self.hiddenCanvasUsers = d3.select(self.nodeUsers).append("canvas")
		.attr("width",self.width)
		.attr("height",self.marginUsers.size)
		.style("position","relative")
		.style("top",self.marginUsers.top.toString()+"px")
		.style("left", (self.marginUsers.left - self.width).toString()+"px")
		.style("display","none");
	self.hiddenCanvasUsersContext = self.hiddenCanvasUsers.node().getContext("2d");
	
	self.colorToData = {}; // Binding between the hidden canvas and the drawn one
	
	self.svgFocus = d3.select(self.nodeFocus).append("svg")
		.attr("width",self.parentNode.clientWidth)
		.attr("height",self.heightFocus)
		/*.attr("height",self.parentNode.clientHeight-15)*/
		.style("position","absolute")
		.style("top","0")
		.style("left","0");	
	
	self.svgOverview = d3.select(self.nodeOverview).append("svg")
		.attr("width",self.parentNode.clientWidth)
		.attr("height",self.heightContext)
		/*.attr("height",self.parentNode.clientHeight-15)*/
		.style("position","absolute")
		.style("top","0")
		.style("left","0");
	
	self.svgUsers = d3.select(self.nodeUsers).append("svg")
		.attr("width",self.parentNode.clientWidth)
		.attr("height",self.heightUsers)
		/*.attr("height",self.parentNode.clientHeight-15)*/
		.style("position","absolute")
		.style("top","0")
		.style("left","0");

	// Parameters for the various axis
	self.parseDate = d3.timeParse("%Y-%M-%d %H:%m:%s");
	self.xFocus = d3.scaleTime().range([0, self.width]);
	self.xContext = d3.scaleTime().range([0,self.widthContext]);
	self.yFocus = d3.scaleLinear().range([self.marginFocus.size,0]);
	self.yContext = d3.scaleLinear().range([self.marginContext.size,0]);
	self.xPatterns = d3.scaleTime().range([0, self.width]);
	self.yPatterns = d3.scalePoint().range([self.marginFocus.size,0]);
	self.xUsers = d3.scaleTime().range([0, self.width]);
	self.yUsers = d3.scaleBand()
			.range([0, self.marginUsers.size])
			.paddingInner(0.2);
	self.xAxisFocus = d3.axisBottom(self.xFocus);
	self.xAxisContext = d3.axisBottom(self.xContext);
	self.yAxisFocus = d3.axisLeft(self.yFocus);//.tickSizeInner(-self.width);
	self.yAxisPatterns = d3.axisRight(self.yPatterns).tickSizeInner(-self.width);
	self.xAxisUsers = d3.axisBottom(self.xUsers);
	self.yAxisUsers = d3.axisLeft(self.yUsers);//.tickSizeInner(-self.width);
	// The brush component of the context part
	self.brush = d3.brushX()
		.extent([[0, 0], [self.widthContext, self.marginContext.size]])
		.on("brush end", self.brushed);
	// The brush component of the users part
	
	// The zoomable rectangle on the focus part
	self.zoom = d3.zoom()
		.scaleExtent([1, Infinity])
		.translateExtent([[0, 0], [self.width, self.marginFocus.size]])
		.extent([[0, 0], [self.width, self.marginFocus.size]])
		.on("zoom", self.zoomed);
	
	// The zoomable rectangle on the user part
	self.zoomUsers = d3.zoom()
		.scaleExtent([1, Infinity])
		.translateExtent([[0, 0], [self.width, self.marginUsers.size]])
		.extent([[0, 0], [self.width, self.marginUsers.size]])
		.on("zoom", self.zoomedUsers);
	
	// Adding the axis to the svg area
	// focus part of the timeline
	self.focus = self.svgFocus.append("g")
	    .attr("class", "focus")
	    .attr("transform", "translate("+self.marginFocus.left+","+self.marginFocus.top+")");
	// Creating the context part of the timeline
	self.context = self.svgOverview.append("g")
	    .attr("class", "context")
	    .attr("transform", "translate("+self.marginContext.left+","+self.marginContext.top+")");
	// Creating the users part for the timeline
	self.users = self.svgUsers.append("g")
	    .attr("class", "users")
	    .attr("transform", "translate("+self.marginUsers.left+","+self.marginUsers.top+")");
	// Creating the xAxis and yAxis for the focus part of the timeline
	self.focus.append("g")
		.attr("class","axis axis--x")
		.attr("transform", "translate(0," + (self.marginFocus.size + self.marginFocus.top) + ")")
		.call(self.xAxisFocus);
	self.focus.append("g")
		.attr("class", "axis axis--y")
		.attr("id", "focusLeftAxis")
		.call(self.yAxisFocus);
		//.selectAll(".tick line").attr("stroke","lightblue").attr("stroke-width","0.5");
	// Creating the xAxis for the context part of the timeline
	self.context.append("g")
		.attr("class","axis axis--x")
		.attr("transform", "translate(0," + (self.marginContext.size + self.marginContext.top) + ")")
		.call(self.xAxisContext);
	// Creating the yAxis for the pattern part of the timeline
	self.focus.append("g")
		.attr("class", "axis axis--y")
		.attr("id", "focusRightAxis")
	    .attr("transform", "translate("+self.width+",0)")
		.call(self.yAxisPatterns)
		.selectAll(".tick line").attr("stroke","lightblue").attr("stroke-width","0.5");
	// Creating the xAxis for the users part of the timeline
	self.users.append("g")
		.attr("class","axis axis--x")
		.attr("transform", "translate(0," + (self.marginUsers.size + self.marginUsers.top) + ")")
		.call(self.xAxisUsers);
	// Creating the yAxis for the user part of the timeline
	self.users.append("g")
		.attr("class", "axis axis--y")
		.call(self.yAxisUsers)
		//.attr("transform", "translate(0,0)")
		.selectAll(".tick line").attr("stroke","lightblue").attr("stroke-width","0.5");
	// Adding the brush to the context part
	self.context.append("g")
		.attr("class", "brush")
		.call(self.brush)
		.call(self.brush.move, self.xFocus.range());
	
	self.showPosition = function() {
		if (self.svgPointerH.style("display") == "none") {
			self.svgPointerH.style("display", "block");
			self.svgPointerV.style("display", "block");
		} else {
			self.svgPointerH.style("display", "none");
			self.svgPointerV.style("display", "none");
		}
	}
	
	self.showTarget = function() {
		if (self.svgPointerHB.style("display") == "none") {
			self.svgPointerHB.style("display", "block");
			self.svgPointerVB.style("display", "block");
		} else {
			self.svgPointerHB.style("display", "none");
			self.svgPointerVB.style("display", "none");
		}
	}
	
	self.svgPointerH = self.svgFocus.append("line")
		.attr("transform", "translate(" + self.marginFocus.left + "," + self.marginFocus.top + ")")
		.attr("id","pointerH")
		.attr("x1","0")
		.attr("x2",self.width)
		.attr("y1","0")
		.attr("y2","0")
		.style("stroke","rgb(255,0,0)")
		.style("stroke-width","1")
		.style("display","none");
	self.svgPointerV = self.svgFocus.append("line")
		.attr("transform", "translate(" + self.marginFocus.left + "," + self.marginFocus.top + ")")
		.attr("id","pointerV")
		.attr("x1","0")
		.attr("x2","0")
		.attr("y1",self.heightFocus-self.marginFocus.bottom)
		.attr("y2","0")
		.style("stroke","rgb(255,0,0)")
		.style("stroke-width","1")
		.style("display","none");
	
	self.svgPointerHB = self.svgFocus.append("line")
		.attr("transform", "translate(" + self.marginFocus.left + "," + self.marginFocus.top + ")")
		.attr("id","pointerH")
		.attr("x1","0")
		.attr("x2",self.width)
		.attr("y1","0")
		.attr("y2","0")
		.style("stroke","rgb(0,0,255)")
		.style("stroke-width","1")
		.style("display","none");
	self.svgPointerVB = self.svgFocus.append("line")
		.attr("transform", "translate(" + self.marginFocus.left + "," + self.marginFocus.top + ")")
		.attr("id","pointerV")
		.attr("x1","0")
		.attr("x2","0")
		.attr("y1",self.heightFocus-self.marginFocus.bottom)
		.attr("y2","0")
		.style("stroke","rgb(0,0,255)")
		.style("stroke-width","1")
		.style("display","none");
	
	self.tooltipCreated = false;
	// Creating the zoomable rectangle on the focus part of the timeline
	self.zoomRect = self.svgFocus.append("rect")
		.attr("class", "zoom")
		.attr("width", self.width)
		.attr("height", self.marginFocus.size)
		.attr("transform", "translate(" + self.marginFocus.left + "," + self.marginFocus.top + ")")
		.call(self.zoom)
		.on("mousemove", function(){	// Handling picking
			var coords = d3.mouse(this);
			
			self.svgPointerH.attr("y1",coords[1]);
			self.svgPointerH.attr("y2",coords[1]);
			self.svgPointerV.attr("x1",coords[0]);
			self.svgPointerV.attr("x2",coords[0]);
			
			var pixelColor = self.hiddenCanvasContext.getImageData(coords[0], coords[1],1,1).data;
			if (pixelColor[3] != 0) { // if the pixel is not transparent (i.e. not background)
			//if (pixelColor[0] != 255 && pixelColor[1] != 255 && pixelColor[2] != 255) { old test when the background was white
				var colorString = "rgb("+pixelColor[0]+","+pixelColor[1]+","+pixelColor[2]+")";
				//console.log("-----");
				//console.log(pixelColor);
				//console.log(colorString);
				var data = self.colorToData[colorString];
				//console.log(data);
				//console.log("coords: "+coords);
				/*console.log("colorString: "+colorString);
				console.log(data);*/
				if (typeof data !== 'undefined') {
					self.displayToolTip(data);
					/*var message = "Year "+data[0]+"<br>"+"("+data[1]+" to "+data[2]+")"+"<br>"+data[3]+" events";
					tooltip.show(message,600);*/
					
					if (self.displayMode == "events") {
						if (self.eventDisplayStyle == "type") {
							let dataTs = data.split(";")[1];
							let dataType = data.split(";")[0];
							let ts = d3.timeParse('%Y-%m-%d %H:%M:%S')(dataTs);
							let dataX = self.xFocus(ts);
							let dataY = self.yFocus(dataType) + self.yFocus.bandwidth()/2;
							
							self.svgPointerHB.attr("y1",dataY);
							self.svgPointerHB.attr("y2",dataY);
							self.svgPointerVB.attr("x1",dataX);
							self.svgPointerVB.attr("x2",dataX);
						}
						if (self.eventDisplayStyle == "time") {
							// Need a way to get the height at which the data is represented to work fully
							let dataTs = data.split(";")[1];
							let dataType = data.split(";")[0];
							let ts = d3.timeParse('%Y-%m-%d %H:%M:%S')(dataTs);
							let dataX = self.xFocus(ts);
							let dataY = 0;//self.yFocus(dataType) + self.yFocus.bandwidth()/2;
							
							self.svgPointerHB.attr("y1",dataY);
							self.svgPointerHB.attr("y2",dataY);
							self.svgPointerVB.attr("x1",dataX);
							self.svgPointerVB.attr("x2",dataX);
						}
					}
				}
				self.tooltipCreated = true;
			} else {
				if (self.tooltipCreated == true) {
					clearTooltip();
				}
			}
		})
		.on("mouseout", function(){
			if (self.tooltipCreated == true) {
				clearTooltip();
			}
		});
	// Creating the zoomable rectangle on the user patterns part of the timeline
	self.userTooltipCreated = false;
	self.hoveredSession = null;
	self.zoomRectUsers = self.svgUsers.append("rect")
		.attr("class", "zoom")
		.attr("width", self.width)
		.attr("height", self.marginUsers.size)
		.attr("transform", "translate(" + self.marginUsers.left + "," + self.marginUsers.top + ")")
		.call(self.zoomUsers)
		.on("mousemove", function(){	// Handling picking
			var coords = d3.mouse(this);
			// offset the y mouse position according to the sessions offset
			coords[1] = coords[1] - self.yUsers.bandwidth()/2;
			let mouseDate = self.xUsers.invert(coords[0]).getTime();
			let userListDomain = self.yUsers.domain();
			let userListRange = self.yUsers.range();
			
			let data = [];
			
			let mouseUserIndex = Math.round((coords[1] / self.yUsers.step()));
			let mouseUser = userListDomain[mouseUserIndex];//userListDomain[d3.bisect(userListRange, coords[1]) -2];
			
			// If there is no user under the mouse, no point in trying to detect something
			if (mouseUser == undefined) {
				if (self.userTooltipCreated == true) {
					clearTooltip();
				}
				return;
			}
			
			data.push(mouseUser);
			
			//console.log("Mouse x-y: "+coords[0]+"-"+coords[1]+" / "+mouseUser+" at "+self.xUsers.invert(coords[0]));
			// get the correct user session
			let theSession = null;
			for (let sessIt=0; sessIt < userSessions[mouseUser].length; sessIt++) {
				self.hoveredSession = null;
				let sess = userSessions[mouseUser][sessIt];
				if (sess.start > mouseDate)
					break;
				if (sess.end >= mouseDate) {
					theSession = sess;
					self.hoveredSession = sess;
					break;
				}
			}
			// Display the tooltip if we have found a session
			if (theSession !== null) {
				// Add the number of patterns to the data
				data.push(Object.keys(theSession.count).length);
				data.push(theSession.start);
				data.push(theSession.end);
				// Addthe patterns to the data
				if (Object.keys(theSession.count).length > 0) {
					Object.keys(theSession.count).forEach(function(id, idx) {
						let msg = patternsInformation[id][0]+": ";
				    	msg += theSession.count[id];
				    	data.push(msg);
					})
				}
			} else {
				data.push(-1);
			}
			self.displayToolTipSessionPatterns(data);
			self.userTooltipCreated = true;
			
			 // Old version, with the pixel colors
			/*var pixelColor = self.hiddenCanvasUsersContext.getImageData(coords[0], coords[1],1,1).data;
			if (pixelColor[0] != 255 && pixelColor[1] != 255 && pixelColor[2] != 255) {
				var colorString = "rgb("+pixelColor[0]+","+pixelColor[1]+","+pixelColor[2]+")";
				var data = self.colorToDataUserPatterns[colorString];
				if (typeof data !== 'undefined') {
					self.displayToolTip(data);
				}
				self.userTooltipCreated = true;
			} else {
				if (self.userTooltipCreated == true)
					tooltip.hide();
			}*/
		})
		.on("mouseout", function(){
			if (self.userTooltipCreated == true) {
				clearTooltip();
			}
		})
		.on("click", function() {
			if (self.hoveredSession != null)
				self.focusOnSession(self.hoveredSession.start, self.hoveredSession.end);
		});
	
	self.context.select(".brush").select(".selection")
		.attr("fill","white")
		.attr("stroke","black")
		.attr("stroke-width","1")
		.attr("fill-opacity","0.2");
	
	/****************************/
	/*			Methods			*/
	/****************************/
	
	/*self.focusOnSession = function(start, end) {
		self.context.select(".brush")
			.call(self.brush.move, [self.xFocus(start), self.xFocus(end)]);
	}*/
	
	self.updateContextBounds = function(start, end) {
		console.log("Updating context bounds");
		
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
			.range([0,self.widthContext]);
		self.xPatterns = d3.scaleTime()
		.domain([startTime,endTime])
			.range([0,self.width]);
		self.xUsers = d3.scaleTime()
		.domain([startTime,endTime])
			.range([0,self.width]);
		/*self.yUsers = d3.scaleBand()
			.domain(userList)
			.range([self.marginUsers.size, 0]);*/
			
		self.xAxisFocus = d3.axisBottom(self.xFocus);
		self.xAxisContext = d3.axisBottom(self.xContext);
		self.xAxisUsers = d3.axisBottom(self.xUsers);
		//self.yAxisUsers = d3.axisLeft(self.yUsers);

		self.focus.select(".axis--x").call(self.xAxisFocus);
		self.context.select(".axis--x").call(self.xAxisContext);
		self.users.select(".axis--x").call(self.xAxisUsers);
		self.users.select(".axis--y").call(self.yAxisUsers);
	}
	
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
	      .call(self.yAxisFocus);
			//.selectAll(".tick line").attr("stroke","lightblue").attr("stroke-width","0.5");

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
	      .call(self.yAxisFocus);
			//.selectAll(".tick line").attr("stroke","lightblue").attr("stroke-width","0.5");

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
		//console.log("Display distributions");
		self.drawCanvas();	// Replace with a drawing function handling distributions
		// Code for a transition
		/*var t = svg.transition().duration(750),
			g = t.selectAll(".group").attr("transform", function(d) { return "translate(0," + y0(d.key) + ")"; });
		g.selectAll("rect").attr("y", function(d) { return y1(d.value); });
		g.select(".group-label").attr("y", function(d) { return y1(d.values[0].value / 2); })*/
	};
	
	self.displayEvents = function() {
		//console.log("Display events");
		self.drawCanvas();	// Replace with a drawing function handling events
		// Code for a transition
		/*var t = svg.transition().duration(750),
			g = t.selectAll(".group").attr("transform", "translate(0," + y0(y0.domain()[0]) + ")");
		g.selectAll("rect").attr("y", function(d) { return y1(d.value + d.valueOffset); });
		g.select(".group-label").attr("y", function(d) { return y1(d.values[0].value / 2 + d.values[0].valueOffset); })*/
	};
	
	self.drawCanvas = function() {
		//console.log("Drawing canvas");
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
		
		//console.log("data drawn");
	};
	
	self.drawUsersTest = function() {
		//console.log("drawing users");
		
		var displayStep = (self.yFocus.domain()[1] - self.yFocus.domain()[0] - 2) / datasetInfo["numberOfDifferentEvents"];

		self.canvasUsersContext.fillStyle = "#fff";
		self.canvasUsersContext.rect(0,0,self.canvasUsers.attr("width"),self.canvasUsers.attr("height"));
		self.canvasUsersContext.fill();
		var drawCount = 0;
		
		/*self.hiddenCanvasContext.fillStyle = "#fff";
		self.hiddenCanvasContext.fillRect(0,0,self.hiddenCanvas.attr("width"),self.hiddenCanvas.attr("height"));
		
		self.colorToData = {};
		let nextColor = 1;
		*/
		// get the last accessor point before the time-span start
		var firstIndex = getEventAccessorAtDate(self.xFocus.domain()[0]);
		//console.log("Retreived first index is "+firstIndex);
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
		//console.log("drawing from event "+firstIndex);
		var endReached = false;
		while (!endReached) {
			var info = timeOrderedEvents[firstIndex][0].split(";");
			var time = d3.timeParse('%Y-%m-%d %H:%M:%S')(info[1]);
			if (time > self.xFocus.domain()[1] || firstIndex == timeOrderedEvents.length - 1)
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
				self.canvasContext.strokeStyle = colorList[info[0]][0].toString();//d3.hsl(parseInt(colorList[info[0]]),100,50).rgb();//"green";
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
		//console.log("to event "+firstIndex);
		
		var nbEventsChecked = firstIndex-startingIndex;
		console.log(drawCount+" events drawn, "+nbEventsChecked+" events checked");
	
		
		//console.log("users drawn");
	}
	
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
		//console.log("drawing events by type");
		
		self.yFocus.domain(eventTypes);
		self.yAxisFocus = d3.axisLeft(self.yFocus)
			.tickValues(eventTypes);
		d3.select("#focusLeftAxis").call(self.yAxisFocus);
		
		// Display the event type symbols instead of the event types
		self.customizeFocusLeftAxis();
		
		var drawCount = 0;

		self.canvasContext.save();
		self.hiddenCanvasContext.save();

		self.canvasContext.translate("0.5","0.5");
		self.hiddenCanvasContext.translate("0.5","0.5");
		
		/*self.canvasContext.fillStyle = "#fff";
		self.canvasContext.rect(0,0,self.canvas.attr("width"),self.canvas.attr("height"));
		self.canvasContext.fill();
		
		self.hiddenCanvasContext.fillStyle = "#fff";
		self.hiddenCanvasContext.fillRect(0,0,self.hiddenCanvas.attr("width"),self.hiddenCanvas.attr("height"));
		*/
		self.colorToData = {};
		let nextColor = 100; // 100 instead of 1, to capture all the colors (around 1 the detection isn't working 100% of the time)
		
		// get the last accessor point before the time-span start
		let firstIndex = getEventAccessorAtDate(self.xFocus.domain()[0]);
		//console.log("Retreived first index is "+firstIndex);
		// find the real first index
		var startFound = false;
		var startingIndex = firstIndex; // to see how many events have been check vs how many have been drawn
		while (!startFound) {
			var info = timeOrderedEvents[firstIndex][0].split(";");
			var time = d3.timeParse('%Y-%m-%d %H:%M:%S')(info[1]);
			if (time < self.xFocus.domain()[0])
				firstIndex++;
			else
				startFound = true;
		}
		var nbEventsChecked = firstIndex - startingIndex;
		//console.log("drawing from event "+firstIndex);
		var endReached = false;
		while (!endReached) {
			var info = timeOrderedEvents[firstIndex][0].split(";");
			var time = d3.timeParse('%Y-%m-%d %H:%M:%S')(info[1]);
			if (time > self.xFocus.domain()[1] || firstIndex == timeOrderedEvents.length - 1)
				endReached = true;
			else {
				drawCount++;
				
				// Attributing a color to data link
			    let color = [];
			    // via http://stackoverflow.com/a/15804183
			    if(nextColor < 16777215){
			    	let nextR = Math.max(0, Math.floor(Math.floor(nextColor / 255) / 255));
			    	let nextG = Math.max(0, Math.floor(nextColor / 255) % 255);
			    	let nextB = nextColor % 255;
			    	color = [nextR, nextG, nextB];
			    	
			    	//color.push(nextColor & 0xff); // R
			    	//color.push((nextColor & 0xff00) >> 8); // G 
			    	//color.push((nextColor & 0xff0000) >> 16); // B

			    	nextColor += 1;
			    }
			    self.colorToData["rgb("+color.join(',')+")"] = timeOrderedEvents[firstIndex][0];
			    //console.log("event at index "+firstIndex+" gets color "+color.join(','));
			    firstIndex++;
			    
			    if (self.showOnlyHighlightedInFocus == true) {
			    	if (getCurrentEventColor(info[0], info[3]) == colorList[info[0]][1])
			    		continue;
			    }
			    
				var x = self.xFocus(d3.timeParse('%Y-%m-%d %H:%M:%S')(info[1]));				
				var y = self.yFocus(info[0]) + self.yFocus.bandwidth()/2;
				
				/* Draw the symbol when using svg for the event types
				var symbolGenerator = d3.symbol().type(itemShapes[info[0]])
										.size(self.yFocus.bandwidth())
										.context(self.canvasContext);
				var hiddenSymbolGenerator = d3.symbol().type(itemShapes[info[0]])
										.size(self.yFocus.bandwidth())
										.context(self.hiddenCanvasContext);
				
				//self.canvasContext.rect(x-2.5,y-2.5,5,5);
				self.canvasContext.beginPath();
				self.canvasContext.translate(x,y);
				self.canvasContext.strokeStyle = colorList[info[0]].toString();//d3.hsl(parseInt(colorList[info[0]]),100,50).rgb();//"green";
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
			    self.hiddenCanvasContext.closePath();*/
				
				let trueX = x - self.canvasContext.measureText(itemShapes[info[0]]).width/2;
				let symbolColor = getCurrentEventColor(info[0], info[3]).toString();
				//selectedColorFading
			    self.canvasContext.font = "bold "+self.yFocus.bandwidth()+"px Geneva";
			    self.canvasContext.fillStyle = symbolColor;
			    self.canvasContext.textBaseline="middle";
				self.canvasContext.fillText(itemShapes[info[0]], trueX, y);
			    
				self.hiddenCanvasContext.font = "bold "+self.yFocus.bandwidth()+"px Geneva";
			    self.hiddenCanvasContext.fillStyle = "rgb("+color.join(',')+")";
			    self.hiddenCanvasContext.textBaseline="middle";
				self.hiddenCanvasContext.fillText(itemShapes[info[0]], trueX, y);
				
			}
		}
		//console.log("to event "+firstIndex);
		self.canvasContext.restore();
		self.hiddenCanvasContext.restore();
		nbEventsChecked += drawCount;
		console.log(drawCount+" events drawn, "+nbEventsChecked+" events checked");
		
		//console.log("events drawn");
	}
	
	self.drawEventsByTime = function() {
		
		self.yFocus.domain([0, maxEventAtOneTime + 1]);
		self.yAxisFocus = d3.axisLeft(self.yFocus);
			//.tickValues(eventTypes);
		d3.select("#focusLeftAxis").call(self.yAxisFocus);
		


		self.canvasContext.save();
		self.hiddenCanvasContext.save();

		self.canvasContext.translate("0.5","0.5");
		self.hiddenCanvasContext.translate("0.5","0.5");
		
		
		
		
		// get the last accessor point before the time-span start
		var firstIndex = getEventAccessorAtDate(self.xFocus.domain()[0]);
		//console.log("Retreived first index is "+firstIndex);
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
		//console.log("drawing from event "+firstIndex);
		// get the last accessor point for the end of the time-span
		var lastIndex = getEventAccessorAtDate(self.xFocus.domain()[1]);

		/*self.yFocus.domain([0.0, lastIndex-firstIndex+2]);
		self.focus.select(".axis--y")
	      	.call(self.yAxisFocus);*/

		var drawCount = 0;
		
		/*self.canvasContext.fillStyle = "#fff";
		self.canvasContext.rect(0,0,self.canvas.attr("width"),self.canvas.attr("height"));
		self.canvasContext.fill();
		
		self.hiddenCanvasContext.fillStyle = "#fff";
		self.hiddenCanvasContext.fillRect(0,0,self.hiddenCanvas.attr("width"),self.hiddenCanvas.attr("height"));
*/		
		self.colorToData = {};
		let nextColor = 100;
		
		var endReached = false;
		var previousTime = undefined;
		var previousType = "";
		var currentHeight = 1;
		while (!endReached) {
			var info = timeOrderedEvents[firstIndex][0].split(";");
			var time = d3.timeParse('%Y-%m-%d %H:%M:%S')(info[1]);
			var type = info[0];
			if (!(typeof(previousTime) === "undefined")) {
				if (time.valueOf() == previousTime.valueOf()) {
					if (type == previousType) {	// Jittering
						currentHeight = currentHeight + 1;
						//console.log("Jitter");
					} else {	// Increment
						currentHeight = currentHeight + 1;
						//console.log("    Increment");
					}
				} else {
					currentHeight = 1;
					//console.log("                Reset")
				}
			}
			previousTime = time;
			previousType = type;
			if (time > self.xFocus.domain()[1] || firstIndex == timeOrderedEvents.length - 1)
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
			    
			    firstIndex++;
			    
			    if (self.showOnlyHighlightedInFocus == true) {
			    	if (getCurrentEventColor(info[0], info[3]) == colorList[info[0]][1])
			    		continue;
			    }
			    
				var x = self.xFocus(d3.timeParse('%Y-%m-%d %H:%M:%S')(info[1]));				
				var y = self.yFocus(currentHeight);
				
				/*
				var symbolGenerator = d3.symbol().type(itemShapes[info[0]])
										.size(50)
										.context(self.canvasContext);
				
				var hiddenSymbolGenerator = d3.symbol().type(itemShapes[info[0]])
										.size(50)
										.context(self.hiddenCanvasContext);
				
				self.canvasContext.beginPath();
				self.canvasContext.translate(x,y);
				self.canvasContext.strokeStyle = colorList[info[0]].toString();
				symbolGenerator();
				self.canvasContext.stroke();
				self.canvasContext.translate(-x,-y);
			    self.canvasContext.closePath();
			    
			    self.hiddenCanvasContext.beginPath();
				self.hiddenCanvasContext.translate(x,y);
				self.hiddenCanvasContext.fillStyle = "rgb("+color.join(',')+")";
				hiddenSymbolGenerator();
				self.hiddenCanvasContext.fill();
				self.hiddenCanvasContext.translate(-x,-y);
			    self.hiddenCanvasContext.closePath();*/
				
				let trueX = x - self.canvasContext.measureText(itemShapes[info[0]]).width/2;
				let symbolColor = getCurrentEventColor(info[0], info[3]).toString();
				let fontSize = (self.marginFocus.size / maxEventAtOneTime) - 4;
				fontSize = Math.min(fontSize, 18);
				
			    self.canvasContext.font = "bold "+fontSize+"px Geneva";
			    self.canvasContext.fillStyle = symbolColor;
			    self.canvasContext.textBaseline="middle";
				self.canvasContext.fillText(itemShapes[info[0]], trueX, y);
			    
				self.hiddenCanvasContext.font = "bold "+fontSize+"px Geneva";
			    self.hiddenCanvasContext.fillStyle = "rgb("+color.join(',')+")";
			    self.hiddenCanvasContext.textBaseline="middle";
				self.hiddenCanvasContext.fillText(itemShapes[info[0]], trueX, y);
			}
		}
		//console.log("to event "+firstIndex);

		self.canvasContext.restore();
		self.hiddenCanvasContext.restore();
		var nbEventsChecked = firstIndex-startingIndex;
		console.log(drawCount+" events drawn, "+nbEventsChecked+" events checked");
		
		//console.log("events drawn");
	}
	
	self.drawEventsByUser= function() {
		//console.log("drawing events");
		
		self.yFocus.domain([0.0, datasetInfo["numberOfDifferentEvents"]+2]);
		self.focus.select(".axis--y")
	      	.call(self.yAxisFocus);

		var drawCount = 0;
/*
		self.canvasContext.fillStyle = "#fff";
		self.canvasContext.rect(0,0,self.canvas.attr("width"),self.canvas.attr("height"));
		self.canvasContext.fill();
		
		self.hiddenCanvasContext.fillStyle = "#fff";
		self.hiddenCanvasContext.fillRect(0,0,self.hiddenCanvas.attr("width"),self.hiddenCanvas.attr("height"));
		*/
		self.colorToData = {};
		let nextColor = 1;
		
		// get the last accessor point before the time-span start
		var firstIndex = getEventAccessorAtDate(self.xFocus.domain()[0]);
		//console.log("Retreived first index is "+firstIndex);
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
		//console.log("drawing from event "+firstIndex);
		var endReached = false;
		while (!endReached) {
			var info = timeOrderedEvents[firstIndex][0].split(";");
			var time = d3.timeParse('%Y-%m-%d %H:%M:%S')(info[1]);
			if (time > self.xFocus.domain()[1] || firstIndex == timeOrderedEvents.length - 1)
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
				self.canvasContext.strokeStyle = colorList[info[0]][0].toString();
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
		//console.log("to event "+firstIndex);
		
		var nbEventsChecked = firstIndex-startingIndex;
		console.log(drawCount+" events drawn, "+nbEventsChecked+" events checked");
		
		//console.log("events drawn");
	}
	
};