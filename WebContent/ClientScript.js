window.onload = init;
var webSocket = new WebSocket("ws://localhost:8080/ProgressivePatternMiningTool/serverendpointppmt");
var timeline = null;
var timelineIds = 0;
var timelineItems = new vis.DataSet([]);

var patterns = {};
var occurrences = {}
var patternProbabilities = {};
var itemColors = {};
var datasetInfo = {};
var availableColors = [];

webSocket.onopen = processOpen;
webSocket.onmessage = processMessage;
webSocket.onclose = processClose;
webSocket.onerror = processError;

function processOpen(message) {
	console.log("Server connect." + "\n");
	requestData();
	createTimeline();
	timelineOverview();
}
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
		if (msg.end.length > 0) {
			addToTimeline(msg.type, msg.start, msg.quantity, msg.end);
		} else {
			addToTimeline(msg.type, msg.start, msg.quantity);
		}
	}
	if (msg.action === "refresh") {
	  	timeline.setItems(timelineItems);
	}
	if (msg.action === "datasetInfo") {
		receiveDatasetInfo(msg);
	}
}
function processClose(message) {
	console.log("Server disconnect." + "\n");
}
function processError(message) {
	console.log("Error" + "\n");
}

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

function init() {
	setReadyToStart();
	
	// Set the "algorithm" tab active by default
	document.getElementById("defaultControlTab").click();
	// Set the "list" pattern-tab active by default
	document.getElementById("defaultPatternTab").click();
	
}

function createTimeline() {
	var container = document.getElementById('timeline');

	// Create a DataSet (allows two way data-binding)
	var items = new vis.DataSet([
//	   {id: 1, content: 'item 1', start: '2013-04-20'},
//	   {id: 2, content: 'item 2', start: '2013-04-14'},
//	   {id: 3, content: 'item 3', start: '2013-04-18'},
//	   {id: 4, content: 'item 4', start: '2013-04-16', end: '2013-04-19'},
//	   {id: 5, content: 'item 5', start: '2013-04-25'},
//	   {id: 6, content: 'item 6', start: '2013-04-27'}
	]);

	// Configuration for the Timeline
	var options = {
			minHeight: "300px",
			template: function (item) {
				var event = item.content.split(' ');
				if (itemColors[event[0]] == null) {
					var color = availableColors.shift();
					itemColors[event[0]] = 'rgb('+color+')';
				}
				return "<p style='background-color:"+itemColors[event[0]]+";'>"+item.content+"</p>";
			}
	};

	// Create a Timeline
	timeline = new vis.Timeline(container, items, options);
	
	/*while(webSocket.readyState == webSocket.CONNECTING) {
		
	}*/
	
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

function requestData() {
	var action = {
			action: "request",
			object: "data",
			dataset: ""
	};
	webSocket.send(JSON.stringify(action));
}

function receiveDatasetInfo(message) {
	console.log("number of sequences : " + message.seqNumber);
	datasetInfo["numberOfSequences"] = parseInt(message.seqNumber);
	datasetInfo["numberOfDifferentEvents"] = parseInt(message.nbDifferentEvents);
	datasetInfo["users"] = message.users;
	var node = document.getElementById("nbDiffEvents");
	node.textContent = message.nbDifferentEvents;
	
	// generate a color for each event
	availableColors = generateColors(datasetInfo["numberOfDifferentEvents"]);
	console.log("color: "+availableColors[0]);
	
	// display the available users
	node = document.getElementById("nbUsers");
	node.textContent = datasetInfo["users"].split(';').length;
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

// Manage the left-side (control) tabs
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


//Manage the right-side (patterns) tabs
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