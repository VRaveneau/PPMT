
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

/******************************************************************************/
/*																			  */
/*									Variables								  */
/*																			  */
/******************************************************************************/

// The server the tool will be connected to
var server;

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

/**
 * The default color for user sessions
 */
var sessionColor = "#01668C";
// The faded color for user sessions
var sessionColorFaded = "#7DCAE7";
// The highlighted color for user sessions
var sessionColorHighlighted = "#9B0000";

/*************************************/
/*			HCI elements			 */
/*************************************/
// The timeline object managing the visualizations
var timeline = null;
// Default number of users shown in the session view
var defaultNbUserShown = 15;
// Number of users shown in the session view
var nbUserShown = defaultNbUserShown;

// Max number of pattern selected at once
var maxSelectedPatternNb = 5;

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

// Slider controling the modification of the support parameter of the algorithm
var supportModifySlider = null;
// Slider controling the modification of the window size parameter of the algorithm
var windowModifySlider = null;
// Slider controling the modification of the size parameter of the algorithm
var sizeModifySlider = null;
// Slider controling the modification of the gap parameter of the algorithm
var gapModifySlider = null;

// Minimum time span (in s) to use the 'year' distribution scale
var distributionYearThreshold = 60*60*24*365*3;	// 3 years
// Minimum time span (in s) to use the 'month' distribution scale
var distributionMonthThreshold = 60*60*24*365;	// 1 year
// Minimum time span (in s) to use the 'half month' distribution scale
var distributionHalfMonthThreshold = 60*60*24*31*3;	// 3 months
// Minimum time span (in s) to use the 'day' distribution scale
var distributionDayThreshold = 60*60*24*7*3; // 3 weeks
// Minimum time span (in s) to use the 'half day' distribution scale
var distributionHalfDayThreshold = 60*60*24*3; // 3 days

/*************************************/
/*		Algorithm parameters		 */
/*************************************/

// The minimum support parameter for the algorithm
var algoMinSupport = 500;
// The window size parameter for the algorithm
var algoWindowSize = 60;
// The maximum size parameter for the algorithm
var algoMaxSize = 10;
// The minimum gap parameter for the algorithm
var algoMinGap = 0;
// The maximum gap parameter for the algorithm
var algoMaxGap = 2;
// The maximum duration parameter for the algorithm
var algoMaxDuration = 30000;

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

// The value for the EventTypeInformations variable for an unmodified dataset
var defaultEventTypeInformations = [];
// The value for the EventTypes variable for an unmodified dataset
var defaultEventTypes = [];
// The value for the ColorList variable for an unmodified dataset
var defaultColorList = [];
// The value for the ItemShapes variable for an unmodified dataset
var defaultItemShapes = [];

// The categories of event types
var eventTypeCategories = [];
// For each category, the list of event types that belong to it
var eventTypesByCategory = {};
// For each category, the two colors associated with it
var eventTypeCategoryColors = {};

// The names of all users present in the dataset
var userList = [];

// The raw dataset -- Used to create the Crossfilter
var rawData = [];
// The Crossfilter containing all the dataset
var dataset = {};
/**
 * The dimensions created from the Crossfilter stored in dataset.
 */
var dataDimensions = {
	time: null,
	user: null,
	type: null,
	bin: {
		year: null,
		month: null,
		halfMonth: null,
		day: null,
		halfDay: null,
	}
};
/**
 * The event bins created from the Crossfilter stored in dataset
 */
var eventBins = {
	year: {
		data: null,
		getStart: null,
		getEnd: null
	},
	month: {
		data: null,
		getStart: null,
		getEnd: null
	},
	halfMonth: {
		data: null,
		getStart: null,
		getEnd: null
	},
	day: {
		data: null,
		getStart: null,
		getEnd: null
	},
	halfDay: {
		data: null,
		getStart: null,
		getEnd: null
	},
}

// Informations about the users
// For each key (userName), the available data is:
// name - nbEvents - duration - start - end
var userInformations = {};

// Events removed from the dataset
var removedEventsList = [];
// Ids of event added to the dataset
var addedEventIdsList = [];

// Number of extracted patterns
var numberOfPattern = 0;
// Information about the patterns
var patternsInformation = {};
// The list of ids for all the discovered patterns
var patternIdList = [];
// The list of ids for all the filtered out patterns
var filteredOutPatterns = [];
// The list of ids for all patterns found in the last steering
var lastSteeringPatterns = [];
// The list of patterns waiting to be integrated into the list
var availablePatterns = [];
// Known metrics on the patterns
var patternMetrics = {
	"sizeDistribution": {},
	"supportDistribution": {}
};

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
// Time of reception of the first event
var firstEventReceived = null;
// Time of reception of the last event
var lastEventReceived = null;

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

// Maximum pattern support
var maxPatternSupport = 0;
// Maximum pattern size
var maxPatternSize = 0;

/*************************************/
/*			State elements			 */
/*************************************/

// Whether to request a new start after a notification that the algorithm has
// been stopped or not
var algorithmWillRestart = false;

// Whether to consider all the patterns or only the ones found in the last steering
var showOnlyLastSteering = false;

// Whether the new patterns are directly integrated in the list or not
var patternLiveUpdate = true;

//
var patternsLoaded = false;
// Whether debug mode is active or not
var debugMode = false;
// Whether the pointer target is visible or not in the focus view
var showPointerTarget = false;
// Whether future patterns will be processed or not
var acceptNewPatterns = true;

// Whether information about the dataset is displayed (false) or not (true)
var datasetInfoIsDefault = true;

/**
 * The time period covered by the overview's brush.
 * Contains two values : start and end (in ms)
 */
var currentTimeFilter = [];

// Whether the description of event types is visible or not
var showEventTypeDescription = true;
// Whether the name of event types in a pattern is visible or not
var showPatternText = true;

// Whether the key strokes are listened to or not
var userInputIsDisabled = false;

// Sort order for the list of users. Expected value is one of the following :
// nbEvents_down - nbEvents_up
// name_down - name_up
// duration_down - duration_up
// nbSessions_down - nbSessions_up
// start_down - start_up
// end_down - end_up
var lastUserSort = "nbEvents_down";

// Sort order for the list of event types. Expected value is one of the following :
// support_down - support_up
// nbUsers_down - nbUsers_up
// name_down - name_up
// category_down - category_up
var lastEventTypeSort = "support_down";

// Sort order for the list of patterns. Expected value is one of the following :
// size_down - size_up
// support_down - support_up
// name_down - name_up
// nbUsers_down - nbUsers_up
var lastPatternSort = "size_up";
// Sort order for the list of selected patterns. Expected value is one of the following :
// size_down - size_up
// support_down - support_up
// name_down - name_up
// nbUsers_down - nbUsers_up
var lastSelectedPatternSort = "size_up";

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

// Whether the algorithm is running or not
var algorithmIsRunning;
// Time (in ms) at which the algorithm started
var algorithmStartTime = -1;
// Delay (in ms) between the server and the client
var startDelayFromServer = 0;

// Interval used to ping the server to avoid a timeout
var serverPingInterval;

// Whether the extended algorithm view is shown or not
var useExtendedAlgorithmView = false;

// The current state of the algorithm
var algorithmState = null;

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

// The history of actions during the analysis
var activityHistory = new ActivityHistory("historyList");

// The axis for the number of patterns bars in the algorithm extended view
var algorithmExtendedBarAxis = d3.scaleLinear().rangeRound([0, 200]);

// List of month names to display dates
var monthsNames = [
	"January", "February", "March",
	"April", "May", "June",
	"July", "August", "September",
	"October", "November", "December"];
// TODO request a list of shapes from the server to populate this list
var itemShapes = {};

/**
 * A debounced version of filterUserList
 * @type {function}
 */
var debouncedFilterUserList = _.debounce(filterUserList, 500);

/**
 * A debounced version of filterPatterns
 * @type {function}
 */
var debouncedFilterPatterns = _.debounce(filterPatterns, 200);

/******************************************************************************/
/*																			  */
/*									Functions								  */
/*																			  */
/******************************************************************************/

/*************************************/
/*				Utility				 */
/*************************************/

/**
 * Specific to the user study.
 * Restarts the pattern mining algorithm without changing the parameters
 */
function resetExpe() {
	if (algorithmState.isRunning()) {
		algorithmWillRestart = true;
		requestAlgorithmStop();
	} else {
		requestAlgorithmReStart();
	}
}

/**
 * Updates the display of the current time focus
 * @param {number} start The start of the interval
 * @param {number} end The end of the interval
 */
function updateCurrentTimeFilter(start, end) {
	currentTimeFilter = [start, end];
	
	let startDate = new Date(start);
	let endDate = new Date(end);

	let startDateString = monthsNames[startDate.getMonth()].substr(0,3)+". " +
		startDate.getDate() + ", " +
		startDate.getFullYear();
	let endDateString = monthsNames[endDate.getMonth()].substr(0,3)+". " +
		endDate.getDate() + ", " +
		endDate.getFullYear();
	
	let startTimeString = (startDate.getHours() < 10 ? "0" : "")+startDate.getHours() + ":" +
		(startDate.getMinutes() < 10 ? "0" : "")+startDate.getMinutes();
	let endTimeString = (endDate.getHours() < 10 ? "0" : "")+endDate.getHours() + ":" +
		(endDate.getMinutes() < 10 ? "0" : "")+endDate.getMinutes();
	
	let duration = end - start;
	let elapsedDays = Math.floor(duration/(24*60*60*1000));
	duration = duration%(24*60*60000);
	let elapsedHours = Math.floor(duration/(60*60*1000));
	duration = duration%(60*60000);
	let elapsedMinutes = Math.floor(duration/60000);
	let durationString = "";

	if (elapsedDays > 0) {
		durationString += elapsedDays+"days ";
	}
	durationString += elapsedHours+"h ";
	if (elapsedMinutes > 0) {
		durationString += elapsedMinutes+"min";
	}


	document.querySelector("#focusStart .date")
		.textContent = startDateString;
	document.querySelector("#focusStart .time")
		.textContent = startTimeString;
	
	document.querySelector("#focusEnd .date")
		.textContent = endDateString;
	document.querySelector("#focusEnd .time")
		.textContent = endTimeString;
	document.querySelector("#focusEnd .duration")
		.textContent = durationString;
}

/**
 * Resets the dataset to its unmodified state
 */
function resetDataset() {
	d3.select("#resetDatasetButton")
		.classed("hidden", true);
	
	requestDatasetReset();
	restoreInitialData();
	resetPatterns();
	requestAlgorithmReStart();

	activityHistory.resetDataset();
}

/**
 * Requests a steering on the time period under the overview brush
 */
function steerOnDisplayedTime() {
	requestSteeringOnTime(...currentTimeFilter);
}

/**
 * Keeps refreshing the algorithm state display each frame while it is running
 */
function updateAlgorithmStateDisplayOnRAF() {
	updateAlgorithmStateDisplay();
	if (algorithmIsRunning)
		requestAnimationFrame(updateAlgorithmStateDisplayOnRAF);
}

/**
 * Utility function to ask for the removal of all highlighted event types at once
 */
function askConfirmationToRemoveHighlightedEventTypes() {
	askConfirmationToRemoveEventTypes(...highlightedEventTypes);
}

/**
 * Utility function to ask for the removal of all not highlighted event types at once
 */
function askConfirmationToRemoveNotHighlightedEventTypes() {
	let notHighlighted = _.difference(eventTypes, highlightedEventTypes);
	askConfirmationToRemoveEventTypes(...notHighlighted);
}

/**
 * Utility function to ask for the removal of all highlighted users at once
 */
function askConfirmationToRemoveHighlightedUsers() {
	askConfirmationToRemoveUsers(...highlightedUsers);
}

/**
 * Utility function to ask for the removal of all not highlighted users at once
 */
function askConfirmationToRemoveNotHighlightedUsers() {
	let notHighlighted = _.difference(userList, highlightedUsers);
	askConfirmationToRemoveUsers(...notHighlighted);
}

/**
 * Prevents events against propagating to other DOM elements
 */
function stopEventPropagation() {
	d3.event.stopPropagation();
}

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
 * Takes a time duration and returns a string display of it. The returned string
 * can be in a short format (default), or in a long format
 * @param {number} time The time duration to format
 * @param {boolean} long Whether the return string will be short (XX:YY) or not (XXmin YYs)
 */
function formatElapsedTimeToString(time, long) {
	let elapsedMinutes = Math.floor(time/60000);
	time = time%60000;
	let elapsedSeconds = Math.floor(time/1000);
	let result = "";

	if(long) {
		if (elapsedMinutes > 0) {
			if (elapsedMinutes < 10)
				result = "0";
			result += elapsedMinutes+"min ";
		}
		if (elapsedSeconds < 10 && elapsedMinutes > 0)
			result += "0";
		result += elapsedSeconds+"s";
	} else {
		if (elapsedMinutes < 10)
			result = "0"+elapsedMinutes+":";
		else
			result = elapsedMinutes+":";
		if (elapsedSeconds < 10)
			result += "0"+elapsedSeconds;
		else
			result += elapsedSeconds;
	}
	
	return result;
}

/**
 * Manages keyboard input
 */
function handleKeyPress() {
	if (!userInputIsDisabled) {
		let kc = d3.event.key;
		switch(kc) {
		case "t":
			toggleExtendedAlgorithmView();
			break;
		case "m":
			if (debugMode) {
				console.log("Requesting mem debug");
				let msg = {action:"request",object:"memory"};
				sendToServer(msg);
			}
			break;
		case "h":
		case "H":
		case "?":
			debug();
			break;
		case "s":
		case "S":
			if (debugMode) {
				switchPatternAcceptance();
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
		case "Escape":
			if (useExtendedAlgorithmView)
				toggleExtendedAlgorithmView();
			break;
		default:
		}
	}
}

/**
 * Toggles on or off the debug tools
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
 * Toggles on or off the visualization of the pointer target in the focus view
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
 * Switches between accepting and rejecting incoming patterns
 */
function switchPatternAcceptance() {
	if (acceptNewPatterns) {
		console.log("New patterns will be rejected");
		d3.select("#debugHelpAcceptNewPatterns .kbTxt")
			.text("Accept new patterns");
		acceptNewPatterns = false;
	} else {
		console.log("New patterns will be accepted");
		d3.select("#debugHelpAcceptNewPatterns .kbTxt")
			.text("Ignore new patterns");
		acceptNewPatterns = true;
	}
}

/**
 * Toggles on or off the live updating of the pattern list when new patterns arrive
 */
function toggleLiveUpdate() {
	if (patternLiveUpdate) {
		patternLiveUpdate = false;
		document.getElementById("liveUpdateButton").textContent = "Resume live update";
		d3.select("#liveUpdateIndicator").classed("active", false);
		d3.select("#updatePatternListButton").classed("invisible", false);
	} else {
		// Complete the list with available patterns
		updatePatternList();
		
		patternLiveUpdate = true;
		document.getElementById("liveUpdateButton").textContent = "Pause live update";
		d3.select("#liveUpdateIndicator").classed("active", true);
		d3.select("#updatePatternListButton").classed("invisible", true);
	}
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
 * Hides the blocking overlay over the center of the tool
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
 * @param {boolean} short Whether to use the short or long name of months
 */
function formatDate(date, short = false) {
	if (typeof date == "string") {
		let parts = date.split(" ");
		if (parts.length != 6)
			return date;
		let month = parts[1];
		if (!short) {
			switch(month) {
				case "Jan":
					month = " January";
					break;
				case "Feb":
					month = " February";
					break;
				case "Mar":
					month = " March";
					break;
				case "Apr":
					month = " April";
					break;
				case "May":
					month = " May";
					break;
				case "Jun":
					month = " June";
					break;
				case "Jul":
					month = " July";
					break;
				case "Aug":
					month = " August";
					break;
				case "Sep":
					month = " September";
					break;
				case "Oct":
					month = " October";
					break;
				case "Nov":
					month = " November";
					break;
				case "Dec":
					month = " December";
					break;
				default:
			}
		}
		return month+" "+parts[2]+", "+parts[5]+", "+parts[3];
	} else {
		let parts = [
			"",
			short ? monthsNames[date.getMonth()].substr(0,3)+"." : monthsNames[date.getMonth()],
			date.getDate()+",",
			date.getFullYear()+",",
			(date.getHours() < 10 ? "0" : "")+date.getHours()+":"+
			(date.getMinutes() < 10 ? "0" : "")+date.getMinutes()+":"+
			(date.getSeconds() < 10 ? "0" : "")+date.getSeconds()
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
	case "name_down":
		return patternIdList.findIndex(function(elt, idx) {
			return patternsInformation[elt][0] < patternInfos[0];
		});
	case "name_up":
		return patternIdList.findIndex(function(elt, idx) {
			return patternsInformation[elt][0] > patternInfos[0];
		});
	case "size_down":
		return patternIdList.findIndex(function(elt, idx) {
			return patternsInformation[elt][1] < patternInfos[1];
		});
	case "size_up":
		return patternIdList.findIndex(function(elt, idx) {
			return patternsInformation[elt][1] > patternInfos[1];
		});
	case "nbUsers_down":
		return patternIdList.findIndex(function(elt, idx) {
			return patternsInformation[elt][4].length < patternInfos[4].length;
		});
	case "nbUsers_up":
		return patternIdList.findIndex(function(elt, idx) {
			return patternsInformation[elt][4].length > patternInfos[4].length;
		});
	case "support_down":
		return patternIdList.findIndex(function(elt, idx) {
			return patternsInformation[elt][2] < patternInfos[2];
		});
	case "support_up":
		return patternIdList.findIndex(function(elt, idx) {
			return patternsInformation[elt][2] > patternInfos[2];
		});
	}
	return 0;
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

	// If a dataset is given as parameters, open the relevant server to ask for it
	let serverInformation = false;
	if (pageParameters.data) {
        server = createServer("websocket");
		serverInformation = true;
	} else if (pageParameters.localdata) {
        server = createServer("local");
		serverInformation = true;
	}
	
	if (serverInformation) {
		server.connect();
		setupTool();
	} else { // Otherwise, redirect to the dataset selection page
		handleUnknownDataset();
	}
}

/**
 * Creates the server, depending on the serverType given in the config object.
 * @param {string} serverType The type of server, either "websocket" or "local"
 * @returns {ServerInterface} The server interface object
 */
function createServer(serverType) {
	switch(serverType) {
		case "websocket":
			return new WebSocketServer(config.websocketAdress,
				processOpen, processClose, processError, processMessage);
			break;
		case "local":
			return new LocalServer(processOpen, processClose, processError, processMessage);
			break;
		default:
			// TODO raise an error or ask to choose a local dataset ?
			console.error("!! The requested server type (" + serverType +
						") is unknown !!");
	}
}

/**
 * Creates the sort indicators for the tables
 */
function setupTableSortIndicators() {
	let template = document.getElementById("sortIndicator");
	let headers = document.getElementsByClassName("sortIndicator");

	for (let i = 0; i < headers.length; i++) {
		let clone = document.importNode(template.content, true);
		headers[i].appendChild(clone);
	}

	updateEventTypeTableHead();
	updateUserTableHead();
	updateSelectedPatternTableHead();
	updatePatternTableHead();
}

/**
 * Initializes the tool once a dataset has been selected
 */
function setupTool() {
	setupAlgorithmSpeedGraphs();
	setupTableSortIndicators();
	setupModalWindows();
	disableUserInputWhereNeeded();
	setupAlgorithmSearchField();
	setupUserSearchField();
	
	d3.select("#showPatternTextInput")
		.on("click", switchShowPatternText);
	d3.select("#showEventTypeDescriptionInput")
		.on("click", switchShowEventTypeDescription);

	// Setup the input for the number of users to display
	d3.select("#showAllUserSessionsInput")
		.on("change", function() {
			d3.select("#shownUserSessionsControl")
				.classed("hidden",
					d3.select("#showAllUserSessionsInput").property("checked")
				);
		});
	
	// TODO Might need to be deleted now...
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
	document.getElementById("selectablePatternSpan").textContent = maxSelectedPatternNb;
	
	timeline = new Timeline("timeline",{});
	
	setupAlgorithmSliders();
	setupPatternSizesChart();
	
	d3.select("body").on("keyup", handleKeyPress);
	d3.select("#center").on("mousemove", moveTooltip);
	d3.select("#center").on("click", switchTooltipLock);
	d3.select("#tooltip").on("mouseleave", prepareToLeaveTooltip);
	d3.select("#tooltip").on("mouseenter", enterTooltip);
	
	resetDatasetInfo();	// Set the display of information on the dataset
}

var patternsPerSecondChart;
var candidatesCheckedPerSecondChart;

/**
 * Setups the speed graphs in the extended algorithm state view
 */
function setupAlgorithmSpeedGraphs() {
	patternsPerSecondChart = new PatternPerSecondGraph("patternsPerSecond");
	candidatesCheckedPerSecondChart = new CandidatesCheckedPerSecondGraph("candidatesCheckedPerSecond");
	//patternsPerSecondSvg.draw();
	
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
		userInputIsDisabled = true;
		suggestionDiv.style("display", "block");
	});
	
	searchField.on("focusout", function() {
		userInputIsDisabled = false;
		if (mouseIsOverUserSuggestions == false)
			suggestionDiv.style("display", "none");
	});
	
	searchField.on("input", debouncedFilterUserList);
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

				if (relatedUsers.length > 0) {
					currentUserSearchSuggestionIdx = 0;
					suggestionDiv.html("");
					relatedUsers.forEach(function(d,i) {
						suggestionDiv.append("p")
							.classed("selectedSuggestion", i==currentUserSearchSuggestionIdx)
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
					d3.select(this).classed("selectedSuggestion", i==currentUserSearchSuggestionIdx);
				});
			}
			break;
		case "ArrowDown": // Change the currently targeted suggestion
			if (currentUserSearchSuggestionIdx < relatedUsers.length - 1) {
				currentUserSearchSuggestionIdx++;
				suggestionDiv.selectAll("p").each(function(d,i) {
					d3.select(this).classed("selectedSuggestion", i==currentUserSearchSuggestionIdx);
				});
			}
			break;
		default:
		}
		currentKeyDownUser = "";
	});
}

/**
 * Disables user input when it causes problems, mainly for text input fields
 */
function disableUserInputWhereNeeded() {
	d3.selectAll(".noInput")
		.on("focus", () => {
			userInputIsDisabled = true;
		})
		.on("focusout", () => {
			userInputIsDisabled = false;
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
		userInputIsDisabled = true;
		suggestionDiv.style("display", "block");
	});
	
	searchField.on("focusout", function() {
		userInputIsDisabled = false;
		if (mouseIsOverPatternSuggestions == false)
			suggestionDiv.style("display", "none");
	});
	
	searchField.on("input", function() {
		updatePatternSearchSuggestion();
		debouncedFilterPatterns();
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
				selectPatternSearchSuggestion(currentPatternSearchSuggestionIdx);
			}
			break;
		case "ArrowUp":
			if (currentPatternSearchSuggestionIdx > 0) {
				let baseLength = currentPatternSearchInput.length -
								currentPatternSearchFragment.length;
				let baseValue = currentPatternSearchInput.substr(0, baseLength);
				currentPatternSearchSuggestionIdx--;
				suggestionDiv.selectAll("p").each(function(d,i) {
					d3.select(this).classed("selectedSuggestion", i==currentPatternSearchSuggestionIdx);
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
					d3.select(this).classed("selectedSuggestion", i==currentPatternSearchSuggestionIdx);
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
	
	patternSizesChart.y.domain(data.map(function(d) { return d; }));
	patternSizesChart.x.domain([0, d3.max(data, function(d) {
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
			.attr("x", patternSizesChart.x(0))
			.attr("y", (d) => patternSizesChart.y(d))
			.attr("height", patternSizesChart.y.bandwidth())
			.attr("width", (d) => patternSizesChart.x(patternMetrics.sizeDistribution[d]));
}

/**
 * Setup the sliders that control the algorithm
 */
function setupAlgorithmSliders() {
	// Setup the filtering sliders
	setupAlgorithmSupportSlider();
	//setupAlgorithmWindowSizeSlider();
	setupAlgorithmMaximumSizeSlider();
	//setupAlgorithmGapSlider();

	// Setup the parameter modifying sliders
	toggleExtendedAlgorithmView(); // Open the extended view to setup the width properly
	setupSupportParameterSlider();
	setupGapParameterSlider();
	setupDurationParameterSlider();
	setupSizeParameterSlider();
	toggleExtendedAlgorithmView(); // Close the extended view now that we're done
}

/**
 * Setup the slider controling the 'support' parameter of the algorithm
 */
function setupAlgorithmSupportSlider() {
	// Using the custom made slider
	supportSlider = new FilterSlider("sliderSupport", debouncedFilterPatterns, "supportDistribution");
	
	// Using noUiSlider
	/*supportSlider = document.getElementById("sliderSupport");
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
	});*/
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
	sizeSlider = new FilterSlider("sliderSize", debouncedFilterPatterns, "sizeDistribution");
	
	/*sizeSlider = document.getElementById("sliderSize");
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
	});*/
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
 * Setup the slider controling the 'support' parameter of the algorithm
 */
function setupSupportParameterSlider() {
	let sliderOptions = {
		brushNumber: 1
	}
	supportModifySlider = new ModifySlider("minSupportChangeSlider", sliderOptions);
}

/**
 * Setup the slider controling the 'gap' parameter of the algorithm
 */
function setupGapParameterSlider() {
	let sliderOptions = {
		brushNumber: 2
	}
	gapModifySlider = new ModifySlider("gapChangeSlider", sliderOptions);
}

/**
 * Setup the slider controling the 'duration' parameter of the algorithm
 */
function setupDurationParameterSlider() {
	let sliderOptions = {
		brushNumber: 1
	}
	durationModifySlider = new ModifySlider("maxDurationChangeSlider", sliderOptions);
}

/**
 * Setup the slider controling the 'size' parameter of the algorithm
 */
function setupSizeParameterSlider() {
	let sliderOptions = {
		brushNumber: 1
	}
	sizeModifySlider = new ModifySlider("maxSizeChangeSlider", sliderOptions);
}

/**
 * Sets up the modal windows
 */
function setupModalWindows() {
	d3.select("#modalContent")
		.on("click", function() {
			d3.event.stopPropagation();
		});
	d3.select("#modalBackground")
		.on("click", closeModal);
	d3.select("#modalCloseArea")
		.on("click", closeModal);
}

/**
 * Creates all the dimensions associated  with the event bins
 */
function setupEventBinDimensions() {
	eventBins.year.data = buildEventBins("year");
	eventBins.month.data = buildEventBins("month");
	eventBins.halfMonth.data = buildEventBins("halfMonth");
	eventBins.day.data = buildEventBins("day");
	eventBins.halfDay.data = buildEventBins("halfDay");
	
	function reduceAdd(prev, val, nf) {
		prev.eventCount++;
		if (prev.users.hasOwnProperty(val.user)) {
			prev.users[val.user]++;
		} else
			prev.users[val.user] = 1;
		if (prev.events.hasOwnProperty(val.type)) {
			prev.events[val.type]++;
		} else
			prev.events[val.type] = 1;
		if (prev.aDateInside == null)
			prev.aDateInside = val.start;
		return prev;
	}

	function reduceRemove(prev, val, nf) {
		prev.eventCount--;
		prev.users[val.user]--;
		prev.events[val.type]--;
		return prev;
	}

	function reduceInitial() {
		return {eventCount:0, users:{}, events:{}, aDateInside:null};
	}

	eventBins.halfDay.data.reduce(reduceAdd, reduceRemove, reduceInitial);
	eventBins.day.data.reduce(reduceAdd, reduceRemove, reduceInitial);
	eventBins.halfMonth.data.reduce(reduceAdd, reduceRemove, reduceInitial);
	eventBins.month.data.reduce(reduceAdd, reduceRemove, reduceInitial);
	eventBins.year.data.reduce(reduceAdd, reduceRemove, reduceInitial);
}

/*************************************/
/*				Algorithm			 */
/*************************************/

/**
 * Starts the algorithm with default values, for the start of the session
 */
function startInitialMining() {
	// TODO Stop using hard coded value depending on the dataset
	
	switch(currentDatasetName) {
		case "recsysSamplecategory":
			algoMinSupport = 10;
			algoWindowSize = 60;
			algoMaxSize = 20;
			algoMinGap = 0;
			algoMaxGap = 2;
			algoMaxDuration = 30000;
			break;
		case "coconotesPPMT":
			algoMinSupport = 150;
			algoWindowSize = 60;
			algoMaxSize = 20;
			algoMinGap = 0;
			algoMaxGap = 2;
			algoMaxDuration = 30000;
			break;
		case "coconotesPPMTLarge":
			algoMinSupport = 100;
			algoWindowSize = 60;
			algoMaxSize = 20;
			algoMinGap = 0;
			algoMaxGap = 2;
			algoMaxDuration = 30000;
			break;
		default:
	}
	if (pageParameters.serverDelay) {
		let delay = parseInt(pageParameters.serverDelay);
		requestAlgorithmStart(algoMinSupport, algoWindowSize, algoMaxSize,
			algoMinGap, algoMaxGap, algoMaxDuration, currentDatasetName, delay);
	} else {
		requestAlgorithmStart(algoMinSupport, algoWindowSize, algoMaxSize,
			algoMinGap, algoMaxGap, algoMaxDuration, currentDatasetName);
	}
}

/**
 * Specifies the parameters to be used by the algorithm, displays them and
 * sends the request
 * @param {number} minSupport The minimum absolute support threashold
 * @param {number} windowSize The size of the window
 * @param {number} maxSize The maximum pattern size
 * @param {number} minGap The minimum allowed gap between two events of a pattern
 * @param {number} maxGap The maximum allowed gap between two events of a pattern
 * @param {number} maxDuration The maximum duration of a pattern occurrence
 * @param {number} datasetName The name of the dataset to be used
 * @param {number} delay The delay (in ms) between each candidate check on the server
 */
function requestAlgorithmStart(minSupport, windowSize, maxSize, minGap, maxGap,
								maxDuration, datasetName, ...delay) {
	console.log("Requesting algorithm start:");
	console.log("   minSup: "+minSupport+", windowSize: "+windowSize+
		", maxSize: "+maxSize+", minGap: "+minGap+", maxGap: "+maxGap+
		", maxDuration: "+maxDuration+", datasetName: "+datasetName+", delay: "+delay);
	
	// Make sure that the patterns will be accepted
	if (!acceptNewPatterns)
		switchPatternAcceptance();

	let action = {
		action: "run",
		object: "algorithm",
		minSup: minSupport.toString(),
		windowSize: windowSize.toString(),
		maxSize: maxSize.toString(),
		minGap: minGap.toString(),
		maxGap: maxGap.toString(),
		maxDuration: maxDuration.toString(),
		datasetName: datasetName
	};

	if (delay.length > 0) {
		action.delay = delay[0];
	}
	sendToServer(action);

	// Start the timer independently from the server
	//stopAlgorithmRuntime();
	//startAlgorithmRuntime();
	
	// Reset the algorithm state
	algorithmState = new AlgorithmState();

	// Update the display of the current parameters in the Execution tab
	d3.select("#currentSupport").text(minSupport+" occs.");
	d3.select("#currentGap").text(minGap+"-"+maxGap+" events");
	d3.select("#currentSize").text(maxSize+" events");
	d3.select("#currentMaxDuration").text(maxDuration/1000+"s");

	// Update the display of the current parameters in the extended algorithm tab
	d3.select("#currentSupportExtended").text(minSupport+" occs.");
	d3.select("#currentGapExtended").text(minGap+"-"+maxGap+" events");
	d3.select("#currentWindowExtended").text(windowSize);
	d3.select("#currentSizeExtended").text(maxSize+" events");
	d3.select("#currentMaxDurationExtended").text(maxDuration/1000+"s");
	supportModifySlider.updateValues([minSupport]);
	gapModifySlider.updateValues([minGap, maxGap]);
	sizeModifySlider.updateValues([maxSize]);
	durationModifySlider.updateValues([maxDuration]);
}

/**
 * Restarts the algorithm with the current parameters
 */
function requestAlgorithmReStart() {
	updateUserInformations();
	updateDatasetInfo();
	resetPatterns();
	displayDatasetInfo();
	createUserListDisplay();
	//createEventTypesListDisplay();
	timeline.displayData();
	updateRestartButtonStyle();
	
	requestAlgorithmStart(algoMinSupport, algoWindowSize, algoMaxSize,
		algoMinGap, algoMaxGap, algoMaxDuration, currentDatasetName);
}

/**
 * Requests the termination of the algorithm
 */
function requestAlgorithmStop() {
	let action = {
		action: "stop",
		object: "algorithm"
	};
	sendToServer(action);
}

/**
 * Updates the parameters used by the algorithm, based on the sliders in the
 * extended algorithm view
 */
function changeAlgorithmParameters() {
	let gapValues = gapModifySlider.getValues();
	let modifiedValues = {
		support: algoMinSupport != supportModifySlider.getValues()[0],
		minGap: algoMinGap != gapValues[0],
		maxGap: algoMaxGap != gapValues[1],
		duration: algoMaxDuration != durationModifySlider.getValues()[0],
		size: algoMaxSize != sizeModifySlider.getValues()[0]
	};
	algoMinSupport = supportModifySlider.getValues()[0];
	algoMaxSize = sizeModifySlider.getValues()[0];
	algoMinGap = gapValues[0];
	algoMaxGap = gapValues[1];
	algoMaxDuration = durationModifySlider.getValues()[0];

	activityHistory.changeParameters(algoMinSupport, algoMinGap, algoMaxGap, algoMaxDuration, algoMaxSize, modifiedValues);
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
	serverPingInterval = setInterval(function() {
		console.log("pinging server");
		let action = {
				action: "ping"
		};
		sendToServer(action);
	}, 10*60*1000); // every 10 minutes

	// Ask if the target dataset is available
	requestDatasetValidation(pageParameters.data || pageParameters.localdata);
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
    var msg = message.data;
	// Update the last received date display
	d3.select("#lastReceivedTimeDisplay span")
		.text(formatDate(new Date()));
	//console.log("Receive from server => " + message.data + "\n");
	//var message = LZString.decompressFromUTF16(messageCompressed.data);
    if (typeof msg === "string") {
	    msg = JSON.parse(msg);
    };

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
    if (msg.action === "message") { // Receive a status/info/error message from the server
        activityHistory.serverMessage(msg.message, msg.title);
    }
	if (msg.action === "debug") {	// Receiving a debug message from the server
		if (msg.object && msg.object === "memory") { // The debug is about the memory size of the dataset
			let fullSize = parseInt(msg.size);
			let eventSize = parseInt(msg.sizeEvents);
			console.log("-----MemDebug-----");
			console.log("Dataset : "+msg.dataset);
			console.log("Total size : "+fullSize+"o (~"+fullSize/1000000+"Mo)");
			console.log("Events size : "+eventSize+"o (~"+eventSize/1000000+"Mo)");
			console.log("'Strict' size : "+(fullSize-eventSize)+"o (~"+(fullSize-eventSize)/1000000+"Mo)");
			/*console.log("Dump :");
			console.log(msg.dump);*/
			console.log("-----EndDebug-----");
		} else {
			displayServerDebugMessage(msg);
		}
	}
	if (msg.action === "startLoading") { // The server starts to load the dataset
		displayDatasetLoading();
	}
	if (msg.action === "info") {
		if (msg.object === "newPattern") {
			if (acceptNewPatterns) {
				addPatternToList(msg);
				drawPatternSizesChart();
				algorithmState.addPattern();
			}
		}
	}
	if (msg.action === "signal") {
		if (msg.type === "start")
			handleAlgorithmStartSignal(msg);
		if (msg.type === "end")
			handleAlgorithmEndSignal(msg);
		if (msg.type === "stop")
			handleAlgorithmStopSignal(msg);
		if (msg.type === "newLevel")
			handleNewLevelSignal(parseInt(msg.level));
		if (msg.type === "levelComplete")
			handleLevelCompleteSignal(parseInt(msg.level));
		if (msg.type === "candidatesGenerated")
			handleCandidatesGeneratedSignal(parseInt(msg.number));
		if (msg.type === "loading")
			handleLoadingSignal();
		if (msg.type === "loaded")
			handleLoadedSignal();
		if (msg.type === "steeringStart")
			handleSteeringStartSignal(msg.steeringType, msg.value);
		if (msg.type === "steeringStop")
			handleSteeringStopSignal();
		if (msg.type == "candidateCheck")
			handleCandidateCheckSignal(msg.number);
	}
	if (msg.action === "datasetList") {
		receiveDatasetList(msg);
	}
	if (msg.action === "dataAlteration") {
		// Show the reset button
		d3.select("#resetDatasetButton")
			.classed("hidden", false);
		
		if (msg.type === "eventTypeCreated") {
			updateDatasetForNewEventType(msg.newEvents, msg.removedIds, msg.typeInfo, msg.removedTypes);
		}
		if (msg.type === "eventTypeRemoved") {
			updateDatasetForRemovedEventTypes(msg.removedIds, msg.removedEvents);
		}
		if (msg.type === "usersRemoved") {
			updateDatasetForRemovedUsers(msg.removedIds, msg.removedUsers);
		}
		// Restart the mining
		requestAlgorithmReStart();
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
	server.sendMessage(jsonMessage);
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
 * @deprecated Should no longer be used
 * 
 * TODO see if it really is deprecated
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
 * Requests a reset of the dataset to its initial state
 */
function requestDatasetReset() {
	let action = {
		action: "request",
		object: "datasetReset"
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
 * Requests a steering of the algorithm on a given pattern as prefix
 * @param {string} patternId - Id of the pattern to steer on
 */
function requestSteeringOnPatternPrefix(patternId) {
	console.log('requesting steering on patternId '+patternId+' as prefix');
	activityHistory.steerOnPrefix(patternId);
	let action = {
			action: "steerOnPattern",
			object: "start",
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
	activityHistory.steerOnUser(userId);
	let action = {
			action: "steerOnUser",
			userId: userId
	};
	sendToServer(action);
}

/**
 * Requests a steering of the algorithm on a given time period
 * @param {number} start - The start of the period
 * @param {number} end - The end of the period
 */
function requestSteeringOnTime(start, end) {
	console.log('requesting steering on time between '+start+' and '+end);
	activityHistory.steerOnTime(start, end);
	// Numbers are sent as strings to prevent an error when their value is read
	// by the server
	let action = {
			action: "steerOnTime",
			start: start+"",
			end: end+""
	};
	sendToServer(action);
}

/**
 * Requests an alteration of the dataset by creating a new event type from
 * a pattern
 * @param {number} patternId Id of the pattern
 * @param {string} eventTypeName The name of the new event type
 * @param {{removeOccurrences: [string]}} options Options for the type creation
 * @param {[string]} options.removeOccurrences Name of event types to remove after the creation
 */
function requestEventTypeCreationFromPattern(patternId, eventTypeName, options) {
	console.log('requesting the creation of event type '+
		' from pattern '+ patternId);
	let action = {
			action: "alterDataset",
			alteration: "createEventTypeFromPattern",
			patternId: patternId,
			typeName: eventTypeName,
			options: options
	};
	sendToServer(action);
}

/**
 * Requests an alteration of the dataset by removing some event types
 * @param {[string]} eventNames - The name of the event types
 */
function requestEventTypesRemoval(eventNames) {
	console.log('requesting the removal of event types '+ eventNames);
	let action = {
			action: "alterDataset",
			alteration: "removeEventTypes",
			eventNames: eventNames
	};
	sendToServer(action);
}

/**
 * Requests an alteration of the dataset by removing some users
 * @param {string[]} userNames - The name of the users
 */
function requestUsersRemoval(userNames) {
	console.log('requesting the removal of users '+userNames);
	let action = {
			action: "alterDataset",
			alteration: "removeUsers",
			userNames: userNames
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
		selectDataset(msg.dataset, msg.datasetToken);
	} else {
		handleUnknownDataset();
	}
}

/**
 * Receives information about a dataset from the server
 * @param {JSON} message - The message containing the information
 * 
 * TODO Describe the message structure
 */
function receiveDatasetInfo(message) {
	//console.log("number of sequences : " + message.numberOfSequences);
	datasetInfo["numberOfSequences"] = message.numberOfSequences;
	datasetInfo["numberOfDifferentEvents"] = message.numberOfDifferentEvents;
	datasetInfo["numberOfEvents"] = message.nbEvents;
	datasetInfo["users"] = message.users;
	datasetInfo["firstEvent"] = new Date(message.firstEvent);
	datasetInfo["lastEvent"] = new Date(message.lastEvent);
	datasetInfo["name"] = message.name;
	
	displayDatasetInfo();

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
	message.users.forEach(function(user) {
		let d1 = new Date(user.firstEventDate);
		let d2 = new Date(user.lastEventDate);
		let timeDiff = d2.getTime()-d1.getTime();

		userInformations[user.name] = {};
		userInformations[user.name].name = user.name;
		userInformations[user.name].nbEvents = user.eventNumber;
		userInformations[user.name].start = user.firstEventDate;
		userInformations[user.name].end = user.lastEventDate;
		userInformations[user.name].duration = timeDiff;

	});
	userList = Object.keys(userInformations);

	// sorting by event per user, in descending order
	sortUsersByNbEvents(true);
	
	// Creating the table
	createUserListDisplay();
}

/**
 * Receives some events and store them in memory
 * @param {JSON} events - The events and information about them
 */
function receiveEvents(events) {
	let nbEventsInMessage = events.numberOfEvents;
	if (nbEventsReceived == 0)
		firstEventReceived = new Date();

	events.events.forEach(function(evt) {
		let time = new Date(evt.start);
		let evtObj = {
			"id": evt.id,
			"type": evt.type,
			"start": time.getTime(),
			"end": evt.end,
			"user": evt.user,
			"properties": evt.properties
		};
		// Add the event to the array later used to create the crossfilter
		rawData.push(evtObj);
	});

	nbEventsReceived += nbEventsInMessage;
	enableCentralOverlay("Receiving all the events... ("+nbEventsReceived+" out of "+datasetInfo["numberOfEvents"]+")");
	
	// All events of the dataset are received
	if (datasetInfo["numberOfEvents"] == nbEventsReceived) {
		lastEventReceived = new Date();
		enableCentralOverlay("Preparing the data for the exploration...");
		console.log(nbEventsReceived+" events received between");
		console.log(firstEventReceived);
		console.log("and");
		console.log(lastEventReceived);
		console.log("Creating crossfilter at "+new Date());
		dataset = crossfilter(rawData);
		console.log("Crossfilter created at "+new Date());
		dataDimensions.user = dataset.dimension(function(d) {return d.user;});
		dataDimensions.time = dataset.dimension(function(d) {return d.start;});
		dataDimensions.type = dataset.dimension(function(d) {return d.type;});
		setupEventBinDimensions();
		console.log("Dimensions created at "+new Date());
		rawData = null;
		console.log("raw data removed");
		activityHistory.receiveDataset(datasetInfo.name);
		buildUserSessions();
		computeMaxEventAtOneTime();
		computeUsersPerEventType();
		createEventTypesListDisplay();
		timeline.displayData();
		updateCurrentTimeFilter(...timeline.xFocus.domain().map( x => x.getTime() ));
		dataDimensions.time.filterRange(currentTimeFilter);
		startInitialMining();
		disableCentralOverlay();
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
			let occTimestamp = new Date(o);
			for (idx = 0; idx < thisUserSessions.length; idx++) {
				if (thisUserSessions[idx].start <= occTimestamp &&
					thisUserSessions[idx].end >= occTimestamp) {
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
	let nbEvents = message.size;
	
	// Reset existing information about the event types
	eventTypeInformations = {};
	eventTypes = [];
	colorList = [];
	itemShapes = [];
	Object.keys(eventTypesByCategory).forEach(function (category) {
		eventTypesByCategory[category] = [];
	});
	
	// Hide the message saying that there is no event
	if (nbEvents > 0)
		d3.select("#noEvent").classed("hidden", true);

	message.eventTypes.forEach( function(evtType) {
		let eType = evtType.type;
		if (!eventTypes.includes(eType))
					eventTypes.push(eType);

		let eNbOccs = evtType.nbOccs;
		let eDescription = evtType.description;
		let eCategory = evtType.category;
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

		eventTypesByCategory[eCategory].push(eType);

		// Take the first available shape in this category
		let eCode = shapes[(eventTypesByCategory[eCategory].length - 1)%shapes.length];
		let eColor = eventTypeCategoryColors[eCategory];
		
		colorList[eType] = eColor;
		itemShapes[eType] = eCode;
		
		eventTypeInformations[eType] = {
				"category": eCategory,
				"description": eDescription,
				"nbOccs": eNbOccs,
				"code": eCode,
				"nbUsers": 0
		};
	});
	
	defaultEventTypeInformations = eventTypeInformations;
	defaultEventTypes = eventTypes;
	defaultColorList = colorList;
	defaultItemShapes = itemShapes;

	sortEventTypes();
	createEventTypesListDisplay();
}

/************************************/
/*		Data manipulation			*/
/************************************/

/**
 * Toggles between showing all patterns or only the ones found in the last steering
 */
function toggleShowOnlyLastSteering() {
	showOnlyLastSteering = !showOnlyLastSteering;
	if (showOnlyLastSteering) {
		document.getElementById("showOnlyLastSteeringButton")
			.classList.add("selectedOption");
		document.getElementById("showAllPatternsButton")
			.classList.remove("selectedOption");
	} else {
		document.getElementById("showOnlyLastSteeringButton")
			.classList.remove("selectedOption");
		document.getElementById("showAllPatternsButton")
			.classList.add("selectedOption");
	}
	filterPatterns();
}

/**
 * Integrates available patterns into the pattern list
 */
function updatePatternList() {
	patternIdList = _.concat(patternIdList, availablePatterns);
	availablePatterns = [];
	filterPatterns();
}

/**
 * Restore the dataset in the state it was when sent by the server
 */
function restoreInitialData() {
	resetDataFilters();

	dataset.remove( (d,i) => addedEventIdsList.includes(d.id) );
	addedEventIdsLis = [];

	dataset.add(removedEventsList);
	removedEventsList = [];

	// Reapply the time filter
	dataDimensions.time.filterRange(currentTimeFilter);

	eventTypeInformations = defaultEventTypeInformations;
	eventTypes = defaultEventTypes;
	colorList = defaultColorList;
	itemShapes = defaultItemShapes;

	highlightedUsers = [];
	highlightedEventTypes = [];

	updateUserInformations();
	updateEventTypesInformations();
	updateDatasetInfo(true);
	setHighlights();
}

/**
 * Computes the number of users for each event type
 */
function computeUsersPerEventType() {
	dataDimensions.time.filterAll();
	Object.keys(eventTypeInformations).forEach( (type) => {
		dataDimensions.type.filterExact(type);
		eventTypeInformations[type].nbUsers = dataDimensions.user.group().all()
			.filter( (d) => d.value > 0 ).length;
	});
	dataDimensions.type.filterAll();
	if (currentTimeFilter)
		dataDimensions.time.filterRange(currentTimeFilter);
}

/**
 * Filters the patterns according to all possible filters. Currently, this means:
 * - the sliders for support and size
 * - the 'only show patterns found in the last steering' option
 * - the subsyntax in the search field
 * 
 * A debounced version is available in debouncedFilterPatterns 
 */
function filterPatterns() {
	let rangeSupport = supportSlider.getSelectedRange();
	let rangeSize = sizeSlider.getSelectedRange();
	let nameSyntax = "" + currentPatternSearchInput;

	let toFilterOut = _.remove(patternIdList, function(pId) {
			let support = patternsInformation[pId][2];
			let size = patternsInformation[pId][1];
			let name = patternsInformation[pId][0];
			let supportInvalid = support < rangeSupport[0] || support > rangeSupport[1];
			let sizeInvalid = size < rangeSize[0] || size > rangeSize[1];
			let lastSteeringInvalid = showOnlyLastSteering ? !lastSteeringPatterns.includes(pId) : false;
			let syntaxInvalid = !name.includes(nameSyntax);
			return supportInvalid || sizeInvalid || lastSteeringInvalid || syntaxInvalid;
		});
	let toFilterIn = _.remove(filteredOutPatterns, function(pId) {
			let support = patternsInformation[pId][2];
			let size = patternsInformation[pId][1];
			let name = patternsInformation[pId][0];
			let supportValid = support >= rangeSupport[0] && support <= rangeSupport[1];
			let sizeValid = size >= rangeSize[0] && size <= rangeSize[1];
			let lastSteeringValid = showOnlyLastSteering ? lastSteeringPatterns.includes(pId) : true;
			let syntaxValid = name.includes(nameSyntax);
			return supportValid && sizeValid && lastSteeringValid && syntaxValid;
		});

	patternIdList = _.concat(patternIdList, toFilterIn);
	filteredOutPatterns = _.concat(filteredOutPatterns, toFilterOut);

	sortPatterns();
	updatePatternCountDisplay();
	// Updates the pattern list
	createPatternListDisplay();
}

/**
 * Filters the patterns according to the support slider
 * @param {[number]} range The currently selected range in the slider
 */
function filterPatternsBySupport(range) {
	let toFilterOut = _.remove(patternIdList, function(pId) {
			let supp = patternsInformation[pId][2];
			return supp < range[0] || supp > range[1];
				
		});
	let toFilterIn = _.remove(filteredOutPatterns, function(pId) {
			let supp = patternsInformation[pId][2];
			return supp >= range[0] && supp <= range[1];
		});

	patternIdList = _.concat(patternIdList, toFilterIn);
	filteredOutPatterns = _.concat(filteredOutPatterns, toFilterOut);
}

/**
 * Filters the patterns according to the size slider
 * @param {[number]} range The currently selected range in the slider
 */
function filterPatternsBySize(range) {
	let toFilterOut = _.remove(patternIdList, function(pId) {
			let size = patternsInformation[pId][1];
			return size < range[0] || size > range[1];
				
		});
	let toFilterIn = _.remove(filteredOutPatterns, function(pId) {
			let size = patternsInformation[pId][1];
			return size >= range[0] && size <= range[1];
		});

	patternIdList = _.concat(patternIdList, toFilterIn);
	filteredOutPatterns = _.concat(filteredOutPatterns, toFilterOut);
}

/**
 * Updates the list of patterns depending on the value in the pattern search field.
 * @param {string} syntax The syntax in the pattern search field
 */
function filterPatternsBySyntax(syntax) {
	let toFilterOut = _.remove(patternIdList, function(pId) {
		let name = patternsInformation[pId][0];
		return !name.includes(syntax);
	});
	let toFilterIn = _.remove(filteredOutPatterns, function(pId) {
		let name = patternsInformation[pId][0];
		return name.includes(syntax);
	});

	patternIdList = _.concat(patternIdList, toFilterIn);
	filteredOutPatterns = _.concat(filteredOutPatterns, toFilterOut);
}

/**
 * Updates the value for the maximum pattern support
 * @param {number} newSupport The new value
 */
function increaseMaxPatternSupport(newSupport) {
	maxPatternSupport = newSupport;
	supportSlider.updateDomainTop(maxPatternSupport);
}

/**
 * Resets the maximum pattern support 
 * @param {number} value The default value to use, 0 if not given
 */
function resetMaxPatternSupport(value = 0) {
	maxPatternSupport = value;
	supportSlider.updateDomainTop(maxPatternSupport);
}

/**
 * Updates the value for the maximum pattern size
 * @param {number} newSize The new value
 */
function increaseMaxPatternSize(newSize) {
	maxPatternSize = newSize;
	sizeSlider.updateDomainTop(maxPatternSize);
}

/**
 * Resets the maximum pattern size 
 * @param {number} value The default value to use, 0 if not given
 */
function resetMaxPatternSize(value = 0) {
	maxPatternSize = value;
	//sizeSlider.updateDomainTop(maxPatternSize);
}

/**
 * Updates the information on each user from the data
 */
function updateUserInformations() {
	dataDimensions.time.filterAll();
	userInformations = {};

	dataDimensions.user.group().dispose().all().forEach(function(user) {
		userInformations[user.key] = {};
		userInformations[user.key].name = user.key;
		userInformations[user.key].nbEvents = user.value;
		dataDimensions.user.filterExact(user.key);
		let dateStart = new Date(dataDimensions.time.bottom(1)[0].start);
		let dateEnd = new Date(dataDimensions.time.top(1)[0].start);
		userInformations[user.key].start = dateStart.toISOString();
		userInformations[user.key].end = dateEnd.toISOString();
		userInformations[user.key].duration = dateEnd.getTime() - dateStart.getTime();
	});
	dataDimensions.user.filterAll();

	// Reapply the time filter
	dataDimensions.time.filterRange(currentTimeFilter);

	userList = Object.keys(userInformations);
	sortUsers();
}

/**
 * Updates the information on each event type from the data
 */
function updateEventTypesInformations() {
	dataDimensions.time.filterAll();
	let oldInfo = eventTypeInformations;
	eventTypeInformations = {};
	eventTypesByCategory = {};
	eventTypeCategories = [];

	dataDimensions.type.group().dispose().all().forEach( function(type) {
		let category = oldInfo[type.key].category;

		eventTypeInformations[type.key] = {};
		eventTypeInformations[type.key].category = category;
		eventTypeInformations[type.key].description = oldInfo[type.key].description;
		eventTypeInformations[type.key].nbOccs = type.value;
		eventTypeInformations[type.key].code = oldInfo[type.key].code;
		eventTypeInformations[type.key].nbUsers = oldInfo[type.key].nbUsers;

		if (eventTypeCategories.includes(category) == false) {
			eventTypesByCategory[category] = [];
			eventTypeCategories.push(category);
		}
		eventTypesByCategory[category].push(type.key);
	});

	eventTypes = Object.keys(eventTypeInformations);
	computeUsersPerEventType();
	sortEventTypes();
	createEventTypesListDisplay();

	// Reapply the time filter
	dataDimensions.time.filterRange(currentTimeFilter);
}

/**
 * Updates the information about the dataset from the actual data
 * @param {bool} buildSessions Whether the sessions will be rebuilt or not
 */
function updateDatasetInfo(buildSessions = false) {
	datasetInfo["numberOfSequences"] = dataDimensions.user.group().size();
	datasetInfo["numberOfDifferentEvents"] = dataDimensions.type.group().size();
	datasetInfo["numberOfEvents"] = dataset.size();
	datasetInfo["users"] = _.map(dataDimensions.user.group().all(), (d)=>d.key);
	datasetInfo["firstEvent"] = new Date(dataDimensions.time.bottom(1)[0].start);
	datasetInfo["lastEvent"] = new Date(dataDimensions.time.top(1)[0].start);
	if (buildSessions)
		buildUserSessions();
	else
		datasetInfo.nbSessions = _.reduce(userSessions, (sum, val) => sum+val.length, 0);
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
	let initialTimeFilter = currentTimeFilter;
	dataDimensions.time.filterAll();
	userSessions = {};

	let userGroups = dataDimensions.user.group().dispose();
	userGroups.all().forEach( function(grp) {
		let u = grp.key;
		// Consider only the events of the current user
		dataDimensions.user.filterExact(u);
		let currentSession = null;
		userSessions[u] = [];
		dataDimensions.time.bottom(Infinity).forEach( function(evt) {
			if (currentSession != null) {
				if (evt.start - currentSession.end < sessionInactivityLimit ) {
					// Keep growing the current session
					currentSession.end = evt.start;
					currentSession.nbEvents++;
				} else {
					// Store the current session
					userSessions[u].push(currentSession);
					// Create a new session
					currentSession = {
						start: evt.start, 
						end: evt.start, 
						count: {}, 
						nbEvents: 1
					};
				}
			} else { // Initialize the first session
				currentSession = {
					start: evt.start,
					end: evt.start,
					count: {}, 
					nbEvents: 1
				};
			}
		});
		// Store the last session
		userSessions[u].push(currentSession);

		nbOfSession += userSessions[u].length;
	});
	// Add the number of sessions as an information about the dataset
	datasetInfo.nbSessions = nbOfSession;
	// Restore the initial time filter
	dataDimensions.time.filterRange(initialTimeFilter);
	// Reset the user filter
	dataDimensions.user.filterAll();
	// Refresh the display of dataset infos
	displayDatasetInfo();
	// Refresh the user list display
	createUserListDisplay();
}

/**
 * Builds the event bins according to the given scale
 * @param {string} binScale The scale of the bins
 * @returns The created dimension
 * 
 * TODO Make it handle correctly the time calculations
 */
function buildEventBins(binScale) {
	let grp = dataDimensions.time.group( function(d) {
		let dateStart = new Date(d);
		switch(binScale) {
			case "year":
				dateStart.setMonth(0, 1);
				dateStart.setMinutes(0);
				dateStart.setSeconds(0);
				dateStart.setHours(0);
				break;
			case "month":
				dateStart.setDate(1);
				dateStart.setMinutes(0);
				dateStart.setSeconds(0);
				dateStart.setHours(0);
				break;
			case "halfMonth":
				dateStart.setMinutes(0);
				dateStart.setSeconds(0);
				dateStart.setHours(0);

				// Get the duration of the month
				let monthStart = new Date(dateStart.getTime());
				monthStart.setDate(1);
				let monthEnd = null;
				if (monthStart.getMonth() < 11) {
					monthEnd = new Date(monthStart.getTime());
					monthEnd.setMonth(monthStart.getMonth()+1);
				} else {
					monthEnd = new Date(monthStart.getTime());
					monthEnd.setFullYear(monthStart.getFullYear()+1, 0, 1);
				}
				let monthDuration = monthEnd.getTime() - monthStart.getTime();

				if (dateStart.getTime() < monthStart.getTime() + Math.floor(monthDuration/2))
					dateStart.setDate(1);
				else
					dateStart = new Date(monthStart.getTime() + Math.floor(monthDuration/2));
				break;
			case "day": // Incorrect handling of daylight saving times
				dateStart.setMinutes(0);
				dateStart.setSeconds(0);
				dateStart.setHours(0);
				break;
			case "halfDay":
				dateStart.setMinutes(0);
				dateStart.setSeconds(0);
				
				if (dateStart.getHours() < 12) {
					dateStart.setHours(0);
				} else {
					dateStart.setHours(12);
				}
				break;
			default:
		}

		return dateStart.getTime();;
	});

	switch(binScale) {
		case "year":
			eventBins.year.getStart = function(time) {
				let date = new Date(time);
				date.setMonth(0, 1);
				date.setMinutes(0);
				date.setSeconds(0);
				date.setHours(0);

				let stringOutput = [
					date.getFullYear(),
					date.getMonth()+1,
					date.getDate()].join("-") + "T" +
					[date.getHours() > 9 ? date.getHours() : "0"+date.getHours(),
					date.getMinutes() > 9 ? date.getMinutes() : "0"+date.getMinutes(),
					date.getSeconds() > 9 ? date.getSeconds() : "0"+date.getSeconds()].join(":");
				return stringOutput;
			};
			eventBins.year.getEnd = function(time) {
				let date = new Date(time);
				date.setFullYear(date.getFullYear()+1, 0, 1);
				date.setMinutes(0);
				date.setSeconds(0);
				date.setHours(0);
				date = new Date(date.getTime()-1000);

				let stringOutput = [
					date.getFullYear(),
					date.getMonth()+1,
					date.getDate()].join("-") + "T" +
					[date.getHours() > 9 ? date.getHours() : "0"+date.getHours(),
					date.getMinutes() > 9 ? date.getMinutes() : "0"+date.getMinutes(),
					date.getSeconds() > 9 ? date.getSeconds() : "0"+date.getSeconds()].join(":");
				return stringOutput;
			}
			break;
		case "month":
			eventBins.month.getStart = function(time) {
				let date = new Date(time);
				date.setDate(1);
				date.setMinutes(0);
				date.setSeconds(0);
				date.setHours(0);

				let stringOutput = [
					date.getFullYear(),
					date.getMonth()+1,
					date.getDate()].join("-") + "T" +
					[date.getHours() > 9 ? date.getHours() : "0"+date.getHours(),
					date.getMinutes() > 9 ? date.getMinutes() : "0"+date.getMinutes(),
					date.getSeconds() > 9 ? date.getSeconds() : "0"+date.getSeconds()].join(":");
				return stringOutput;
			};
			eventBins.month.getEnd = function(time) {
				let date = new Date(time);
				if (date.getMonth() < 11)
					date.setMonth(date.getMonth()+1, 1);
				else {
					date.setFullYear(date.getFullYear()+1, 0, 1);
				}
				date.setMinutes(0);
				date.setSeconds(0);
				date.setHours(0);
				date = new Date(date.getTime()-1000);

				let stringOutput = [
					date.getFullYear(),
					date.getMonth()+1,
					date.getDate()].join("-") + "T" +
					[date.getHours() > 9 ? date.getHours() : "0"+date.getHours(),
					date.getMinutes() > 9 ? date.getMinutes() : "0"+date.getMinutes(),
					date.getSeconds() > 9 ? date.getSeconds() : "0"+date.getSeconds()].join(":");
				return stringOutput;
			}
			break;
		case "halfMonth":
			eventBins.halfMonth.getStart = function(time) {
				let date = new Date(time);
				date.setMinutes(0);
				date.setSeconds(0);
				date.setHours(0);

				// Get the duration of the month
				let monthStart = new Date(date.getTime());
				monthStart.setDate(1);
				let monthEnd = null;
				if (monthStart.getMonth() < 11) {
					monthEnd = new Date(monthStart.getTime());
					monthEnd.setMonth(monthStart.getMonth()+1);
				} else {
					monthEnd = new Date(monthStart.getTime());
					monthEnd.setFullYear(monthStart.getFullYear()+1, 0, 1);
				}
				let monthDuration = monthEnd.getTime() - monthStart.getTime();

				if (date.getTime() < monthStart.getTime() + Math.floor(monthDuration/2))
					date.setDate(1);
				else
					date = new Date(monthStart.getTime() + Math.floor(monthDuration/2));

				let stringOutput = [
					date.getFullYear(),
					date.getMonth()+1,
					date.getDate()].join("-") + "T" +
					[date.getHours() > 9 ? date.getHours() : "0"+date.getHours(),
					date.getMinutes() > 9 ? date.getMinutes() : "0"+date.getMinutes(),
					date.getSeconds() > 9 ? date.getSeconds() : "0"+date.getSeconds()].join(":");
				return stringOutput;
			};
			eventBins.halfMonth.getEnd = function(time) {
				let date = new Date(time);
				date.setMinutes(0);
				date.setSeconds(0);
				date.setHours(0);

				// Get the duration of the month
				let monthStart = new Date(date.getTime());
				monthStart.setDate(1);
				let monthEnd = null;
				if (monthStart.getMonth() < 11) {
					monthEnd = new Date(monthStart.getTime());
					monthEnd.setMonth(monthStart.getMonth()+1);
				} else {
					monthEnd = new Date(monthStart.getTime());
					monthEnd.setFullYear(monthStart.getFullYear()+1, 0, 1);
				}
				let monthDuration = monthEnd.getTime() - monthStart.getTime();

				if (date.getTime() < monthStart.getTime() + Math.floor(monthDuration/2))
					date.setDate(1);
				else
					date = new Date(monthStart.getTime() + Math.floor(monthDuration/2));
				
				// Add half the month minus 1 second
				date = new Date(date.getTime() + Math.floor(monthDuration/2) - 1000);

				let stringOutput = [
					date.getFullYear(),
					date.getMonth()+1,
					date.getDate()].join("-") + "T" +
					[date.getHours() > 9 ? date.getHours() : "0"+date.getHours(),
					date.getMinutes() > 9 ? date.getMinutes() : "0"+date.getMinutes(),
					date.getSeconds() > 9 ? date.getSeconds() : "0"+date.getSeconds()].join(":");
				return stringOutput;
			}
			break;
		case "day":
			eventBins.day.getStart = function(time) {
				let date = new Date(time);
				date.setMinutes(0);
				date.setSeconds(0);
				date.setHours(0);

				let stringOutput = [
					date.getFullYear(),
					date.getMonth()+1,
					date.getDate()].join("-") + "T" +
					[date.getHours() > 9 ? date.getHours() : "0"+date.getHours(),
					date.getMinutes() > 9 ? date.getMinutes() : "0"+date.getMinutes(),
					date.getSeconds() > 9 ? date.getSeconds() : "0"+date.getSeconds()].join(":");
				return stringOutput;
			};
			eventBins.day.getEnd = function(time) {
				let date = new Date(time);
				date.setMinutes(0);
				date.setSeconds(0);
				date.setHours(0);
				// Add 1 day minus 1 second
				date = new Date(date.getTime() + 1000*60*60*24 - 1000);

				let stringOutput = [
					date.getFullYear(),
					date.getMonth()+1,
					date.getDate()].join("-") + "T" +
					[date.getHours() > 9 ? date.getHours() : "0"+date.getHours(),
					date.getMinutes() > 9 ? date.getMinutes() : "0"+date.getMinutes(),
					date.getSeconds() > 9 ? date.getSeconds() : "0"+date.getSeconds()].join(":");
				return stringOutput;
			}
			break;
		case "halfDay":
			eventBins.halfDay.getStart = function(time) {
				let date = new Date(time);
				date.setMinutes(0);
				date.setSeconds(0);

				if (date.getHours() < 12) {
					date.setHours(0);
				} else {
					date.setHours(12);
				}

				let stringOutput = [
					date.getFullYear(),
					date.getMonth()+1,
					date.getDate()].join("-") + "T" +
					[date.getHours() > 9 ? date.getHours() : "0"+date.getHours(),
					date.getMinutes() > 9 ? date.getMinutes() : "0"+date.getMinutes(),
					date.getSeconds() > 9 ? date.getSeconds() : "0"+date.getSeconds()].join(":");
				return stringOutput;
			};
			eventBins.halfDay.getEnd = function(time) {
				let date = new Date(time);
				date.setMinutes(0);
				date.setSeconds(0);

				if (date.getHours() < 12) {
					date.setHours(0);
				} else {
					date.setHours(12);
				}
				// Add 12 hours minus 1 second
				date = new Date(date.getTime() + 1000*60*60*12 - 1000);

				let stringOutput = [
					date.getFullYear(),
					date.getMonth()+1,
					date.getDate()].join("-") + "T" +
					[date.getHours() > 9 ? date.getHours() : "0"+date.getHours(),
					date.getMinutes() > 9 ? date.getMinutes() : "0"+date.getMinutes(),
					date.getSeconds() > 9 ? date.getSeconds() : "0"+date.getSeconds()].join(":");
				return stringOutput;
			}
			break;
		default:
	}

	return grp;
}

/**
 * Sorts the user list according to the number of events in the traces
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
function sortUsersByNbEvents(decreasing=false) {
	userList.sort(function(a, b) {
		var nbA = userInformations[a].nbEvents;
		var nbB = userInformations[b].nbEvents;
		
		return nbA-nbB;
	});
	
	if (decreasing == true) {
		userList.reverse();
		lastUserSort = "nbEvents_down";
	} else {
		lastUserSort = "nbEvents_up";
	}
}

/**
 * Sorts the user list according to the name of the user
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
function sortUsersByName(decreasing=false) {
	userList.sort(function(a, b) {
		var nameA = a;
		var nameB = b;
		
		if (nameA < nameB)
			return -1;
		else if (nameA > nameB)
			return 1;
		else
			return 0;
	});
	
	if (decreasing == true) {
		userList.reverse();
		lastUserSort = "name_down";
	} else {
		lastUserSort = "name_up";
	}
}

/**
 * Sorts the user list according to the nduration of the traces
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
function sortUsersByTraceDuration(decreasing=false) {
	userList.sort(function(a, b) {
		var durationA = userInformations[a].duration;
		var durationB = userInformations[b].duration;
		
		return durationA-durationB;
	});
	
	if (decreasing == true) {
		userList.reverse();
		lastUserSort = "duration_down";
	} else {
		lastUserSort = "duration_up";
	}
}

/**
 * Sorts the user list according to the number of sessions in the traces
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
function sortUsersByNbSessions(decreasing=false) {
	if (Object.keys(userSessions).length > 0) {
		userList.sort(function(a, b) {
			var nbA = userSessions[a].length;
			var nbB = userSessions[b].length;
			
			return nbA-nbB;
		});
		
		if (decreasing == true) {
			userList.reverse();
			lastUserSort = "nbSessions_down";
		} else {
			lastUserSort = "nbSessions_up";
		}
	}
}

/**
 * Sorts the user list according to their first event
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
function sortUsersByStartDate(decreasing=false) {
	userList.sort(function(a, b) {
		var startA = userInformations[a].start;
		var startB = userInformations[b].start;
		
		if (startA < startB)
			return -1;
		else if (startA > startB)
			return 1;
		else
			return 0;
	});
	
	if (decreasing == true) {
		userList.reverse();
		lastUserSort = "start_down";
	} else {
		lastUserSort = "start_up";
	}
}

/**
 * Sorts the user list according to their last event
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
function sortUsersByEndDate(decreasing=false) {
	userList.sort(function(a, b) {
		var endA = userInformations[a].end;
		var endB = userInformations[b].end;
		
		if (endA < endB)
			return -1;
		else if (endA > endB)
			return 1;
		else
			return 0;
	});
	
	if (decreasing == true) {
		userList.reverse();
		lastUserSort = "end_down";
	} else {
		lastUserSort = "end_up";
	}
}

/**
 * Sorts the user list by the currently defined sort order
 */
function sortUsers() {
	let parts = lastUserSort.split("_");
	switch(parts[0]) {
		case "nbEvents":
			sortUsersByNbEvents(parts[1] == "down");
			break;
		case "name":
			sortUsersByName(parts[1] == "down");
			break;
		case "duration":
			sortUsersByTraceDuration(parts[1] == "down");
			break;
		case "nbSessions":
			sortUsersByNbSessions(parts[1] == "down");
			break;
		case "start":
			sortUsersByStartDate(parts[1] == "down");
			break;
		case "end":
			sortUsersByEndDate(parts[1] == "down");
			break;
		default:
	}
}

/**
 * Sorts the selected pattern list according to their name
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
function sortSelectedPatternsByName(decreasing=false) {
	selectedPatternIds.sort(function(a, b) {
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
		selectedPatternIds.reverse();
		lastSelectedPatternSort = "name_down";
	} else {
		lastSelectedPatternSort = "name_up";
	}
}

/**
 * Sorts the selected pattern list according to their number of users
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
function sortSelectedPatternsByNbUsers(decreasing=false) {
	selectedPatternIds.sort(function(a, b) {
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
		selectedPatternIds.reverse();
		lastSelectedPatternSort = "nbUsers_down";
	} else {
		lastSelectedPatternSort = "nbUsers_up";
	}
}

/**
 * Sorts the selected pattern list according to their size
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
function sortSelectedPatternsBySize(decreasing=false) {
	selectedPatternIds.sort(function(a, b) {
		var sizeA = patternsInformation[a][1];
		var sizeB = patternsInformation[b][1];
		
		return sizeA - sizeB;
	});
	
	if (decreasing == true) {
		selectedPatternIds.reverse();
		lastSelectedPatternSort = "size_down";
	} else {
		lastSelectedPatternSort = "size_up";
	}
}

/**
 * Sorts the selected pattern list according to their support
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
function sortSelectedPatternsBySupport(decreasing=false) {
	selectedPatternIds.sort(function(a, b) {
		var supportA = patternsInformation[a][2];
		var supportB = patternsInformation[b][2];
		
		return supportA - supportB;
	});
	
	if (decreasing == true) {
		selectedPatternIds.reverse();
		lastSelectedPatternSort = "support_down";
	} else {
		lastSelectedPatternSort = "support_up";
	}
}

/**
 * Sorts the pattern list by the currently defined sort order
 */
function sortPatterns() {
	let parts = lastPatternSort.split("_");
	switch(parts[0]) {
		case "nbUsers":
			sortPatternsByNbUsers(parts[1] == "down");
			break;
		case "name":
			sortPatternsByName(parts[1] == "down");
			break;
		case "size":
			sortPatternsBySize(parts[1] == "down");
			break;
		case "support":
			sortPatternsBySupport(parts[1] == "down");
			break;
		default:
	}
}

/**
 * Sorts the pattern list according to their name. If several patterns have the
 * same name, they are sorted according to their id.
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
			return (a < b) ? -1 : 1;
	});
	
	if (decreasing == true) {
		patternIdList.reverse();
		lastPatternSort = "name_down";
	} else {
		lastPatternSort = "name_up";
	}
}

/**
 * Sorts the pattern list according to their number of users. If several
 * patterns have the same number of users, they are sorted according to their id.
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
			return (a < b) ? -1 : 1;
	});
	
	if (decreasing == true) {
		patternIdList.reverse();
		lastPatternSort = "nbUsers_down";
	} else {
		lastPatternSort = "nbUsers_up";
	}
}

/**
 * Sorts the pattern list according to their size. If several patterns have the
 * same size, they are sorted according to their id.
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
function sortPatternsBySize(decreasing=false) {
	patternIdList.sort(function(a, b) {
		let sizeA = patternsInformation[a][1];
		let sizeB = patternsInformation[b][1];
		let diff = sizeA - sizeB;
		
		if (diff != 0)
			return diff;
		else
			return (a < b) ? -1 : 1;
	});
	
	if (decreasing == true) {
		patternIdList.reverse();
		lastPatternSort = "size_down";
	} else {
		lastPatternSort = "size_up";
	}
}

/**
 * Sorts the pattern list according to their support. If several patterns have
 * the same support, they are sorted according to their id.
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
function sortPatternsBySupport(decreasing=false) {
	patternIdList.sort(function(a, b) {
		let supportA = patternsInformation[a][2];
		let supportB = patternsInformation[b][2];
		let diff = supportA - supportB;
		
		if (diff != 0)
			return diff;
		else
			return (a < b) ? -1 : 1;
	});
	
	if (decreasing == true) {
		patternIdList.reverse();
		lastPatternSort = "support_down";
	} else {
		lastPatternSort = "support_up";
	}
}

/**
 * Sorts the event types list according to the current sort order
 */
function sortEventTypes() {
	let [target, direction] = lastEventTypeSort.split("_");

	switch(target) {
		case "name":
			sortEventTypesByName(direction == "down");
			break;
		case "support":
			sortEventTypesBySupport(direction == "down");
			break;
		case "nbUsers":
			sortEventTypesByNbUsers(direction == "down");
			break;
		case "category":
			sortEventTypesByCategory(direction == "down");
			break;
		default:
			console.warn("Trying to sort event types in an unknown current order : "+lastEventTypeSort);
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
		lastEventTypeSort = "name_down";
	} else {
		lastEventTypeSort = "name_up";
	}
}

/**
 * Sorts the event types list according to the number of events associated to them
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
function sortEventTypesBySupport(decreasing=false) {
	eventTypes.sort(function(a,b) {
		return eventTypeInformations[a].nbOccs - eventTypeInformations[b].nbOccs;
	});
	
	if (decreasing == true) {
		eventTypes.reverse();
		lastEventTypeSort = "support_down";
	} else {
		lastEventTypeSort = "support_up";
	}
}

/**
 * Sorts the event types list according to the number of users associated to them
 * @param {boolean} decreasing - Whether or not to sort in descending order
 */
function sortEventTypesByNbUsers(decreasing=false) {
	eventTypes.sort(function(a,b) {
		return eventTypeInformations[a].nbUsers - eventTypeInformations[b].nbUsers;
	});
	
	if (decreasing == true) {
		eventTypes.reverse();
		lastEventTypeSort = "nbUsers_down";
	} else {
		lastEventTypeSort = "nbUsers_up";
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
		lastEventTypeSort = "category_down";
	} else {
		lastEventTypeSort = "category_up";
	}
}

/**
 * Computes the maximum number of event present at a same time in the dataset
 */
function computeMaxEventAtOneTime() {
	let timeGroup = dataDimensions.time.group().dispose();
	maxEventAtOneTime = timeGroup.top(1)[0].value;
}

/**
 * Highlights all the users where selected patterns are found
 */
function selectUsersBasedOnPatternSelection() {
	let selectedUsersList = new Set();

	selectedPatternIds.forEach( function(d,i) {
		patternsInformation[d][4].forEach( function(e,j) {
			selectedUsersList.add(e);
		});
	});

	selectedUsersList.forEach( function(d,i) {
		highlightUserRow(d);
	});

	setHighlights();
	refreshUserPatterns();
}

/**
 * Adds all the users presenting a pattern to the user selection if they don't
 * already belong to it. If all the users are already selected, deselect them
 * instead
 * @param {number} patternId The id of the pattern
 */
function updateUserSelectionFromPattern(patternId) {
	let usersNotSelected = _.difference(patternsInformation[patternId][4], highlightedUsers);

	if (usersNotSelected.length == 0) {
		patternsInformation[patternId][4].forEach(highlightUserRow);
	} else {
		usersNotSelected.forEach(highlightUserRow);
	}
	
	setHighlights();
	refreshUserPatterns();
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
	numberOfPattern++;
	
	let pSize = parseInt(message.size);
	let pSupport = parseInt(message.support);
	let pId = message.id;

	let shouldUpdateSupportSlider = false;
	let shouldUpdateSizeSlider = false;

	if (maxPatternSupport < pSupport) {
		increaseMaxPatternSupport(pSupport);
		shouldUpdateSupportSlider = true;
	}

	if (maxPatternSize < pSize) {
		increaseMaxPatternSize(pSize);
		patternMetrics["sizeDistribution"][pSize] = 0;
		shouldUpdateSizeSlider = true;
	}

	let pUsers = message.userDistribution.users.split(";");
	
	// TODO Rename the function or move its behavior here
	receivePatternDistributionPerUser(message.userDistribution);
	
	let pItems = [];
	for (let k = 0; k < pSize; k++) {
		pItems.push(message[k]);
	}
	let pString = pItems.join(" ");

	patternsInformation[pId] = [pString, pSize, pSupport, pItems, pUsers];
	
	// Update the relevant metrics
	patternMetrics["sizeDistribution"][pSize]++;
	if (patternMetrics["supportDistribution"][pSupport]) {
		patternMetrics["supportDistribution"][pSupport]++;
	} else {
		patternMetrics["supportDistribution"][pSupport] = 1;
	}

	if (shouldUpdateSupportSlider)
		supportSlider.draw();
	if (shouldUpdateSizeSlider)
		sizeSlider.draw();

	let properPatternSearchInput = currentPatternSearchInput.split(" ")
		.filter( d => d.length > 0 ).join(" ");
	
	if (algorithmState.isUnderSteering()) {
		lastSteeringPatterns.push(pId);
		updateLastSteeringDetails();
	}

	if (!patternLiveUpdate) {
		availablePatterns.push(pId);
	} else {
		// Don't take this pattern into consideration if it doesn"t pass the filter
		if (!supportSlider.hasValueSelected(pSupport) ||
			!sizeSlider.hasValueSelected(pSize) ||
			!pString.includes(properPatternSearchInput) ||
			(!algorithmState.isUnderSteering() && showOnlyLastSteering)) {
				filteredOutPatterns.push(pId);
		} else {
			let correctPositionInList = findNewPatternIndex(patternsInformation[pId]);
			if (correctPositionInList == -1) {// append at the end of the list
				patternIdList.push(pId);
				document.getElementById("patternTableBody")
					.appendChild(createPatternRow(pId));
			} else { // append at the right position in the list
				patternIdList.splice(correctPositionInList, 0, pId);
				let nextIdInList = patternIdList[correctPositionInList + 1];
				//console.log("First unselectedId: "+firstUnselectedId);
				let firstUnselectedNode = document.getElementById("pattern"+nextIdInList);
				
				firstUnselectedNode.parentNode.insertBefore(createPatternRow(pId), firstUnselectedNode);
			}
		}
	}

	updatePatternCountDisplay();
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

/**
 * Deletes every pattern, and the information related to them
 */
function resetPatterns() {
	numberOfPattern = 0;
	patternsInformation = {};
	patternIdList = [];
	availablePatterns = [];
	filteredOutPatterns = [];
	lastSteeringPatterns = [];
	patternOccurrences = {};
	selectedPatternIds = [];
	// TODO Deal with the potential other pattern metrics in patternMetrics
	patternMetrics.sizeDistribution = {};
	patternMetrics.supportDistribution = {};
	patternsPerSecondChart.reset();
	candidatesCheckedPerSecondChart.reset();
	resetMaxPatternSupport();
	resetMaxPatternSize();
	drawPatternSizesChart();
	createPatternListDisplay();
	updatePatternCountDisplay();
	setHighlights();
	resetLastSteeringDetails();
	// TODO Keep the initial sessions ?
	buildUserSessions();
	refreshUserPatterns();
	// Reset the algorithm state extended view
	d3.select("#patternSizeTableContent").html("");
	algorithmState = new AlgorithmState();
}

/**
 * Updates the data after the creation of a new event type
 * @param {JSON} newEvents New events to add to the data
 * @param {[number]} removedIds Ids of events to be removed
 * @param {json} typeInfo Information about the new type
 * @param {[string]} removedTypes Event types completely removed
 */
function updateDatasetForNewEventType(newEvents, removedIds, typeInfo, removedTypes) {
	resetDataFilters();
	let theseRemovedEvents = dataset.all().filter( d => removedIds.includes(d.id) );
	dataset.remove(function(d,i) {
		return removedIds.includes(d.id);
	});
	removedEventsList = _.concat(removedEventsList, theseRemovedEvents);
	console.log("Removed");

	let toAdd = [];
	newEvents.forEach(function(evt) {
		let time = new Date(evt.start);
		let evtObj = {
			"id": evt.id,
			"type": evt.type,
			"start": time.getTime(),
			"end": evt.end,
			"user": evt.user,
			"properties": evt.properties
		};
		toAdd.push(evtObj);
		addedEventIdsList.push(evt.id);
	});
	dataset.add(toAdd);
	console.log("Added");

	// Reapply the time filter
	dataDimensions.time.filterRange(currentTimeFilter);

	eventTypeInformations[typeInfo.name] = {
		"category": typeInfo.category,
		"description": typeInfo.description,
		"nbOccs": toAdd.length,
		"nbUsers": 0
	};

	if (eventTypeCategories.includes(typeInfo.category) == false) {
		eventTypesByCategory[typeInfo.category] = [];
		eventTypeCategories.push(typeInfo.category);
		let catColor = getNextCategoryColor();
		eventTypeCategoryColors[typeInfo.category] = [d3.rgb(catColor[0]), d3.rgb(catColor[1])];
		
		let categoryRow = d3.select("#categoryTableBody").append("tr");
		categoryRow.append("td").text(typeInfo.category);
		let categorySvg = categoryRow.append("td")
			.append("svg")
			.attr("width",60)
			.attr("height", 20);
		categorySvg.append("rect")
			.attr("width", 30)
			.attr("height", 20)
			.attr("fill",eventTypeCategoryColors[typeInfo.category][0].toString());
		categorySvg.append("rect")
			.attr("width", 30)
			.attr("height", 20)
			.attr("x",30)
			.attr("fill",eventTypeCategoryColors[typeInfo.category][1].toString());
	}
	eventTypesByCategory[typeInfo.category].push(typeInfo.name);

	// Take the first available shape in this category
	let eCode = shapes[(eventTypesByCategory[typeInfo.category].length - 1)%shapes.length];
	let eColor = eventTypeCategoryColors[typeInfo.category];
	
	colorList[typeInfo.name] = eColor;
	itemShapes[typeInfo.name] = eCode;

	eventTypeInformations[typeInfo.name].code = eCode;

	updateEventTypesInformations();
	activityHistory.createEventType(newEvents[0].type, typeInfo.parent, removedTypes);
}

/**
 * Updates the data after the removal of an event type
 * @param {number[]} removedIds Ids of events to be removed
 * @param {string[]} removedEvents The name of the removed event types
 */
function updateDatasetForRemovedEventTypes(removedIds, removedEvents) {
	resetDataFilters();
	let theseRemovedEvents = dataset.all().filter( d => removedIds.includes(d.id) );
	console.log("thse/ "+theseRemovedEvents.length);
	dataset.remove(function(d,i) {
		return removedIds.includes(d.id);
	});
	removedEventsList = _.concat(removedEventsList, theseRemovedEvents);
	console.log("rem: "+removedEventsList.length);
	// Clean the highlights if necessary
	let intersection = _.intersection(highlightedEventTypes, removedEvents);
	if (intersection.length > 0) {
		highlightedEventTypes = _.difference(highlightedEventTypes, intersection);
		setHighlights();
	}
	console.log("Removed");
	// Reapply the time filter
	dataDimensions.time.filterRange(currentTimeFilter);
	updateEventTypesInformations();
	activityHistory.removeEventTypes(removedEvents);
}

/**
 * Updates the data after the removal of a user
 * @param {number[]} removedIds Ids of events to be removed
 * @param {string[]} removedUsers The name of the removed users
 */
function updateDatasetForRemovedUsers(removedIds, removedUsers) {
	resetDataFilters();
	let theseRemovedEvents = dataset.all().filter( d => removedIds.includes(d.id) );
	dataset.remove(function(d,i) {
		return removedIds.includes(d.id);
	});
	removedEventsList = _.concat(removedEventsList, theseRemovedEvents);
	// Clean the highlights if necessary
	let intersection = _.intersection(highlightedUsers, removedUsers);
	if (intersection.length > 0) {
		highlightedUsers = _.difference(highlightedUsers, intersection);
		setHighlights();
	}
	console.log("Removed");
	// Reapply the time filter
	dataDimensions.time.filterRange(currentTimeFilter);
	updateEventTypesInformations();
	activityHistory.removeUsers(removedUsers);
}

/**
 * Resets all the filters applied to the crossfitler storing the events
 */
function resetDataFilters() {
	dataDimensions.time.filterAll();
	dataDimensions.type.filterAll();
	dataDimensions.user.filterAll();
}

/************************************/
/*			HCI manipulation		*/
/************************************/

/**
 * Handles the case where the dataset is either not specified or unknown
 */
function handleUnknownDataset() {
	showDatasetErrorModal();
	//redirectToDatasetSelection();
}

/**
 * Redirects the page to the dataset selection
 */
function redirectToDatasetSelection() {
	location.href = "/ppmt";
}

/**
 * Enables the toggle of the pattern list's live update 
 */
function enableLiveUpdateControl() {
	document.getElementById("liveUpdateButton").disabled = false;
}

/**
 * Disables the toggle of the pattern list's live update 
 */
function disableLiveUpdateControl() {
	document.getElementById("liveUpdateButton").disabled = true;
}

/**
 * Setup the details about the last steering.
 * @param {string} type The type of steering
 * @param {string} value The target of the steering
 */
function setupLastSteeringDetails(type, value) {
	let fragment = document.createDocumentFragment();
	let typeDiv = document.createElement("div");
	let targetDiv = document.createElement("div");
	switch(type) {
		case "time":
			let bounds = value.split(" ");
			let start = new Date(parseInt(bounds[0]));
			let end = new Date(parseInt(bounds[1]));
			typeDiv.textContent = "Steering on time";
			targetDiv.textContent = `Limits: ${formatDate(start, true)} <-> ${formatDate(end, true)}`;
			break;
		case "pattern":
			typeDiv.textContent = "Steering on pattern";
			targetDiv.textContent = `Prefix: ${value}`;
			break;
		case "user":
			typeDiv.textContent = "Steering on user";
			targetDiv.textContent = `User: ${value}`;
			break;
		default:
	}
	let patternNumberDiv = document.createElement("div");
	patternNumberDiv.className = "patternNumber";
	patternNumberDiv.textContent = `${lastSteeringPatterns.length} patterns found`
	fragment.appendChild(typeDiv);
	fragment.appendChild(targetDiv);
	fragment.appendChild(patternNumberDiv);

	let details = document.getElementById("lastSteeringDetails");
	details.textContent = "";
	details.appendChild(fragment);
}

/**
 * Updates the display of the last steering details
 */
function updateLastSteeringDetails() {
	document.querySelector("#lastSteeringDetails .patternNumber")
		.textContent = `${lastSteeringPatterns.length} patterns found`;
}

/**
 * Resets the last steering details
 */
function resetLastSteeringDetails() {
	document.getElementById("lastSteeringDetails")
		.textContent = "No steering yet";
}

/**
 * Updates the suggestions of event types to complete the input of the pattern
 * search field
 */
function updatePatternSearchSuggestion() {
	let searchField = d3.select("#patternListArea input.searchField");
	let suggestionDiv = d3.select("#patternListArea .suggestionDiv");

	let currentValue = searchField.property("value");
	currentPatternSearchInput = currentValue.trim();
	let inputParts = currentPatternSearchInput.split(" ").filter( d => d.length > 0);
	currentPatternSearchFragment = inputParts.pop();
	
	if(currentPatternSearchFragment && currentPatternSearchFragment.length > 0) {
		let baseLength = currentPatternSearchInput.length -
							currentPatternSearchFragment.length;
		let baseValue = currentPatternSearchInput.substr(0, baseLength);
		relatedEventTypes = eventTypes.filter(function(d, i) {
			return d.toLowerCase().includes(currentPatternSearchFragment.toLowerCase());
		});
		relatedEventTypes.sort();
		
		if (relatedEventTypes.length > 0) {
			let fragment = document.createDocumentFragment();
			currentPatternSearchSuggestionIdx = 0;
			relatedEventTypes.forEach(function(d,i) {
				let child = document.createElement("p");
				child.className = "clickable";
				if (i==currentPatternSearchSuggestionIdx)
					child.classList.add("selectedSuggestion");
				child.textContent = baseValue + d;
				child.setAttribute("value", baseValue + relatedEventTypes[i]);
				child.addEventListener("click", selectPatternSearchSuggestion);
				fragment.appendChild(child);
			});
			suggestionDiv.html(null);
			suggestionDiv.node().appendChild(fragment);
		} else {
			currentPatternSearchSuggestionIdx = -1;
			suggestionDiv.html(null);
		}
	} else {
		currentPatternSearchInput = "";
		currentPatternSearchSuggestionIdx = -1;
		currentPatternSearchFragment = "";
		relatedEventTypes = [];
		suggestionDiv.html(null);
	}
	suggestionDiv.style("display", "block");
}

/**
 * Selects a suggestion in the pattern search field suggestion list and updates
 * the field's input and pattern list accordingly.
 * 
 * @param {number|HTMLElement} selectedSuggestion The selected suggestion, either
 * the element or its index in the suggestion list
 */
function selectPatternSearchSuggestion(selectedSuggestion) {
	let suggestionDiv = d3.select("#patternListArea .suggestionDiv");
	let suggestion;
	if (typeof selectedSuggestion == "number")
		suggestion = suggestionDiv.node().childNodes[selectedSuggestion].getAttribute("value");
	else
		suggestion = this.getAttribute("value");
	let searchField = d3.select("#patternListArea input.searchField");

	currentPatternSearchInput = suggestion;
	searchField.property("value", suggestion);

	currentPatternSearchSuggestionIdx = -1;
	suggestionDiv.style("display", "none");
	suggestionDiv.html(null);

	debouncedFilterPatterns.cancel();
	filterPatterns();
}

/**
 * Updates the style of the "restart" button, depending on the modifying sliders' values
 */
function updateRestartButtonStyle() {
	if (supportModifySlider.getValues()[0] != algoMinSupport ||
		durationModifySlider.getValues()[0] != algoMaxDuration ||
		sizeModifySlider.getValues()[0] != algoMaxSize ||
		gapModifySlider.getValues()[0] != algoMinGap ||
		gapModifySlider.getValues()[1] != algoMaxGap) {
		document.getElementById("restartButton")
			.disabled = false;
	} else {
		document.getElementById("restartButton")
			.disabled = true;
	}
}

/**
 * Opens a modal window to confirm or cancel the creation of an event type from a pattern
 * @param {number} patternId The id of the pattern used
 */
function askConfirmationToCreateEventType(patternId) {
	showEventTypeCreationConfirmation();
	d3.select("#modalTitle")
		.text("Confirm the creation of event type");

	document.getElementById("newEventTypePattern").textContent = patternsInformation[patternId][0];

	let newName = patternsInformation[patternId][0].replace(" ", "-");
	document.getElementById("newEventTypeNameInput").value = newName;
	let description = `Created from '${patternsInformation[patternId][0]}'`;
	document.getElementById("newEventTypeDescriptionInput").value = description;


	d3.selectAll(".eventCreationOption").remove();

	let body = d3.select("#createEventTypeConfirmation .contentBody");
	patternsInformation[patternId][3].forEach( type => {
		body.append("div")
			.classed("eventCreationOption textRight", true)
			.text(type);
		body.append("input")
			.attr("type", "checkbox")
			.classed("eventCreationOption clickable", true)
			.attr("value", type);
	});

	d3.select("#createEventTypeConfirmation .confirmationConfirm")
		.on("click", function() {
			let name = document.getElementById("newEventTypeNameInput").value;
			let description = document.getElementById("newEventTypeDescriptionInput").value;
			let typesToRemove = [];
			document.querySelectorAll(".eventCreationOption[type='checkbox']").forEach( d => {
				if (d.checked)
					typesToRemove.push(d.value);
			});

			let options = {
				removeOccurrences: typesToRemove,
				description: description
			};
			requestEventTypeCreationFromPattern(patternId, name, options);
			closeModal();
		});
}

/**
 * Opens a modal window to confirm or cancel the change of parameters for the algorithm
 */
function askConfirmationToChangeAlgorithmParameters() {
	useExtendedAlgorithmView = false;
	showParameterChangeConfirmation();
	d3.select("#modalTitle")
		.text("Confirm the parameters change");
	d3.select("#changeParametersConfirmation .contentBody")
		.text("param changes ...");
		// Add a warning that it will relaunch the process
	d3.select("#changeParametersConfirmation .confirmationConfirm")
		.on("click", function() {
			changeAlgorithmParameters();
			if (algorithmState.isRunning()) {
				algorithmWillRestart = true;
				requestAlgorithmStop();
			} else {
				requestAlgorithmReStart();
			}
			closeModal();
		});
}

/**
 * Opens a modal window to confirm or cancel the removal of event types
 * @param {...string} eventTypeNames The name of event types whose removal must be confirmed
 */
function askConfirmationToRemoveEventTypes(...eventTypeNames) {
	showEventTypeRemovalConfirmation();
	d3.select("#modalTitle")
		.text("Confirm event type removal");
	let contentArea = d3.select("#removeEventTypeConfirmation .contentBody")
		.text("");
	eventTypeNames.forEach( (typeName) => {
		contentArea.append("div")
			.text(typeName);
	});
	d3.select("#removeEventTypeConfirmation .confirmationConfirm")
		.on("click", function() {
			requestEventTypesRemoval(eventTypeNames);
			closeModal();
		});
}

/**
 * Opens a modal window to confirm or cancel the removal of users
 * @param {...string} userNames The name of users whose removal must be confirmed
 */
function askConfirmationToRemoveUsers(...userNames) {
	showUserRemovalConfirmation();
	d3.select("#modalTitle")
		.text("Confirm user removal");
	let contentArea = d3.select("#removeUserConfirmation .contentBody")
		.text("");
	userNames.forEach( (userName) => {
		contentArea.append("div")
			.text(userName);
	});
	d3.select("#removeUserConfirmation .confirmationConfirm")
		.on("click", function() {
			requestUsersRemoval(userNames);
			closeModal();
		});
}

/**
 * Updates the display of the number of pattern discovered, selected and
 * filtered
 */
function updatePatternCountDisplay() {
	d3.select("#patternNumberSpan").text(numberOfPattern);
	document.getElementById("totalPatternFound")
		.textContent = algorithmState.getTotalPatternNumber();
	d3.select("#displayedPatternNumberSpan").text(patternIdList.length + filteredOutPatterns.length);
	d3.select("#updatePatternListButton span").text(availablePatterns.length);
	document.querySelector("#showOnlyLastSteeringButton span")
		.textContent = lastSteeringPatterns.length;
	// TODO dynamically update the number of patterns matching the filter
	d3.select("#filteredInPatternNumberSpan").text(patternIdList.length);
}

/**
 * Displays information on the dataset when there is no dataset
 */
function resetDatasetInfo() {
	let infoDiv = document.getElementById("datasetInfo");
	infoDiv.textContent = "No dataset selected, select a dataset to display more information";
	
	datasetInfoIsDefault = true;
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
	d3.selectAll("#data .tabContent").classed("hidden", true);
	d3.select("#data .active").classed("active", false);
	
	// Show the current tab, and add an "active" class to the header that opened it
	d3.select("#"+tabName).classed("hidden", false);
	d3.select(evt.currentTarget).classed("active", true);
}

/**
 * Manages the right-side (algorithm) tabs
 * @param {Event} evt The click event on a tab header
 * @param {string} tabName The name of the tab that has been clicked
 */
function openAlgorithmTab(evt, tabName) {
	d3.selectAll("#algorithmInfo .tabContent").classed("hidden", true);
	d3.select("#algorithmInfo .active").classed("active", false);
	
	// Show the current tab, and add an "active" class to the header that opened it
	d3.select("#"+tabName).classed("hidden", false);
	d3.select(evt.currentTarget).classed("active", true);
}

/**
 * Shows or hides the description of event types
 */
function switchShowEventTypeDescription() {
	d3.event.stopPropagation();
	if (showEventTypeDescription == true) {
		showEventTypeDescription = false;
		d3.selectAll(".eventTypeDescription")
			.style("display", "none");
		document.getElementById("showEventTypeDescriptionInput")
			.textContent = "Show description";
	} else {
		showEventTypeDescription = true;
		d3.selectAll(".eventTypeDescription")
			.style("display", "initial");
		document.getElementById("showEventTypeDescriptionInput")
			.textContent = "Hide description";
	}
}

/**
 * Shows or hides the name of event types inside a pattern, besides their symbol
 */
function switchShowPatternText() {
	d3.event.stopPropagation();
	if (showPatternText == true) {
		showPatternText = false;
		d3.selectAll(".patternText")
			.style("display", "none");
		document.getElementById("showPatternTextInput")
			.textContent = "Show text";
	} else {
		showPatternText = true;
		d3.selectAll(".patternText")
			.style("display", "initial");
		document.getElementById("showPatternTextInput")
			.textContent = "Hide text";
	}
}

/**
 * Updates the headline of the table of users for the current sort
 */
function updateUserTableHead() {
	document.querySelectorAll("#userTable th .sortIndicator").forEach( (node) => {
		node.className = "sortIndicator";
	});

	let [value, direction] = lastUserSort.split("_");

	document.querySelector(`#userTable th[value='${value}'] .sortIndicator`)
				.className += ` sorted${_.capitalize(direction)}`;
}

/**
 * Handles a click on the 'name' header in the user list
 */
function clickOnUserNameHeader() {
	sortUsersByName(!(lastUserSort == "name_down"));
	updateUserTableHead();
	createUserListDisplay();
	timeline.drawUsersPatterns();
}

/**
 * Handles a click on the 'nbEvents' header in the user list
 */
function clickOnUserNbEventsHeader() {
	sortUsersByNbEvents(!(lastUserSort == "nbEvents_down"));
	updateUserTableHead();
	createUserListDisplay();
	timeline.drawUsersPatterns();
}

/**
 * Handles a click on the 'duration' header in the user list
 */
function clickOnUserDurationHeader() {
	sortUsersByTraceDuration(!(lastUserSort == "duration_down"));
	updateUserTableHead();
	createUserListDisplay();
	timeline.drawUsersPatterns();
}

/**
 * Handles a click on the 'nbSessions' header in the user list
 */
function clickOnUserNbSessionsHeader() {
	sortUsersByNbSessions(!(lastUserSort == "nbSessions_down"));
	updateUserTableHead();
	createUserListDisplay();
	timeline.drawUsersPatterns();
}

/**
 * Handles a click on the 'start' header in the user list
 */
function clickOnUserStartHeader() {
	sortUsersByStartDate(!(lastUserSort == "start_down"));
	updateUserTableHead();
	createUserListDisplay();
	timeline.drawUsersPatterns();
}

/**
 * Handles a click on the 'end' header in the user list
 */
function clickOnUserEndHeader() {
	sortUsersByEndDate(!(lastUserSort == "end_down"));
	updateUserTableHead();
	createUserListDisplay();
	timeline.drawUsersPatterns();
}

/**
 * Updates the headline of the table of event types for the current sort
 */
function updateEventTypeTableHead() {
	document.querySelectorAll("#eventTable th .sortIndicator").forEach( (node) => {
		node.className = "sortIndicator";
	});

	let [value, direction] = lastEventTypeSort.split("_");
	
	document.querySelector(`#eventTable th[value='${value}'] .sortIndicator`)
		.className += ` sorted${_.capitalize(direction)}`;
}

/**
 * Handles a click on the 'name' header in the event types list
 */
function clickOnEventTypeNameHeader() {
	sortEventTypesByName(!(lastEventTypeSort == "name_down"));
	updateEventTypeTableHead();
	createEventTypesListDisplay();
	if (timeline.displayMode == "events")
		timeline.displayData();
}

/**
 * Handles a click on the 'support' header in the event types list
 */
function clickOnEventTypeSupportHeader() {
	sortEventTypesBySupport(!(lastEventTypeSort == "support_down"));
	updateEventTypeTableHead();
	createEventTypesListDisplay();
	if (timeline.displayMode == "events")
		timeline.displayData();
}

/**
 * Handles a click on the 'nbUsers' header in the event types list
 */
function clickOnEventTypeNbUsersHeader() {
	sortEventTypesByNbUsers(!(lastEventTypeSort == "nbUsers_down"));
	updateEventTypeTableHead();
	createEventTypesListDisplay();
	if (timeline.displayMode == "events")
		timeline.displayData();
}

/**
 * Handles a click on the 'category' header in the event types list
 */
function clickOnEventTypeCategoryHeader() {
	sortEventTypesByCategory(!(lastEventTypeSort == "category_down"));
	updateEventTypeTableHead();
	createEventTypesListDisplay();
	if (timeline.displayMode == "events")
		timeline.displayData();
}

/**
 * Updates the headline of the table of selected patterns for the current sort
 */
function updateSelectedPatternTableHead() {
	document.querySelectorAll("#selectedPatternTable th .sortIndicator").forEach( (node) => {
		node.className = "sortIndicator";
	});

	let [value, direction] = lastSelectedPatternSort.split("_");

	document.querySelector(`#selectedPatternTable th[value='${value}'] .sortIndicator`)
				.className += ` sorted${_.capitalize(direction)}`;
}

/**
 * Handles a click on the 'name' header in the selected pattern list
 */
function clickOnSelectedPatternNameHeader() {
	sortSelectedPatternsByName(!(lastSelectedPatternSort == "name_down"));
	updateSelectedPatternTableHead();
	createPatternListDisplay();
}

/**
 * Handles a click on the 'size' header in the selected pattern list
 */
function clickOnSelectedPatternSizeHeader() {
	sortSelectedPatternsBySize(!(lastSelectedPatternSort == "size_down"));
	updateSelectedPatternTableHead();
	createPatternListDisplay();
}

/**
 * Handles a click on the 'nb users' header in the selected pattern list
 */
function clickOnSelectedPatternNbUsersHeader() {
	sortSelectedPatternsByNbUsers(!(lastSelectedPatternSort == "nbUsers_down"));
	updateSelectedPatternTableHead();
	createPatternListDisplay();
}

/**
 * Handles a click on the 'support' header in the selected pattern list
 */
function clickOnSelectedPatternSupportHeader() {
	sortSelectedPatternsBySupport(!(lastSelectedPatternSort == "support_down"));
	updateSelectedPatternTableHead();
	createPatternListDisplay();
}

/**
 * Updates the headline of the table of patterns for the current sort
 */
function updatePatternTableHead() {
	document.querySelectorAll("#patternTable th .sortIndicator").forEach( (node) => {
		node.className = "sortIndicator";
	});

	let [value, direction] = lastPatternSort.split("_");

	document.querySelector(`#patternTable th[value='${value}'] .sortIndicator`)
				.className += ` sorted${_.capitalize(direction)}`;
}

/**
 * Handles a click on the 'name' header in the pattern list
 */
function clickOnPatternNameHeader() {
	sortPatternsByName(!(lastPatternSort == "name_down"));
	updatePatternTableHead();
	createPatternListDisplay();
}

/**
 * Handles a click on the 'size' header in the pattern list
 */
function clickOnPatternSizeHeader() {
	sortPatternsBySize(!(lastPatternSort == "size_down"));
	updatePatternTableHead();
	createPatternListDisplay();
}

/**
 * Handles a click on the 'nb users' header in the pattern list
 */
function clickOnPatternNbUsersHeader() {
	sortPatternsByNbUsers(!(lastPatternSort == "nbUsers_down"));
	updatePatternTableHead();
	createPatternListDisplay();
}

/**
 * Handles a click on the 'support' header in the pattern list
 */
function clickOnPatternSupportHeader() {
	sortPatternsBySupport(!(lastPatternSort == "support_down"));
	updatePatternTableHead();
	createPatternListDisplay();
}

/**
 * (Re)creates the display of the highlights summary
 */
function setHighlights() {
	// user highlights
	d3.select("#userHighlight .highlightsValue")
		.text(highlightedUsers.length);
	if(highlightedUsers.length > 0)
		d3.select("#userHighlight .highlightsResetOption").classed("hidden", false);
	else
		d3.select("#userHighlight .highlightsResetOption").classed("hidden", true);
	let detailed = d3.select("#detailedUserHighlight");
	let detailedSubtitle = detailed.select(".subtitle");
	let detailedContent = detailed.select(".content");
	detailedContent.html("");
	highlightedUsers.forEach(function(usr) {
		detailedContent.append("div")
			.classed("clickable", true)
			.classed("highlightButton", true)
			.text(usr)
			.on("click", function() {
				highlightUserRow(usr);
				setHighlights();
				timeline.displayData();
			});
	});
	detailedSubtitle.classed("hidden", highlightedUsers.length == 0);

	// event type highlights
	d3.select("#eventTypeHighlight .highlightsValue")
		.text(highlightedEventTypes.length);
	if(highlightedEventTypes.length > 0)
		d3.select("#eventTypeHighlight .highlightsResetOption").classed("hidden", false);
	else
		d3.select("#eventTypeHighlight .highlightsResetOption").classed("hidden", true);
	detailed = d3.select("#detailedEventTypeHighlight");
	detailedSubtitle = detailed.select(".subtitle");
	detailedContent = detailed.select(".content");
	detailedContent.html("");
	highlightedEventTypes.forEach(function(type) {
		detailedContent.append("div")
			.classed("clickable", true)
			.classed("highlightButton", true)
			.style("color", colorList[type][0].toString())
			.text(itemShapes[type])
			.on("click", function() {
				highlightEventTypeRow(type);
				setHighlights();
				timeline.displayData();
			})
			.append("span")
			.style("color", "black")
			.text("\u00A0"+type);
	});
	detailedSubtitle.classed("hidden", highlightedEventTypes.length == 0);

	// pattern highlights
	d3.select("#patternHighlight .highlightsValue")
		.text(selectedPatternIds.length);
	if(selectedPatternIds.length > 0)
		d3.select("#patternHighlight .highlightsResetOption").classed("hidden", false);
	else
		d3.select("#patternHighlight .highlightsResetOption").classed("hidden", true);
	detailed = d3.select("#detailedPatternHighlight");
	detailedSubtitle = detailed.select(".subtitle");
	detailedContent = detailed.select(".content");
	detailedContent.html("");
	selectedPatternIds.forEach(function(patternId) {
		let pSize = patternsInformation[patternId][1];
		let pString = patternsInformation[patternId][0];
		let pItems = patternsInformation[patternId][3];

		let row = detailedContent.append("div")
			.classed("clickable",true)
			.on("click", function() {
				let index = selectedPatternIds.indexOf(patternId);
				selectedPatternIds.splice(index, 1);
				
				timeline.displayData(); // TODO optimize by just displaying the pattern occurrences
				//d3.event.stopPropagation();
				console.log("click on "+patternId);
				createPatternListDisplay();
				setHighlights();
			});
		for (let k=0; k < pSize; k++) {
			row.append("span")
				.style("color",colorList[pItems[k]][0].toString())
				.text(itemShapes[pItems[k]]);
		}
		row.append("span")
			.text(" "+pString)
			.attr("patternId",patternId);
	});
	detailedSubtitle.classed("hidden", selectedPatternIds.length == 0);
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
	} else {
		if (row.classed("selectedEventTypeRow")) {
			// Remove this event type from the list of highlighted event types
			let eventIdx = highlightedEventTypes.indexOf(eType);
			highlightedEventTypes.splice(eventIdx, 1);
		} else {
			// Adds the newly highlighted user to the list
			highlightedEventTypes.push(eType);
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
	} else {
		if (row.classed("selectedUserRow")) {
			// Remove this user from the list of highlighted users
			let userIdx = highlightedUsers.indexOf(userName);
			highlightedUsers.splice(userIdx, 1);
			// Updates the displays of the number of selected users
			d3.select("#showSelectedUserSessionsButton")
				.text("Selected users ("+highlightedUsers.length+")");
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
			})
		let firstCell = eventRow.append("td")
			.property("title",eventTypeInformations[eType].description);
		firstCell.append("span")
			.style("color",colorList[eType][0].toString())
			.text(itemShapes[eType]+"  ");
		firstCell.append("span")
			.text(eType);
		firstCell.append("br");
		firstCell.append("span")
			.classed("eventTypeDescription", true)
			.style("display", showEventTypeDescription == true ? "initial" : "none")
			.text(eventTypeInformations[eType].description);
		eventRow.append("td").text(eventTypeInformations[eType].nbOccs);
		eventRow.append("td").text(eventTypeInformations[eType].nbUsers == 0 ?
			"??" :
			eventTypeInformations[eType].nbUsers);
		eventRow.append("td").append("div")
			.classed("wrapping", true)
			.style("color",colorList[eType][0].toString())
			.text(eventTypeInformations[eType].category);

		if (highlightedEventTypes.includes(eType)) {
			eventRow.classed("selectedEventTypeRow", true);
		}

		// Add the context actions
		let contextActions = eventRow.append("td").append("div")
			.classed("contextActions", true);
		let removeAction = contextActions.append("div");
		removeAction.append("button")
			.classed("clickable", true)
			.classed("icon-remove", true)
			.attr("title", "Remove")
			.on("click", function() {
				d3.event.stopPropagation();
				askConfirmationToRemoveEventTypes(eType);
			});
		let extendedRemoveActions = removeAction.append("div")
			.classed("extendedContextAction", true);
		extendedRemoveActions.append("p")
			.text(`Remove ${eType} (${eventTypeInformations[eType].nbOccs} events)`)
			.on("click", function() {
				d3.event.stopPropagation();
				askConfirmationToRemoveEventTypes(eType);
			});
		extendedRemoveActions.append("p")
			.text("Remove all highlighted")
			.on("click", function() {
				d3.event.stopPropagation();
				askConfirmationToRemoveHighlightedEventTypes();
			});
		extendedRemoveActions.append("p")
			.text("Remove all unhighlighted")
			.on("click", function() {
				d3.event.stopPropagation();
				askConfirmationToRemoveNotHighlightedEventTypes();
			});
		
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
	userList.forEach(function(user) {
		// Only add the user if:
		// - it is selected (always displayed)
		// - the filter is empty or accepts the user
		if (highlightedUsers.includes(user) == false) {
			if (relatedUsers.length == 0) {
				if (currentUserSearchInput.length > 0)
					return; // The filter accepts nothing
			} else {
				if (!relatedUsers.includes(user))
					return; // The filter rejects the user
			}
		}
		
		let userRow = d3.select("#userTableBody").append("tr")
			.classed("clickable", true);
		
		userRow.append("td").text(user); // name
		userRow.append("td").text(userInformations[user].nbEvents); // nbEvents
		
		// Display the duration of the trace
		var minutes = 1000 * 60;
		var hours = minutes * 60;
		var days = hours * 24;
		var years = days * 365;
		var timeDiff = userInformations[user].duration;
		
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
		if (userSessions[user]) {
			userRow.append("td").text(userSessions[user].length);
		} else {
			userRow.append("td").text("??");
		}
		
		let d1 = new Date(userInformations[user].start);
		let startDateFormated = d1.getDate()+"/"+(d1.getMonth()+1)+"/"+(d1.getFullYear().toString().substring(2,4));
		let d2 = new Date(userInformations[user].end);
		let endDateFormated = d2.getDate()+"/"+(d2.getMonth()+1)+"/"+(d2.getFullYear().toString().substring(2,4));
		
		userRow.append("td").text(startDateFormated);  // start
		userRow.append("td").text(endDateFormated); // end

		userRow.attr("id","u"+user);
		
		if (highlightedUsers.includes(user)) {
			userRow.attr("class", "selectedUserRow");
		}
		
		// Add the context actions
		let contextActions = userRow.append("td").append("div")
			.classed("contextActions", true);
		let steerAction = contextActions.append("div");
		steerAction.append("button")
			.classed("clickable", true)
			.classed("icon-steering", true)
			.attr("title", "Steer algorithm on this user")
			.on("click", function() {
				requestSteeringOnUser(user);
				d3.event.stopPropagation();
			});
		let removeAction = contextActions.append("div");
		removeAction.append("button")
			.classed("clickable", true)
			.classed("icon-remove", true)
			.attr("title", "Remove")
			.on("click", function() {
				d3.event.stopPropagation();
				askConfirmationToRemoveUsers(user);
			});
		
		let extendedRemoveActions = removeAction.append("div")
			.classed("extendedContextAction", true);
		extendedRemoveActions.append("p")
			.text(`Remove '${user}' (${userInformations[user].nbEvents} events)`)
			.on("click", function() {
				d3.event.stopPropagation();
				askConfirmationToRemoveUsers(user);
			});
		extendedRemoveActions.append("p")
			.text("Remove all highlighted")
			.on("click", function() {
				d3.event.stopPropagation();
				askConfirmationToRemoveHighlightedUsers();
			});
		extendedRemoveActions.append("p")
			.text("Remove all unhighlighted")
			.on("click", function() {
				d3.event.stopPropagation();
				askConfirmationToRemoveNotHighlightedUsers();
			});


		userRow.on("click", function(){
			//console.log(userName);
			highlightUserRow(user);
			setHighlights();
			timeline.displayData();
			//d3.event.stopPropagation();
		});
	});
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
	algorithmIsRunning = true;
	updateAlgorithmStateDisplayOnRAF();
}

/**
 * Stops the algorithm runtime counter
 * @param {Number} time The time in ms at which the algorithm ended on the server
 */
function stopAlgorithmRuntime(time) {
	if (algorithmStartTime > 0) {
		algorithmIsRunning = false;
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
}

/**
 * Updates the display of the algorithm state
 */
function updateAlgorithmStateDisplay() {
	let thisTime = new Date();
	let elapsedTime = (algorithmState.isRunning()) ?
						thisTime - algorithmStartTime :
						algorithmState.getTotalElapsedTime();
	// Compensate for the delay between the two clocks
	if (algorithmState.isRunning()) {
		elapsedTime += startDelayFromServer;
		// Update the elapsed time on the current level
		let timeDiff = elapsedTime - algorithmState.getTotalElapsedTime();
		algorithmState.addTime(timeDiff);
	}
	// Update the extended view

	algorithmExtendedBarAxis.domain([0, algorithmState.getMaxPatternNumber()]);

	// Update the table
	let table = d3.select("#patternSizeTable");
	algorithmState.getOrderedLevels().forEach( function(lvl) {
		let lvlData = algorithmState.getLevel(lvl);
		let lvlProgression = algorithmState.getProgression(lvl);
		let row = d3.select("#patternSizeTableRow"+lvl);
		if (row.size() > 0) { // The row already exists
			row.classed("rowactive", lvlData.status == "active");
			row.select(".patternSizeStatus")
				.classed("levelstarted", false)
				.classed("levelcomplete", false)
				.classed("levelactive", false)
				.classed("level"+lvlData.status, true)
				.text(algorithmState.getVerboseStatus(lvlData.status));
			let patternCount = row.select(".patternSizeCount");
			patternCount.select("span")
				.text(lvlData.patternCount)
			patternCount.selectAll(".bar")
			  	.data([lvlData.patternCount])
				.transition().duration(0)
					.attr("status", lvlData.status)
					.attr("width", (d) => algorithmExtendedBarAxis(d));
			row.select(".patternSizeCandidates")
				.text(lvlData.candidatesChecked+"/"+lvlData.candidates);
			row.select(".patternSizeProgression")
				.text(isNaN(lvlProgression) ? "---" : parseFloat(lvlProgression).toFixed(2)+"%");
			row.select(".patternSizeTime")
				.text(formatElapsedTimeToString(lvlData.elapsedTime, true));
		} else { // The row doesn't exist yet
			row = table.select("#patternSizeTableContent").append("tr")
				.property("id", "patternSizeTableRow"+lvl);
			row.append("td")
				.text(lvlData.size);
			row.append("td")
				.classed("patternSizeStatus", true)
				.classed("level"+lvlData.status, true)
				.text(algorithmState.getVerboseStatus(lvlData.status));
			let patternCount = row.append("td")
				.classed("patternSizeCount", true);
			patternCount.append("span")
				.text(lvlData.patternCount)
			patternCount.append("svg")
				.attr("width", "200px")
				.attr("height", "15px")
			  .selectAll(".bar")
				.data([lvlData.patternCount])
				.enter()
			  .append("rect")
				  .attr("class", "bar")
				  .attr("status", lvlData.status)
				  .attr("x", 0)
				  .attr("y", 0 )
				  .attr("height", 15)
				  .attr("width", (d) => algorithmExtendedBarAxis(d));
			row.append("td")
				.classed("patternSizeCandidates", true)
				.text(lvlData.candidatesChecked+"/"+lvlData.candidates);
			row.append("td")
				.classed("patternSizeProgression", true)
				.text(isNaN(lvlProgression) ? "---" : parseFloat(lvlProgression).toFixed(2)+"%");
			row.append("td")
				.classed("patternSizeTime", true)
				.text(formatElapsedTimeToString(lvlData.elapsedTime, true));
		}
	});
	// Update the total row
	d3.select("#patternSizeTableTotal").selectAll("td").each(function(d,i) {
		switch(i) {
			case 1:// status
				d3.select(this)
					.text(algorithmState.getGlobalStatus())
					.classed("levelcomplete", !algorithmState.isRunning());
				break;
			case 2:// patterns found
				d3.select(this).text(algorithmState.getTotalPatternNumber());
				break;
			case 3:// candidates checked
				d3.select(this).text(algorithmState.getTotalCandidatesChecked());
				break;
			case 4:// progression

				break;
			case 5:// elapsed time
				d3.select(this).text(formatElapsedTimeToString(algorithmState.getTotalElapsedTime(), true));
				break;
			default:
		}
	});
	// Update the strategy
	let strategyTxt = "Not running";
	if (algorithmState.isRunning()) {
		if (algorithmState.isUnderSteering()) {
			strategyTxt = "Steering on ";
			if (algorithmState.getSteeringTarget()) {
				strategyTxt += algorithmState.getSteeringTarget();
				if (algorithmState.getSteeringValue())
					strategyTxt += " "+algorithmState.getSteeringValue();
			} else {
				strategyTxt += "something";
			}
		} else {
			strategyTxt = "Default (breadth-first search)";
		}
	}
	d3.select("#extendedAlgorithmStrategyArea div.body")
		.text(strategyTxt);
	// Update the speeds
	let dateNow = Date.now();
	let lastData = patternsPerSecondChart.getLastData();
	if (lastData) {
		if (dateNow - lastData.date >= 1000 ) {
			let patternNb = algorithmState.getTotalPatternNumber();
			let valueDifference = patternNb - lastData.total;
			patternsPerSecondChart.addData({date: dateNow, delta: valueDifference, total: patternNb});
			patternsPerSecondChart.draw();
		}
	} else {
		let patternNb = algorithmState.getTotalPatternNumber();
		patternsPerSecondChart.addData({date: dateNow, delta: patternNb, total: patternNb});
		patternsPerSecondChart.draw();
	}

	lastData = candidatesCheckedPerSecondChart.getLastData();
	if (lastData) {
		if (dateNow - lastData.date >= 1000 ) {
			let candidatesNb = algorithmState.getTotalCandidatesChecked();
			let valueDifference = candidatesNb - lastData.total;
			candidatesCheckedPerSecondChart.addData({date: dateNow, delta: valueDifference, total: candidatesNb});
			candidatesCheckedPerSecondChart.draw();
		}
	} else {
		let candidatesNb = algorithmState.getTotalCandidatesChecked();
		candidatesCheckedPerSecondChart.addData({date: dateNow, delta: candidatesNb, total: candidatesNb});
		candidatesCheckedPerSecondChart.draw();
	}
	
	// Update the reduced view
	document.getElementById("totalElapsedTime")
		.textContent = formatElapsedTimeToString(algorithmState.getTotalElapsedTime(), true);
	document.getElementById("totalPatternFound")
		.textContent = algorithmState.getTotalPatternNumber();

	let focusTxt = "Not running";
	let activityClass = "complete";
	let activityTxt = "Completed";
	if (algorithmState.isRunning()) {
		activityTxt = "Working on size "+algorithmState.getCurrentLevel().size;
		activityClass = "running";
		if (algorithmState.isUnderSteering()) {
			focusTxt = "Steering on ";
			activityClass = "steering";
			if (algorithmState.getSteeringTarget()) {
				focusTxt += algorithmState.getSteeringTarget();
				if (algorithmState.getSteeringValue())
					focusTxt += " "+algorithmState.getSteeringValue();
			} else {
				focusTxt += "something";
			}
		} else {
			focusTxt = "Default strategy";
		}
	}
	
	let activity = document.getElementById("algorithmActivity");
	activity.textContent = activityTxt;
	activity.className = activityClass;
	document.getElementById("algorithmFocus")
		.textContent = focusTxt;
}

/**
 * Handles the signal that the algorithm has started on the server
 * @param {json} msg The received message
 */
function handleAlgorithmStartSignal(msg) {
	let dateUTC = new Date(msg.time);
	startAlgorithmRuntime(dateUTC.getTime());
	enableLiveUpdateControl();
	if (patternLiveUpdate)
		d3.select("#liveUpdateIndicator").classed("active", true);
	algorithmState.start();

	activityHistory.startAlgorithm(algoMinSupport, algoMinGap, algoMaxGap, algoMaxDuration, algoMaxSize);
}

/**
 * Handles the signal that the algorithm has ended on the server
 * @param {json} msg The received message
 */
function handleAlgorithmEndSignal(msg) {
	let dateUTC = new Date(msg.time);
	stopAlgorithmRuntime(dateUTC.getTime());
	disableLiveUpdateControl();
	if (patternLiveUpdate)
		d3.select("#liveUpdateIndicator").classed("active", false);
	algorithmState.stop();
	updateAlgorithmStateDisplay();
	
	activityHistory.endAlgorithm(algorithmState.getTotalPatternNumber(), algorithmState.getTotalElapsedTime())
}

/**
 * Handles the signal that the algorithm has been stoped on the server
 * @param {json} msg The received message
 */
function handleAlgorithmStopSignal(msg) {
	let dateUTC = new Date(msg.time);
	stopAlgorithmRuntime(dateUTC.getTime());
	disableLiveUpdateControl();
	if (patternLiveUpdate)
		d3.select("#liveUpdateIndicator").classed("active", false);
	algorithmState.stopInterrupted();
	updateAlgorithmStateDisplay();
	
	activityHistory.endAlgorithm(algorithmState.getTotalPatternNumber(), algorithmState.getTotalElapsedTime(), false);

	if (algorithmWillRestart) {
		algorithmWillRestart = false;
		requestAlgorithmReStart();
	}
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
		let activity = document.getElementById("algorithmActivity");
		activity.textContent = "Loading data"+dots;
		activity.className = "";
		}, 1000);
}

/**
 * Displays that the algorithm has loaded its data
 */
function handleLoadedSignal() {
	clearInterval(loadingAlgorithmDataAnimation);
	loadingAlgorithmDataAnimationState = 1;
	document.getElementById("algorithmActivity")
		.textContent = "Starting";
	console.log("Dataset loaded on server");
}

/**
 * Displays the current pattern-size the algorithm is working on
 * @param {number} level The pattern size
 */
function handleNewLevelSignal(level) {
	algorithmState.stopLevel();
	algorithmState.startLevel(level);
	drawPatternSizesChart();
	updateAlgorithmStateDisplay();
}

/**
 * Displays the current pattern-size the algorithm is working on
 * @param {number} level The pattern size
 */
function handleLevelCompleteSignal(level) {
	algorithmState.setLevelComplete(level);
	drawPatternSizesChart();
}

/**
 * Displays the number of candidates generated for the current algorithm level
 * @param {number} number The number of candidates
 */
function handleCandidatesGeneratedSignal(number) {
	algorithmState.addGeneratedCandidates(number);
}

/**
 * Draws the barchart displaying the number of discovered pattern for each size
 */
function drawPatternSizesChart() {
	let data = Object.keys(patternMetrics.sizeDistribution);
	
	patternSizesChart.y.domain(data.map(function(d) { return d; }));
	patternSizesChart.x.domain([0, d3.max(data, function(d) {
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
		.attr("x", patternSizesChart.x(0))
		.attr("width", patternSizesChart.width - patternSizesChart.x(0))
		.style('fill-opacity', 1e-6)
		.remove();
	
	texts.exit()
		.transition()
		.duration(0)
		.attr("x", patternSizesChart.x(0))
		.attr("width", patternSizesChart.width - patternSizesChart.x(0))
		.style('fill-opacity', 1e-6)
		.remove();
	
	let barHeight = Math.min(25, Math.round(patternSizesChart.y.bandwidth()));
	let bandwidthOffset = (patternSizesChart.y.bandwidth() - barHeight) / 2;

	bars.enter().append("rect")
		.classed("bar", true)
		.attr("status", d => algorithmState.getLevel(d).status)
		.attr("x", patternSizesChart.x(0))
		.attr("y", d => Math.round(patternSizesChart.y(d) + bandwidthOffset))
		.attr("width", d => Math.round(patternSizesChart.x(patternMetrics.sizeDistribution[d])))
		.attr("height", barHeight);
	
	texts.enter().append("text")
		.classed("bar", true)
		.attr("text-anchor", "start")
		.attr("alignment-baseline", "middle")
		.attr("y", function(d) {
			return patternSizesChart.y(d) + patternSizesChart.y.bandwidth()/2;
		})
		.attr("x", (d) => patternSizesChart.x(patternMetrics.sizeDistribution[d]) + 5)
		.text((d) => patternMetrics.sizeDistribution[d]);
		
	// the "UPDATE" set:
	bars.transition().duration(0)
		.attr("status", d => algorithmState.getLevel(d).status)
		.attr("y", d => Math.round(patternSizesChart.y(d) + bandwidthOffset))
		.attr("height", barHeight)
		.attr("x", patternSizesChart.x(0))
		.attr("width", d => Math.round(patternSizesChart.x(patternMetrics.sizeDistribution[d])));
	
	texts.transition()
		.duration(0)
		.attr("y", function(d) {
			return patternSizesChart.y(d) + patternSizesChart.y.bandwidth()/2;
		})
		.attr("x", (d) => patternSizesChart.x(patternMetrics.sizeDistribution[d]) + 5)
		.text((d) => patternMetrics.sizeDistribution[d]);
}

/**
 * Displays the new focus of the algorithm after a steering has started
 * @param {string} type The type of steering that is occurring
 * @param {string} value The focus of the steering, according to its type
 */
function handleSteeringStartSignal(type, value) {
	console.log(`${type} steering starts on ${value}`);
	d3.select("#focus").text(type+" starting with: "+value);
	algorithmState.startSteering(type, value);
	lastSteeringPatterns = [];
	setupLastSteeringDetails(type, value);
	updatePatternCountDisplay(); // To reset the number of patterns from the last steering
}

/**
 * Clears the display of the algorithm's steering after it has ended
 */
function handleSteeringStopSignal() {
	console.log(`Steering stops`);
	activityHistory.stopSteering(lastSteeringPatterns);
	d3.select("#focus").text("");
	algorithmState.stopSteering();
}

/**
 * Updates the number of checked candidates for the current level
 * @param {number} numberOfCandidates The number of checked candidates
 */
function handleCandidateCheckSignal(numberOfCandidates) {
	algorithmState.updateCheckedCandidates(numberOfCandidates);
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
	let patternRowsRoot = document.getElementById("patternTableBody");
	while (patternRowsRoot.firstChild) {
		patternRowsRoot.removeChild(patternRowsRoot.firstChild);
	}
	// removing the old selected patterns
	patternRowsRoot = document.getElementById("selectedPatternTableBody");
	while (patternRowsRoot.firstChild) {
		patternRowsRoot.removeChild(patternRowsRoot.firstChild);
	}
	
	let patternList = d3.select("#patternTableBody");
	let properPatternSearchInput = currentPatternSearchInput.split(" ")
		.filter(function(d,i) {
			return d.length > 0;
		}).join(" ");
	let filteredPatterns = 0;
	
	// display the new ones
	for (let i=0; i < patternIdList.length; i++) {
		
		let pId = patternIdList[i];
		let pString = patternsInformation[patternIdList[i]][0];
		
		// Only add the pattern if the filter is empty or accepts the pattern
		if (pString.toLowerCase().includes(properPatternSearchInput.toLowerCase()) == false) {
			continue; // The filter rejects the pattern
		}
		
		filteredPatterns++;
		
		let displayAsSelected = selectedPatternIds.includes(pId);
		
		patternList.node().appendChild(createPatternRow(pId, displayAsSelected));
	}

	patternList = d3.select("#selectedPatternTableBody");
	selectedPatternIds.forEach(function(pId) {
		patternList.node().appendChild(createSelectedPatternRow(pId));
	});
	d3.select("#selectedPatternsArea .body").classed("hidden", selectedPatternIds.length == 0);
	
	d3.select("#filteredInPatternNumberSpan").text(filteredPatterns);
}

/**
 * Creates the global elements of a pattern row and returns it
 * @param {number} pId The id of the pattern
 * @param {boolean} displayAsSelected Whether the pattern should be highlighted as selected or not
 */
function createGeneralPatternRow(pId, displayAsSelected = false) {
	let pSize = patternsInformation[pId][1];
	let pSupport = patternsInformation[pId][2];
	let pString = patternsInformation[pId][0];
	let pItems = patternsInformation[pId][3];
	let pUsers = patternsInformation[pId][4];

	let row = d3.select(document.createElement("tr"))
		.classed("clickable",true)
		.classed("selectedPattern", displayAsSelected)
		.on("click", function() {
			if (selectedPatternIds.includes(pId)) {
				let index = selectedPatternIds.indexOf(pId);
				if (index >= 0)
					selectedPatternIds.splice(index, 1);
			} else {
				// Select the pattern if the max number is not yet reached
				if (selectedPatternIds.length < maxSelectedPatternNb) {
					selectedPatternIds.push(pId);
				} else {
					return;
				}
			}
			
			if (occurrencesAreKnown(pId) == false)
				requestPatternOccurrences(pId, currentDatasetName);
			else
				timeline.displayData(); // TODO optimize by just displaying the pattern occurrences
			//d3.event.stopPropagation();
			console.log("click on "+pId);
			createPatternListDisplay();
			
			d3.select("#resetPatternSelectionButton")
				.classed("hidden", selectedPatternIds.length == 0);

			setHighlights();
		});
	
	let nameCell = row.append("td");
		//.classed("dropdown", true);
	/*var pSvg = thisNameCell.append("svg")
		.attr("width", 20*pSize)
		.attr("height", 20);*/
	for (let k=0; k < pSize; k++) {
		nameCell.append("span")
			.style("color",colorList[pItems[k]][0].toString())
			.text(itemShapes[pItems[k]]);
	}
	nameCell.append("span")
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
	
	row.append("td")
		.text(pSupport);
	row.append("td")
		.text(pUsers.length);
	row.append("td")
		.text(pSize);
	
	// Add the context actions
	let contextActions = row.append("td").append("div")
		.classed("contextActions", true);
	contextActions.append("button")
		.classed("clickable", true)
		.classed("icon-selectUsers", true)
		.attr("title", "Highlight users having this pattern")
		.on("click", function() {
			d3.event.stopPropagation();
			updateUserSelectionFromPattern(pId);
		});
	contextActions.append("button")
		.classed("clickable", true)
		.classed("icon-steering", true)
		.attr("title", "Steer algorithm on this pattern")
		.on("click", function() {
			d3.event.stopPropagation();
			requestSteeringOnPatternPrefix(pId);
		});
	contextActions.append("button")
		.classed("clickable", true)
		.classed("icon-toEventType", true)
		.attr("title", "Convert to event type")
		.on("click", function() {
			d3.event.stopPropagation();
			askConfirmationToCreateEventType(pId);
		});
	
	return row;
}

/**
 * Creates a pattern row for the list of selected patterns and add it to the list
 * @param {number} pId The id of the pattern
 */
function createSelectedPatternRow(pId) {
	let row = createGeneralPatternRow(pId);
	row.attr("id", "selectedPattern"+pId);

	return row.node();
}

/**
 * Creates a pattern row for the list of all patterns and add it to the list
 * @param {number} pId The id of the pattern
 * @param {boolean} displayAsSelected Whether the pattern should be highlighted as selected or not
 */
function createPatternRow(pId, displayAsSelected = false) {
	let row = createGeneralPatternRow(pId, displayAsSelected);
	row.attr("id","pattern"+pId);

	return row.node();
}

/**
 * Moves the overview brush over a specific time period (clamped to the period
 * covered by the dataset)
 * @param {number} startTime The lower bound of the period (in ms)
 * @param {number} endTime The upper bound if the period (in ms)
 */
function focusOnTimePeriod(startTime, endTime) {
	let contextTimeRange = timeline.xContext.range().map(timeline.xContext.invert);
	let start = Math.max(startTime, contextTimeRange[0]);
	let end = Math.min(endTime, contextTimeRange[1]);

	timeline.gBrush.call(timeline.brush.move, 
		[timeline.xContext(start), timeline.xContext(end)]);
}

/**
 * Puts the focus on the whole dataset
 */
function resetFocus() {
	focusOnTimePeriod(...timeline.xContext.domain().map( d => d.getTime() ));
}

/**
 * Moves the overview brush so that a specific bin size is used. If possible,
 * the brush extends both ends to keep the current middle point unchanged.
 */
function goToDistribution(distributionThreshold) {
	let currentPeriod = currentTimeFilter[1] - currentTimeFilter[0];
	let center = currentTimeFilter[0] + Math.round(currentPeriod/2);

	let newPeriod = distributionThreshold*1000-1; // Convert from s to ms
	let start = center - Math.floor(newPeriod/2);
	let end = center + Math.ceil(newPeriod/2);

	let contextRange = timeline.xContext.range();
	let overflowStart = contextRange[0] - timeline.xContext(start);
	let overflowEnd = timeline.xContext(end) - contextRange[1];

	if (overflowStart > 0 && overflowEnd > 0) {
		// Both end overflow, view the entire dataset
		timeline.gBrush.call(timeline.brush.move, 
			contextRange);
	} else {
		if (overflowStart > 0) {
			start = timeline.xContext.invert(contextRange[0]);
			// The -0 is used to cast start to a number of milliseconds from a string
			end = Math.min(start -0 +newPeriod, timeline.xContext.invert(contextRange[1]));
		} else if (overflowEnd > 0) {
			end = timeline.xContext.invert(contextRange[1]);
			start = Math.max(end -newPeriod, timeline.xContext.invert(contextRange[0]));
		}
		timeline.gBrush.call(timeline.brush.move, 
			[timeline.xContext(start), timeline.xContext(end)]);
	}
}

/**
 * Moves the overview brush over the full dataset, to use the biggest event
 * bin size (one bin per year)
 */
function goToYearDistribution() {
	let contextTimeRange = timeline.xContext.range().map(timeline.xContext.invert);
	focusOnTimePeriod(contextTimeRange[0], contextTimeRange[1]);
}

/**
 * Moves the overview brush to use the month bin size (one bin per month)
 */
function goToMonthDistribution() {
	goToDistribution(distributionYearThreshold);
}

/**
 * Moves the overview brush to use the half month bin size (one bin per half 
 * month)
 */
function goToHalfMonthDistribution() {
	goToDistribution(distributionMonthThreshold);
}

/**
 * Moves the overview brush to use the day bin size (one bin per day)
 */
function goToDayDistribution() {
	goToDistribution(distributionHalfMonthThreshold);
}

/**
 * Moves the overview brush to use the half day bin size (one bin per 12h)
 */
function goToHalfDayDistribution() {
	goToDistribution(distributionDayThreshold);
}

/**
 * Moves the overview brush to view the individual events
 */
function goToEvents() {
	goToDistribution(distributionHalfDayThreshold);
}

/**
 * Updates the list of users depending on the value in the user search field. A
 * debounced version of this function is stored in debouncedFilterUserList.
 */
function filterUserList() {
	let searchField = d3.select("#Users input.searchField");
	let suggestionField = d3.select("#Users input.suggestionField");
	let suggestionDiv = d3.select("#Users .suggestionDiv");

	currentUserSearchInput = searchField.property("value");
		
	if(currentUserSearchInput.length > 0) {
		relatedUsers = userList.filter(function(d, i) {
			return d.includes(currentUserSearchInput);
		});
		
		if (relatedUsers.length > 0) {
			currentUserSearchSuggestionIdx = 0;
			suggestionDiv.html("");
			relatedUsers.forEach(function(d,i) {
				suggestionDiv.append("p")
					.classed("selectedSuggestion", i==currentUserSearchSuggestionIdx)
					.classed("clickable", true)
					.text(d)
					.on("click", function() {
						currentUserSearchInput = relatedUsers[i];
						searchField.property("value",currentUserSearchInput);
						// Updates the suggestion list
						relatedUsers = userList.filter(function(e, j) {
							return e.includes(currentUserSearchInput);
						});

						if (relatedUsers.length > 0) {
							currentUserSearchSuggestionIdx = 0;
							suggestionDiv.html("");
							relatedUsers.forEach(function(e,j) {
								suggestionDiv.append("p")
									.classed("selectedSuggestion", j==currentUserSearchSuggestionIdx)
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
}

/**
 * Zooms in to restrict the viewed time span to 90% of the current one
 */
function zoomingIn() {
	console.log("zooming in");
	timeline.currentZoomScale = Math.max(0.05, timeline.currentZoomScale + 0.05);
	timeline.zoomRect.call(timeline.zoom.scaleBy, 1.1);
	timeline.zoomRectUsers.call(timeline.zoomUsers.scaleBy, 1.1);
}

/**
 * Zooms out to augment the viewed time span to 110% of the current one
 */
function zoomingOut() {
	console.log("zoomeing out");
	timeline.currentZoomScale = Math.max(1.0, timeline.currentZoomScale - 0.05);
	timeline.zoomRect.call(timeline.zoom.scaleBy, 0.9);
	timeline.zoomRectUsers.call(timeline.zoomUsers.scaleBy, 0.9);
}

/**
 * Updates whether or not event categories should be displayed in the event bins
 *  and updates the interface accordingly
 */
function switchBinCategoryDisplay() {
	timeline.displayColorsInBins = document.getElementById("displayBinColorInput").checked;
	if (timeline.displayColorsInBins) {
		d3.select("#displayBinFullHeightInput").classed("hidden",false);
		d3.select(d3.select("#displayBinFullHeightInput").node().previousElementSibling).classed("hidden",false);
	} else {
		timeline.displayFullHeightBins = false;
		d3.select("#displayBinFullHeightInput").property("checked",false)
			.classed("hidden",true);
		d3.select(d3.select("#displayBinFullHeightInput").node().previousElementSibling).classed("hidden",true);
	}
	timeline.displayData();
}

/**
 * Updates whether or not event bins should have an absolute or relative size,
 * and updates the interface accordingly
 */
function switchBinHeightDisplay() {
	timeline.displayFullHeightBins = document.getElementById("displayBinFullHeightInput").checked;
	timeline.displayData();
}

/**
 * Starts using the display of events by type and updates the visualization
 */
function startDisplayingEventsByType() {
	timeline.eventDisplayStyle = "type";
	// change the left axis
	timeline.yFocus = d3.scaleBand()
		.range([0, timeline.marginFocus.size])
		.paddingInner(0.1);
	timeline.displayData();
}

/**
 * Starts using the display of events by time and updates the visualization
 */
function startDisplayingEventsByTime() {
	timeline.eventDisplayStyle = "time";
	timeline.displayData();
}

/**
 * Starts using the display of events by user and updates the visualization
 * @deprecated Probably never used
 * TODO Check if this should be deleted
 */
function startDisplayingEventsByUser() {
	timeline.eventDisplayStyle = "user";
	timeline.displayData();
}

/**
 * Switches whether all the events should be displayed in the focus view, or only
 * the highlighted ones
 */
function switchFocusShowOnlyHighlighted() {
	let optionChecked = timeline.showOnlyHighlightedInFocusForm.select("input").property("checked");
	timeline.showOnlyHighlightedInFocus = optionChecked;
	timeline.displayData();
}

/**
 * Returns the relevant display mode for the focus view ("events" or
 * "distributions").
 * 
 * This is the valid version to use once the timeline will be implemented better.
 * 
 * TODO Use instead of Timeline.getRelevantDisplayMode()
 */
function getRelevantDisplayMode() {
	let tlDomain = timeline.xFocus.domain();
	if ((tlDomain[1]-tlDomain[0])/1000 < distributionHalfDayThreshold ) {
		return "events";
	} else {
		return "distributions";
	}
}

/**
 * Expands or shrinks the extended algorithm view
 */
function toggleExtendedAlgorithmView() {
	useExtendedAlgorithmView = !useExtendedAlgorithmView;
	if(useExtendedAlgorithmView) { // Show the extended view
		d3.select("#algorithmExtended").classed("hidden", false);
		d3.select("#changeParametersConfirmation").classed("hidden", true);
		d3.select("#modalTitle").text("Information about the pattern mining algorithm");
		d3.select("#modalBackground").classed("hidden", false);
		
	} else { // Show the shrinked view
		d3.select("#modalBackground").classed("hidden", true);
		d3.select("#modalTitle").text("");
		d3.select("#algorithmExtended").classed("hidden", true);
	}
}

/**
 * Hides the modal window and its content
 */
function closeModal() {
	if (useExtendedAlgorithmView)
		toggleExtendedAlgorithmView();
	d3.select("#modalBackground").classed("hidden", true);
	d3.select("#modalTitle").text("");
	d3.selectAll(".actionConfirmation").classed("hidden", true);
	d3.select("#datasetError").classed("hidden", true);
}

/**
 * Shows the modal window in 'dataset error' mode
 */
function showDatasetErrorModal() {
	d3.select("#modalBackground").classed("hidden", false);
	d3.select("#modalTitle").text("Error in dataset selection");
	if (useExtendedAlgorithmView)
		toggleExtendedAlgorithmView();
	d3.selectAll(".actionConfirmation").classed("hidden", true);
	d3.select("#datasetError").classed("hidden", false);
}

/**
 * Shows the modal window in 'action confirmation' mode
 */
function showConfirmationModal() {
	d3.select("#modalBackground").classed("hidden", false);
	//d3.select("#modalTitle").text("Action confirmation");
	d3.select("#algorithmExtended").classed("hidden", true);
}

/**
 * Shows the modal window for confirming the removal of an event type
 */
function showEventTypeRemovalConfirmation() {
	showConfirmationModal();
	d3.select("#removeEventTypeConfirmation").classed("hidden", false);
	d3.select("#removeEventTypeConfirmation .confirmationCancel").node().focus();
}

/**
 * Shows the modal window for confirming the removal of a user
 */
function showUserRemovalConfirmation() {
	showConfirmationModal();
	d3.select("#removeUserConfirmation").classed("hidden", false);
	d3.select("#removeUserConfirmation .confirmationCancel").node().focus();
}

/**
 * Shows the modal window for confirming the modification of parameters
 */
function showParameterChangeConfirmation() {
	showConfirmationModal();
	d3.select("#changeParametersConfirmation").classed("hidden", false);
	d3.select("#changeParametersConfirmation .confirmationCancel").node().focus();
}

/**
 * Shows the modal window for confirming the creation of an event type
 */
function showEventTypeCreationConfirmation() {
	showConfirmationModal();
	d3.select("#createEventTypeConfirmation").classed("hidden", false);
	d3.select("#createEventTypeConfirmation .confirmationCancel").node().focus();
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
			displayGeneralTooltip(data);
			break;
		case "session":
			displaySessionTooltip(data);
			break;
		default:
		}
		
		tooltipHasContent = true;
		tooltip.property("scrollTop",0);
		tooltip.classed("hidden", false);
	}
}

/**
 * Displays the tooltip when its data comes from the "all users" view
 * @param {JSON} data The data to display
 */
function displayGeneralTooltip(data) {
	let area = d3.select("#tooltip").select(".body");
	area.html("")
		.style("text-align", "left");

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
			let typeLine = area.append("p")
				.classed("clickable", true)
				.classed("bold", highlightedEventTypes.includes(data.type))
				.text("Type: ")
				.on("click", function() {
					highlightEventTypeRow(data.type);
					d3.select(this)
						.classed("bold", highlightedEventTypes.includes(data.type));
					setHighlights();
					timeline.displayData();
				});
			typeLine.append("span")
				.style("color",colorList[data.type][0])
				.text(itemShapes[data.type]);
			typeLine.append("span")
				.text(" "+data.type);
			area.append("p")
				.text("Time: " + formatDate(new Date(data.start)));
			area.append("p")
				.classed("clickable", true)
				.classed("bold", highlightedUsers.includes(data.user))
				.text("User: " + data.user)
				.on("click", function() {
					highlightUserRow(data.user);
					d3.select(this)
						.classed("bold", highlightedUsers.includes(data.user));
					setHighlights();
					timeline.displayData();
				});
			area.append("p")
				.text("Properties:");
			for(let i = 0; i < data.properties.length; i++)
				area.append("p")
					.classed("tooltipEventProperty", true)
					.text(data.properties[i]);
	}
}

/**
 * Displays the tooltip when its data comes from the "session" view
 * @param {JSON} data The data to display
 */
function displaySessionTooltip(data) {
	let area = d3.select("#tooltip").select(".body");
	area.html("")
		.style("text-align", "left");

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
 * @param {string} datasetToken - Token to request the dataset
 */
function selectDataset(datasetName, datasetToken) {
	currentDatasetName = datasetName;
	
	if (!pageParameters.gzip)
		requestDatasetLoad(datasetName);
	
	requestDatasetInfo(datasetName);
	requestEventTypes(datasetName);
	requestUserList(datasetName);
	enableCentralOverlay("The dataset is loading...");
	
	if (!pageParameters.gzip)
		requestDataset(datasetName);
	else {
		let servletAdress = config.servletAdress.replace("dataset", "data");
		fetch(`${servletAdress}?session=${datasetToken}`)
			.then( response => response.json() )
			.then( json => {
				receiveEvents(json);
			});
	}
}

/**
 * Clears the selection of patterns and update the HCI accordingly
 */
function unselectAllPatterns() {
	selectedPatternIds = [];
	
	createPatternListDisplay();
	timeline.displayData(); // TODO only redraw the pattern occurrences
	//timeline.drawUsersPatterns(); // TODO uncomment when the above line's TODO will be done
	
	d3.select("#resetPatternSelectionButton")
				.classed("hidden", selectedPatternIds.length == 0);
	setHighlights();
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
	this.svg = d3.select("#patternSizesChart").append("svg")
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("id","patternSizesSvg");
	this.margin = {top: 10, right: 40, bottom: 20, left: 30};
	this.width = this.svg.node().getBoundingClientRect().width -
				 this.margin.left - this.margin.right;
	this.height = this.svg.node().getBoundingClientRect().height -
				 this.margin.top - this.margin.bottom;
	this.y = d3.scaleBand().rangeRound([0, this.height]).padding(0.1);
	this.x = d3.scaleLinear().rangeRound([0, this.width]);
	this.xAxis = d3.axisBottom(this.x).ticks(5);
	this.yAxis = d3.axisLeft(this.y);
	this.g = this.svg.append("g")
			.attr("transform",
				 "translate(" + this.margin.left + "," + this.margin.top + ")");
}

/**
 * Creates a slider that will filter the patterns
 * @constructor
 * @param {string} elemId Id of the HTML node where the slider will be created
 * @param {function} onupdate Callback used when one of the brushes' value changes
 * @param {string} metricName Field of patternMetrics whe the data is located
 */
function FilterSlider(elemId, onupdate, metricName) {
	let self = this;
	self.parentNodeId = elemId;
	self.parentNode = d3.select("#"+self.parentNodeId);
	self.parentWidth = parseFloat(document.getElementById(self.parentNodeId).getBoundingClientRect().width);
	
	self.margin = {right: 10, left: 10, size:50};
	
	self.svg = self.parentNode.append("svg")
		.attr("class","slider")
		.attr("width", Math.floor(self.parentWidth).toString())
		.attr("height", self.margin.size);
	
	self.width = +self.svg.attr("width") - self.margin.left - self.margin.right;
	self.height = +self.svg.attr("height");	
	
	self.domain = [0,0];
	self.currentMinValue = self.domain[0];
	self.currentMaxValue = self.domain[1];
	self.currentHandleMinValue = self.currentMinValue;
	self.currentHandleMaxValue = self.currentMaxValue;
	
	self.onupdate = (onupdate ? onupdate : function(f){return;});
	self.metricName = metricName;
	self.areaData = [];

	self.axisX = d3.scaleLinear()
		.domain(self.domain)
		.range([0,self.width])
		.clamp(true);
	self.axisY = d3.scaleLinear()
		.domain([0, 10])
		.range([self.height/2, 0]);
	
	self.slider = self.svg.append("g")
		.attr("class","slider")
		.attr("transform","translate("+self.margin.left+","+ self.height / 2 +")");
	
	self.area = d3.area()
		.curve(d3.curveStep)
		.x( d => self.axisX(d.key) )
		.y0(self.axisY(0))
		.y1( d => self.axisY(d.value) );

	self.line = self.slider.append("line")
		.attr("class","track")
		.attr("x1",self.axisX.range()[0])
		.attr("x2",self.axisX.range()[1])
		.attr("stroke", "black");
	
	self.areaG = self.slider.append("path")
		.attr("class", "sliderArea")
		.attr("transform", `translate(0,${-(self.height/2 + 1)})`);

	self.clipPath = self.slider.append("defs")
		.append("clipPath")
		.attr("id", `selection-clip-${self.parentNodeId}`)
		.append("rect")
		.attr("x", self.axisX(self.currentHandleMinValue - 0.5))
		.attr("y", 0)
		.attr("height", self.height/2 + 1)
		.attr("width", self.axisX(self.currentHandleMaxValue + 0.5) - self.axisX(self.currentHandleMinValue - 0.5));
		//.attr("transform", `translate(0,${-(self.height/2 + 1)})`);
	
	self.blueAreaG = self.slider.append("g")
		.attr("clip-path", `url(#selection-clip-${self.parentNodeId})`)
		.attr("transform", `translate(0,${-(self.height/2 + 1)})`)
		.append("path")
		.attr("class", "sliderBlueArea");

	self.blueLine = self.slider.append("line")
		.attr("class","bluetrack")
		.attr("x1",self.axisX(self.currentHandleMinValue))
		.attr("x2",self.axisX(self.currentHandleMaxValue))
		.attr("stroke", "lightblue");
	
	self.handle1 = self.slider.insert("circle", ".track-overlay")
		.attr("class","handleSlider")
		.attr("r",5)
		.attr("cx",self.axisX(self.currentMinValue))
		.call(d3.drag()
				.on("start.interrupt", function() { self.slider.interrupt(); })
				.on("start drag", function() {
					var roundedPos = Math.round(self.axisX.invert(d3.event.x));
					self.moveHandle1To(roundedPos);
					}));
	
	self.handle2 = self.slider.insert("circle", ".track-overlay")
		.attr("class","handleSlider")
		.attr("r",5)
		.attr("cx",self.axisX(self.currentMaxValue))
		.call(d3.drag()
				.on("start.interrupt", function() { self.slider.interrupt(); })
				.on("start drag", function() {
					var roundedPos = Math.round(self.axisX.invert(d3.event.x));
					self.moveHandle2To(roundedPos);
					}));

	self.tooltipMin = self.slider.insert("text", ".track-overlay")
		.attr("class","handleSliderText")
		.attr("x", self.axisX(self.currentHandleMinValue))
		.attr("text-anchor","middle")
		.attr("transform", "translate(0,-"+10+")")
		.text(self.currentHandleMinValue);
	self.tooltipMax = self.slider.insert("text", ".track-overlay")
		.attr("class","handleSliderText")
		.attr("x", self.axisX(self.currentHandleMaxValue))
		.attr("text-anchor","middle")
		.attr("transform", "translate(0,-"+10+")")
		.text(self.currentHandleMaxValue);
	
	// Unfinished
	self.updateCurrentValues = function(min, max) {
		self.currentMinValue = min;
		self.currentMaxValue = max;
		self.handle1.attr("cx",self.axisX(self.current))
	};
	
	self.moveHandle1To = function(value) {
		if (value >= self.currentMinValue && value <= self.currentMaxValue) {
			self.handle1.attr("cx",self.axisX(Math.round(value)));
			var otherValue = self.axisX.invert(self.handle2.attr("cx"));	
			self.currentHandleMinValue = Math.min(value, otherValue);
			self.currentHandleMaxValue = Math.max(value, otherValue);
	
			self.blueLine.attr("x1",self.axisX(self.currentHandleMinValue))
				.attr("x2",self.axisX(self.currentHandleMaxValue));
			self.tooltipMin.attr("x", self.axisX(self.currentHandleMinValue))
				.text(Math.round(self.currentHandleMinValue));
			self.tooltipMax.attr("x", self.axisX(self.currentHandleMaxValue))
				.text(Math.round(self.currentHandleMaxValue));

			self.clipPath.attr("x", self.axisX(self.currentHandleMinValue - 0.5))
				.attr("width", self.axisX(self.currentHandleMaxValue + 0.5) - self.axisX(self.currentHandleMinValue - 0.5));
		}
		
		self.onupdate();

		/*self.blueLine.attr("x1",self.axis(self.currentHandleMinValue))
			.attr("x2",self.handle2.attr("cx"));*/
	};
	
	self.moveHandle2To = function(value) {
		if (value >= self.currentMinValue && value <= self.currentMaxValue) {
			self.handle2.attr("cx",self.axisX(Math.round(value)));
			var otherValue = self.axisX.invert(self.handle1.attr("cx"));	
			self.currentHandleMinValue = Math.min(value, otherValue);
			self.currentHandleMaxValue = Math.max(value, otherValue);
	
			self.blueLine.attr("x1",self.axisX(self.currentHandleMinValue))
				.attr("x2",self.axisX(self.currentHandleMaxValue));
			self.tooltipMin.attr("x", self.axisX(self.currentHandleMinValue))
				.text(Math.round(self.currentHandleMinValue));
			self.tooltipMax.attr("x", self.axisX(self.currentHandleMaxValue))
				.text(Math.round(self.currentHandleMaxValue));
				
			self.clipPath.attr("x", self.axisX(self.currentHandleMinValue - 0.5))
				.attr("width", self.axisX(self.currentHandleMaxValue + 0.5) - self.axisX(self.currentHandleMinValue - 0.5));
		}
		
		self.onupdate();
		/*self.blueLine.attr("x1",)
			.attr("x2",self.axis(Math.round(value)));*/
	};

	self.draw = function() {
		self.axisY.domain([0, d3.max(Object.values(patternMetrics[self.metricName]))]);
		self.areaData = Object.entries(patternMetrics[self.metricName])
			.map( d => ({key: parseInt(d[0]), value: d[1]}) );
		// Add important values such as min and max, and maybe 0s between ?
		let toAdd = [];
		let actualData = Object.keys(patternMetrics[self.metricName])
			.map( d => parseInt(d) );
		self.areaData.forEach( d => {
			let keyVal = parseInt(d.key);
			if (!actualData.includes(keyVal-1)) {
				toAdd.push({key: keyVal-1, value: 0});
			}
			if (!actualData.includes(keyVal+1)) {
				toAdd.push({key: keyVal+1, value: 0});
			}
		});
		self.areaData = _.concat(self.areaData, toAdd);
		self.areaData = _.sortBy(self.areaData, ['key']);

		self.clipPath.attr("x", self.axisX(self.currentHandleMinValue - 0.5))
			.attr("width", self.axisX(self.currentHandleMaxValue + 0.5) - self.axisX(self.currentHandleMinValue - 0.5));

		self.slider.select(".sliderArea")
			.datum(self.areaData)
			.attr("d", self.area);
		self.slider.select(".sliderBlueArea")
			.datum(self.areaData)
			.attr("d", self.area);
	};

	self.getSelectedRange = function() {
		return [self.currentHandleMinValue, self.currentHandleMaxValue];
	}

	/**
	 * Updates the domain of the slider, keeping the current handle values if possible
	 * @param {number} start The new domain bottom value (included)
	 * @param {number} end The new domain top value (included)
	 */
	self.updateDomain = function(start, end) {
		self.domain = [start, end];
		let minHandleAtBottom = self.currentMinValue == self.currentHandleMinValue;
		let maxHandleAtTop = self.currentMaxValue == self.currentHandleMaxValue;
		self.currentMinValue = self.domain[0];
		self.currentMaxValue = self.domain[1];
		if (self.currentHandleMinValue <= self.currentMinValue || minHandleAtBottom)
			self.currentHandleMinValue = self.currentMinValue;
		else
			self.currentHandleMinValue = Math.min(self.currentMaxValue, self.currentHandleMinValue);
		
		if (self.currentHandleMaxValue >= self.currentMaxValue || maxHandleAtTop)
			self.currentHandleMaxValue = self.currentMaxValue;
		else
			self.currentHandleMaxValue = Math.max(self.currentMinValue, self.currentHandleMaxValue);
		self.axisX.domain(self.domain);
		self.line.attr("x1",self.axisX.range()[0])
			.attr("x2",self.axisX.range()[1]);
		self.blueLine.attr("x1",self.axisX(self.currentHandleMinValue))
			.attr("x2",self.axisX(self.currentHandleMaxValue));
		self.handle1.attr("cx",self.axisX(self.currentHandleMinValue));
		self.handle2.attr("cx",self.axisX(self.currentHandleMaxValue));
		self.tooltipMin.attr("x", self.axisX(self.currentHandleMinValue))
			.text(self.currentHandleMinValue);
		self.tooltipMax.attr("x", self.axisX(self.currentHandleMaxValue))
			.text(self.currentHandleMaxValue);
		
		self.onupdate();
	}

	self.updateDomainTop = function(end) {
		self.updateDomain(self.domain[0], end);
	}

	self.updateDomainBottom = function(start) {
		self.updateDomain(start, self.domain[1]);
	}

	self.hasValueSelected = function(value) {
		return value >= self.currentHandleMinValue && value <= self.currentHandleMaxValue;
	}
}

/**
 * Creates a slider that will modify the algorithm's parameters
 * @constructor
 * @param {string} elemId Id of the HTML node where the slider will be created
 * @param {JSON} options Options for the creation of the slider
 */
function ModifySlider(elemId, options) {
	let self = this;
	self.parentNodeId = elemId;
	self.parentNode = d3.select("#"+self.parentNodeId);
	self.parentWidth = parseFloat(document.getElementById(self.parentNodeId).getBoundingClientRect().width);
	
	self.svg = self.parentNode.append("svg")
		.attr("class","slider")
		.attr("width", Math.floor(self.parentWidth).toString())
		.attr("height","50");
	
	self.margin = {right: 30, left: 10};
	self.width = +self.svg.attr("width") - self.margin.left - self.margin.right;
	self.height = +self.svg.attr("height");	
	
	self.domain = [0,10];
	self.currentMinValue = self.domain[0];
	self.currentMaxValue = self.domain[1];

	self.axis = d3.scaleLinear()
		.domain(self.domain)
		.range([0,self.width])
		.clamp(false);
	
	self.slider = self.svg.append("g")
		.attr("class","slider")
		.attr("transform","translate("+self.margin.left+","+ self.height / 2 +")");
	
	self.line = self.slider.append("line")
		.attr("class","track")
		.attr("x1",self.axis.range()[0])
		.attr("x2",self.axis.range()[1])
		.attr("stroke", "black");
	
	let arrowPathData = [
		{x: self.axis.range()[1]+1, y: 0},
		{x: self.margin.right/2, y: 0},
		{x: -self.margin.right/4, y: -5},
		{x: 0, y: 10},
		{x: self.margin.right/4, y: -5}
	];

	self.arrow = self.slider.append("path")
		.attr("class", "trackArrow")
		.attr("d", `M${arrowPathData[0].x} ${arrowPathData[0].y} l${arrowPathData[1].x} ${arrowPathData[1].y} l${arrowPathData[2].x} ${arrowPathData[2].y} m${arrowPathData[3].x} ${arrowPathData[3].y} l${arrowPathData[4].x} ${arrowPathData[4].y}`)
		.attr("stroke", "red");
		
	self.ticks = self.slider.insert("g",".track-overlay")
		.attr("class","ticks")
		.attr("transform", "translate(0,"+18+")");
	self.ticks.selectAll("text")
		.data(self.axis.ticks(5))
		.enter().append("text")
		.attr("x",self.axis)
		.attr("text-anchor","middle")
		.text(function(d) { return d; });
		
	self.blueLine = options.brushNumber == 1 ? null :
		self.slider.append("line")
			.attr("class","bluetrack")
			.attr("x1", self.axis(self.currentMinValue))
			.attr("x2",self.axis(self.currentMinValue))
			.attr("stroke", "lightblue");

	self.handles = [];
		
	for(let brushNb = 0; brushNb < options.brushNumber; brushNb++) {
		let value = self.currentMinValue;
		
		let obj = {
			value: value,
			handle: null,
			tooltip: null
		};
		
		let handle = self.slider.insert("circle", ".track-overlay")
		.attr("class","handleSlider")
		.attr("r",5)
		.attr("cx",self.axis(value))
		.call(d3.drag()
			.on("start.interrupt", function() { self.slider.interrupt(); })
			.on("start drag", function() {
				var roundedPos = Math.round(self.axis.invert(d3.event.x));
				self.moveHandleTo(obj, roundedPos);
			})
			.on("end", updateRestartButtonStyle)
		);

		let tooltip = self.slider.insert("text", ".track-overlay")
		.attr("class","handleSliderText")
		.attr("x", self.axis(value))
		.attr("text-anchor","middle")
		.attr("transform", "translate(0,-"+10+")")
		.text(value);
		
		obj.handle = handle;
		obj.tooltip = tooltip;
		
		self.handles.push(obj);
	}
	
	self.updateValues = function(values) {
		values.forEach( (val, idx) => {
			if (val < self.currentMinValue) {
				self.domain[0] = val;
				self.currentMinValue = val;
				self.axis.domain(self.domain);
			} else if (val > self.currentMaxValue) {
				self.domain[1] = val;
				self.currentMaxValue = val;
				self.axis.domain(self.domain);
			}

			self.moveHandleTo(self.handles[idx], val);
		});
	}

	self.moveHandleTo = function(handleObject, value) {
		if (value >= self.currentMinValue && value <= self.currentMaxValue) {
			handleObject.value = value;
			handleObject.handle.attr("cx",self.axis(Math.round(value)));
			handleObject.tooltip.attr("x", self.axis(handleObject.value))
				.text(Math.round(handleObject.value));

			if (self.blueLine) {
				self.blueLine.attr("x1",self.axis(_.min(_.reduce(self.handles,(prev, cur) => {
						prev.push(cur.value);
						return prev;
					}, []))))
					.attr("x2",self.axis(_.max(_.reduce(self.handles,(prev, cur) => {
						prev.push(cur.value);
						return prev;
					}, []))));
			}
		} else if (value > self.currentMaxValue) { // Touching the max value, we increase it by 1
			self.increaseMax(handleObject);
		}
	};

	self.increaseMax = _.throttle( function(handleObject) {
		handleObject.value++;
		self.updateValues(self.handles.map( (h) => h.value ));
	}, 100);

	self.getValues = function() {
		return self.handles.map( (h) => h.value ).sort();
	}
}

/**
 * All the informations about the state of a progressive algorithm
 * @constructor
 */
function AlgorithmState() {
	this.running = false;
	this.underSteering = false;
	this.steeringTarget = null;
	this.steeringValue = null;
	this.patternSizeInfo = {};
	this.currentLevel = null;
	this.totalCandidatesChecked = 0;
	this.globalStatus = "Not started";

	this.start = function() {
		this.running = true;
		this.globalStatus = "Running";
	}

	this.stop = function() {
		this.running = false;
		this.globalStatus = "Complete";
	}

	this.stopInterrupted = function() {
		this.running = false;
		this.globalStatus = "Interrupted";
	}

	this.startLevel = function(pSize) {
		// Go to a previously started pattern size
		if (Object.keys(this.patternSizeInfo).includes(pSize.toString())) {
			this.currentLevel = this.patternSizeInfo[pSize];
			this.currentLevel.status = "active";
		} else { // Start a new pattern size
			this.patternSizeInfo[pSize] = {
				size: pSize,
				status: "active",
				patternCount : 0,
				candidates : 0,
				candidatesChecked : 0,
				elapsedTime: 0
			};
			this.currentLevel = this.patternSizeInfo[pSize];
		}
	};

	this.stopLevel = function() {
		if (this.currentLevel != null) {
			if (this.currentLevel.candidates == this.currentLevel.candidatesChecked &&
				!this.isUnderSteering() &&
				this.currentLevel.candidates > 0) {
				this.currentLevel.status = "complete";
			} else {
				this.currentLevel.status = "started";
			}
			this.currentLevel = null;
		}
	};

	this.isRunning = function() {
		return this.running;
	}

	this.isUnderSteering = function() {
		return this.underSteering;
	};

	this.getSteeringTarget = function() {
		return this.steeringTarget;
	}

	this.getSteeringValue = function() {
		return this.steeringValue;
	}

	this.getTotalCandidatesChecked = function() {
		return this.totalCandidatesChecked;
	}

	this.getProgression = function(patternSize) {
		let res = null;
		if (patternSize) {
			if (this.patternSizeInfo[patternSize])
				res = 100 * this.patternSizeInfo[patternSize].candidatesChecked
							/ this.patternSizeInfo[patternSize].candidates;
		} else {
			if (this.currentLevel != null)
				res = 100 * this.currentLevel.candidatesChecked / this.currentLevel.candidates;
		}
		
		return res;
	}

	this.getOrderedLevels = function() {
		return Object.keys(this.patternSizeInfo).sort();
	}

	this.getTotalPatternNumber = function() {
		let res = 0;
		Object.keys(this.patternSizeInfo).forEach( (d) => {
			res += this.patternSizeInfo[d].patternCount;
		});
		return res;
	}

	this.getTotalElapsedTime = function() {
		let res = 0;
		Object.keys(this.patternSizeInfo).forEach( (d) => {
			res += this.patternSizeInfo[d].elapsedTime;
		});
		return res;
	}

	this.addPattern = function() {
		if (this.currentLevel != null) {
			this.currentLevel.patternCount++;
		}
	}

	this.addGeneratedCandidates = function(nb) {
		if (this.currentLevel != null) {
			this.currentLevel.candidates += nb;
		}
	}

	this.addCheckedCandidates = function(nb) {
		if (this.currentLevel != null) {
			this.currentLevel.candidatesChecked += nb;
			this.totalCandidatesChecked += nb;
		}
	}

	this.updateCheckedCandidates = function(nb) {
		if (this.currentLevel != null) {
			let diff = nb - this.currentLevel.candidatesChecked;
			this.currentLevel.candidatesChecked += diff;
			this.totalCandidatesChecked += diff;
		}
	}

	this.setLevelComplete = function(level) {
		if (this.patternSizeInfo[level]) {
			this.updateCheckedCandidates(this.patternSizeInfo[level].candidates);
		}
		if (this.currentLevel && this.currentLevel.size == level)
			this.stopLevel();
	}

	this.getCurrentLevel = function() {
		return this.currentLevel;
	}

	this.getLevel = function(patternSize) {
		if (this.patternSizeInfo[patternSize])
			return this.patternSizeInfo[patternSize];
		return null;
	}

	this.addTime = function(time) {
		if (this.currentLevel != null) {
			this.currentLevel.elapsedTime += time;
		}
	}

	this.startSteering = function(target, value) {
		this.underSteering = true;
		this.steeringTarget = target;
		if (target == "time") {
			let bounds = value.split(" ");
			let start = new Date(parseInt(bounds[0]));
			let end = new Date(parseInt(bounds[1]));
			this.steeringValue = formatDate(start) + " <-> " + formatDate(end);
		} else {
			this.steeringValue = value;
		}
	}

	this.stopSteering = function() {
		this.underSteering = false;
		this.steeringTarget = null;
		this.steeringValue = null;
	}

	this.getVerboseStatus = function(shortStatus) {
		let result = shortStatus;
		switch(shortStatus) {
			case "complete":
				result = "Completely extracted";
				break;
			case "started":
				result = "Started in a steering";
				break;
			case "active":
				result = "Currently extracting";
				break;
			default:
		}
		return result;
	}

	this.getGlobalStatus = function() {
		return this.globalStatus;
	}

	this.getMaxPatternNumber = function() {
		let maxNbr = 0;

		for (level of Object.keys(this.patternSizeInfo)) {
			if (this.patternSizeInfo[level].patternCount > maxNbr)
				maxNbr = this.patternSizeInfo[level].patternCount;
		}

		return maxNbr;
	}
}

/**
 * Creates a graph displaying the number of patterns discovered each second
 * @param {string} elemId The id of the parent node for the graph
 */
function PatternPerSecondGraph(elemId) {
	let self = this;

	self.parentNode = document.getElementById(elemId);
	self.svg = d3.select(self.parentNode).append("svg")
		.attr("width", "200")
		.attr("height", "100");
	
	self.margin = {top: 10, right: 10, bottom:20, left: 20};
	self.width = +self.svg.attr("width") - self.margin.left - self.margin.right;
	self.height = +self.svg.attr("height") - self.margin.top - self.margin.bottom;	

	self.x = d3.scaleTime().range([0, self.width]);
	self.y = d3.scaleLinear().range([self.height, 0]);
	self.xAxis = d3.axisBottom(self.x)
		.ticks(5);
	self.yAxis = d3.axisLeft(self.y)
		.ticks(5);

	self.area = self.svg.append("g")
		.attr("transform", `translate(${self.margin.left},${self.margin.top})`);
	self.xAxisG = self.svg.append("g")
		.attr("class", "axis axis--x")
		.attr("transform", `translate(${self.margin.left},${self.height + self.margin.top})`)
		.call(self.xAxis);
	self.yAxisG = self.svg.append("g")
		.attr("class", "axis axis--y")
		.attr("transform", `translate(${self.margin.left},${self.margin.top})`)
		.call(self.yAxis);
	
	self.line = d3.line()
		.x( (d) => self.x(d.date) )
		.y( (d) => self.y(d.delta) );
	self.path = self.area.append("path");

	self.data = [];
	self.lastMinutesData = [];

	self.timeDisplayed = 60*1000;

	self.draw = function() {
		self.x.domain(d3.extent(self.lastMinutesData, (d) => d.date ));
		self.y.domain(d3.extent(self.data, (d) => d.delta ));
		
		self.xAxisG.call(self.xAxis);
		self.yAxisG.call(self.yAxis);

		self.path.datum(self.lastMinutesData)
			.attr("fill", "none")
			.attr("stroke", "steelblue")
			.attr("stroke-linejoin", "round")
			.attr("stroke-linecap", "round")
			.attr("stroke-width", 1.5)
			.attr("d", self.line);
	}

	self.getLastData = function() {
		if (self.lastMinutesData.length > 0)
			return self.lastMinutesData[self.lastMinutesData.length-1];
		else
			return null;
	}

	self.addData = function(newData) {
		if (self.lastMinutesData.length > 0) {
			let lastDataTime = self.lastMinutesData[self.lastMinutesData.length - 1].date;
			while(self.lastMinutesData.length > 0) {
				if (lastDataTime - self.timeDisplayed > self.lastMinutesData[0].date) {
					self.lastMinutesData.shift();
				} else {
					break;
				}
			}
		}
		self.data.push(newData);
		self.lastMinutesData.push(newData);
	}

	self.reset = function() {
		self.data = [];
		self.lastMinutesData = [];
		self.draw();
	}
}

/**
 * Creates a graph displaying the number of candidates checked each second
 * @param {string} elemId The id of the parent node for the graph
 */
function CandidatesCheckedPerSecondGraph(elemId) {
	let self = this;

	self.parentNode = document.getElementById(elemId);
	self.svg = d3.select(self.parentNode).append("svg")
		.attr("width", "200")
		.attr("height", "100");
	
	self.margin = {top: 10, right: 10, bottom:20, left: 20};
	self.width = +self.svg.attr("width") - self.margin.left - self.margin.right;
	self.height = +self.svg.attr("height") - self.margin.top - self.margin.bottom;	

	self.x = d3.scaleTime().range([0, self.width]);
	self.y = d3.scaleLinear().range([self.height, 0]);
	self.xAxis = d3.axisBottom(self.x)
		.ticks(5);
	self.yAxis = d3.axisLeft(self.y)
		.ticks(5);

	self.area = self.svg.append("g")
		.attr("transform", `translate(${self.margin.left},${self.margin.top})`);
	self.xAxisG = self.svg.append("g")
		.attr("class", "axis axis--x")
		.attr("transform", `translate(${self.margin.left},${self.height + self.margin.top})`)
		.call(self.xAxis);
	self.yAxisG = self.svg.append("g")
		.attr("class", "axis axis--y")
		.attr("transform", `translate(${self.margin.left},${self.margin.top})`)
		.call(self.yAxis);
	
	self.line = d3.line()
		.x( (d) => self.x(d.date) )
		.y( (d) => self.y(d.delta) );
	self.path = self.area.append("path");

	self.data = [];
	self.lastMinutesData = [];

	self.timeDisplayed = 60*1000;

	self.draw = function() {
		self.x.domain(d3.extent(self.lastMinutesData, (d) => d.date ));
		self.y.domain(d3.extent(self.data, (d) => d.delta ));
		
		self.xAxisG.call(self.xAxis);
		self.yAxisG.call(self.yAxis);

		self.path.datum(self.lastMinutesData)
			.attr("fill", "none")
			.attr("stroke", "steelblue")
			.attr("stroke-linejoin", "round")
			.attr("stroke-linecap", "round")
			.attr("stroke-width", 1.5)
			.attr("d", self.line);
	}

	self.getLastData = function() {
		if (self.lastMinutesData.length > 0)
			return self.lastMinutesData[self.lastMinutesData.length-1];
		else
			return null;
	}

	self.addData = function(newData) {
		if (self.lastMinutesData.length > 0) {
			let lastDataTime = self.lastMinutesData[self.lastMinutesData.length - 1].date;
			while(self.lastMinutesData.length > 0) {
				if (lastDataTime - self.timeDisplayed > self.lastMinutesData[0].date) {
					self.lastMinutesData.shift();
				} else {
					break;
				}
			}
		}
		self.data.push(newData);
		self.lastMinutesData.push(newData);
	}

	self.reset = function() {
		self.data = [];
		self.lastMinutesData = [];
		self.draw();
	}
}

/**
 * Creates an history of actions
 * @param {string} elemId The id of the parent node for the history's display
 */
function ActivityHistory(elemId) {
	this.parent = d3.select("#"+elemId);
	this.events = [];
	this.timeFormat = d3.timeFormat("%H:%M:%S");
	this.indentLevel = 0;

	// Item management

	this.createItem = function(title, date) {
		let item = d3.select(document.createElement("div"))
			.classed("historyItem", true)
			.style("margin-left", `${this.indentLevel * 10}px`);
		item.append("p")
			.classed("historyTitle", true)
			.text(title);
		item.append("p")
			.classed("historyTimestamp", true)
			.text(date.toString());
		return item;
	}

	this.createContent = function(item) {
		let content = item.append("div")
			.classed("historyContent hidden", true);
		item.append("p")
    		.text("Show details")
			.classed("clickable clickableText smallText historyShowMore", true)
			.on("click", function() {
				if (content.classed("hidden")) {
					this.textContent = "Hide details";
					content.classed("hidden", false);
				} else {
					this.textContent = "Show details";
					content.classed("hidden", true);
				}
			});
		return content;
	}

	this.displayItem = function(item) {
		let parentNode = this.parent.node();
		parentNode.insertBefore(item.node(), parentNode.firstChild);
	}

	// Entry points
    this.publishEvent = function (event) {
        if (event.time === undefined) {
            event.time = new Date();
        }
		this.events.push(event);
		this.drawEvent(event);
    }

    this.serverMessage = function (message, title) {
        this.publishEvent({ action: "servermessage",
                            properties: {
                                message: message,
                                title: title
                            }});
    }

	this.resetDataset = function() {
        this.publishEvent({ action: "resetDataset",
			                properties: {} });
	}

	this.receiveDataset = function(datasetName) {
        this.publishEvent({ action: "receiveDataset",
			                properties: {
				                name: datasetName
			                }
                          });
	}

	this.createEventType = function(typeName, parent, removedTypes) {
        this.publishEvent({ action: "createEventType",
			                properties: {
				                name: typeName,
				                parent: parent,
				                removedTypes: removedTypes
			                }
		                  });
	}

	this.removeEventTypes = function(typeNames) {
		this.publishEvent({ action: "removeEventTypes",
			                properties: {
				                names: typeNames
			                }
		                  });
	}

	this.removeUsers = function(userNames) {
		this.publishEvent({ action: "removeUsers",
			                properties: {
				                names: userNames
			                }
		                  });
	}

	this.changeParameters = function(support, minGap, maxGap, duration, size, modifiedValues) {
        this.publishEvent({ action: "changeParameters",
			                properties: {
				                support: support,
				                minGap: minGap,
				                maxGap: maxGap,
				                duration: duration,
				                size: size,
				                modifiedValues: modifiedValues
			                }
		                  });
	}

	this.startAlgorithm = function(support, minGap, maxGap, duration, size) {
        this.publishEvent({ action: "startAlgorithm",
			                properties: {
				                support: support,
				                minGap: minGap,
				                maxGap: maxGap,
				                duration: duration,
				                size: size
			                }
		                  });
	}

	this.endAlgorithm = function(patternsFound, timeElapsed, hasCompleted=true) {
        this.publishEvent({ action: "endAlgorithm",
			                properties: {
				                patterns: patternsFound,
				                time: timeElapsed,
				                completed: hasCompleted
			                }
		                  });
	}

	this.steerOnPrefix = function(patternId) {
        this.publishEvent({ action: "steerOnPrefix",
			                properties: {
				                patternId: patternId,
				                patternString: patternsInformation[patternId][0]
			                }
		                  });
	}

	this.steerOnUser = function(userId) {
        this.publishEvent({ action: "steerOnUser",
			                properties: {
				                userId: userId,
				                name: userInformations[userId].name
			                }
		                  });
	}

	this.steerOnTime = function(start, end) {
        this.publishEvent({ action: "steerOnTime",
			                properties: {
				                start: start,
				                end: end
			                }
		                  });
	}

	this.stopSteering = function(patternsFoundList) {
        this.publishEvent({ action: "stopSteering",
			                properties: {
				                patternsFound: patternsFoundList.length
			                }
		                  });
	}

	this.drawEvent = function(event) {
		let item, content;

		switch(event.action) {
			case "resetDataset":
				item = this.createItem("Reset the dataset", this.timeFormat(event.time));
				this.displayItem(item);
				break;
			case "receiveDataset":
				item = this.createItem("Dataset "+event.properties.name+" received", this.timeFormat(event.time));
				this.displayItem(item);
				break;
			case "createEventType":
				item = this.createItem("Event type created: "+event.properties.name, this.timeFormat(event.time));
				content = this.createContent(item);
				content.append("p")
					.text("From the occurrences of '"+event.properties.parent+"'");
				if (event.properties.removedTypes.length > 0) {
					content.append("p")
						.text("Other events from the following types have been removed:");
					let removedTypesDiv = content.append("div");
					event.properties.removedTypes.forEach( type => {
						removedTypesDiv.append("p")
							.text(type);
					});
				}
				this.displayItem(item);
				break;
			case "removeEventTypes":
				item = this.createItem(event.properties.names.length + " event types removed", this.timeFormat(event.time));
				content = this.createContent(item);
				content.append("p")
					.text(event.properties.names.join(", "));
				this.displayItem(item);
				break;
			case "removeUsers":
				item = this.createItem(event.properties.names.length + " users removed", this.timeFormat(event.time));
				content = this.createContent(item);
				content.append("p")
					.text(event.properties.names.join(", "));
				this.displayItem(item);
				break;
			case "changeParameters":
				item = this.createItem("Parameters changed",this.timeFormat(event.time));
				content = this.createContent(item);
				content.append("p")
					.text("Parameters (modified values in bold):");
				let newParametersDiv = content.append("div");
				newParametersDiv.append("p")
					.text("Min. support: " + event.properties.support)
					.classed("bold", event.properties.modifiedValues.support);
				newParametersDiv.append("p")
					.text("Gap: " + event.properties.minGap + " - " + event.properties.maxGap)
					.classed("bold", event.properties.modifiedValues.minGap || event.properties.modifiedValues.maxGap);
				newParametersDiv.append("p")
					.text("Max. duration: " + event.properties.duration + "ms")
					.classed("bold", event.properties.modifiedValues.duration);
				newParametersDiv.append("p")
					.text("Max. size: " + event.properties.size)
					.classed("bold", event.properties.modifiedValues.size);
				this.displayItem(item);
				break;
			case "startAlgorithm":
				item = this.createItem("Algorithm started",this.timeFormat(event.time))
					.classed("emphasizedItem", true);
				content = this.createContent(item);
				content.append("p")
					.text("Parameters:");
				let parametersDiv = content.append("div");
				parametersDiv.append("p")
					.text("Min. support: " + event.properties.support);
				parametersDiv.append("p")
					.text("Gap: " + event.properties.minGap + " - " + event.properties.maxGap);
				parametersDiv.append("p")
					.text("Max. duration: " + event.properties.duration + "ms");
				parametersDiv.append("p")
					.text("Max. size: " + event.properties.size);
				this.displayItem(item);
				this.indentLevel++;
				break;
			case "endAlgorithm":
				this.indentLevel--;
				item = this.createItem(event.properties.completed ? "Algorithm completed" : "Algorithm interrupted", this.timeFormat(event.time))
					.classed("emphasizedItem", true);
				content = this.createContent(item);
				content.append("p")
					.text(event.properties.patterns + " patterns found over " + event.properties.time + "ms");
				this.displayItem(item);
				break;
			case "steerOnPrefix":
				item = this.createItem(`Steering on prefix ${event.properties.patternString}`, this.timeFormat(event.time));
				this.displayItem(item);
				break;
			case "steerOnUser":
				item = this.createItem(`Steering on user ${event.properties.name}`, this.timeFormat(event.time));
				this.displayItem(item);
				break;
			case "steerOnTime":
				let bounds = [formatDate(new Date(event.properties.start)), formatDate(new Date(event.properties.end))]
				item = this.createItem(`Steering on time beetween ${bounds[0]} and ${bounds[1]}`, this.timeFormat(event.time));
				this.displayItem(item);
				break;
			case "stopSteering":
				item = this.createItem("Steering end", this.timeFormat(event.time));
				content = this.createContent(item);
				content.append("p")
					.text(event.properties.patternsFound + " patterns found during this steering");
				this.displayItem(item);
    			break;
            case "servermessage":
				item = this.createItem(`Server message ${event.properties.title || ""}`, this.timeFormat(event.time));
				content = this.createContent(item);
				content.append("p").text(event.properties.message);
				this.displayItem(item);
    			break;
			default:
				console.log("Trying to display an unknown action in the history: "+event);
				item = this.createItem(`Unknown action ${event.action}`, this.timeFormat(event.time));
				content = this.createContent(item);
     			content.append("p").text(event);
				this.displayItem(item);
				break;
		}
	}

	this.resetHistory = function() {
		this.events = [];
		this.indentLevel = 0;
	}

	this.redrawHistory = function() {
		this.parent.html("");
		this.indentLevel = 0;
		this.events.forEach( event => this.drawEvent(event) );
	}
}




var Timeline = function(elemId, options) {
	var self = this;
	
	self.parentNode = document.getElementById(elemId);
	self.nodeFocusControl = document.getElementById('tl_focusControl');
	self.nodeOverview = document.getElementById('tl_overview');
	self.nodeFocus = document.getElementById('tl_focus');
	self.nodeUsers = document.getElementById('tl_users');
	self.nodeSelectedUsers = document.getElementById('tl_selectedUsers');
	
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
		self.patterns.select(".axis--x")
			.call(self.xAxisFocus);
		self.users.select(".axis--x")
			.call(self.xAxisUsers);
		
		if (dataDimensions.time) {
			updateCurrentTimeFilter(self.xFocus.domain()[0].getTime(), self.xFocus.domain()[1].getTime()+1);
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
		
		self.drawContextBins();
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
		self.patterns.select(".axis--x")
			.call(self.xAxisFocus);
		self.users.select(".axis--x")
			.call(self.xAxisUsers);

		if (dataDimensions.time) {
			updateCurrentTimeFilter(self.xFocus.domain()[0].getTime(), self.xFocus.domain()[1].getTime()+1);
			dataDimensions.time.filterRange(currentTimeFilter);
		}
		/*self.focus.selectAll(".dot")
			.attr("transform",function(d) {return "translate("+self.xFocus(d.time)+","+self.yFocus(d.height)+")"});*/
		//self.drawCurrentBins();
		self.displayData();
		self.context.select(".brush")
			.call(self.brush.move, self.xUsers.range().map(t.invertX, t));
		self.zoomRect.property("__zoom", t);  // Manually save the transform to clear the saved old transform
		
		self.drawContextBins();
	};
	
	self.drawUsersPatterns = function() {
		//console.log("Starting to draw users patterns");
		let nextColor = 1;
		
		self.canvasUsersContext.clearRect(0,0,self.canvasUsers.attr("width"),self.canvasUsers.attr("height"));
		
		self.hiddenCanvasUsersContext.fillStyle = "#fff";
		self.hiddenCanvasUsersContext.rect(0,0,self.hiddenCanvasUsers.attr("width"),self.hiddenCanvasUsers.attr("height"));
		self.hiddenCanvasUsersContext.fill();
		
		//let userNames = Object.keys(userSessions);
		
		let shownUsers = [];
		
		switch(showUserSessionOption) {
		case "all":
			shownUsers = userList;
			break;
		case "selected":
			let hl = highlightedUsers;
			hl.sort(function(a, b) {
				let aIdx = userList.findIndex(function(elt) {
					return elt == a;
				});
				let bIdx = userList.findIndex(function(elt) {
					return elt == b;
				});
				return aIdx-bIdx;
			});
			shownUsers = hl;
			break;
		case "some":
			shownUsers = userList.slice(firstUserShown, firstUserShown + nbUserShown);
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

			// Draw a band in the background if the user is selected
			if (showUserSessionOption != "selected" && highlightedUsers.includes(userName)) {
				console.log(userName);
				let x1 = self.xUsers(self.xUsers.domain()[0]);
				let x2 = self.xUsers(self.xUsers.domain()[1]);
				let y = self.yUsers(userName) + self.yUsers.bandwidth()/2;
				self.canvasUsersContext.beginPath();
				self.canvasUsersContext.strokeStyle = "lightgrey";
				self.canvasUsersContext.lineWidth = Math.floor(self.yUsers.bandwidth());
				self.canvasUsersContext.moveTo(x1,y);
				self.canvasUsersContext.lineTo(x2,y);
				self.canvasUsersContext.lineCap = "butt";
				self.canvasUsersContext.stroke();
			}
			
			userSessions[userName].forEach(function(ses, sesIdx) {
				let color = sessionColor;
				if (hasSelected == true) {
					color = sessionColorFaded; // lighter blue
					Object.keys(ses.count).forEach(function(id, idx) {
						if (selectedPatternIds.includes(Number(id))) {
							//console.log(id+" selected");
							color = sessionColorHighlighted;
						}
					});
				}
				
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
			});
		}
		
		// Draw the event symbols if needed
		if (drawEvents == true) {
			dataDimensions.time.bottom(Infinity).forEach( function(evt) {
				// Only draw if the user is displayed
				if (shownUsers.includes(evt.user)) {
					let time = new Date(evt.start);
					// Don't draw if the event is not highlighted and we only want the highlighted ones
					if (drawOnlyHighlightedEvents == true) {
						if (getCurrentEventColor(evt.type, evt.user) == colorList[evt.type][1]) {
							return;
						}
					}
					
					let x = self.xUsers(time);				
					let y = self.yUsers(evt.user) + self.yUsers.bandwidth()/2;
					
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
					
					let trueX = x - self.canvasUsersContext.measureText(itemShapes[evt.type]).width/2;
					let symbolColor = getCurrentEventColor(evt.type, evt.user).toString();
					let symbolSize = Math.min(self.yUsers.bandwidth() * 0.8, 18);
					
					self.canvasUsersContext.font = "bold "+symbolSize+"px Geneva";
					self.canvasUsersContext.fillStyle = symbolColor;
					self.canvasUsersContext.textBaseline="middle";
					self.canvasUsersContext.fillText(itemShapes[evt.type], trueX, y);
					/*
					self.hiddenCanvasUsersContext.font = "bold "+symbolSize+"px Geneva";
					self.hiddenCanvasUsersContext.fillStyle = "rgb("+color.join(',')+")";
					self.hiddenCanvasUsersContext.textBaseline="middle";
					self.hiddenCanvasUsersContext.fillText(itemShapes[info[0]], trueX, y);
					*/
				}
			});
		}
		
		//console.log("User traces drawn");
	}
	
	self.drawPatternOccurrences = function() {
		
		//console.log("Starting to draw pattern occurrences");
		let idsToDraw = selectedPatternIds;
		
		//console.log("patterns to draw: "+listOfPatternsToDraw);
		
		let step = self.marginPatterns.size / (idsToDraw.length + 1.0);
		let range = [];
		for (let i = 0; i< idsToDraw.length + 2; i++)
			range.push(i*step);
		
		
		self.yPatterns = d3.scaleOrdinal()
			//.domain([""].concat(idsToDraw).concat([""]))
			.domain([""].concat(idsToDraw))
			.range(range);
	
		self.yAxisPatterns = d3.axisLeft(self.yPatterns)
	        .tickValues(self.yPatterns.domain());
		self.patterns.select("#focusRightAxis").call(self.yAxisPatterns);
		
		// Hide the axis if there is no selected pattern
		if (idsToDraw.length == 0) {
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
		
		// Displays all occurrences of a pattern on a line
		for (let i = 0; i < idsToDraw.length; i++) {// Draw each pattern
			for (let j=0; j < patternOccurrences[idsToDraw[i]].length; j++) {// Draw each occurrence
				console.log("Ids to draw: "+idsToDraw);
				if (patternOccurrences[idsToDraw[i]][j]) {
					let occ = patternOccurrences[idsToDraw[i]][j].split(";");
					// Only draw the occurrence if it belongs to a selected user
					// To uncomment when "only show highlighted" will impact the bin view
					//if (highlightedUsers.length == 0 || highlightedUsers.includes(occ[0])) {
						let x1 = self.xFocus(new Date(occ[1]));
						let x2 = self.xFocus(new Date(occ[occ.length-1])); // Last timestamp in the occurrence
						let y = self.yPatterns(idsToDraw[i]);
						self.canvasPatternDistinctContext.beginPath();
						if (x1 == x2) {
							self.canvasPatternDistinctContext.fillStyle = "black";
							self.canvasPatternDistinctContext.arc(x1,y,1.5,0,2*Math.PI, false);
							self.canvasPatternDistinctContext.fill();
							//self.canvasPatternDistinctContext.closePath();
						} else {
							self.canvasPatternDistinctContext.lineWidth = 3;
							self.canvasPatternDistinctContext.moveTo(x1,y);
							self.canvasPatternDistinctContext.lineTo(x2,y);
							self.canvasPatternDistinctContext.lineCap = "round";
							self.canvasPatternDistinctContext.stroke();
							//self.canvasPatternDistinctContext.closePath();
						}
					//}
				}
			}
		}

		if (self.displayMode == "events") {
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
							let x1 = self.xFocus(new Date(occ[1]));
							let y1 = self.yFocus(patternItems[0]) + self.yFocus.bandwidth()/2;
							self.canvasPatternContext.moveTo(x1,y1);
							for (let evtIdx=2; evtIdx < occ.length; evtIdx++) { // for each event inside the occurrence
								let x2 = self.xFocus(new Date(occ[evtIdx]));
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
		}
	}
	
	self.displayColorsInBins = false;
	self.displayFullHeightBins = false;
	
	self.drawBins = function() {
		let bins = eventBins[self.distributionScale];
		console.log("drawing new bins");

		var maxHeight = 0.0;
		
		// Adjust the y axis to the max height
		if (self.displayFullHeightBins == true) 
			maxHeight = 100.0;
		else {
			bins.data.all().forEach(function(bin) {
				if (bin.value.eventCount > maxHeight)
					maxHeight = bin.value.eventCount;
			});
		}
		
		self.yFocus.domain([0.0, maxHeight/*+1.0*/]);
		self.focus.select(".axis--y")
		  .call(self.yAxisFocus);
		
		self.colorToData = {};
		let nextColor = 1;
		
		if (!self.displayColorsInBins) {
			bins.data.all().forEach(function(bin) {
				self.canvasContext.beginPath();
				let binStart = bins.getStart(bin.value.aDateInside);
				let binEnd = bins.getEnd(bin.value.aDateInside);
				let x = Math.round(self.xFocus(d3.timeParse('%Y-%m-%dT%H:%M:%S')(binStart)));
				let x2 = Math.round(self.xFocus(d3.timeParse('%Y-%m-%dT%H:%M:%S')(binEnd)));
				
				y = Math.round(self.yFocus(maxHeight-bin.value.eventCount));
				binHeight = Math.round(self.yFocus(bin.value.eventCount));
				self.canvasContext.fillStyle = "#a6a7a8";
				self.canvasContext.fillRect(x, binHeight, x2-x, y);
				/*self.canvasContext.lineWidth = 0.25;
				self.canvasContext.strokeStyle = "black";
				self.canvasContext.stroke();*/
				//  self.canvasContext.fillRect(x, binHeight, x2-x, y);
				//self.canvasContext.closePath();
				
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
				let splitEventTypes = Object.keys(bin.value.events).filter( (d) => {
					return bin.value.events[d]>0;
				});
				splitEventTypes.forEach(function(et) {
					eventTypesColors.push(et+":"+getEventColor(et));
				});
				
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
				subBinInfo.push(binStart.split("-")[0]); // year
				subBinInfo.push(binStart);
				subBinInfo.push(binEnd);
				subBinInfo.push(bin.value.eventCount);
				subBinInfo.push(Object.keys(bin.value.users).filter((d)=>{return bin.value.users[d]>0;}).join(";"));
				subBinInfo.push(splitEventTypes.join(";"));
				let nbOccsPerType = [];
				splitEventTypes.forEach(function(et) {
					nbOccsPerType.push(et+":"+bin.value.events[et]);
				});
				subBinInfo.push(nbOccsPerType.join(";"));
				subBinInfo.push(bin.value.eventCount);
				subBinInfo.push(eventTypesColors.join(';'));
				self.colorToData["rgb("+color.join(',')+")"] = subBinInfo;
				
				// Drawing on the hidden canvas for the tooltip
				self.hiddenCanvasContext.beginPath();
				self.hiddenCanvasContext.fillStyle = "rgb("+color.join(',')+")";//node.attr("fillStyle");
				self.hiddenCanvasContext.fillRect(x, binHeight, x2-x, y);
				self.hiddenCanvasContext.closePath();
			});
		}

		let drawColoredBins = self.displayColorsInBins;
		if (highlightedEventTypes.length > 0 && !self.displayColorsInBins) {
			dataDimensions.type.filterFunction( function(t) {
				return highlightedEventTypes.includes(t);
			});
			drawColoredBins = true;
		}

		bins.data.all().forEach(function(bin) {
			self.canvasContext.beginPath();
			let binStart = bins.getStart(bin.value.aDateInside);
			let binEnd = bins.getEnd(bin.value.aDateInside);
		    let x = self.xFocus(d3.timeParse('%Y-%m-%dT%H:%M:%S')(binStart));
			let x2 = self.xFocus(d3.timeParse('%Y-%m-%dT%H:%M:%S')(binEnd));

			if (drawColoredBins) {
				/*
				 * Deduce the decomposition in multiple bars from bins[iBin]
				 * Structure : [year,start,end,nbEvents,user1;user2;...,???,type1:nbOcc;type2:nbOcc;...]
				 */
				let colorsProportion = {}; // nbOccs for each color
				let eventTypesAssociatedToColor = {}; // nbOccs per event for each color
				
				Object.keys(bin.value.events).filter((d)=>{return bin.value.events[d]>0;}).forEach(function(et) {
					// TODO fix the agavue situation --> Still needed ?
					let eColor = getCurrentEventColor(et).toString();
					if (!colorsProportion[eColor]) {
						colorsProportion[eColor] = bin.value.events[et];
						eventTypesAssociatedToColor[eColor] = [];
					} else {
						colorsProportion[eColor] += bin.value.events[et];
					}
					eventTypesAssociatedToColor[eColor].push(et);
				});
	
				let evtNbr = bin.value.eventCount;
				let colorsFound = Object.keys(colorsProportion);
				
				colorsFound.sort(function(a,b) {
					return colorsProportion[a] - colorsProportion[b];
				});
				
				// draw each of the coloured sections of the bar
				let cumulatedHeight = 0;
				let y;
				let binHeight;
				
				colorsFound.forEach(function(color) {
					let y = 0;
					let binHeight = 0;
	
					if (self.displayFullHeightBins == true) {
						y = self.yFocus(maxHeight - (colorsProportion[color] * maxHeight) / bin.value.eventCount);
						binHeight = self.yFocus(cumulatedHeight + (colorsProportion[color] * maxHeight) / bin.value.eventCount);
					} else {
						y = self.yFocus(maxHeight-colorsProportion[color]);
						binHeight = self.yFocus(cumulatedHeight + colorsProportion[color]);
					}
					
					self.canvasContext.fillStyle = color.toString();
					self.canvasContext.fillRect(x, binHeight, x2-x, y);
					/*self.canvasContext.lineWidth = 0.25;
					self.canvasContext.strokeStyle = "black";
					self.canvasContext.stroke();*/
					//  self.canvasContext.fillRect(x, binHeight, x2-x, y);
					//self.canvasContext.closePath();
					
					// Attributing a color to data link for the hidden canvas
					let hiddenColor = [];
					// via http://stackoverflow.com/a/15804183
					if(nextColor < 16777215){
						hiddenColor.push(nextColor & 0xff); // R
						hiddenColor.push((nextColor & 0xff00) >> 8); // G 
						hiddenColor.push((nextColor & 0xff0000) >> 16); // B
	
						nextColor += 1;
					} else {
						console.log('Warning : too many colors needed for the main hidden canvas');
					}
					
					let eventTypesColors = [];
					
					let splitEventTypes = Object.keys(bin.value.events).filter((d)=>{return bin.value.events[d]>0;});
					splitEventTypes.forEach(function(et) {
						eventTypesColors.push(et+":"+getEventColor(et));
					});
					
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
					subBinInfo.push(binStart.split("-")[0]); // year
					subBinInfo.push(binStart);
					subBinInfo.push(binEnd);
					subBinInfo.push(bin.value.eventCount);
					subBinInfo.push(Object.keys(bin.value.users).filter((d)=>{return bin.value.users[d]>0;}).join(";"));
					subBinInfo.push(splitEventTypes.join(";"));
					let nbOccsPerType = [];
					eventTypesAssociatedToColor[color].forEach(function(et) {
						nbOccsPerType.push(et+":"+bin.value.events[et]);
					});
					subBinInfo.push(nbOccsPerType.join(';'));
					subBinInfo.push(colorsProportion[color]);
					subBinInfo.push(eventTypesColors.join(';'));
					self.colorToData["rgb("+hiddenColor.join(',')+")"] = subBinInfo;
					
					// Drawing on the hidden canvas for the tooltip
					self.hiddenCanvasContext.beginPath();
					self.hiddenCanvasContext.fillStyle = "rgb("+hiddenColor.join(',')+")";//node.attr("fillStyle");
					self.hiddenCanvasContext.fillRect(x, binHeight, x2-x, y);
					self.hiddenCanvasContext.closePath();
					
					if (self.displayFullHeightBins == true) {
						cumulatedHeight += (colorsProportion[color] * maxHeight) / bin.value.eventCount;
					} else {
						cumulatedHeight += colorsProportion[color];
					}
				});
			}
		});

		dataDimensions.type.filterAll();

		self.drawContextBins();
		
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
		self.canvasOverviewContext.fillStyle = "#04B7FB";
		self.canvasOverviewContext.strokeStyle = "#04B7FB";
		self.canvasOverviewContext.fill();*/
	};
	
	self.drawCurrentBins = function() {
		self.drawBins();
	};
	
	self.binTransformed = false;

	self.drawContextBins = function() {
		// Avoid drawing if there is no events or distribution scale
		if (!self.distributionScale || !eventBins[self.distributionScale].data) {
			console.log("Not drawing context bins, it would fail anyway");
			if (self.distributionScale)
				console.log("Distribution scale: "+self.distributionScale);
			return;
		}
		let bins = eventBins[self.distributionScale];

		let maxBin = 0;

		bins.data.all().forEach(function(bin) {
			if (bin.value.eventCount > maxBin)
				maxBin = bin.value.eventCount;
		});

		self.canvasOverviewContext.fillStyle = "#fff";
		self.canvasOverviewContext.rect(0,0,self.canvasOverview.attr("width"),self.canvasOverview.attr("height"));
		self.canvasOverviewContext.fill();

		self.yContext.domain([0.0, maxBin+1.0]);
		
		let brushStartTime = self.xFocus.domain()[0];
		let brushEndTime = self.xFocus.domain()[1];

		let fillStyle = {
			underBrush: "#04B7FB",
			outOfBrush: "lightgrey"
		};
		
		bins.data.all().forEach(function(bin) {
			self.canvasOverviewContext.beginPath();
			let binStartTime = d3.timeParse('%Y-%m-%dT%H:%M:%S')(bins.getStart(bin.value.aDateInside));
			let binEndTime = d3.timeParse('%Y-%m-%dT%H:%M:%S')(bins.getEnd(bin.value.aDateInside));
		    let x = Math.round(self.xContext(binStartTime));
			let x2 = Math.round(self.xContext(binEndTime));
			let y = Math.round(self.yContext(maxBin-bin.value.eventCount));
			
			binHeight = Math.round(self.yContext(bin.value.eventCount));

			// Draw the full bin outside of the brush
			if (binEndTime < brushStartTime || binStartTime > brushEndTime) {
				self.canvasOverviewContext.fillStyle = fillStyle.outOfBrush;
				self.canvasOverviewContext.fillRect(x, binHeight, x2-x, y);
			} else 
			// Draw the full bin under the brush
			if (binStartTime >= brushStartTime && binEndTime <= brushEndTime) {
				self.canvasOverviewContext.fillStyle = fillStyle.underBrush;
				self.canvasOverviewContext.fillRect(x, binHeight, x2-x, y);
			} else
			// The brush start is over the bin
			if (binStartTime < brushStartTime && binEndTime < brushEndTime) {
				let xBrushStart = Math.round(self.xContext(brushStartTime));
				self.canvasOverviewContext.fillStyle = fillStyle.outOfBrush;
				self.canvasOverviewContext.fillRect(x, binHeight, xBrushStart-x, y);
				self.canvasOverviewContext.fillStyle = fillStyle.underBrush;
				self.canvasOverviewContext.fillRect(xBrushStart, binHeight, x2-xBrushStart, y);
			} else
			// The brush end is over the bin
			if (binStartTime > brushStartTime && binEndTime > brushEndTime) {
				let xBrushEnd = Math.round(self.xContext(brushEndTime));
				self.canvasOverviewContext.fillStyle = fillStyle.underBrush;
				self.canvasOverviewContext.fillRect(x, binHeight, xBrushEnd-x, y);
				self.canvasOverviewContext.fillStyle = fillStyle.outOfBrush;
				self.canvasOverviewContext.fillRect(xBrushEnd, binHeight, x2-xBrushEnd, y);
			} else {// The bin is over the brush
				let xBrushStart = Math.round(self.xContext(brushStartTime));
				self.canvasOverviewContext.fillStyle = fillStyle.outOfBrush;
				self.canvasOverviewContext.fillRect(x, binHeight, xBrushStart-x, y);

				let xBrushEnd = Math.round(self.xContext(brushEndTime));
				self.canvasOverviewContext.fillStyle = fillStyle.underBrush;
				self.canvasOverviewContext.fillRect(xBrushStart, binHeight, xBrushEnd-xBrushStart, y);

				self.canvasOverviewContext.fillStyle = fillStyle.outOfBrush;
				self.canvasOverviewContext.fillRect(xBrushEnd, binHeight, x2-xBrushEnd, y);
			}
		});
	};

	self.drawContextBinsOld = function(bins) {
		let maxBin = 0;
		for (let iBin=0; iBin < bins.length; iBin++) {
			if (parseInt(bins[iBin][3]) > maxBin)
				maxBin = parseFloat(bins[iBin][3]);
		}

		self.canvasOverviewContext.fillStyle = "#fff";
		self.canvasOverviewContext.rect(0,0,self.canvasOverview.attr("width"),self.canvasOverview.attr("height"));
		self.canvasOverviewContext.fill();

		self.yContext.domain([0.0, maxBin+1.0]);
		
		let area = d3.area()
		    .x(function(d) { return d[0]; })
		    .y0(self.heightContext)
		    .y1(function(d) { return d[1]; })
		    .context(self.canvasOverviewContext);
		
		let dataBeforeBrush = [];
		let dataUnderBrush = [];
		let dataAfterBrush = [];
		
		for (let iBin=0; iBin < bins.length; iBin++) {			
			let thisData = [];
			
			let beforeBrushStart = false;
			let beforeBrushEnd = false;

			let brushStartTime = self.xFocus.domain()[0];
			let brushEndTime = self.xFocus.domain()[1];

			let binStartTime = d3.timeParse('%Y-%m-%d %H:%M:%S')(bins[iBin][1]);
			let binValue = parseInt(bins[iBin][3]);
			thisData.push(self.xContext(binStartTime));
			thisData.push(self.yContext(binValue));
			if (binStartTime < brushStartTime) {
				dataBeforeBrush.push(thisData);
				beforeBrushStart = true;
			} else if (binStartTime > brushEndTime)
				dataAfterBrush.push(thisData);
			else {
				dataUnderBrush.push(thisData);
				beforeBrushEnd = true;
			}
			
			let binEndTime = d3.timeParse('%Y-%m-%d %H:%M:%S')(bins[iBin][2]);
			thisData = [];
			
			thisData.push(self.xContext(binEndTime));
			thisData.push(self.yContext(binValue));

			if (binEndTime < brushStartTime)
				dataBeforeBrush.push(thisData);
			else if (binEndTime > brushEndTime) {
				if (beforeBrushEnd) {
					let brushEndData = [];
					brushEndData.push(self.xContext(brushEndTime));
					brushEndData.push(self.yContext(binValue));
					dataUnderBrush.push(brushEndData);
					dataAfterBrush.push(brushEndData);
				} else if (beforeBrushStart) {
					let brushStartData = [];
					brushStartData.push(self.xContext(brushStartTime));
					brushStartData.push(self.yContext(binValue));
					let brushEndData = [];
					brushEndData.push(self.xContext(brushEndTime));
					brushEndData.push(self.yContext(binValue));
					dataBeforeBrush.push(brushStartData);
					dataUnderBrush.push(brushStartData);
					dataUnderBrush.push(brushEndData);
					dataAfterBrush.push(brushEndData);
				}
				dataAfterBrush.push(thisData);
			} else {
				if (beforeBrushStart) {
					let brushStartData = [];
					brushStartData.push(self.xContext(brushStartTime));
					brushStartData.push(self.yContext(binValue));
					dataBeforeBrush.push(brushStartData);
					dataUnderBrush.push(brushStartData);
				}
				dataUnderBrush.push(thisData);
			}
		}
		
		self.canvasOverviewContext.beginPath();
		area(dataBeforeBrush);
		self.canvasOverviewContext.fillStyle = "lightgrey";//"#04B7FB";
		self.canvasOverviewContext.strokeStyle = "lightgrey";
		self.canvasOverviewContext.fill();
		self.canvasOverviewContext.beginPath();
		area(dataUnderBrush);
		self.canvasOverviewContext.fillStyle = "#04B7FB";
		self.canvasOverviewContext.strokeStyle = "#04B7FB";
		self.canvasOverviewContext.fill();
		self.canvasOverviewContext.beginPath();
		area(dataAfterBrush);
		self.canvasOverviewContext.fillStyle = "lightgrey";//"#04B7FB";
		self.canvasOverviewContext.strokeStyle = "lightgrey";
		self.canvasOverviewContext.fill();
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
		self.patterns.select(".axis--x")
			.call(self.xAxisFocus);
		self.users.select(".axis--x")
			.call(self.xAxisUsers);
		
		if (dataDimensions.time) {
			updateCurrentTimeFilter(self.xFocus.domain()[0].getTime(), self.xFocus.domain()[1].getTime()+1);
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
		
		self.drawContextBins();

		// draw the custom brush handles
		//self.brushHandles.attr("display", null).attr("transform", function(d, i) { return "translate(" + [ s[i], - self.marginContext.size / 4] + ")"; });
	};

	self.typeHeight = {};
	self.detachedContainer = document.createElement("custom");
	self.dataContainer = d3.select(self.detachedContainer);
	self.displayMode = "distributions";
	self.distributionScale = "year";
	
	/**
	 * Temporary version of getRelevantDisplayMode()
	 * Only used while the call to self.xFocus causes an error during the
	 * instanciation of Timeline
	 * 
	 * @deprecated To be replaced by calls to getRelevantDisplayMode()
	 */
	self.getRelevantDisplayMode = function() {
		let displaySeconds = (self.xFocus.domain()[1] - self.xFocus.domain()[0])/1000;
		if (displaySeconds < distributionHalfDayThreshold ) {
			return "events";
		} else {
			return "distributions";
		}
	};
	
	self.getRelevantDistributionScale = function() {
		let displaySeconds = (self.xFocus.domain()[1] - self.xFocus.domain()[0])/1000;
		if (self.getRelevantDisplayMode() == "distributions") {
			if (displaySeconds >= distributionYearThreshold )
				return "year";
			if (displaySeconds < distributionYearThreshold &&
				 displaySeconds >= distributionMonthThreshold)
				return "month";
			if (displaySeconds < distributionMonthThreshold &&
				 displaySeconds >= distributionHalfMonthThreshold)
				return "halfMonth";
			if (displaySeconds < distributionHalfMonthThreshold &&
				 displaySeconds >= distributionDayThreshold)
				return "day";
			if (displaySeconds < distributionDayThreshold &&
				 displaySeconds >= distributionHalfDayThreshold)
				return "halfDay";
			// If no other condition is met
			console.log("Trying to scale distributions in an unknown way. distributionScale = "+self.distributionScale);
			return "halfDay";
		}
		console.log("Trying to display data in an unknown way. displayMode = "+self.displayMode);
	};
	
	self.displayData = function() {
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
			let relevantDistributionScale = self.getRelevantDistributionScale();
			switch(relevantDistributionScale) {
			case "halfDay":
				d3.select("#zoomInfoHalfDay").classed("currentZoom", true);
				self.distributionScale = "halfDay";
				break;
			case "day":
				d3.select("#zoomInfoDay").classed("currentZoom", true);
				self.distributionScale = "day";
				break;
			case "halfMonth":
				d3.select("#zoomInfoHalfMonth").classed("currentZoom", true);
				self.distributionScale = "halfMonth";
				break;
			case "month":
				d3.select("#zoomInfoMonth").classed("currentZoom", true);
				self.distributionScale = "month";
				break;
			case "year":
				d3.select("#zoomInfoYear").classed("currentZoom", true);
				self.distributionScale = "year";
				break;
			default:
				console.log("Relevant distribution scale is unknown, keeping the last one");
			}
		}
		
		self.setupFocusLeftAxis();
		
		// clear the focus canvas and hidden canvas
		self.canvasContext.clearRect(0,0,self.canvas.attr("width"),self.canvas.attr("height"));
		self.hiddenCanvasContext.clearRect(0,0,self.hiddenCanvas.attr("width"),self.hiddenCanvas.attr("height"));
		self.canvasPatternContext.clearRect(0,0,self.canvasPattern.attr("width"),self.canvasPattern.attr("height"));
		self.canvasPatternDistinctContext.clearRect(0,0,self.canvasPatternDistinct.attr("width"),self.canvasPatternDistinct.attr("height"));
		
		switch(self.displayMode) {
		case "distributions":
			self.drawBins();
			self.drawPatternOccurrences();
			break;
		case "events":
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
	
	self.binsDisplayStyleForm = d3.select("#binDisplayStyleForm");
	
	self.switchBinsDisplayStyleFormVisibility = function() {
		let currentVisibility = self.binsDisplayStyleForm.style("display");
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
	
	self.eventDisplayStyleForm = d3.select("#eventDisplayStyleForm");

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
	
	self.showOnlyHighlightedInFocusForm = d3.select("#focusShowOnlyHighlightedForm");

	self.displayToolTipGeneral = function(data) {
		/* WARNING : MAY NOT BE TRUE ANYMORE
		 * Structure : 
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
		changeTooltip(data, "session");
	}
	
	// Parameters about size and margin of the timeline's parts
	self.marginContext = {"top": 0,"right": 20,"bottom": 20,"left": 50,"size": 25};
	self.marginFocus = {"top": 0,"right": 20,"bottom": 10,"left": 50,"size": 225};
	self.marginPatterns = {"top": 0,"right": 20,"bottom": 20,"left": 50,"size": 75};
	self.marginUsers =  {"top": 0,"right": 20,"bottom": 20,"left": 50,"size": 250};
	
	self.width = +self.parentNode.clientWidth
			- Math.max(self.marginFocus.left, self.marginContext.left)
			- Math.max(self.marginFocus.right, self.marginContext.right);
	self.widthContext = +self.parentNode.clientWidth
			- self.marginContext.left
			- self.marginContext.right;
	self.heightContext = self.marginContext.size//+self.parentNode.clientHeight
			+ self.marginContext.top + self.marginContext.bottom;
	self.heightFocus = self.marginFocus.size//+self.parentNode.clientHeight
			+ self.marginFocus.top + self.marginFocus.bottom;
	self.heightPatterns = self.marginPatterns.size//+self.parentNode.clientHeight
			+ self.marginPatterns.top + self.marginPatterns.bottom;
	self.heightUsers = self.marginUsers.size
			+ self.marginUsers.top + self.marginUsers.bottom;
	
	self.height = self.heightContext
		+ self.heightFocus
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
	
	self.canvasPatternDistinct = d3.select(self.nodeFocus).append("canvas")
		.attr("width",self.width)
		.attr("height",self.marginPatterns.size)
		.style("position","relative")
		.style("top",(self.marginPatterns.top + 6).toString()+"px")
		.style("left",self.marginPatterns.left.toString()+"px")
		.style("height", self.marginPatterns.size+"px");	
	self.canvasPatternDistinctContext = self.canvasPatternDistinct.node().getContext("2d");

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
		.style("position","absolute")
		.style("top","0")
		.style("left","0");

	self.svgPatterns = d3.select(self.nodeFocus).append("svg")
		.attr("width",self.parentNode.clientWidth)
		.attr("height",self.heightPatterns)
		.style("position","absolute")
		.style("top",self.heightFocus)
		.style("left","0");
	
	self.svgOverview = d3.select(self.nodeOverview).append("svg")
		.attr("width",self.parentNode.clientWidth)
		.attr("height",self.heightContext)
		.style("position","absolute")
		.style("top","0")
		.style("left","0");
	
	self.svgUsers = d3.select(self.nodeUsers).append("svg")
		.attr("width",self.parentNode.clientWidth)
		.attr("height",self.heightUsers)
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
	self.yPatterns = d3.scalePoint().range([self.marginPatterns.size,0]);
	self.xUsers = d3.scaleTime().range([0, self.width]);
	self.yUsers = d3.scaleBand()
			.range([0, self.marginUsers.size])
			.paddingInner(0.2);
	self.xAxisFocus = d3.axisBottom(self.xFocus);
	self.xAxisContext = d3.axisBottom(self.xContext);
	self.yAxisFocus = d3.axisLeft(self.yFocus);//.tickSizeInner(-self.width);
	self.yAxisPatterns = d3.axisLeft(self.yPatterns);//.tickSizeInner(-self.width);
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
	
		// The zoomable rectangle on the patterns part
	self.zoomPatterns = d3.zoom()
		.scaleExtent([1, Infinity])
		.translateExtent([[0, 0], [self.width, self.marginPatterns.size]])
		.extent([[0, 0], [self.width, self.marginPatterns.size]])
		.on("zoom", self.zoomed);
	
	// The zoomable rectangle on the user part
	self.zoomUsers = d3.zoom()
		.scaleExtent([1, Infinity])
		.translateExtent([[0, 0], [self.width, self.marginUsers.size]])
		.extent([[0, 0], [self.width, self.marginUsers.size]])
		.on("zoom", self.zoomedUsers);
	
	// Adding the axis to the svg area
	// Creating the focus part of the timeline
	self.focus = self.svgFocus.append("g")
	    .attr("class", "focus")
	    .attr("transform", "translate("+self.marginFocus.left+","+self.marginFocus.top+")");
	// Creating the context part of the timeline
	self.context = self.svgOverview.append("g")
	    .attr("class", "context")
	    .attr("transform", "translate("+self.marginContext.left+","+self.marginContext.top+")");
	// Creating the pattern part of the timeline
	self.patterns = self.svgPatterns.append("g")
	    .attr("class", "patterns")
	    .attr("transform", "translate("+self.marginPatterns.left+","+self.marginPatterns.top+")");
	// Creating the users part for the timeline
	self.users = self.svgUsers.append("g")
	    .attr("class", "users")
	    .attr("transform", "translate("+self.marginUsers.left+","+self.marginUsers.top+")");
	// Creating the xAxis and yAxis for the focus part of the timeline
	self.patterns.append("g")
		.attr("class","axis axis--x")
		.attr("transform", "translate(0," + (self.marginPatterns.size + self.marginPatterns.top) + ")")
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
	self.patterns.append("g")
		.attr("class", "axis axis--y")
		.attr("id", "focusRightAxis")
	    //.attr("transform", "translate("+self.width+",0)")
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
							let ts = new Date(data.start);
							let dataX = self.xFocus(ts);
							let dataY = self.yFocus(data.type) + self.yFocus.bandwidth()/2;
							
							self.svgPointerHB.attr("y1",dataY);
							self.svgPointerHB.attr("y2",dataY);
							self.svgPointerVB.attr("x1",dataX);
							self.svgPointerVB.attr("x2",dataX);
						}
						if (self.eventDisplayStyle == "time") {
							// Need a way to get the height at which the data is represented to work fully
							let ts = new Date(data.start);
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
			self.hoveredSession = null;
			
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
	
	// Creating the zoomable rectangle on the patterns part of the timeline
	self.zoomRectPatterns = self.svgPatterns.append("rect")
		.attr("class", "zoom")
		.attr("width", self.width)
		.attr("height", self.marginPatterns.size)
		.attr("transform", "translate(" + self.marginPatterns.left + "," + self.marginPatterns.top + ")")
		.call(self.zoomPatterns);

	self.context.select(".brush").select(".selection")
		.attr("fill","white")
		.attr("stroke","black")
		.attr("stroke-width","1")
		.attr("fill-opacity","0.2");
	
	/**
	 * Moves the time selection brush over a time period starting just before a
	 * session, and ending just after
	 * @param {number} start The start of the session
	 * @param {number} end The end of the session
	 */
	self.focusOnSession = function(start, end) {
		// TODO Change the 5ms padding to a value depending on the session duration
		focusOnTimePeriod(start-5*1000, end+5*1000);
	}
	
	self.updateContextBounds = function(startDate, endDate) {
		console.log("Updating context bounds");
		let startTime = d3.timeSecond.offset(startDate, -1);
		let endTime = d3.timeSecond.offset(endDate, 1);
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

		self.patterns.select(".axis--x").call(self.xAxisFocus);
		self.context.select(".axis--x").call(self.xAxisContext);
		self.users.select(".axis--x").call(self.xAxisUsers);
		self.users.select(".axis--y").call(self.yAxisUsers);
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
		
		dataDimensions.time.bottom(Infinity).forEach( function(evt) {
			let time = new Date(evt.start);
				
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
			self.colorToData["rgb("+color.join(',')+")"] = evt;
			
			if (self.showOnlyHighlightedInFocus == true) {
				if (getCurrentEventColor(evt.type, evt.user) == colorList[evt.type][1])
					return;
			}
			
			let x = self.xFocus(time);
			let y = self.yFocus(evt.type) + self.yFocus.bandwidth()/2;
			
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
			
			let trueX = x - self.canvasContext.measureText(itemShapes[evt.type]).width/2;
			let symbolColor = getCurrentEventColor(evt.type, evt.user).toString();
			//selectedColorFading
			self.canvasContext.font = "bold "+self.yFocus.bandwidth()+"px Geneva";
			self.canvasContext.fillStyle = symbolColor;
			self.canvasContext.textBaseline="middle";
			self.canvasContext.fillText(itemShapes[evt.type], trueX, y);
			
			self.hiddenCanvasContext.font = "bold "+self.yFocus.bandwidth()+"px Geneva";
			self.hiddenCanvasContext.fillStyle = "rgb("+color.join(',')+")";
			self.hiddenCanvasContext.textBaseline="middle";
			self.hiddenCanvasContext.fillText(itemShapes[evt.type], trueX, y);
		});

		//console.log("to event "+firstIndex);
		/*
		self.canvasContext.restore();
		self.hiddenCanvasContext.restore();*/
		
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
		
		//console.log("drawing from event "+firstIndex);

		/*self.yFocus.domain([0.0, lastIndex-firstIndex+2]);
		self.focus.select(".axis--y")
	      	.call(self.yAxisFocus);*/
		
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
		
		dataDimensions.time.bottom(Infinity).forEach( function(evt) {
			let time = new Date(evt.start);
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
			previousType = evt.type;
				
			// Attributing a color to data link
			let color = [];
			// via http://stackoverflow.com/a/15804183
			if(nextColor < 16777215){
				color.push(nextColor & 0xff); // R
				color.push((nextColor & 0xff00) >> 8); // G 
				color.push((nextColor & 0xff0000) >> 16); // B

				nextColor += 1;
			}
			self.colorToData["rgb("+color.join(',')+")"] = evt;
			
			if (self.showOnlyHighlightedInFocus == true) {
				if (getCurrentEventColor(evt.type, evt.user) == colorList[evt.type][1])
					return;
			}
			
			let x = self.xFocus(time);
			let y = self.yFocus(currentHeight);
			
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
			
			let trueX = x - self.canvasContext.measureText(itemShapes[evt.type]).width/2;
			let symbolColor = getCurrentEventColor(evt.type, evt.user).toString();
			let fontSize = (self.marginFocus.size / maxEventAtOneTime) - 4;
			fontSize = Math.min(fontSize, 18);
			
			self.canvasContext.font = "bold "+fontSize+"px Geneva";
			self.canvasContext.fillStyle = symbolColor;
			self.canvasContext.textBaseline="middle";
			self.canvasContext.fillText(itemShapes[evt.type], trueX, y);
			
			self.hiddenCanvasContext.font = "bold "+fontSize+"px Geneva";
			self.hiddenCanvasContext.fillStyle = "rgb("+color.join(',')+")";
			self.hiddenCanvasContext.textBaseline="middle";
			self.hiddenCanvasContext.fillText(itemShapes[evt.type], trueX, y);
		});


		/*self.canvasContext.restore();
		self.hiddenCanvasContext.restore();*/
		
		//console.log("events drawn");
	}
	
	/**
	 * Draws the events by user. Should not be used, since this is basically the
	 * behavior of the session view with "show events" checked.
	 * 
	 * @deprecated Not using the correct drawing method. Also not relying on the
	 * crossfilter data
	 */
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
