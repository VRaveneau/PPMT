window.addEventListener ? 
		window.addEventListener("load", init, false) : 
		window.attachEvent && window.attachEvent("onload", init);

/******************************************************************************/
/*																			  */
/*									Variables								  */
/*																			  */
/******************************************************************************/

// Adress of the websocket that we want to connect to
var __websocketAdress__ = config.websocketAdress;
// The actual websocket
var webSocket = null;

// The parameters passed in the URL
var pageParameters = {};

/*************************************/
/*			Display elements		 */
/*************************************/
// Colors available for the event type categories
//First color is brighter, to represent the unselected version
var colorPalet = [
	["#e41a1c","#fbb4ae"], 
	["#377eb8","#b3cde3"],
	["#4daf4a","#ccebc5"],
	["#984ea3","#decbe4"],
	["#ff7f00","#fed9a6"],
	["#a65628","#e5d8bd"],
	["#f781bf","#fddaec"],
	["#999999","#f2f2f2"],
	["#ffff33","#ffffcc"]];
// Shapes available for the event types
var shapesDraw = extendedSymbolTypes[0]; // SVG drawings
var shapesAlpha = [ // Capitalized letters
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
var shapesWriteWhite = [ // UTF-8 symbols
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
var shapesWriteBlack = [ // Filled UTF-8 symbols
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
	"↓"];
// Selected shapes
var shapes = shapesWriteBlack;
// Names for the available shapes
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
// Selected names
var shapeNames = shapeNamesWrite;

/*************************************/
/*			HCI elements			 */
/*************************************/
// The timeline object managing the visualizations
var timeline = null;
// Default number of users shown in the session view
var defaultNbUserShown = 15;
// Number of users shown in the session view
var nbUserShown = defaultNbUserShown;

// Number of elements fully displayed in the highlight summary.
// Beyond this value, only the number of highlighted elements is displayed
var numberOfDetailedHighlights = 5;

// Current input in the user panel's search field
var currentUserSearchInput = "";
// Index of the currently selected suggestion in the user panel's search field
var currentUserSearchSuggestionIdx = -1;
// Users matching the current filter in the user panel's search field
var relatedUsers = [];
// Keyboard key currently down
var currentKeyDownUser = "";
// Whether the mouse pointer is above the user panel's suggestion list or not
var mouseIsOverUserSuggestions = false;

// Current input in the pattern search field
var currentPatternSearchInput = "";
// Current fragment of the pattern search field (what follows the last space)
var currentPatternSearchFragment = "";
// Index of the currently selected suggestion in the pattern search field
var currentPatternSearchSuggestionIdx = -1;
// Patterns matching the current filter in the pattern search field
var relatedEventTypes = [];
// Keyboard key currently down
var currentKeyDown = "";
// Whether the mouse pointer is above the pattern suggestion list or not
var mouseIsOverPatternSuggestions = false;

// Barchart of the number of discovered patterns for each size
var patternSizesChart = new PatternSizesChart();

// Slider controling the support parameter of the algorithm
var supportSlider = null;
// Slider controling the window size parameter of the algorithm
var windowSlider = null;
// Slider controling the size parameter of the algorithm
var sizeSlider = null;
// Slider controling the gap parameter of the algorithm
var gapSlider = null;

// Svg component displaying the activity indicator
var runningTaskIndicatorSvg = d3.select("#top").select("svg").select("circle");

/*************************************/
/*			Data elements			 */
/*************************************/
// Name of the selected dataset
var currentDatasetName = "";

/**
 * Information about the dataset
 * 
 * TODO detail the structure
 */
var datasetInfo = {};

// The categories of event types
var eventTypeCategories = [];
// For each category, the list of event types that belong to it
var eventTypesByCategory = {};
// For each category, the two colors associated with it
var eventTypeCategoryColors = {};

// References to the events of the dataset, associated to the relevant user
var userTraces = {};
// The names of all users present in the dataset
var userList = [];

// The raw dataset -- Used to create the Crossfilter
var rawData = [];
// The Crossfilter containing all the dataset
var dataset = {};
/**
 * The dimensions created from the Crossfilter stored in dataset.
 * 
 * TODO document the dimensions (for now : time - user - time)
 */
var dataDimensions = {};
// Information about each user (start - end - duration)
var userProperties = {};

// Informations about the users
// Each user is an array with the following informations :
// userName - nbEvents - traceDuration - startDate - endDate
var userInformations = [];

// Number of extracted patterns
var numberOfPattern = 0;
// Information about the patterns
var patternsInformation = {};
// The list of ids for all the discovered patterns
var patternIdList = [];
// Known metrics on the patterns
var patternMetrics = {"sizeDistribution":{}};

// The occurrences for each pattern
var patternOccurrences = {};

// List of highlighted event type ids
var highlightedEventTypes = [];

// List of ids of all the patterns selected by the user
var selectedPatternIds = [];

// List of highlighted user names
var highlightedUsers = [];
// Duration between two events beyond which a new session is created
var sessionInactivityLimit = 30*60*1000; // 30 minutes
// The sessions for every user
var userSessions = {};

// Number of trace events sent from the server
var nbEventsReceived = 0;
// Events in the dataset, ordered by time
// Each event is the single element of an array, to allow references to them
var timeOrderedEvents = [];
// Time of reception of the first event
var firstEventReceived = null;
// Time of reception of the last event
var lastEventReceived = null;

// Index map of the events, with two levels of indexation over the time:
// First level has keys with year with century + day of the year (in decimal)
// Second level has keys with hours + minutes
var eventAccessor = {};
var formatAccessorFirstLevel = d3.timeFormat("%Y%j"); // year with century as decimal + day of the year as decimal
var formatAccessorSecondLevel = d3.timeFormat("%H%M"); // hour + minutes
// Maximum number of events at a same time
var maxEventAtOneTime = 0;

/**
 * The color associated with each event type
 */
var colorList = {};
/**
 * The list of event types
 */
var eventTypes = [];
/**
 * Information about each event type.
 * @property {string} category - The category of the event type
 * @property {string} description - The description of the event type
 * @property {string} nbOccs - The number of occurrences of the event type
 * @property {string} code - The code of the shape associated to the event type
 */
var eventTypeInformations = {};

// Number of tasks managed by the activity indicator currently occurring
var runningTaskIndicatorNumber = 0;

/*************************************/
/*			State elements			 */
/*************************************/
//
var patternsLoaded = false;
//
var patternsReceived = false;
// Whether debug mode is active or not
var debugMode = false;
// Whether the pointer target is visible or not in the focus view
var showPointerTarget = false;
// Whether future patterns will be processed or not
var updateUI = true;

// Whether information about the dataset is displayed (false) or not (true)
var datasetInfoIsDefault = true;
// Whether actions are displayed in the history (false) or not (true)
var historyDisplayIsDefault = true;

/**
 * The time period covered by the overview's brush.
 * Contains two values : start and end (in ms)
 */
var currentTimeFilter = [];

// Whether the description of event types is visible or not
var showEventTypeDescription = true;
// Whether the name of event types in a pattern is visible or not
var showPatternText = true;

// Sort order for the list of users. Expected value is one of the following :
// nbEventsDown - nbEventsUp
// nameDown - nameUp
// durationDown - durationUp
// nbSessionsDown - nbSessionsUp
// startDown - startUp
// endDown - endUp
var lastUserSort = "";

// Sort order for the list of event types. Expected value is one of the following :
// nbEventsDown - nbEventsUp
// nameDown - nameUp
// categoryDown - categoryUp
var lastEventTypeSort = "";

// Sort order for the list of patterns. Expected value is one of the following :
// sizeDown - sizeUp
// supportDown - supportUp
// nameDown - nameUp
// nbUsersDown - nbUsersUp
var lastPatternSort = "sizeUp";

// The current display mode for the session view. Value is one of the following:
// all - selected - some
var showUserSessionOption = "all";
// When the session wiew is in the "some" mode, index of the first user in the
//  list of users to display
var firstUserShown = 0;

// Interval for the animation while the algorithm loads the data
var loadingAlgorithmDataAnimation;
// State of the animation (number of dots to be displayed) while the algorithm
//  loads the data
var loadingAlgorithmDataAnimationState = 1;

// Interval for the timer of the algorithm's runtime
var algorithmTimer;
// Time (in ms) at which the algorithm started
var algorithmStartTime = -1;
// Delay (in ms) between the server and the client
var startDelayFromServer = 0;

// Interval used to animate the activity indicator
var runningTaskIndicator;
// Whether the activity indicator is active or not
var runningTaskIndicatorState = false;

/*************************************/
/*				Tooltip				 */
/*************************************/

// D3 selection of the tooltip
var tooltip = d3.select("#tooltip");
// HTML node of the tooltip
var tooltipNode = tooltip.node();
// Distance between the mouse pointer and the tooltip
var tooltipOffsetFromMouse = 5;
// X,Y position of the mouse pointer
var currentMousePos = [];
// Whether the mouse pointer is inside the tooltip or not
var mouseIsInsideTooltip = false;
// Whether the tooltip has been fixed or moves with the pointer
var tooltipIsFixed = false;
// Whether the tooltip has content
var tooltipHasContent = false;
// The data contained in the tooltip
var tooltipData = {};
// The part of the interface the tooltip's data comes from. Value is one of the
//  following: general - session
var tooltipOrigin = "";
// The data the tooltip should be displaying if it was moving with the pointer
var tooltipSupposedData = {};
// The part of the interface the tooltip's supposed data comes from. Value is
//  one of the following: general - session
var tooltipSupposedOrigin = "";
// Whether the tooltip should be emptied
var tooltipShouldBeCleared = false;
// Time (in ms) allowed to the pointer to reenter the tooltip after leaving it
//  before it closes
var tooltipCloseTimeout;

/*************************************/
/*				?????				 */
/*************************************/

// List of month names to display dates
var monthsNames = [
	"January", "February", "March",
	"April", "May", "June",
	"July", "August", "September",
	"October", "November", "December"];
// TODO request a list of shapes from the server to populate this list
var itemShapes = {};


/******************************************************************************/
/*																			  */
/*									Functions								  */
/*																			  */
/******************************************************************************/

/*************************************/
/*				Utility				 */
/*************************************/

/**
 * Displays a debug message sent by the server
 * @param {JSON} message - The message sent by the server
 */
function displayServerDebugMessage(message) {
	let debugSize = parseInt(message.size);
	console.log("===== Server debug =====");
	for (let i=0;i<debugSize;i++)
		console.log(message["msg"+i.toString()]);
	console.log("========================");
}

/**
 * Manages keyboard input
 */
function handleKeyPress() {
	let kc = d3.event.key;
	console.log(kc)
	switch(kc) {
	case "h":
	case "H":
	case "?":
		debug();
		break;
	case "s":
	case "S":
		if (debugMode) {
			stopUIUpdate();
		}
		break;
	case "g":
	case "G":
		if (debugMode) {
			switchPointerTarget();
		}
		break;
	case "+":
		timeline.currentZoomScale += 0.05;
		timeline.currentZoomScale = Math.max(0.05, timeline.currentZoomScale);
		timeline.zoomRect.call(timeline.zoom.scaleBy, 1.1);
		timeline.zoomRectUsers.call(timeline.zoomUsers.scaleBy, 1.1);
		break;
	case "-":
		timeline.currentZoomScale -= 0.05;
		timeline.currentZoomScale = Math.max(1.0, timeline.currentZoomScale);
		timeline.zoomRect.call(timeline.zoom.scaleBy, 0.9);
		timeline.zoomRectUsers.call(timeline.zoomUsers.scaleBy, 0.9);
		break;
	default:
	}
}

/**
 * (De)activates debug tools
 */
function debug() {
	if (debugMode) {
		console.log("Exiting debug mode");
		d3.select("#debugHelp").style("display", "none");
		d3.select("#debugConnexion").style("display", "none");
		if (showPointerTarget == true) {
			switchPointerTarget();
		}
	} else {
		console.log("Entering debug mode");
		d3.select("#debugHelp").style("display", "flex");
		d3.select("#debugConnexion").style("display", "flex");
		if (showPointerTarget == false) {
			switchPointerTarget();
		}
	}
	debugMode = !debugMode;
}

/**
 * (De)activates the visualization of the pointer target in the focus view
 */
function switchPointerTarget() {
	showPointerTarget = !showPointerTarget;
	if (showPointerTarget)
		d3.select("#debugHelpPointerTarget").select(".kbTxt")
			.text("Hide pointer target");
	else
		d3.select("#debugHelpPointerTarget").select(".kbTxt")
			.text("Show pointer target");
	timeline.showTarget();
	timeline.showPosition();
}

/**
 * Stops handling incomming patterns
 */
function stopUIUpdate() {
	console.log("Pattern reception now ignored");
	updateUI = false;
}

/**
 * Displays the blocking overlay over the center of the tool with a message
 * @param {string} message - the message to be displayed
 */
function enableCentralOverlay(message) {
	d3.select("#centerOverlay")
		.style("visibility","initial")
		.text(message);
}

/**
 * Hide the blocking overlay over the center of the tool
 */
function disableCentralOverlay() {
	d3.select("#centerOverlay")
		.style("visibility","hidden");
}

/**
 * Converts a color from HSV to RGB
 *
 * H runs from 0 to 360 degrees
 * S and V run from 0 to 100
 * 
 * Ported from the excellent java algorithm by Eugene Vishnevsky at:
 * http://www.cs.rit.edu/~ncs/color/t_convert.html
 * @param {int} h - The hue value of the color
 * @param {int} s - The saturation value of the color
 * @param {int} v - The vibrance value of the color
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

/**
 * Formats a given date to a readable format.
 * If the date is given as a string, assumes the format from Agavue :
 * Sun Mar 31 01:32:10 CET 2013
 * @param {string|Date} date The date to format
 */
function formatDate(date) {
	if (typeof date == "string") {
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
		let parts = [
			"",
			monthsNames[date.getMonth()],
			date.getDate()+",",
			date.getFullYear()+",",
			date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()
		];
		
		return parts.join(" ");
	}
}

/**
 * Returns the first unused category color
 * 
 * TODO Prevent it from accessing an out of bound index
 */
function getNextCategoryColor() {
	return colorPalet[eventTypeCategories.length -1];
}

/**
 * Assign a new symbol to an event type.
 * 
 * @param {string} eventType The event type
 * @param {number} newShapeIndex The index of the new symbol in the list of
 *  symbols
 * 
 * @deprecated Only used if the dropdown menus in the event type list are kept
 * 
 * TODO Update or delete/replace
 */
function changeEventTypeSymbol(eventType, newShapeIndex) {
	itemShapes[eventType] = shapes[newShapeIndex];
	return true;
}

/**
 * Assign a new color to an event type.
 * 
 * @param {string} eventType The event type
 * @param {number} newColor The H value of a color in the HSV space
 * 
 * @deprecated Only used if the dropdown menus in the event type list are kept.
 * Also, uses an old version of the colorList (only using 1 color instead of 2)
 * 
 * TODO Update or delete/replace
 */
function changeEventTypeColor(eventType, newColor) {
	if (newColor != colorList[eventType][0]) {
		colorList[eventType][0] = newColor;
		return true;
	}
	return false;
}

/**
 * Returns the current color associated with an event type, depending on the
 *  current highlights.
 * If 'user' is omitted, the current user selection is not taken into account 
 * @param {string} eventType The event type we want the color
 * @param {string} user The user attached to the event. Optional parameter.
 * @returns An RGB object describing a color
 */
function getCurrentEventColor(eventType, user) {
	let typeHighlight = true;
	let userHighlight = true;
	if (highlightedEventTypes.length > 0 &&
		 !highlightedEventTypes.includes(eventType)) {
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

/**
 * Returns the color associated with an event type. Both values of the colors
 *  are returned. To only get one, use getCurrentEventColor(eventType, user).
 * @param {string} eventType The event type we want the color
 * @returns {array} The array containing both colors associated with an event type
 */
function getEventColor(eventType) {
	return colorList[eventType];
}

/**
 * Returns the correct index in the list of pattern for a new pattern
 * @param {array} patternInfos Informations about the pattern, to be able to
 * handle all sorting possible.
 * @returns {number} The index for the new pattern
 */
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
	case "nbUsersDown":
		return patternIdList.findIndex(function(elt, idx) {
			return patternsInformation[elt][4].length < patternInfos[4].length;
		});
	case "nbUsersUp":
		return patternIdList.findIndex(function(elt, idx) {
			return patternsInformation[elt][4].length > patternInfos[4].length;
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

/**
 * Finds the first pattern id in the list of patterns that doesn't belong to a
 * selected pattern, starting at a given index
 * 
 * @param {number} startIdx The first index to be checked
 * @returns {number} The new index in patternIdList
 * or -1 if no index is suitable
 * 
 * @deprecated Probably never used, maybe replaced by 
 * findFirstFilteredUnselectedId ?
 * 
 * TODO check if it can be deleted
 */
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

/**
 * Finds the first pattern id in the list of patterns that doesn't belong to a
 * selected pattern and is accepted by the current filter, starting at a given index
 * 
 * @param {number} startIdx The first index to be checked
 * @returns {number} The new index in patternIdList
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
	while(selectedPatternIds.indexOf(patternIdList[newIdx]) != -1 &&
		 patternInformations[patternIdList[newIdx]][0].includes(properPatternSearchInput)) {
		newIdx++;
		if (newIdx > patternIdList.length)
			return -1;
	}
	return newIdx;
}

/**
 * Adds a task to the activity indicator, starting it if it wasn't already
 * 
 * @deprecated Not in use currently due to the bad impact on performances
 */
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

/**
 * Removes a task from the activity indicator, stoping it if it was the last one
 * 
 * @deprecated Not in use currently due to the bad impact on performances
 */
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

/**
 * Returns a color specific color contained in a list of distinct colors
 * If the list has less items in it than the presetList, the preset list is used
 * otherwise, the color is computed
 * 
 * PresetList : red - orange - lightBlue - darkBlue - purple
 * 
 * @param colorNum The index of the color we want in the list (starts at 1)
 * @param colors The size of the color list
 * @returns the first parameter for generating an HSL color (second and third
 *  are respectively supposed to be 100% and 50%)
 * @deprecated Probably never used
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

/*************************************/
/*				Setup				 */
/*************************************/

/**
 * Initializes the system at the start
 */
function init() {
	// Store all the parameters, after removing the leading '?'
	let urlParameters = window.location.search.substr(1).split('&');
	// Gather the parameters in the URL
	if (window.location.search.length > 1) {
		for(let i = 0; i < urlParameters.length; i++) {
			let parts = urlParameters[i].split('=');
			pageParameters[unescape(parts[0])] = parts.length > 1 ?
											unescape(parts[1]) :
											"";
		}
	}

	// If a dataset is given as parameters, open the websocket to ask for it
	if (pageParameters.ds) {
		// Try to establish the websocket connection
		webSocket = new WebSocket("ws://"+__websocketAdress__);
		// Handle the future communication through the socket
		webSocket.onopen = processOpen;
		webSocket.onmessage = processMessage;
		webSocket.onclose = processClose;
		webSocket.onerror = processError;

		setupTool();
	} else { // Otherwise, redirect to the dataset selection page
		location.href = "/ppmt";
	}
}

/**
 * Initializes the tool once a dataset has been selected
 */
function setupTool() {
	setupAlgorithmSearchField();
	setupUserSearchField();
	
	// Setup the input for the number of users to display
	d3.select("#showAllUserSessionsInput")
		.on("change", function() {
			d3.select("#shownUserSessionsControl")
				.classed("hidden",
					d3.select("#showAllUserSessionsInput").property("checked")
				);
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
	
	timeline = new Timeline("timeline",{});
	setupHelpers();
	
	setupAlgorithmSliders();
	setupPatternSizesChart();
	
	d3.select("body").on("keyup", handleKeyPress);
	d3.select("body").on("mousemove", moveTooltip);
	d3.select("body").on("click", switchTooltipLock);
	d3.select("#tooltip").on("mouseleave", prepareToLeaveTooltip);
	d3.select("#tooltip").on("mouseenter", enterTooltip);
	
	resetDatasetInfo();	// Set the display of information on the dataset
	resetHistory();	// Reset the history display
}

/**
 * Setups the search field in the user panel
 */
function setupUserSearchField() {
	let searchField = d3.select("#Users").select("input.searchField");
	let suggestionField = d3.select("#Users").select("input.suggestionField");
	let suggestionDiv = d3.select("#Users").select(".suggestionDiv");
	
	suggestionDiv.on("mouseenter", function(d,i) {
		mouseIsOverUserSuggestions = true;
	});
	
	suggestionDiv.on("mouseleave", function(d,i) {
		mouseIsOverUserSuggestions = false;
	});
	
	searchField.on("focus", function() {
		suggestionDiv.style("display", "block");
	});
	
	searchField.on("focusout", function() {
		if (mouseIsOverUserSuggestions == false)
			suggestionDiv.style("display", "none");
	});
	
	searchField.on("input", function() {
		currentUserSearchInput = searchField.property("value");
		
		if(currentUserSearchInput.length > 0) {
			relatedUsers = userList.filter(function(d, i) {
				return d.includes(currentUserSearchInput);
			});
			relatedUsers.sort();
			
			if (relatedUsers.length > 0) {
				currentUserSearchSuggestionIdx = 0;
				suggestionDiv.html("");
				relatedUsers.forEach(function(d,i) {
					suggestionDiv.append("p")
						.classed("selected", i==currentUserSearchSuggestionIdx)
						.classed("clickable", true)
						.text(d)
						.on("click", function() {
							currentUserSearchInput = relatedUsers[i];
							searchField.property("value",currentUserSearchInput);
							// Updates the suggestion list
							relatedUsers = userList.filter(function(e, j) {
								return e.includes(currentUserSearchInput);
							});
							relatedUsers.sort();

							if (relatedUsers.length > 0) {
								currentUserSearchSuggestionIdx = 0;
								suggestionDiv.html("");
								relatedUsers.forEach(function(e,j) {
									suggestionDiv.append("p")
										.classed("selected", j==currentUserSearchSuggestionIdx)
										.text(e);
								});
							} else {
								currentUserSearchSuggestionIdx = -1;
								suggestionDiv.html("");
							}
							
							createUserListDisplay();
							suggestionDiv.style("display", "none");
						});
				});
				suggestionField.property("value",relatedUsers[0]);
			} else {
				currentUserSearchSuggestionIdx = -1;
				suggestionDiv.html("");
			}
		} else {
			currentUserSearchInput = "";
			currentUserSearchSuggestionIdx = -1;
			relatedUsers = [];
			suggestionDiv.html("");
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
		case "Escape": // Hide the suggestion list
			suggestionDiv.style("display", "none");
			break;
		case "ArrowRight":
		case "Enter": // Complete the field with the currently target suggestion
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
					suggestionDiv.html("");
					relatedUsers.forEach(function(d,i) {
						suggestionDiv.append("p")
							.classed("selected", i==currentUserSearchSuggestionIdx)
							.text(d);
					});
				} else {
					currentUserSearchSuggestionIdx = -1;
					suggestionDiv.html("");
				}
			}
			createUserListDisplay();
			break;
		case "ArrowUp": // Change the currently targeted suggestion
			if (currentUserSearchSuggestionIdx > 0) {
				currentUserSearchSuggestionIdx--;
				suggestionDiv.selectAll("p").each(function(d,i) {
					d3.select(this).classed("selected", i==currentUserSearchSuggestionIdx);
				});
			}
			break;
		case "ArrowDown": // Change the currently targeted suggestion
			if (currentUserSearchSuggestionIdx < relatedUsers.length - 1) {
				currentUserSearchSuggestionIdx++;
				suggestionDiv.selectAll("p").each(function(d,i) {
					d3.select(this).classed("selected", i==currentUserSearchSuggestionIdx);
				});
			}
			break;
		default:
		}
		currentKeyDownUser = "";
	});
}

/**
 * Setups the search field in the pattern panel
 */
function setupAlgorithmSearchField() {
	let searchField = d3.select("#patternListArea").select("input.searchField");
	let suggestionDiv = d3.select("#patternListArea").select(".suggestionDiv");
	
	suggestionDiv.on("mouseenter", function(d,i) {
		mouseIsOverPatternSuggestions = true;
	});
	
	suggestionDiv.on("mouseleave", function(d,i) {
		mouseIsOverPatternSuggestions = false;
	});
	
	searchField.on("focus", function() {
		suggestionDiv.style("display", "block");
	});
	
	searchField.on("focusout", function() {
		if (mouseIsOverPatternSuggestions == false)
			suggestionDiv.style("display", "none");
	});
	
	searchField.on("input", function() {
		suggestionDiv.style("display", "block");
		let currentValue = searchField.property("value");
		currentPatternSearchInput = currentValue;
		currentPatternSearchFragment = currentValue.split(" ").pop();
		
		if(currentPatternSearchFragment.length > 0) {
			let baseLength = currentPatternSearchInput.length -
							 currentPatternSearchFragment.length;
			let baseValue = currentPatternSearchInput.substr(0, baseLength);
			relatedEventTypes = eventTypes.filter(function(d, i) {
				return d.toLowerCase().includes(currentPatternSearchFragment.toLowerCase());
			});
			relatedEventTypes.sort();
			
			if (relatedEventTypes.length > 0) {
				currentPatternSearchSuggestionIdx = 0;
				suggestionDiv.html("");
				relatedEventTypes.forEach(function(d,i) {
					suggestionDiv.append("p")
						.classed("selected", i==currentPatternSearchSuggestionIdx)
						.classed("clickable", true)
						.text(baseValue + d)
						.on("click", function() {
							let baseLength = currentPatternSearchInput.length - 
											currentPatternSearchFragment.length;
							let baseValue = currentPatternSearchInput.substr(0, baseLength);
							currentPatternSearchInput = baseValue + relatedEventTypes[i];
							currentPatternSearchFragment = relatedEventTypes[i];
							searchField.property("value", currentPatternSearchInput);
							// Updates the suggestion list
							relatedEventTypes = eventTypes.filter(function(e, j) {
								return e.toLowerCase().includes(currentPatternSearchFragment.toLowerCase());
							});
							relatedEventTypes.sort();

							if (relatedEventTypes.length > 0) {
								currentPatternSearchSuggestionIdx = 0;
								suggestionDiv.html("");
								relatedEventTypes.forEach(function(e,j) {
									suggestionDiv.append("p")
										.classed("selected", j==currentPatternSearchSuggestionIdx)
										.text(baseValue + e);
								});
							} else {
								currentPatternSearchSuggestionIdx = -1;
								suggestionDiv.html("");
							}
							
							createPatternListDisplay();
							suggestionDiv.style("display", "none");
						});
				});
			} else {
				currentPatternSearchSuggestionIdx = -1;
				suggestionDiv.html("");
			}
		} else {
			currentPatternSearchInput = "";
			currentPatternSearchSuggestionIdx = -1;
			currentPatternSearchFragment = "";
			relatedEventTypes = [];
			suggestionDiv.html("");
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
		case "Escape":
			suggestionDiv.style("display", "none");
			break;
		case "Enter":
			if (currentPatternSearchSuggestionIdx >= 0) {
				let baseLength = currentPatternSearchInput.length -
								currentPatternSearchFragment.length;
				let baseValue = currentPatternSearchInput.substr(0, baseLength);
				currentPatternSearchInput = baseValue +
						relatedEventTypes[currentPatternSearchSuggestionIdx];
				currentPatternSearchFragment = relatedEventTypes[currentPatternSearchSuggestionIdx];
				searchField.property("value", currentPatternSearchInput);
				// Updates the suggestion list
				relatedEventTypes = eventTypes.filter(function(d, i) {
					return d.includes(currentPatternSearchFragment);
				});
				relatedEventTypes.sort();

				if (relatedEventTypes.length > 0) {
					currentPatternSearchSuggestionIdx = 0;
					suggestionDiv.html("");
					relatedEventTypes.forEach(function(d,i) {
						suggestionDiv.append("p")
							.classed("selected", i==currentPatternSearchSuggestionIdx)
							.text(baseValue + d);
					});
				} else {
					currentPatternSearchSuggestionIdx = -1;
					suggestionDiv.html("");
				}
				// Hide the suggestion list
				suggestionDiv.style("display", "none");

				createPatternListDisplay();
			}
			break;
		case "ArrowUp":
			if (currentPatternSearchSuggestionIdx > 0) {
				let baseLength = currentPatternSearchInput.length -
								currentPatternSearchFragment.length;
				let baseValue = currentPatternSearchInput.substr(0, baseLength);
				currentPatternSearchSuggestionIdx--;
				suggestionDiv.selectAll("p").each(function(d,i) {
					d3.select(this).classed("selected", i==currentPatternSearchSuggestionIdx);
				});
			}
			break;
		case "ArrowDown":
			if (currentPatternSearchSuggestionIdx < relatedEventTypes.length - 1) {
				let baseLength = currentPatternSearchInput.length -
								currentPatternSearchFragment.length;
				let baseValue = currentPatternSearchInput.substr(0, baseLength);
				currentPatternSearchSuggestionIdx++;
				suggestionDiv.selectAll("p").each(function(d,i) {
					d3.select(this).classed("selected", i==currentPatternSearchSuggestionIdx);
				});
			}
			break;
		default:
		}
		currentKeyDown = "";
	});
}

/**
 * Setup and displays the barchart representing the pattern sizes
 */
function setupPatternSizesChart() {
	let data = Object.keys(patternMetrics.sizeDistribution);
	
	patternSizesChart.x.domain(data.map(function(d) { return d; }));
	patternSizesChart.y.domain([0, d3.max(data, function(d) {
		return patternMetrics.sizeDistribution[d];
	})]);

	patternSizesChart.g.append("g")
		.attr("class", "axis axis--x")
		.attr("transform", "translate(0," + patternSizesChart.height + ")")
		.call(patternSizesChart.xAxis);
	
	patternSizesChart.g.append("g")
		.attr("class", "axis axis--y")
		.call(patternSizesChart.yAxis)
		.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 6)
			.attr("dy", "0.71em")
			.attr("text-anchor", "end")
			.text("Frequency");
	
	patternSizesChart.g.selectAll(".bar")
		.data(data)
		.enter().append("rect")
			.attr("class", "bar")
			.attr("x", (d) => patternSizesChart.x(d))
			.attr("y", (d) => patternSizesChart.y(patternMetrics.sizeDistribution[d]))
			.attr("width", patternSizesChart.x.bandwidth())
			.attr("height", function(d) {
				return patternSizesChart.height -
				 patternSizesChart.y(patternMetrics.sizeDistribution[d]);
				});
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

/**
 * Setup the slider controling the 'support' parameter of the algorithm
 */
function setupAlgorithmSupportSlider() {
	// Using the custom made slider
	//supportSlider = new SupportSlider("sliderSupportArea");
	
	// Using noUiSlider
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

/**
 * Setup the slider controling the 'window size' parameter of the algorithm
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

/**
 * Setup the slider controling the 'max size' parameter of the algorithm
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

/**
 * Setup the slider controling the 'gap' parameter of the algorithm
 */
function setupAlgorithmGapSlider() {
	// Using the custom made slider
	//gapSlider = new GapSlider("sliderGap");
	
	// Using noUiSlider
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

/**
 * Setup the help messages for the algorithm parameters' sliders
 */
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

/*************************************/
/*				Logging				 */
/*************************************/

/**
 * Adds an action to the displayed history
 * @param {string} action - The message to be added to the history
 */
function addToHistory(action) {
	let history = d3.select("#history");
	if (historyDisplayIsDefault) {
		history.text("");
		historyDisplayIsDefault = false;
	}
	//var formatTime = d3.timeFormat("%b %d, %Y, %H:%M:%S");
	let formatTime = d3.timeFormat("%H:%M:%S");
	let now = formatTime(new Date());
	history.append("p")
		.text("- "+action)
	  .append("span")
		.classed("timestamp", true)
		.text(" "+now.toString());
}

/*************************************/
/*				Algorithm			 */
/*************************************/

/**
 * Starts the algorithm with default values, for the start of the session
 */
function startInitialMining() {
	// TODO Stop using hard coded value depending on the dataset

	let defaultMinSupport = "500";
	let defaultWindowSize = "60";
	let defaultMaxSize = "10";
	let defaultMinGap = "0";
	let defaultMaxGap = "2";
	let defaultMaxDuration = "30000";
	let datasetName = currentDatasetName;
	
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
	requestAlgorithmStart(defaultMinSupport, defaultWindowSize, defaultMaxSize,
		 defaultMinGap, defaultMaxGap, defaultMaxDuration, datasetName);
}

/**
 * Specifies the parameters to be used by the algorithm, displays them and
 * sends the request
 * @param {string} minSupport The minimum absolute support threashold
 * @param {string} windowSize The size of the window
 * @param {string} maxSize The maximum pattern size
 * @param {string} minGap The minimum allowed gap between two events of a pattern
 * @param {string} maxGap The maximum allowed gap between two events of a pattern
 * @param {string} maxDuration The maximum duration of a pattern occurrence
 * @param {string} datasetName The name of the dataset to be used
 */
function requestAlgorithmStart(minSupport, windowSize, maxSize, minGap, maxGap,
								maxDuration, datasetName) {
	console.log("Requesting algorithm start:");
	console.log("   minSup: "+minSupport+", windowSize: "+windowSize+
		", maxSize: "+maxSize+", minGap: "+minGap+", maxGap: "+maxGap+
		", maxDuration: "+maxDuration+", datasetName: "+datasetName);
	
	let action = {
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
	sendToServer(action);

	// Start the timer independently from the server
	//stopAlgorithmRuntime();
	//startAlgorithmRuntime();
	
	// Update the display of the current parameters in the Execution tab
	d3.select("#currentSupport").text(minSupport+" occs.");
	d3.select("#currentGap").text(minGap+"-"+maxGap+" events");
	d3.select("#currentWindow").text(windowSize);
	d3.select("#currentSize").text(maxSize+" events");
	d3.select("#currentMaxDuration").text(maxDuration/1000+"s");
}

/*************************************/
/*		Websocket management		 */
/*************************************/

/**
 * Handles the connection to the server
 * @param {string} message - the JSON message sent by the server
 */
function processOpen(message) {
	console.log("Server connected." + "\n");
	// Update the connexion date display
	d3.select("#connexionTimeDisplay span")
		.text(formatDate(new Date()));

	// Ping the server every 10 minutes to keep the connexion alive
	runningTaskIndicator = setInterval(function() {
		console.log("pinging server");
		let action = {
				action: "ping"
		};
		sendToServer(action);
	}, 10*60*1000); // every 10 minutes

	// Ask if the target dataset is available
	requestDatasetValidation(pageParameters.ds);
}

/**
 * Handles the disconnection with the server
 * @param {string} message - the JSON message sent by the server
 */
function processClose(message) {
	// Update the disconnexion date display
	d3.select("#disconnexionTimeDisplay span")
		.text(formatDate(new Date()));
	console.log("Server disconnected on " + new Date());
}

/**
 * Handles error messages from the server
 * @param {string} message - the JSON message sent by the server
 */
function processError(message) {
	console.log("Error on " + new Date());
}

/**
 * Handles the reception of messages from the server
 * @param {string} message - Stringified JSON object containing the message.
 * Should at least contain the "action" property
 */
function processMessage(message/*Compressed*/) {
	// Update the last received date display
	d3.select("#lastReceivedTimeDisplay span")
		.text(formatDate(new Date()));
	//console.log("Receive from server => " + message.data + "\n");
	//var message = LZString.decompressFromUTF16(messageCompressed.data);
	var msg = JSON.parse(message.data);
	//console.log("Receive message on " + new Date());
	//console.log(msg);
	
	if (msg.action === "add") {
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
	  	console.log("Refresh received, but the this message is disabled");
		//timeline.setItems(timelineItems);
	}
	if (msg.action === "datasetInfo") {	// Reception of information about the dataset
		receiveDatasetInfo(msg);
	}
	if (msg.action === "validation") {
		if (msg.object === "dataset")
			handleDatasetValidation(msg);
	}
	if (msg.action === "data") {	// Reception of data
		if (msg.type === "userList")
			receiveUserList(msg);
		if (msg.type === "userTrace")
			receiveUserTrace(msg); // No longer used, function deleted, to be removed
		if (msg.type === "bin") {
			console.log("receiving bins");
			receiveDataBins(msg);
		}
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
	if (msg.action === "startLoading") { // The server starts to load the dataset
		displayDatasetLoading();
	}
	if (msg.action === "info") {
		if (msg.object === "newPattern") {
			if (updateUI) {
				addPatternToList(msg);
				drawPatternSizesChart();
			}
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

/*************************************/
/*		Communication - sending		 */
/*************************************/

/**
 * Sends a message to the server
 * @param {JSON} jsonMessage - the JSON object to be sent
 */
function sendToServer(jsonMessage) {
	//console.log("Sending to server on " + new Date());
	webSocket.send(JSON.stringify(jsonMessage));

	// Update the last sent date display
	d3.select("#lastSentTimeDisplay span")
		.text(formatDate(new Date()));
}

/**
 * Asks the server to load a given dataset
 * @param {string} datasetName - Name of the dataset to be loaded
 */
function requestDatasetLoad(datasetName) {
	var action = {
			action: "load",
			object: "dataset",
			dataset: datasetName
	};
	sendToServer(action);
}

/**
 * Asks for the list of available datasets
 */
function requestDatasetList() {
	var action = {
			action: "request",
			object: "datasetList"
	};
	sendToServer(action);
}

/**
 * Requests a dataset and its content to the server
 * @param {string} datasetName - Name of the dataset
 */
function requestDataset(datasetName) {
	var action = {
			action: "request",
			object: "dataset",
			dataset: datasetName
	};
	sendToServer(action);
}

/**
 * Asks the server to confirm that the given dataset is available
 * 
 * @param {string} datasetName The name of the dataset to be checked
 */
function requestDatasetValidation(datasetName) {
	let action = {
		action: "validate",
		object: "dataset",
		dataset: datasetName
	};
	sendToServer(action);
}

/**
 * Requests information about a dataset to the server
 * @param {string} datasetName - Name of the dataset
 */
function requestDatasetInfo(datasetName) {
	var action = {
			action: "request",
			object: "datasetInfo",
			dataset: datasetName
	};
	sendToServer(action);
}

/**
 * Requests the occurrences of a given pattern in a given dataset
 * @param {number} patternId - The id of the pattern
 * @param {string} datasetName - The name of the dataset
 */
function requestPatternOccurrences(patternId, datasetName) {
	var action = {
			action: "request",
			object: "patternOccs",
			dataset: datasetName,
			patternId: patternId
	};
	sendToServer(action);
}

/**
 * Asks for the event bins for a given dataset, at a given scale
 * @param {string} datasetName - Name of the dataset
 * @param {string} distributionScale - Scale of the distribution we want.
 * Expected values are "year", "month", "halfMonth", "day" or "halfDay"
 */
function requestRelevantBins(datasetName, distributionScale) {
	switch(distributionScale) {
	case "year":
		requestYearBins(datasetName);
		break;
	case "month":
		requestMonthBins(datasetName);
		break;
	case "halfMonth":
		requestHalfMonthBins(datasetName);
		break;
	case "day":
		requestDayBins(datasetName);
		break;
	case "halfDay":
		requestHalfDayBins(datasetName);
		break;
	default:
		console.log("Unexpected distribution :" + distributionScale);
	}
}

/**
 * Asks for the event bins in a given dataset, at year scale
 * Equivalent as requestRelevantBins(datasetName, "year")
 * @param {string} datasetName - Name of the dataset
 */
function requestYearBins(datasetName) {
	var action = {
			action: "request",
			object: "data",
			shape: "bin",
			scale: "year",
			dataset: datasetName
	};
	sendToServer(action);
}

/**
 * Asks for the event bins in a given dataset, at month scale
 * Equivalent as requestRelevantBins(datasetName, "month")
 * @param {string} datasetName - Name of the dataset
 */
function requestMonthBins(datasetName) {
	var action = {
			action: "request",
			object: "data",
			shape: "bin",
			scale: "month",
			dataset: datasetName
	};
	sendToServer(action);
}

/**
 * Asks for the event bins in a given dataset, at half month scale
 * Equivalent as requestRelevantBins(datasetName, "halfMonth")
 * @param {string} datasetName - Name of the dataset
 */
function requestHalfMonthBins(datasetName) {
	var action = {
			action: "request",
			object: "data",
			shape: "bin",
			scale: "halfMonth",
			dataset: datasetName
	};
	sendToServer(action);
}

/**
 * Asks for the event bins in a given dataset, at day scale
 * Equivalent as requestRelevantBins(datasetName, "day")
 * @param {string} datasetName - Name of the dataset
 */
function requestDayBins(datasetName) {
	var action = {
			action: "request",
			object: "data",
			shape: "bin",
			scale: "day",
			dataset: datasetName
	};
	sendToServer(action);
}

/**
 * Asks for the event bins in a given dataset, at half day scale
 * Equivalent as requestRelevantBins(datasetName, "halfDay")
 * @param {string} datasetName - Name of the dataset
 */
function requestHalfDayBins(datasetName) {
	var action = {
			action: "request",
			object: "data",
			shape: "bin",
			scale: "halfDay",
			dataset: datasetName
	};
	sendToServer(action);
}

/**
 * Requests information about the event types of a dataset
 * @param {string} datasetName - Name of the dataset
 */
function requestEventTypes(datasetName) {
	let action = {
			action: "request",
			object: "eventTypes",
			dataset: datasetName
	};
	sendToServer(action);
}

/**
 * Requests the list of users in the dataset
 * @param {string} datasetName - Name of the dataset
 */
function requestUserList(datasetName) {
	let action = {
			action: "request",
			object: "userList",
			dataset: datasetName
	};
	sendToServer(action);
}

/**
 * Requests a steering of the algorithm on a given pattern
 * @param {string} patternId - Id of the pattern to steer on
 */
function requestSteeringOnPattern(patternId) {
	console.log('requesting steering on patternId '+patternId);
	let action = {
			action: "steerOnPattern",
			patternId: patternId
	};
	sendToServer(action);
}

/**
 * Requests a steering of the algorithm on a given user
 * @param {string} userId - Id of the user to steer on
 */
function requestSteeringOnUser(userId) {
	console.log('requesting steering on user '+userId);
	let action = {
			action: "steerOnuser",
			userId: userId
	};
	sendToServer(action);
}

/*************************************/
/*		Communication - receiving	 */
/*************************************/

/**
 * Handles the server's response to a dataset validation request.
 * If the dataset is valid, start using it. Otherwise, go to the dataset
 * selection page.
 * 
 * @param {JSON} msg The message containing the answer
 */
function handleDatasetValidation(msg) {
	if (msg.answer === "valid") {
		// Ask for the selected dataset
		selectDataset(msg.dataset);
	} else {
		// If the dataset is not available, go to the dataset selection
		location.href = "/ppmt";
	}
}

/**
 * Receives information about a dataset from the server
 * @param {JSON} message - The message containing the information
 */
function receiveDatasetInfo(message) {
	//console.log("number of sequences : " + message.numberOfSequences);
	datasetInfo["numberOfSequences"] = parseInt(message.numberOfSequences);
	datasetInfo["numberOfDifferentEvents"] = parseInt(message.numberOfDifferentEvents);
	datasetInfo["numberOfEvents"] = parseInt(message.nbEvents);
	let userList = [];
	for (let i=0; i < datasetInfo["numberOfSequences"];i++)
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
}

/**
 * Receives the list of users present in the dataset, with some info about them
 * @param {JSON} message - The message containing the information
 */
function receiveUserList(message) {
	//console.log("Receiving a list of users")
	let nbUsers = parseInt(message.size);
	//console.log("Adding "+message.size+" users");
	for (let i = 0; i < nbUsers; i++) {
		let userInfo = message[i.toString()].split(";");
		let infoToSave = [userInfo[0], userInfo[1]]; // name and nbEvents
		userList.push(userInfo[0]);
		// Date format : yyyy-MM-dd HH:mm:ss
		let startDate = userInfo[2].split(" ");
		let part1 = startDate[0].split("-");
		let part2 = startDate[1].split(":");
		let d1 = new Date(parseInt(part1[0]),
				parseInt(part1[1]),
				parseInt(part1[2]),
				parseInt(part2[0]),
				parseInt(part2[1]),
				parseInt(part2[2]));
		let startCustomKey = part1[0]+part1[1]+part1[2]+part2[0]+part2[1]+part2[2];
		let startDateFormated = part1[1]+"/"+part1[2]+"/"+part1[0].substring(2,4);//+" "+part2[0]+":"+part2[1]+":"+part2[2];
		let endDate = userInfo[3].split(" ");
		part1 = endDate[0].split("-");
		part2 = endDate[1].split(":");
		let d2 = new Date(parseInt(part1[0]),
				parseInt(part1[1]),
				parseInt(part1[2]),
				parseInt(part2[0]),
				parseInt(part2[1]),
				parseInt(part2[2]));
		let endCustomKey = part1[0]+part1[1]+part1[2]+part2[0]+part2[1]+part2[2];
		let endDateFormated = part1[1]+"/"+part1[2]+"/"+part1[0].substring(2,4);//+" "+part2[0]+":"+part2[1]+":"+part2[2];
		// Calculates the duration of the trace
		let minutes = 1000 * 60;
		let hours = minutes * 60;
		let days = hours * 24;
		let years = days * 365;
		let endTime = d2.getTime();
		let startTime = d1.getTime();
		let timeDiff = endTime-startTime;
		
		infoToSave.push(timeDiff, userInfo[2], userInfo[3]); // trace duration, start, end
		userProperties[userInfo[0]] = {"start": d1, "end":d2, "duration": timeDiff};
		userInformations.push(infoToSave);	// Add this user to the list of already known ones
	}
	// sorting by event per user, in descending order
	sortUsersByNbEvents(true);
	
	// Creating the table
	createUserListDisplay();
}

/**
 * Receives some events and store them in memory
 * @param {JSON} eventsCompressed - The events and information about them
 */
function receiveEvents(eventsCompressed) {
	//var dataCompressed = LZString.decompressFromUTF16(eventsCompressed.data);
	//var events = JSON.parse(dataCompressed);
	
	let events = eventsCompressed;//JSON.parse(eventsCompressed.data);
	
	let nbEventsInMessage = parseInt(events.numberOfEvents);
	if (nbEventsReceived == 0)
		firstEventReceived = new Date();
	for (let i=0; i < nbEventsInMessage; i++) {
		let evtParts = events[i.toString()].split(";");
		let time = d3.timeParse('%Y-%m-%d %H:%M:%S')(events[i.toString()].split(";")[1]);
		let evtObj = {
			"type": evtParts[0],
			"start": time.getTime(),
			"end": evtParts[2],
			"user": evtParts[3]	
		};
		for(let propertyIdx=4; propertyIdx < evtParts.length; propertyIdx++) {
			evtObj["property"+(propertyIdx-3)] = evtParts[propertyIdx];
		}
		let user = evtParts[3];
		timeOrderedEvents.push([events[i.toString()]]);
		// Add the event to the array later used to create the crossfilter
		rawData.push(evtObj);
		// Adding the event to its user
		if(typeof(userTraces[user]) == typeof([]))
			userTraces[user].push(timeOrderedEvents[timeOrderedEvents.length-1]);
		else
			userTraces[user] = [timeOrderedEvents[timeOrderedEvents.length-1]];
		// Setting the accessor if necessary
		if (!eventAccessor.hasOwnProperty(formatAccessorFirstLevel(time))) {
			eventAccessor[formatAccessorFirstLevel(time)] = {};
			eventAccessor[formatAccessorFirstLevel(time)][formatAccessorSecondLevel(time)] = timeOrderedEvents.length-1;
		} else {
			if (!eventAccessor[formatAccessorFirstLevel(time)].hasOwnProperty(formatAccessorSecondLevel(time))) {
				eventAccessor[formatAccessorFirstLevel(time)][formatAccessorSecondLevel(time)] = timeOrderedEvents.length-1;
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
		console.log("Creating crossfilter at "+new Date());
		dataset = crossfilter(rawData);
		console.log("Crossfilter created at "+new Date());
		dataDimensions["user"] = dataset.dimension(function(d) {return d.user;});
		dataDimensions["time"] = dataset.dimension(function(d) {return d.start;});
		dataDimensions["type"] = dataset.dimension(function(d) {return d.type;});
		console.log("Dimensions created at "+new Date());
		rawData = null;
		console.log("raw data removed");
		buildUserSessions();
		computeMaxEventAtOneTime();
		disableCentralOverlay();
		requestRelevantBins(currentDatasetName, timeline.getRelevantDistributionScale());
		startInitialMining();
	}
}

/**
 * Updates the pattern counts in the users sessions
 * @param {JSON} message - The information about the pattern distribution
 */
function receivePatternDistributionPerUser(message) {
	let users = message.users.split(";");
	users.forEach(function(u) {
		let thisUserSessions = userSessions[u];
		let theseOccs = message[u].split(";");
		
		theseOccs.forEach(function(o) {
			let idx = 0;
			for (idx = 0; idx < thisUserSessions.length; idx++) {
				if (thisUserSessions[idx].start <= Number(o) &&
					thisUserSessions[idx].end >= Number(o)) {
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
	
	// Commented because it makes the page freeze or crash when too many patterns arrive
	// TODO redraw only if visible changes (new patterns in the displayed tooltip)
	//timeline.drawUsersPatterns();
}

/**
 * Receives the message describing the binned events, stores and displays them
 * @param {JSON} message - The message containing the bins
 */
function receiveDataBins(message) {
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
}

/**
 * Receives, stores and displays the occurrences of a pattern
 * @param {JSON} message - The message containing the occurrences
 */
function receivePatternOccurrences(message) {
	var pId = message.patternId;
	var count = parseInt(message.count);
	
	for (var i=0; i < count; i++) {
		addPatternOccurrence(pId, message[i.toString()]);
	}
	timeline.displayData(); //TODO only redraw the pattern occs and session view
}

/**
 * Handles the reception of the list of event types. Assign colors and symbols
 * to the types, while creating the event type categories.
 * @param {JSON} message The message containing the event types
 */
function receiveEventTypes(message) {
	let nbEvents = parseInt(message.size);
	// Hide the message saying that there is no event
	if (nbEvents > 0)
		d3.select("#noEvent").classed("hidden", true);

	for (let i = 0; i < nbEvents; i++) {
		let eventInfo = message[i.toString()].split(";");
		let eType = "";
		let eCode = "";
		let eNbOccs = "";
		let eCategory = "";
		let eDescription = "";
		let eColor;
		
		for (let j=0; j < eventInfo.length;j++) {
			let info = eventInfo[j].split(":");
			switch(info[0]) {
			case "code":
				// Use a temporary code in case we don't have the category yet
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
		
		eventTypesByCategory[eCategory].push(eType);

		// Correct the event code now that we have the category
		// Take the first available shape in this category
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

/************************************/
/*		Data manipulation			*/
/************************************/

/**
 * Returns the first event starting from a given date
 * @param {string} date The date
 */
function getEventAccessorAtDate(date) {
	let result = eventAccessor[formatAccessorFirstLevel(date)][formatAccessorSecondLevel(date)];
	while (result === undefined) {
		date = d3.timeMinute.offset(date,1);
		result = eventAccessor[formatAccessorFirstLevel(date)][formatAccessorSecondLevel(date)];
	}
	return result;
}

/**
 * Builds the user sessions based on the value of sessionInactivityLimit
 * A session has :
 * - a start (in milliseconds)
 * - an end (in milliseconds)
 * - a pattern count
 * - an event count
 */
function buildUserSessions() {
	let nbOfSession = 0;

	for (let userIdx = 0; userIdx < userList.length; userIdx++) {
		let timeParser = d3.timeParse('%Y-%m-%d %H:%M:%S');
		let u = userList[userIdx];
		let lastEventDate = timeParser(userTraces[u][0][0].split(";")[1]).getTime();
		userSessions[u] = [
			{
				start: Number(lastEventDate), 
				end: Number(lastEventDate), 
				count: {}, 
				nbEvents: 1
			}
		];
		
		for (let idx = 1; idx < userTraces[u].length; idx++) {
			let thisEventDate = timeParser(userTraces[u][idx][0].split(";")[1]).getTime();
			if (lastEventDate + sessionInactivityLimit > thisEventDate) {
				// Keep growing the current session
				userSessions[u][userSessions[u].length - 1].end = Number(thisEventDate);
				userSessions[u][userSessions[u].length - 1].nbEvents++;
			} else {
				// Create a new session
				userSessions[u].push(
					{
						start: Number(thisEventDate), 
						end: Number(thisEventDate), 
						count: {}, 
						nbEvents: 1
					}
				);
			}
			lastEventDate = thisEventDate;
		}

		nbOfSession += userSessions[u].length;
	}
	// Add the number of sessions as an information about the dataset
	datasetInfo.nbSessions = nbOfSession;
	// Refresh the display of dataset infos
	displayDatasetInfo();
	// Refresh the user list display
	createUserListDisplay();
}

/**
 * Sorts the user list according to the number of events in the traces
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
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

/**
 * Sorts the user list according to the name of the user
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
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

/**
 * Sorts the user list according to the nduration of the traces
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
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

/**
 * Sorts the user list according to the number of sessions in the traces
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
function sortUsersByNbSessions(decreasing=false) {
	if (Object.keys(userSessions).length > 0) {
		userInformations.sort(function(a, b) {
			var nbA = userSessions[a[0]].length;
			var nbB = userSessions[b[0]].length;
			
			return nbA-nbB;
		});
		
		if (decreasing == true) {
			userInformations.reverse();
			lastUserSort = "nbSessionsDown";
		} else {
			lastUserSort = "nbSessionsUp";
		}
	}
}

/**
 * Sorts the user list according to their first event
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
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

/**
 * Sorts the user list according to their last event
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
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

/**
 * Sorts the pattern list according to their name
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
function sortPatternsByName(decreasing=false) {
	patternIdList.sort(function(a, b) {
		let nameA = patternsInformation[a][0];
		let nameB = patternsInformation[b][0];
		
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

/**
 * Sorts the pattern list according to their number of users
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
function sortPatternsByNbUsers(decreasing=false) {
	patternIdList.sort(function(a, b) {
		let nbUsersA = patternsInformation[a][4].length;
		let nbUsersB = patternsInformation[b][4].length;
		
		if (nbUsersA < nbUsersB)
			return -1;
		else if (nbUsersA > nbUsersB)
			return 1;
		else
			return 0;
	});
	
	if (decreasing == true) {
		patternIdList.reverse();
		lastPatternSort = "nbUsersDown";
	} else {
		lastPatternSort = "nbUsersUp";
	}
}

/**
 * Sorts the pattern list according to their size
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
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

/**
 * Sorts the pattern list according to their support
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
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

/**
 * Sorts the event types list according to their name
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
function sortEventTypesByName(decreasing=false) {
	eventTypes.sort();
	
	if (decreasing == true) {
		eventTypes.reverse();
		lastEventTypeSort = "nameDown";
	} else {
		lastEventTypeSort = "nameUp";
	}
}

/**
 * Sorts the event types list according to the number of events associated to them
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
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

/**
 * Sorts the event types list according to their category
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
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

/**
 * Computes the maximum number of event present at a same time in the dataset
 */
function computeMaxEventAtOneTime() {
	maxEventAtOneTime = dataDimensions.time.group().top(1)[0].value;
}

/**
 * Highlights all the users where selected patterns are found
 */
function selectUsersBasedOnPatternSelection() {
	let userList = new Set();

	selectedPatternIds.forEach( function(d,i) {
		patternsInformation[d][4].forEach( function(e,j) {
			userList.add(e);
		});
	});

	userList.forEach( function(d,i) {
		highlightUserRow(d);
	});

	setHighlights();
}

/**
 * Dehighlights all the users
 */
function clearUserSelection() {
	let tmpUsers = new Set(highlightedUsers);
	tmpUsers.forEach( function(d,i) {
		highlightUserRow(d);
	});

	setHighlights();
	timeline.displayData();
}

/**
 * Dehighlights all the event types
 */
function clearEventTypeSelection() {
	let tmpEventTypes = new Set(highlightedEventTypes);
	tmpEventTypes.forEach( function(d,i) {
		highlightEventTypeRow(d);
	});

	setHighlights();
	timeline.displayData();
}

/**
 * Handles the reception of a new pattern.
 * @param {JSON} message The message containing the new pattern and information
 * about it.
 * 
 * TODO Detail the behavior of the function and the structure of 'message'
 * 
 * TODO Optimize it
 */
function addPatternToList(message) {
	
	let pSize = parseInt(message.size);
	let pSupport = parseInt(message.support);
	let pId = message.id;

	let pUsers = message.userDistribution.users.split(";");
	
	// TODO Rename the function or move its behavior here
	receivePatternDistributionPerUser(message.userDistribution);
	
	let pItems = [];
	for (let k = 0; k < pSize; k++) {
		pItems.push(message[k]);
	}
	let pString = pItems.join(" ");

	patternsInformation[pId] = [pString, pSize, pSupport, pItems, pUsers];
	
	let correctPositionInList = findNewPatternIndex(patternsInformation[pId]);
	
	if (correctPositionInList == -1)
		patternIdList.push(pId);
	else
		patternIdList.splice(correctPositionInList, 0, pId);
	
	numberOfPattern++;
	
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
				.attr("id","pattern"+pId)
				.classed("clickable", true)
				.on("click", function() {
					if (d3.event.shiftKey) { // Shift + click, steering
						requestSteeringOnPattern(pId);
						d3.event.stopPropagation();
					} else { // Normal click, displays the occurrences
						if (selectedPatternIds.includes(pId)) {
							let index = selectedPatternIds.indexOf(pId);
							if (index >= 0)
								selectedPatternIds.splice(index, 1);
						} else {
							selectedPatternIds.push(pId);
						}
						if (occurrencesAreKnown(pId) == false)
							requestPatternOccurrences(pId, currentDatasetName);
						else
							timeline.displayData(); // TODO optimize by just displaying the pattern occurrences
						//d3.event.stopPropagation();
						console.log("click on "+pId);
						createPatternListDisplay();
						
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
				.text(pSupport);
			thisRow.append("td")
				.text(pUsers.length);
			thisRow.append("td")
				.text(pSize);
		} else { // append at the right position in the list
			let firstUnselectedId = findFirstFilteredUnselectedId(correctPositionInList + 1);
			//console.log("First unselectedId: "+firstUnselectedId);
			let patternList = d3.select("#patternTableBody");
			let firstUnselectedNode = d3.select("#pattern"+patternIdList[firstUnselectedId]).node();
			
			let thisRow = d3.select(document.createElement("tr"))
				.attr("id","pattern"+pId)
				.classed("clickable", true)
				.on("click", function() {
					if (d3.event.shiftKey) { // Shift + click, steering
						requestSteeringOnPattern(pId);
						d3.event.stopPropagation();
					} else { // Normal click, displays the occurrences
						if (selectedPatternIds.includes(pId)) {
							let index = selectedPatternIds.indexOf(pId);
							if (index >= 0)
								selectedPatternIds.splice(index, 1);
						} else {
							selectedPatternIds.push(pId);
						}
						
						if (occurrencesAreKnown(pId) == false)
							requestPatternOccurrences(pId, currentDatasetName);
						else
							timeline.displayData(); // TODO optimize by just displaying the pattern occurrences
						//d3.event.stopPropagation();
						console.log("click on "+pId);
						createPatternListDisplay();
	
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
				.text(pSupport);
			thisRow.append("td")
				.text(pUsers.length);
			thisRow.append("td")
				.text(pSize);
			
			firstUnselectedNode.parentNode.insertBefore(thisRow.node(), firstUnselectedNode);
		}
	}
	// Update the number of filtered patterns if necessary
	
	// Update the relevant metrics
	if (patternMetrics["sizeDistribution"][pSize])
		patternMetrics["sizeDistribution"][pSize] = patternMetrics["sizeDistribution"][pSize] + 1;
	else
		patternMetrics["sizeDistribution"][pSize] = 1;
}

/**
 * Whether or not the occurrences of a pattern have already been sent by the
 * server.
 * @param {number} patternId The id of the pattern
 */
function occurrencesAreKnown(patternId) {
	return patternOccurrences.hasOwnProperty(patternId);
}

/**
 * Adds a pattern occurrence to the known occurrences
 * @param {number} patternId The id of the pattern
 * @param {*} occ The occurrence
 * 
 * TODO What is the type of 'occ' ?
 */
function addPatternOccurrence(patternId, occ) {
	if (occurrencesAreKnown(patternId) == false) {
		patternOccurrences[patternId] = [];
	}
	patternOccurrences[patternId].push(occ);
}

/************************************/
/*			HCI manipulation		*/
/************************************/

/**
 * Displays information on the dataset when there is no dataset
 */
function resetDatasetInfo() {
	let infoDiv = document.getElementById("datasetInfo");
	infoDiv.textContent = "No dataset selected, select a dataset to display more information";
	
	datasetInfoIsDefault = true;
}

/**
 * Resets the display of the history of actions
 * 
 * @deprecated Make sure that it is enough, maybe children should be removed
 * 
 * TODO check the deprecation
 */
function resetHistory() {
	let historyDiv = document.getElementById("history");
	historyDiv.textContent = "No history to display";
	
	historyDisplayIsDefault = true;
}

/**
 * Displays that the server is loading the dataset
 */
function displayDatasetLoading() {
	// TODO replace with an animation or an estimate
	document.getElementById("datasetInfo").textContent = "Dataset loading";
}

/**
 * Display information on the dataset in the "Trace" control tab.
 */
function displayDatasetInfo() {
	let infoDiv = d3.select("#datasetInfo")
		.html("");

	infoDiv.append("p")
		.text("Number of events: "+datasetInfo["numberOfEvents"]);
	infoDiv.append("p")
		.text("Number of event types: "+datasetInfo["numberOfDifferentEvents"]);
	infoDiv.append("p")
		.text("Number of users: "+datasetInfo["users"].length);
	infoDiv.append("p")
		.text(datasetInfo["nbSessions"] ?
			"Number of sessions: "+ datasetInfo["nbSessions"] :
			"Number of sessions: Not known yet"
		);
	infoDiv.append("p")
		.text("First event: "+formatDate(datasetInfo["firstEvent"]));
	infoDiv.append("p")
		.text("Last event: "+formatDate(datasetInfo["lastEvent"]));
	

	datasetInfoIsDefault = false;
}

/**
 * Manages the left-side (control) tabs
 * @param {Event} evt The click event on a tab header
 * @param {string} tabName The name of the tab that has been clicked
 */
function openControlTab(evt, tabName) {
    let i, tabcontent, tablinks;

    // Hide all elements with class="controlTabContent"
    tabcontent = document.getElementsByClassName("controlTabContent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Remove the "active" class from all elements with class="controlTabLink"
    tablinks = document.getElementsByClassName("controlTabLink");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the link that opened it
    document.getElementById(tabName).style.display = "flex";
    evt.currentTarget.className += " active";
}

/**
 * Manages the right-side (algorithm) tabs
 * @param {Event} evt The click event on a tab header
 * @param {string} tabName The name of the tab that has been clicked
 */
function openAlgorithmTab(evt, tabName) {
	let i, tabcontent, tablinks;
	
	// Hide all elements with class="algorithmTabContent"
	tabcontent = document.getElementsByClassName("algorithmTabContent");
	for (i = 0; i < tabcontent.length; i++) {
		tabcontent[i].style.display = "none";
	}
	
	// Remove the "active" class from all elements with class="algorithmTabLink"
	tablinks = document.getElementsByClassName("algorithmTabLink");
	for (i = 0; i < tablinks.length; i++) {
		tablinks[i].className = tablinks[i].className.replace(" active", "");
	}
	
	// Show the current tab, and add an "active" class to the link that opened it
	document.getElementById(tabName).style.display = "flex";
	evt.currentTarget.className += " active";
}

/**
 * Shows or hides the description of event types
 */
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

/**
 * Shows or hides the name of event types inside a pattern, besides their symbol
 */
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

/**
 * Handles a click on the 'name' header in the user list
 */
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

/**
 * Handles a click on the 'nbEvents' header in the user list
 */
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

/**
 * Handles a click on the 'duration' header in the user list
 */
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

/**
 * Handles a click on the 'nbSessions' header in the user list
 */
function clickOnUserNbSessionsHeader() {
	let header = null;
	let txt = "";
	// Remove the sorting indicators
	d3.select("#userTable").selectAll("th")
		.each(function(d, i) {
			let colName = d3.select(this).text().split(/\s/);
			colName.pop();
			colName = colName.join("\u00A0").trim();
			if (colName == "Nb\u00A0sessions") {
				header = this;
				txt = colName;
			} else
				d3.select(this).text(colName+"\u00A0\u00A0");
		});
	if (lastUserSort == "nbSessionsDown") {
		d3.select(header).text(txt + "\u00A0↓");
		sortUsersByNbSessions();
	} else {
		d3.select(header).text(txt + "\u00A0↑");
		sortUsersByNbSessions(true);
	}
	
	createUserListDisplay();
	timeline.drawUsersPatterns();
}

/**
 * Handles a click on the 'start' header in the user list
 */
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

/**
 * Handles a click on the 'end' header in the user list
 */
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

/**
 * Handles a click on the 'name' header in the event types list
 */
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

/**
 * Handles a click on the 'nbEvents' header in the event types list
 */
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

/**
 * Handles a click on the 'category' header in the event types list
 */
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

/**
 * Handles a click on the 'name' header in the pattern list
 */
function clickOnPatternNameHeader() {
	let nameHeader = null;
	let nameTxt = "";
	// Remove the sorting indicators
	d3.select("#patternTable").selectAll("th")
		.each(function(d, i) {
			let colName = d3.select(this).text().split(/\s/);
			colName.pop();
			colName = colName.join("\u00A0").trim();
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

/**
 * Handles a click on the 'size' header in the pattern list
 */
function clickOnPatternSizeHeader() {
	let sizeHeader = null;
	let sizeTxt = "";
	// Remove the sorting indicators
	d3.select("#patternTable").selectAll("th")
		.each(function(d, i) {
			let colName = d3.select(this).text().split(/\s/);
			colName.pop();
			colName = colName.join("\u00A0").trim();
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

/**
 * Handles a click on the 'nb users' header in the pattern list
 */
function clickOnPatternNbUsersHeader() {
	let nbUsersHeader = null;
	let nbUsersTxt = "";
	// Remove the sorting indicators
	d3.select("#patternTable").selectAll("th")
		.each(function(d, i) {
			let colName = d3.select(this).text().split(/\s/);
			colName.pop();
			colName = colName.join("\u00A0").trim();
			if (colName == "Nb\u00A0users") {
				nbUsersHeader = this;
				nbUsersTxt = colName;
			} else
				d3.select(this).text(colName+"\u00A0\u00A0");
		});
	if (lastPatternSort == "nbUsersDown") {
		d3.select(nbUsersHeader).text(nbUsersTxt + "\u00A0↓");
		sortPatternsByNbUsers();
	} else {
		d3.select(nbUsersHeader).text(nbUsersTxt + "\u00A0↑");
		sortPatternsByNbUsers(true);
	}
	
	createPatternListDisplay();
}

/**
 * Handles a click on the 'support' header in the pattern list
 */
function clickOnPatternSupportHeader() {
	let supportHeader = null;
	let supportTxt = "";
	// Remove the sorting indicators
	d3.select("#patternTable").selectAll("th")
		.each(function(d, i) {
			let colName = d3.select(this).text().split(/\s/);
			colName.pop();
			colName = colName.join("\u00A0").trim();
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

/**
 * (Re)creates the display of the highlights summary
 */
function setHighlights() {
	// removing the potential old user highlights
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
					.classed("highlightButton", true)
					.text(thisUser)
					.on("click", function() {
						highlightUserRow(thisUser);
						setHighlights();
						timeline.displayData();
						//d3.event.stopPropagation();
					});
				if (i < highlightedUsers.length - 1)
					userDisplayArea.append("span")
						.text(" ");
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
					.classed("highlightButton", true)
					.style("color", colorList[highlightedEventTypes[i]][0].toString())
					.text(itemShapes[highlightedEventTypes[i]])
					.on("click", function() {
						highlightEventTypeRow(thisEventType);
						setHighlights();
						timeline.displayData();
						//d3.event.stopPropagation();
					})
				  .append("span")
					.style("color", "black")
					.text("\u00A0"+highlightedEventTypes[i]);

				if (i < highlightedEventTypes.length - 1)
					eventTypeDisplayArea.append("span")
						.text(" ");
			}
		} else {
			eventTypeDisplayArea.text(highlightedEventTypes.length +" event types");
		}
	}

}

/**
 * Switch the highlight of a given event type in the event types list
 * @param {string} eType - The event type we want the highlight switched
 */
function highlightEventTypeRow(eType) {
	// Highlights the row
	var row = d3.select("#eventTableBody").select("#"+eType);
	
	if (row.attr("class") === null) {
		row.classed("selectedEventTypeRow", true);
		// Adds the newly highlighted event type to the list
		highlightedEventTypes.push(eType);
		addToHistory("Highlight event type "+eType);
	} else {
		if (row.classed("selectedEventTypeRow")) {
			// Remove this event type from the list of highlighted event types
			let eventIdx = highlightedEventTypes.indexOf(eType);
			highlightedEventTypes.splice(eventIdx, 1);
			addToHistory("Unhighlight event type "+eType);
		} else {
			// Adds the newly highlighted user to the list
			highlightedEventTypes.push(eType);
			addToHistory("Highlight event type "+eType);
		}
		row.classed("selectedEventTypeRow", !row.classed("selectedEventTypeRow"));
	}
}

/**
 * Switch the highlight of a given user in the user list
 * @param {string} userName - The user we want the highlight switched
 */
function highlightUserRow(userName) {
	// Highlights the user
	var row = d3.select("#userTableBody").select("#u"+userName);
	
	if (row.attr("class") === null) {
		//console.log("adding from null "+rowId);
		row.classed("selectedUserRow", true);
		// Adds the newly highlighted user to the list
		highlightedUsers.push(userName);
		// Updates the displays of the number of selected users
		d3.select("#showSelectedUserSessionsButton")
			.text("Selected users ("+highlightedUsers.length+")");
		addToHistory("Highlight user "+userName);
	} else {
		if (row.classed("selectedUserRow")) {
			// Remove this user from the list of highlighted users
			let userIdx = highlightedUsers.indexOf(userName);
			highlightedUsers.splice(userIdx, 1);
			// Updates the displays of the number of selected users
			d3.select("#showSelectedUserSessionsButton")
				.text("Selected users ("+highlightedUsers.length+")");
			addToHistory("Unhighlight user "+userName);
			// If a filter is being applied, removes the row if necessary
			if (relatedUsers.length == 0) {
				if (currentUserSearchInput.length > 0)
					row.remove(); // The filter accepts nothing
			} else {
				if (!relatedUsers.includes(userName))
					row.remove(); // The filter rejects the user
			}
		} else {
			//console.log("adding "+rowId);
			// Adds the newly highlighted user to the list
			highlightedUsers.push(userName);
			// Updates the displays of the number of selected users
			d3.select("#showSelectedUserSessionsButton")
				.text("Selected users ("+highlightedUsers.length+")");
			addToHistory("Highlight user "+userName);
		}
		row.classed("selectedUserRow", !row.classed("selectedUserRow"));
	}
}

/**
 * Creates the list of event types
 */
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
			});
		let firstCell = eventRow.append("td")
			.property("title",eventTypeInformations[eType].description);
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

/**
 * Displays the list of users.
 * Takes into account the current ordering and user highlights
 */
function createUserListDisplay() {
	// removing the old users
	var userRowsRoot = document.getElementById("userTableBody");
	while (userRowsRoot.firstChild) {
		userRowsRoot.removeChild(userRowsRoot.firstChild);
	}
	
	// Adding the new ones
	for (let u= 0; u < userInformations.length; u++) {
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
			result += tmpValue+" year";
			if (tmpValue > 1)
				result += "s";
			timeDiff = timeDiff - tmpValue*years;
			tdText = "> "+result;
		}
		if (result == "") {
			if (Math.floor(timeDiff / days) > 0) {
				tmpValue = Math.floor(timeDiff / days);
				result += tmpValue+" day";
				if (tmpValue > 1)
					result += "s";
				timeDiff = timeDiff - tmpValue*days;
				tdText = result;
			} else {
				tdText = "< 1 day";
			}
		}
		userRow.append("td").text(tdText); // traceDuration
		
		 // number of sessions
		if (userSessions[thisUser[0]]) {
			userRow.append("td").text(userSessions[thisUser[0]].length);
		} else {
			userRow.append("td").text("??");
		}
		

		// Date format : yyyy-MM-dd HH:mm:ss
		let startDate = thisUser[3].split(" ");
		let part1 = startDate[0].split("-");
		let part2 = startDate[1].split(":");
		let d1 = new Date(parseInt(part1[0]),
				parseInt(part1[1]),
				parseInt(part1[2]),
				parseInt(part2[0]),
				parseInt(part2[1]),
				parseInt(part2[2]));
		let startDateFormated = part1[1]+"/"+part1[2]+"/"+part1[0].substring(2,4);//+" "+part2[0]+":"+part2[1]+":"+part2[2];
		let endDate = thisUser[4].split(" ");
		part1 = endDate[0].split("-");
		part2 = endDate[1].split(":");
		let d2 = new Date(parseInt(part1[0]),
				parseInt(part1[1]),
				parseInt(part1[2]),
				parseInt(part2[0]),
				parseInt(part2[1]),
				parseInt(part2[2]));
		let endDateFormated = part1[1]+"/"+part1[2]+"/"+part1[0].substring(2,4);//+" "+part2[0]+":"+part2[1]+":"+part2[2];
		
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
				//d3.event.stopPropagation();
			}
		});
	}
	
	// Calling the display of the trace
	//timeline.drawUsersTraces();  Keep commented until the function really draws the user traces
}

/**
 * If necessary, changes the display mode for the session view and refreshes it
 * @param {string} mode - The display mode for the session view
 */
function showUserSessions(mode) {
	let eventsShown = true;
	switch (mode) {
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

/**
 * Starts the algorithm runtime counter, that will be updated every second
 * @param {Number} time The time in ms at which the algorithm started
 *  on the server
 */
function startAlgorithmRuntime(time) {
	let clientTime = new Date();
	algorithmStartTime = new Date(time);
	startDelayFromServer = algorithmStartTime - clientTime;
	algorithmTimer = setInterval(function() {
		let thisTime = new Date();
		let elapsedTime = thisTime - algorithmStartTime;
		// Compensate for the delay between the two clocks
		elapsedTime += startDelayFromServer;
		let elapsedMinutes = Math.floor(elapsedTime/60000);
		elapsedTime = elapsedTime%60000;
		let elapsedSeconds = Math.floor(elapsedTime/1000);
		// Update the display of the runtime
		let text = "";
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
 * Stops the algorithm runtime counter
 * @param {Number} time The time in ms at which the algorithm ended on the server
 */
function stopAlgorithmRuntime(time) {
	if (algorithmStartTime > 0) {
		clearInterval(algorithmTimer);
		// checks if the timer is coherent with the server's
		let thisDate = new Date(time);
		let elapsedTime = thisDate - algorithmStartTime;
		let elapsedMinutes = Math.floor(elapsedTime/60000);
		elapsedTime = elapsedTime%60000;
		let elapsedSeconds = Math.floor(elapsedTime/1000);
		// Update the display of the runtime
		let text = "";
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
 * Displays that the algorithm is loading its data
 */
function handleLoadingSignal() {
	loadingAlgorithmDataAnimation = setInterval(function() {
		let dots;
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
 */
function handleLoadedSignal() {
	clearInterval(loadingAlgorithmDataAnimation);
	loadingAlgorithmDataAnimationState = 1;
	d3.select("#currentAlgorithmWork")
		.text("(Data loaded)");
	console.log("Dataset loaded on server");
}

/**
 * Displays the current pattern-size the algorithm is working on
 * @param {number} level The pattern size
 */
function handleNewLevelSignal(level) {
	d3.select("#currentAlgorithmWork")
		.text("(working on size "+level+")");
}

/**
 * Draws the barchart displaying the number of discovered pattern for each size
 */
function drawPatternSizesChart() {
	let data = Object.keys(patternMetrics.sizeDistribution);
	
	patternSizesChart.x.domain(data.map(function(d) { return d; }));
	patternSizesChart.y.domain([0, d3.max(data, function(d) {
		return patternMetrics.sizeDistribution[d];
	})]);
	
	patternSizesChart.g.select('.axis--x.axis')
		.transition()
		.duration(0)
		.call(patternSizesChart.xAxis);
	
	patternSizesChart.g.select(".axis--y.axis")
		.transition()
		.duration(0)
		.call(patternSizesChart.yAxis);
	 
	// second argument of .data() is an ID generator function
	let bars = patternSizesChart.g.selectAll("rect.bar")
		.data(data, function(d) { return d; });
	let texts = patternSizesChart.g.selectAll("text.bar")
		.data(data, function(d) { return d; });

	bars.exit()
		.transition()
		.duration(0)
		.attr("y", patternSizesChart.y(0))
		.attr("height", patternSizesChart.height - patternSizesChart.y(0))
		.style('fill-opacity', 1e-6)
		.remove();
	
	texts.exit()
		.transition()
		.duration(0)
		.attr("y", patternSizesChart.y(0))
		.attr("height", patternSizesChart.height - patternSizesChart.y(0))
		.style('fill-opacity', 1e-6)
		.remove();
	
	bars.enter().append("rect")
		.attr("class", "bar")
		.attr("y", patternSizesChart.y(0))
		.attr("height", patternSizesChart.height - patternSizesChart.y(0));
	
	texts.enter().append("text")
		.attr("class", "bar")
		.attr("text-anchor", "middle")
		.attr("x", function(d) {
			return patternSizesChart.x(d) + patternSizesChart.x.bandwidth()/2;
		})
		.attr("y", function(d) {
			return patternSizesChart.y(patternMetrics.sizeDistribution[d]) - 5;
		})
		.text(function(d) { return patternMetrics.sizeDistribution[d]; });
		
	// the "UPDATE" set:
	bars.transition().duration(0)
		.attr("x", function(d) { return patternSizesChart.x(d); })
		.attr("width", patternSizesChart.x.bandwidth())
		.attr("y", function(d) {
			return patternSizesChart.y(patternMetrics.sizeDistribution[d]);
		})
		.attr("height", function(d) {
			return patternSizesChart.height -
			patternSizesChart.y(patternMetrics.sizeDistribution[d]);
		});
	
	texts.transition()
		.duration(0)
		.attr("x", function(d) {
			return patternSizesChart.x(d) + patternSizesChart.x.bandwidth()/2;
		})
		.attr("y", function(d) {
			return patternSizesChart.y(patternMetrics.sizeDistribution[d]) - 5;
		})
		.text(function(d) { return patternMetrics.sizeDistribution[d]; });
}

/**
 * Displays the new focus of the algorithm after a steering has started
 * @param {string} type The type of steering that is occurring
 * @param {string} value The focus of the steering, according to its type
 */
function handleSteeringStartSignal(type, value) {
	d3.select("#focus").text(type+" starting with: "+value);
}

/**
 * Clears the display of the algorithm's steering after it has ended
 */
function handleSteeringStopSignal() {
	d3.select("#focus").text("");
}

/**
 * Refreshes the display of the timeline's session view
 * 
 * TODO Make it a mthod of the timeline ? Or maybe just replace the calls by
 * direct calls to the function's content
 */
function refreshUserPatterns() {
	timeline.drawUsersPatterns();
}

/**
 * Removes a pattern row from the document. Used once in processMessage, but
 *  probably needs to be removed.
 * Probably dates back to the pre-viz code.
 * 
 * @param id The id of the pattern to remove
 * 
 * @deprecated Check if the message calling it can still be sent by the server
 * 
 * TODO Decide if it is te be kept or not
 */
function removePatternFromList(id) {
	document.getElementById("pattern"+id).remove();
}

/**
 * Removes the content of the current pattern list (selected and unselected) and
 * recreates it from scratch, according to the current selections and filters
 * 
 * TODO Optimize the way it is doing it and clean the code
 */
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
		let pUsers = patternsInformation[patternIdList[i]][4];
		
		let index = selectedPatternIds.indexOf(pId);
		
		// Only add the pattern if:
		// - it is selected (always displayed)
		// - the filter is empty or accepts the pattern
		if (selectedPatternIds.includes(pId) == false) {
			if (pString.toLowerCase().includes(properPatternSearchInput.toLowerCase()) == false) {
				continue; // The filter rejects the pattern
			}
		}
		
		filteredPatterns++;
		
		if (index >= 0) {
			patternList = d3.select("#selectedPatternTableBody");
		} else {
			patternList = d3.select("#patternTableBody");
		}
		
		let thisRow = patternList.append("tr")
			.attr("id","pattern"+pId)
			.classed("clickable",true)
			.on("click", function() {
				if (d3.event.shiftKey) { // Shift + click, steering
					requestSteeringOnPattern(pId);
					d3.event.stopPropagation();
				} else { // Normal click, displays the occurrences
					if (selectedPatternIds.includes(pId)) {
						let index = selectedPatternIds.indexOf(pId);
						if (index >= 0)
							selectedPatternIds.splice(index, 1);
					} else {
						selectedPatternIds.push(pId);
					}
					
					if (occurrencesAreKnown(pId) == false)
						requestPatternOccurrences(pId, currentDatasetName);
					else
						timeline.displayData(); // TODO optimize by just displaying the pattern occurrences
					//d3.event.stopPropagation();
					console.log("click on "+pId);
					createPatternListDisplay();
					
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
			.text(pSupport);
		thisRow.append("td")
			.text(pUsers.length);
		thisRow.append("td")
			.text(pSize);
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

/************************************/
/*				Tooltip				*/
/************************************/

/**
 * Changes the tooltip's data
 * @param {JSON} data The new data 
 * @param {string} origin The origin of the data. Can be either "general" or
 *  "session"
 */
function changeTooltip(data, origin) {
	// If the tooltip is fixed, store the data as its' supposed data
	if (tooltipIsFixed) {
		tooltipSupposedOrigin = origin;
		tooltipSupposedData = data;
		tooltipShouldBeCleared= false;
	} else {
		tooltipShouldBeCleared = false;
		tooltipData = data;
		tooltipOrigin = origin;
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
					if (nbOccs.length > 1) {
						ttTableHead.append("th")
							.text(nbOccs.length + " event types");
					} else {
						ttTableHead.append("th")
							.text(nbOccs.length + " event type");
					}
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
						
						ttTableRow.classed("clickable", true)
							.classed("bold", highlightedEventTypes.includes(occ[0]))
							.on("click", function() {
								highlightEventTypeRow(occ[0]);
								d3.select(this)
									.classed("bold", highlightedEventTypes.includes(occ[0]));
								setHighlights();
								timeline.displayData();
							});
						
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
					
					let typeLine = area.append("p")
						.classed("clickable", true)
						.classed("bold", highlightedEventTypes.includes(splitData[0]))
						.text("Type: ")
						.on("click", function() {
							highlightEventTypeRow(splitData[0]);
							d3.select(this)
								.classed("bold", highlightedEventTypes.includes(splitData[0]));
							setHighlights();
							timeline.displayData();
						});
					typeLine.append("span")
						.style("color",colorList[splitData[0]][0])
						.text(itemShapes[splitData[0]]);
					typeLine.append("span")
						.text(" "+splitData[0]);
					area.append("p")
						.text("Time: " + splitData[1]);
					area.append("p")
						.classed("clickable", true)
						.classed("bold", highlightedUsers.includes(splitData[3]))
						.text("User: " + splitData[3])
						.on("click", function() {
							highlightUserRow(splitData[3]);
							d3.select(this)
								.classed("bold", highlightedUsers.includes(splitData[3]));
							setHighlights();
							timeline.displayData();
						});
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
			 * 	"patternId: number"]
		   	 */
			
			area.append("p")
				.classed("clickable", true)
				.classed("bold", highlightedUsers.includes(data[0]))
				.text("User " + data[0])
				.on("click", function() {
					highlightUserRow(data[0]);
					d3.select(this)
						.classed("bold", highlightedUsers.includes(data[0]));
					setHighlights();
					timeline.displayData();
				});
			
			let dateStart = "";
			let dateEnd = "";
			let duration = (data[3] - data[2]) / 1000; // In seconds
			let dS = duration % 60;
			let dM = Math.floor(duration / 60);
			let dH = Math.floor(dM / 60);
			dM = dM % 60;
			let durationString = "";
			if (dH > 0)
				durationString += dH + "h ";
			if (dM > 0 || dH > 0)
				durationString += dM + "m ";
			durationString += dS + "s";
			
			switch(data[1]) {
			case -1:/*
				area.append("p")
					.text("No session");*/
				break;
			case 0:
				dateStart = new Date(data[2]);
				dateEnd = new Date(data[3]);
				area.append("p")
					.text(data[4]+" events");
				area.append("p")
					.text("Session duration: "+durationString);
				area.append("p")
					.text("Session start: "+formatDate(dateStart));
				area.append("p")
					.text("Session end: "+formatDate(dateEnd));
				area.append("hr");
				area.append("p")
					.text("No pattern in this session");
				break;
			default:
				dateStart = new Date(data[2]);
				dateEnd = new Date(data[3]);
				area.append("p")
				.text(data[4]+" events");
			area.append("p")
				.text("Session duration: "+durationString);
				area.append("p")
					.text("Session start: "+formatDate(dateStart));
				area.append("p")
					.text("Session end:  "+formatDate(dateEnd));
				area.append("hr");
				area.append("p")
					.text("Show patterns' text: ")
				  .append("input")
				  	.attr("type", "checkbox")
				  	.property("checked", true)
				  	.classed("clickable", true)
				  	.on("change", function() {
				  		if (d3.select(this).property("checked")) {
				  			d3.selectAll(".tooltipPatternText")
				  				.classed("hidden", false);
				  		} else {
				  			d3.selectAll(".tooltipPatternText")
			  					.classed("hidden", true);
				  		}
				  	});
				let ttTable = area.append("table");
				let ttTableHead = ttTable.append("thead").append("tr");
				if (data[1] > 1) {
					ttTableHead.append("th")
						.text(data[1] + " patterns");
				} else {
					ttTableHead.append("th")
						.text(data[1] + " pattern");
				}
				ttTableHead.append("th")
					.text("Support (here"+String.fromCharCode(160)+"/"+String.fromCharCode(160)+"total)"); // Use non-breaking spaces
				let ttTableBody = ttTable.append("tbody");
				for (let pIdx = 5; pIdx < data.length; pIdx++) {
					let thisData = data[pIdx].split(":");
					let pId = Number(thisData[0].trim());
					let evtTypes = patternsInformation[pId][3];
					let ttTableRow = ttTableBody.append("tr")
						.classed("clickable", true)
						.classed("bold", selectedPatternIds.includes(pId))
						.on("click", function() {
							if (selectedPatternIds.includes(pId)) {
								let index = selectedPatternIds.indexOf(pId);
								if (index >= 0)
									selectedPatternIds.splice(index, 1);
								d3.select(this).classed("bold", false);
							} else {
								selectedPatternIds.push(pId);
								d3.select(this).classed("bold", true);
							}
							if (occurrencesAreKnown(pId) == false)
								requestPatternOccurrences(pId, currentDatasetName);
							else
								timeline.displayData(); // TODO optimize by just displaying the pattern occurrences
							//d3.event.stopPropagation();
							console.log("click on "+pId);
							createPatternListDisplay();
							
							// Update the number of selected patterns display
							d3.select("#selectedPatternNumberSpan").text(selectedPatternIds.length);
						});
					let firstCell = ttTableRow.append("td");
					for (let tIdx = 0; tIdx < evtTypes.length; tIdx++) {
						firstCell.append("span")
							.style("color", colorList[evtTypes[tIdx]][0])
							.text(itemShapes[evtTypes[tIdx]]);
					}
					firstCell.append("span")
						.classed("tooltipPatternText", true)
						.text(" " + patternsInformation[pId][0]);
					ttTableRow.append("td")
						.text(thisData[1].trim() + " / " + patternsInformation[pId][2]);
				}
			}
			
			break;
		default:
		}
		
		tooltipHasContent = true;
		tooltip.property("scrollTop",0);
		tooltip.classed("hidden", false);
	}
}

/**
 * Clears the tooltip's content, or marks it to be cleared when possible
 */
function clearTooltip() {
	if (!tooltipIsFixed) {
		d3.select("#tooltip").select(".body")
			.html("Hover over the visualizations to get more information");
		tooltipHasContent = false;
		//updateTooltipLockMessage();
		tooltip.classed("hidden", true);
	} else {
		tooltipShouldBeCleared = true;
	}
}

/**
 * Updates the instruction to lock or unlock the tooltip
 */
function updateTooltipLockMessage() {
	if (tooltipIsFixed) {
		tooltip.select(".subtitle")
			.text("Click somewhere to unlock this tooltip");
	} else {
		tooltip.select(".subtitle")
			.text("Click somewhere to lock this tooltip");
	}
}

/**
 * Moves the tooltip to the position of the mouse
 */
function moveTooltip() {
	let mousePos;
	try {
		mousePos = d3.mouse(d3.select("body").node());
		currentMousePos = mousePos;
	} catch(e) {
		mousePos = currentMousePos;
	}
	
	if (tooltipIsFixed == true)
		return;
	
	let mX = mousePos[0];
	let mY = mousePos[1];
	let newPosX = mousePos[0] + tooltipOffsetFromMouse;
	let newPosY = mousePos[1] - tooltipOffsetFromMouse - tooltipNode.offsetHeight;
	if (newPosY < 0)
		newPosY = 0;
	tooltip.style("left", newPosX+"px")
		.style("top", newPosY+"px");
}

/**
 * Locks the tooltip at its current position
 */
function lockTooltip() {
	tooltipIsFixed = true;
	updateTooltipLockMessage();
}

/**
 * Unlocks the tooltip from its position
 */
function unlockTooltip() {
	tooltipIsFixed = false;
	updateTooltipLockMessage();
}

/**
 * Starts the countdown before actually considering that the pointer has 
 *  left the tooltip
 */
function prepareToLeaveTooltip() {
	tooltipCloseTimeout = setTimeout(leaveTooltip, 500);
}

/**
 * Handles the pointer leaving the tooltip
 */
function leaveTooltip() {
	mouseIsInsideTooltip = false;

	unlockTooltip();
	clearTooltip();
	updateTooltip();
}

/**
 * Handles the pointer entering the tooltip
 */
function enterTooltip() {
	// Prevent the hiding of the tooltip if it has been planned
	clearTimeout(tooltipCloseTimeout);
	
	mouseIsInsideTooltip = true;

	tooltip.select(".subtitle")
		.text("Move the pointer out of this tooltip to close it");
}

/**
 * If the mouse pointer is outside the tooltip, switches its locked state
 */
function switchTooltipLock() {
	// Prevent from unlocking when the mouse is inside the tooltip
	if (mouseIsInsideTooltip)
		return;
	if (tooltipHasContent) {
		tooltipIsFixed = !tooltipIsFixed;
		updateTooltipLockMessage();
		if (!tooltipIsFixed) {
			updateTooltip();
		}
	}
}

/**
 * Clears the tooltip or updates its data and position
 */
function updateTooltip() {
	if (tooltipShouldBeCleared)
		clearTooltip();
	else {
		changeTooltip(tooltipSupposedData, tooltipSupposedOrigin);
		moveTooltip();
	}
}

/************************************/
/*			Miscellaneous			*/
/************************************/

/**
 * Selects the given dataset to be used in the tool
 * @param {string} datasetName - Name of the dataset
 */
function selectDataset(datasetName) {
	currentDatasetName = datasetName;
	
	requestDatasetLoad(datasetName);
	
	requestDatasetInfo(datasetName);
	requestEventTypes(datasetName);
	requestUserList(datasetName);
	enableCentralOverlay("The dataset is loading...");
	requestDataset(datasetName);
}

/**
 * Clears the selection of patterns and update the HCI accordingly
 */
function unselectAllPatterns() {
	selectedPatternIds = [];
	
	createPatternListDisplay();
	timeline.displayData(); // TODO only redraw the pattern occurrences
	//timeline.drawUsersPatterns(); // TODO uncomment when the above line's TODO will be done
	
	// Update the number of selected patterns display
	d3.select("#selectedPatternNumberSpan").text('0');
}

/**
 * Handles the onChange() event for the checkbox controling the display of
 * events in the timeline's session view
 */
function changeDrawIndividualEventsOnSessions() {
	let checked = d3.select("#drawIndividualEventsInput").property("checked");
	if (checked == true)
		d3.select("#showOnlyHighlightedInSessions").classed("hidden", false);
	else
		d3.select("#showOnlyHighlightedInSessions").classed("hidden", true);
	refreshUserPatterns();
}

/************************************/
/*			Constructors			*/
/************************************/

/**
 * Creates a barchart of the number of discovered patterns for each size
 * @constructor
 */
function PatternSizesChart() {
	this.svg = d3.select(d3.selectAll("#Execution > div").nodes()[1]).append("svg")
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("id","patternSizesSvg");
	this.margin = {top: 20, right: 0, bottom: 40, left: 30};
	this.width = this.svg.node().getBoundingClientRect().width -
				 this.margin.left - this.margin.right;
	this.height = this.svg.node().getBoundingClientRect().height -
				 this.margin.top - this.margin.bottom;
	this.x = d3.scaleBand().rangeRound([0, this.width]).padding(0.1);
	this.y = d3.scaleLinear().rangeRound([this.height, 0]);
	this.xAxis = d3.axisBottom(this.x);
	this.yAxis = d3.axisLeft(this.y).ticks(5);
	this.g = this.svg.append("g")
			.attr("transform",
				 "translate(" + this.margin.left + "," + this.margin.top + ")");
}

/**
 * Creates a slider controling the 'support' parameter of the algorithm
 * @constructor
 * @param {string} elemId Id of the HTML node where the slider will be created
 */
function SupportSlider(elemId) {
	let self = this;
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
			self.currentHandleMinValue = Math.min(value, otherValue);
			var otherValue = self.axis.invert(self.handle1.attr("cx"));	
			self.currentHandleMaxValue = Math.max(value, otherValue);
	
			self.blueLine.attr("x1",self.axis(self.currentHandleMinValue))
				.attr("x2",self.axis(self.currentHandleMaxValue));
		}
		/*self.blueLine.attr("x1",)
			.attr("x2",self.axis(Math.round(value)));*/
	};
}

/**
 * Creates a slider controling the 'gap' parameter of the algorithm
 * @constructor
 * @param {string} elemId Id of the HTML node where the slider will be created
 */
function GapSlider(elemId) {
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
	
	self.resetPatterns = function() {
		patternOccurrences = {};
		selectedPatternIds = [];
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
		
		if (dataDimensions.time) {
			currentTimeFilter = [self.xFocus.domain()[0].getTime(), self.xFocus.domain()[1].getTime()+1];
			dataDimensions.time.filterRange(currentTimeFilter);
		}
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

		if (dataDimensions.time) {
			currentTimeFilter = [self.xFocus.domain()[0].getTime(), self.xFocus.domain()[1].getTime()+1];
			dataDimensions.time.filterRange(currentTimeFilter);
		}
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

	self.sessionColor = "#01668C";//04B7FB
	self.sessionColorFaded = "#7DCAE7";//c8daea
	self.sessionColorHighlighted = "#9B0000";//red
	
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
		
		self.canvasUsersContext.clearRect(0,0,self.canvasUsers.attr("width"),self.canvasUsers.attr("height"));
		
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
		let yAxis = self.users.select(".axis--y");
		yAxis.call(self.yAxisUsers);
		// Format the labels and make them clickable
		yAxis.selectAll(".tick text")
			.each(function(d) {
				let el = d3.select(this);
				el.classed("clickable", true)
					.on("click", function(){
						highlightUserRow(el.text());
						setHighlights();
						timeline.displayData();
					});
			});

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
				let color = self.sessionColor;
				if (hasSelected == true) {
					color = self.sessionColorFaded; // lighter blue
					Object.keys(ses.count).forEach(function(id, idx) {
						if (selectedPatternIds.includes(Number(id))) {
							//console.log(id+" selected");
							color = self.sessionColorHighlighted;
						}
					});
				}
				
				/*var event = userTraces[userName][j];
				var eventData = event[0].split(";");*/
				
				self.canvasUsersContext.beginPath();
				
				let x1 = Math.floor(self.xUsers(new Date(ses.start)));
				let x2 = Math.floor(self.xUsers(new Date(ses.end)));
				let y1 = 0;
				let y2 = 0;
				if (x1 == x2) {
					// Offset the position to get crisp lines
					x1 += 0.5;
					x2 += 0.5;
					y1 = self.yUsers(userName);
					y2 = self.yUsers(userName) + self.yUsers.bandwidth();
					self.canvasUsersContext.lineWidth = 1;
				} else {
					y1 = self.yUsers(userName) + self.yUsers.bandwidth()/2;
					y2 = y1;
					self.canvasUsersContext.lineWidth = Math.floor(self.yUsers.bandwidth());
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
		let idsToDraw = selectedPatternIds;
		
		//console.log("patterns to draw: "+listOfPatternsToDraw);
		
		let step = self.marginFocus.size / (idsToDraw.length + 1.0);
		let range = [];
		for (let i = 0; i< idsToDraw.length + 2; i++)
			range.push(i*step);
		
		
		self.yPatterns = d3.scaleOrdinal()
			.domain([""].concat(idsToDraw).concat([""]))
			.range(range);
	
		self.yAxisPatterns = d3.axisRight(self.yPatterns)
	        .tickValues(self.yPatterns.domain());
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
					let pId = parseInt(el.text());
					if (!isNaN(pId) && patternsInformation[pId] && patternsInformation[pId].length >= 0) {
		        		let elts = patternsInformation[pId][0].split(' ');
		        		
		        		el.classed("clickable", true)
		        			.on("click", function() {
		        				let index = selectedPatternIds.indexOf(pId);
								if (index >= 0) {
									selectedPatternIds.splice(index, 1);
									createPatternListDisplay();
									d3.select("#selectedPatternNumberSpan").text(selectedPatternIds.length);
									self.displayData(); // TODO Only redraw the pattern occurrences
								}
		        			});
		        		
		        		if (elts.length > 0 && elts[0].length > 0) {
							// erase the old text
							el.text("");
							el.append("title")
								.text(patternsInformation[pId][0]);
							// add a tspan for each event type symbol
							for (let symbolIdx = 0; symbolIdx < elts.length; symbolIdx++) {
								let evtName = elts[symbolIdx];
								el.append("tspan")
									.text(itemShapes[evtName])
									.style("fill", colorList[evtName][0].toString());
							}
						}
		        	}
				});
		}
		
		switch(self.displayMode) {
		case "distributions": // Displays all occurrences of a pattern on a line
			for (let i = 0; i < idsToDraw.length; i++) {// Draw each pattern
				for (let j=0; j < patternOccurrences[idsToDraw[i]].length; j++) {// Draw each occurrence
					console.log("Ids to draw: "+idsToDraw);
					if (patternOccurrences[idsToDraw[i]][j]) {
						let occ = patternOccurrences[idsToDraw[i]][j].split(";");
						// Only draw the occurrence if it belongs to a selected user
						// To uncomment when "only show highlighted" will impact the bin view
						//if (highlightedUsers.length == 0 || highlightedUsers.includes(occ[0])) {
							let x1 = self.xFocus(new Date(parseInt(occ[1])));
							let x2 = self.xFocus(new Date(parseInt(occ[occ.length-1]))); // Last timestamp in the occurrence
							let y = self.yPatterns(idsToDraw[i]);
							self.canvasContext.beginPath();
							if (x1 == x2) {
								self.canvasContext.fillStyle = "black";
								self.canvasContext.arc(x1,y,1.5,0,2*Math.PI, false);
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
						//}
					}
				}
			}
			break;
		case "events": // Displays occurrences by connecting their events
			for (let i = 0; i < idsToDraw.length; i++) {// Draw each pattern
				let patternItems = patternsInformation[idsToDraw[i]][3];
				for (let j=0; j < patternOccurrences[idsToDraw[i]].length; j++) {// Draw each occurrence
					console.log("Ids to draw: "+idsToDraw);
					if (patternOccurrences[idsToDraw[i]][j]) {
						let occ = patternOccurrences[idsToDraw[i]][j].split(";");
						// Only draw the occurrence if it belongs to a selected user
						// 	and if "only show highlighted" is true
						if (!self.showOnlyHighlightedInFocus || (highlightedUsers.length == 0 || highlightedUsers.includes(occ[0]))) {
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
		let s = d3.event.selection || self.xContext.range();
		// draw the custom brush handles
		self.brushHandles.attr("display", null).attr("transform", function(d, i) { return "translate(" + [ s[i], - self.marginContext.size / 4] + ")"; });
		
		if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") {	
			return; // ignore brush-by-zoom
		}
		
		self.xFocus.domain(s.map(self.xContext.invert, self.xContext));
		self.xPatterns.domain(s.map(self.xContext.invert, self.xContext));
		self.xUsers.domain(s.map(self.xContext.invert, self.xContext));
		/*self.focus.select(".area")
			.attr("d", self.areaFocus);*/
		self.focus.select(".axis--x")
			.call(self.xAxisFocus);
		self.users.select(".axis--x")
			.call(self.xAxisUsers);
		
		if (dataDimensions.time) {
			currentTimeFilter = [self.xFocus.domain()[0].getTime(), self.xFocus.domain()[1].getTime()+1];
			dataDimensions.time.filterRange(currentTimeFilter);
		}
		
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
		
		// draw the custom brush handles
		//self.brushHandles.attr("display", null).attr("transform", function(d, i) { return "translate(" + [ s[i], - self.marginContext.size / 4] + ")"; });
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
	
	self.getRelevantDisplayMode = function() {
		let displaySeconds = (self.xFocus.domain()[1] - self.xFocus.domain()[0])/1000;
		if (displaySeconds < 60*60*24*3 ) { // less than 3 days
			return "events";
		} else {
			return "distributions";
		}
	};
	
	self.getRelevantDistributionScale = function() {
		let displaySeconds = (self.xFocus.domain()[1] - self.xFocus.domain()[0])/1000;
		if (self.getRelevantDisplayMode() == "distributions") {
			if (displaySeconds > 60*60*24*365*3 )	// more than 3 years
				return "year";
			if (displaySeconds < 60*60*24*365*3 && displaySeconds > 60*60*24*365)	// between 1 year and 3 years
				return "month";
			if (displaySeconds < 60*60*24*365 && displaySeconds > 60*60*24*31*3)	// between 3 months and 1 year
				return "halfMonth";
			if (displaySeconds < 60*60*24*31*3 && displaySeconds > 60*60*24*7*3)	// between 3 months and 3 weeks
				return "day";
			if (displaySeconds < 60*60*24*7*3 && displaySeconds > 60*60*24*3)	// between 3 weeks and 3 days
				return "halfDay";
			// If no other condition is met
			console.log("Trying to scale distributions in an unknown way. distributionScale = "+self.distributionScale);
			return "halfDay";
		}
		console.log("Trying to display data in an unknown way. displayMode = "+self.displayMode);
	};
	
	self.displayData = function() {
		//startRunningTaskIndicator();
		//console.log("----DisplayData----");
		// check if we need to adapt the semantic zoom
		let displaySeconds = (self.xFocus.domain()[1] - self.xFocus.domain()[0])/1000;
		let displayModeIsFine = false;
		let displayDistributionIsFine = false;
		if (self.getRelevantDisplayMode() == self.displayMode) {
			displayModeIsFine = true;
			if (self.displayMode == "events")
				displayDistributionIsFine = true;
			else
				displayDistributionIsFine = (self.getRelevantDistributionScale() == self.distributionScale);
		}
		
		// Adapt the semantic zoom if needed
		if (displayModeIsFine == false || displayDistributionIsFine == false) {
			d3.selectAll(".zoomInfoSpan").classed("currentZoom", false); // remove the .currentZoom from the previously used zomm level
		}
		
		if (displayModeIsFine == false) {
			self.displayMode = self.getRelevantDisplayMode();
			self.switchEventDisplayStyleFormVisibility();
			self.switchBinsDisplayStyleFormVisibility();
			if (self.displayMode == "events")
				d3.select("#zoomInfoEvent").classed("currentZoom", true);
		}
		
		if (displayDistributionIsFine == false) {
			self.distributionScale = self.getRelevantDistributionScale();
			requestRelevantBins(currentDatasetName, self.distributionScale);
			switch(self.distributionScale) {
			case "halfDay":
				d3.select("#zoomInfoHalfDay").classed("currentZoom", true);
				break;
			case "day":
				d3.select("#zoomInfoDay").classed("currentZoom", true);
				break;
			case "halfMonth":
				d3.select("#zoomInfoHalfMonth").classed("currentZoom", true);
				break;
			case "month":
				d3.select("#zoomInfoMonth").classed("currentZoom", true);
				break;
			case "year":
				d3.select("#zoomInfoYear").classed("currentZoom", true);
				break;
			default:
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
		.text("Show categories: ")
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
		.text("Relative size: ")
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
			.classed("clickable", true)
			.on("click", function(d,i) {
				highlightEventTypeRow(d);
				setHighlights();
				timeline.displayData();
			})
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
		.classed("hidden", true)
	  .append("input")
		.attr("type","radio")
		.attr("name","scale")
		.attr("value","time")
		.classed("clickable", true)
		.classed("hidden", true);
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
		changeTooltip(data, "general");
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
		changeTooltip(message, "agavue");
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
		 * ["id: number"]
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
		changeTooltip(data, "session");
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
	self.gBrush = self.context.append("g")
		.attr("class", "brush")
		.call(self.brush);
	// Creating the custom handles for the context brush
	self.brushResizePath = function(d) {
	    var e = +(d.type == "e"),
	        x = e ? 1 : -1,
	        y = self.marginContext.size / 2;
	    return "M" + (.5 * x) + "," + y + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6) + "V" + (2 * y - 6) + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y) + "Z" + "M" + (2.5 * x) + "," + (y + 8) + "V" + (2 * y - 8) + "M" + (4.5 * x) + "," + (y + 8) + "V" + (2 * y - 8);
	}
	// Adding custom handles to the context brush
	self.brushHandles = self.gBrush.selectAll(".handle--custom")
		.data([{type: "w"}, {type: "e"}])
		.enter().append("path")
		  .attr("class", "handle--custom")
		  .attr("stroke", "#000")
		  .attr("fill", "#666")
		  .attr("fill-opacity", 0.8)
		  .attr("cursor", "ew-resize")
		  .attr("d", self.brushResizePath);
	self.gBrush.call(self.brush.move, self.xFocus.range());
	
	
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
			coords[1] = coords[1];// - self.yUsers.bandwidth()/2;
			let mouseDate = self.xUsers.invert(coords[0]).getTime();
			let userListDomain = self.yUsers.domain();
			let userListRange = self.yUsers.range();
			
			let data = [];
			
			let mouseUserIndex = Math.floor((coords[1] / self.yUsers.step()));
			let mouseUser = userListDomain[mouseUserIndex];//userListDomain[d3.bisect(userListRange, coords[1]) -2];
			
			// If there is no user under the mouse, no point in trying to detect something
			if (mouseUser == undefined) {
				if (self.userTooltipCreated == true) {
					clearTooltip();
				}
				return;
			}
			
			data.push(mouseUser);
			
			let theSession = null;
			
			// try to find the session if there is one under (the pixel is not white)
			let pixelColors = self.canvasUsersContext.getImageData(coords[0], coords[1],1,1).data;
			if (pixelColors[3]!= 0) {
				//console.log("Mouse x-y: "+coords[0]+"-"+coords[1]+" / "+mouseUser+" at "+self.xUsers.invert(coords[0]));
				// get the correct user session
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
			}
			// Display the tooltip if we have found a session
			if (theSession !== null) {
				// Add the number of patterns to the data
				data.push(Object.keys(theSession.count).length);
				data.push(theSession.start);
				data.push(theSession.end);
				data.push(theSession.nbEvents);
				// Addthe patterns to the data
				if (Object.keys(theSession.count).length > 0) {
					Object.keys(theSession.count).forEach(function(id, idx) {
						let msg = id+": ";
				    	msg += theSession.count[id];
				    	data.push(msg);
					})
				}
				self.displayToolTipSessionPatterns(data);
				self.userTooltipCreated = true;
			} else {
				data.push(-1);
				if (self.userTooltipCreated == true) {
					clearTooltip();
				}
			}
			
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
	
	self.focusOnSession = function(start, end) {
		//self.context.select(".brush")
			//.call(self.brush.move, [self.xFocus(start), self.xFocus(end)]);
	}
	
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

		/* Try to get sharper lines
		self.canvasContext.save();
		self.hiddenCanvasContext.save();
		
		self.canvasContext.translate("0.5","0.5");
		self.hiddenCanvasContext.translate("0.5","0.5");*/
		
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
		/*
		self.canvasContext.restore();
		self.hiddenCanvasContext.restore();*/
		nbEventsChecked += drawCount;
		console.log(drawCount+" events drawn, "+nbEventsChecked+" events checked");
		
		//console.log("events drawn");
	}
	
	self.drawEventsByTime = function() {
		
		self.yFocus.domain([0, maxEventAtOneTime + 1]);
		self.yAxisFocus = d3.axisLeft(self.yFocus);
			//.tickValues(eventTypes);
		d3.select("#focusLeftAxis").call(self.yAxisFocus);
		

		/* Try to get sharper lines
		self.canvasContext.save();
		self.hiddenCanvasContext.save();

		self.canvasContext.translate("0.5","0.5");
		self.hiddenCanvasContext.translate("0.5","0.5");*/
		
		
		
		
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

		/*self.canvasContext.restore();
		self.hiddenCanvasContext.restore();*/
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
