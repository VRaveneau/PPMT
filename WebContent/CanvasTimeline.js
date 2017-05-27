/**
 * 
 */
// cf http://bl.ocks.org/stepheneb/1182434
//		for things like rescaleable axis

registerKeyboardHandler = function(callback) {
  var callback = callback;
  d3.select(window).on("keydown", callback);  
};


Timeline = function(elemId, options) {
	var self = this;
	self.userData = 0;
	self.parentNode = document.getElementById(elemId);
	
	self.zoomed = function() {
		//console.log("zooming");
		if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
		var t = d3.event.transform;
		self.xFocus.domain(t.rescaleX(self.xContext).domain());
		/*self.focus.select(".area")
			.attr("d", self.areaFocus);*/
		self.focus.select(".axis--x")
			.call(self.xAxisFocus);
		self.focus.selectAll(".dot")
			.attr("transform",function(d) {return "translate("+self.xFocus(d.time)+","+self.yFocus(d.height)+")"});
		self.context.select(".brush")
			.call(self.brush.move, self.xFocus.range().map(t.invertX, t));
	};
	
	self.brushed = function() {
		//console.log("brushing");
		if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
		var s = d3.event.selection || self.xContext.range();
		self.xFocus.domain(s.map(self.xContext.invert, self.xContext));
		/*self.focus.select(".area")
			.attr("d", self.areaFocus);*/
		self.focus.select(".axis--x")
			.call(self.xAxisFocus);
		self.focus.selectAll(".dot")
			.attr("transform",function(d) {return "translate("+self.xFocus(d.time)+","+self.yFocus(d.height)+")"});
		self.svg.select(".zoom")
			.call(self.zoom.transform, d3.zoomIdentity.scale(self.width / (s[1] - s[0]))
			.translate(-s[0], 0));
	};

	self.typeHeight = {};
	self.detachedContainer = document.createElement("custom");
	self.dataContainer = d3.select(self.detachedContainer);
	self.displayMode = "distributions";
	
	// Adding the control buttons over the timeline
	self.changeDisplayMode = function() {
	    if (this.value === "distributions")
	    	self.displayMode = "distributions";
    	else
    		self.displayMode = "events";
	    self.displayData();
	};

	self.displayData = function() {
		switch(self.displayMode) {
		case "distributions":
			self.displayDistributions();
			break;
		case "events":
			self.displayEvents();
			break;
		default:
			console.log("Trying to display data in an unknown way. displayMode = "+self.displayMode);
		}
	};
	
	self.controlForm = d3.select(self.parentNode).append("form");
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
		.attr("value","events");
	self.controlForm.selectAll("input").on("change", self.changeDisplayMode);
	
	// Parameters about size and margin of the timeline's parts
	self.marginFocus = {"top": 20,"right": 20,"bottom": 110,"left": 40};
	self.marginContext = {"top": 430,"right": 20,"bottom": 30,"left": 40};
	self.width = +self.parentNode.clientWidth
			- Math.max(self.marginFocus.left, self.marginContext.left)
			- Math.max(self.marginFocus.right, self.marginContext.right);
	self.heightFocus = +self.parentNode.clientHeight
			- self.marginFocus.top - self.marginFocus.bottom;
	self.heightContext = +self.parentNode.clientHeight
			- self.marginContext.top - self.marginContext.bottom;
	
	// The timeline's parts
	self.canvas = d3.select(self.parentNode).append("canvas")
		.attr("width",self.width)
		.attr("height",self.heightFocus)
		.style("position","absolute")
		.style("top",(self.marginFocus.top + self.controlForm.node().clientHeight).toString()+"px")
		.style("left",self.marginFocus.left.toString()+"px");	
	self.canvasContext = self.canvas.node().getContext("2d");
	
	self.hiddenCanvas = d3.select(self.parentNode).append("canvas")
		.attr("width",self.width)
		.attr("height",self.heightFocus)
		.style("position","absolute")
		.style("top",(self.marginFocus.top + self.controlForm.node().clientHeight).toString()+"px")
		.style("left",self.marginFocus.left.toString()+"px");
	self.hiddenCanvasContext = self.canvas.node().getContext("2d");
	
	self.svg = d3.select(self.parentNode).append("svg")
		.attr("width",self.parentNode.clientWidth)
		.attr("height",self.parentNode.clientHeight)
		.style("position","absolute")
		.style("top",self.controlForm.clientHeight)
		.style("left","0");
	
	// Parameters for the various axis
	self.parseDate = d3.timeParse("%Y-%M-%d %H:%m:%s");
	self.xFocus = d3.scaleTime().range([0, self.width]);
	self.xContext = d3.scaleTime().range([0,self.width]);
	self.yFocus = d3.scaleLinear().range([self.heightFocus,0]);
	self.yContext = d3.scaleLinear().range([self.heightContext,0]);
	self.xAxisFocus = d3.axisBottom(self.xFocus);
	self.xAxisContext = d3.axisBottom(self.xContext);
	self.yAxisFocus = d3.axisLeft(self.yFocus);
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
	// Creating the xAxis and yAxis for the focus part of the timeline
	self.focus.append("g")
		.attr("class","axis axis--x")
		.attr("transform", "translate(0," + self.heightFocus + ")")
		.call(self.xAxisFocus);
	self.focus.append("g")
		.attr("class", "axis axis--y")
		.call(self.yAxisFocus);
	// Creating the xAxis for the context part of the timeline
	self.context.append("g")
		.attr("class","axis axis--x")
		.attr("transform", "translate(0," + self.heightContext + ")")
		.call(self.xAxisContext);
	// Adding the brush to the context part
	self.context.append("g")
		.attr("class", "brush")
		.call(self.brush)
		.call(self.brush.move, self.xFocus.range());
	// Creating the zoomable rectangle on the focus part of the timeline
	self.svg.append("rect")
		.attr("class", "zoom")
		.attr("width", self.width)
		.attr("height", self.heightFocus)
		.attr("transform", "translate(" + self.marginFocus.left + "," + self.marginFocus.top + ")")
		.call(self.zoom);
	
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
		
		self.xFocus = d3.scaleTime()
			.domain([timeFormat(startString),timeFormat(endString)])
			.range([0,self.width]);
		self.xContext = d3.scaleTime()
			.domain([timeFormat(startString),timeFormat(endString)])
			.range([0,self.width]);
		
		self.xAxisFocus = d3.axisBottom(self.xFocus);
		self.xAxisContext = d3.axisBottom(self.xContext);

		self.focus.select(".axis--x").call(self.xAxisFocus);
		self.context.select(".axis--x").call(self.xAxisContext);
	};
	
	self.addDataset = function(data) {
		for (var user in data) {
			if (data.hasOwnProperty(user)) {
				self.addToDataBinding(data[user]);
			}
		}
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
	
};

/**
 * Creates a timeline as a child of the elemid node, with the given options
 */
TimelineOld = function(elemId, options) {
	var self = this;
	
	self.zoomed = function() {
		//console.log("zooming");
		if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
		var t = d3.event.transform;
		self.xFocus.domain(t.rescaleX(self.xContext).domain());
		/*self.focus.select(".area")
			.attr("d", self.areaFocus);*/
		self.focus.select(".axis--x")
			.call(self.xAxisFocus);
		self.focus.selectAll(".dot")
			.attr("transform",function(d) {return "translate("+self.xFocus(d.time)+","+self.yFocus(d.height)+")"});
		self.context.select(".brush")
			.call(self.brush.move, self.xFocus.range().map(t.invertX, t));
	};
	
	self.brushed = function() {
		//console.log("brushing");
		if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
		var s = d3.event.selection || self.xContext.range();
		self.xFocus.domain(s.map(self.xContext.invert, self.xContext));
		/*self.focus.select(".area")
			.attr("d", self.areaFocus);*/
		self.focus.select(".axis--x")
			.call(self.xAxisFocus);
		self.focus.selectAll(".dot")
			.attr("transform",function(d) {return "translate("+self.xFocus(d.time)+","+self.yFocus(d.height)+")"});
		self.svg.select(".zoom")
			.call(self.zoom.transform, d3.zoomIdentity.scale(self.width / (s[1] - s[0]))
			.translate(-s[0], 0));
	};
	
	self.typeHeight = {};
	self.parentNode = document.getElementById(elemId);
	self.canvas = d3.select(self.parentNode).append("canvas")
		.attr("width",self.parentNode.clientWidth)
		.attr("height",self.parentNode.clientHeight);
	self.canvasContext = self.canvas.node().getContext("2d");
	self.hiddenCanvas = d3.select(self.parentNode).append("canvas")
		.attr("width",self.parentNode.clientWidth)
		.attr("height",self.parentNode.clientHeight)
		.style("display","none");
	self.hiddenCanvasContext = self.hiddenCanvas.node().getContext("2d");
	self.dataContainer = d3.select(self.parentNode).append("custom")
	self.marginFocus = {
			"top": 20,
			"right": 20,
			"bottom": 110,
			"left": 40
	};
	self.marginContext = {
			"top": 430,
			"right": 20,
			"bottom": 30,
			"left": 40
	};
	self.width = +self.canvas.attr("width")
			- Math.max(self.marginFocus.left, self.marginContext.left)
			- Math.max(self.marginFocus.right, self.marginContext.right);
	self.heightFocus = +self.canvas.attr("height")
			- self.marginFocus.top - self.marginFocus.bottom;
	self.heightContext = +self.canvas.attr("height")
			- self.marginContext.top - self.marginContext.bottom;
	self.parseDate = d3.timeParse("%Y-%M-%d %H:%m:%s");
	self.xFocus = d3.scaleTime().range([0, self.width]);
	self.xContext = d3.scaleTime().range([0,self.width]);
	self.yFocus = d3.scaleLinear().range([self.heightFocus,0]);
	self.yContext = d3.scaleLinear().range([self.heightContext,0]);
	self.xAxisFocus = d3.axisBottom(self.xFocus);
	self.xAxisContext = d3.axisBottom(self.xContext);
	self.yAxisFocus = d3.axisLeft(self.yFocus);
	self.brush = d3.brushX()
		.extent([[0, 0], [self.width, self.heightContext]])
		.on("brush end", self.brushed);
	self.zoom = d3.zoom()
		.scaleExtent([1, Infinity])
		.translateExtent([[0, 0], [self.width, self.heightFocus]])
		.extent([[0, 0], [self.width, self.heightFocus]])
		.on("zoom", self.zoomed);
	// Here goes the clip path		--> Needed with canvas ?
	/*self.svg.append("defs").append("clipPath")
	    .attr("id", "clip")
	    .append("rect")
	    .attr("width", self.width)
	    .attr("height", self.heightFocus);*/
	
	
	
	// Creating the focus part of the timeline
	self.focus = self.svg.append("g")
	    .attr("class", "focus")
	    .attr("transform", "translate("+self.marginFocus.left+","+self.marginFocus.top+")");
	// Creating the context part of the timeline
	self.context = self.svg.append("g")
	    .attr("class", "context")
	    .attr("transform", "translate("+self.marginContext.left+","+self.marginContext.top+")");
	
	
	// Here goes the loading of some data
	// Creating the xAxis and yAxis for the focus part of the timeline
	self.focus.append("g")
		.attr("class","axis axis--x")
		.attr("transform", "translate(0," + self.heightFocus + ")")
		.call(self.xAxisFocus);
	self.focus.append("g")
		.attr("class", "axis axis--y")
		.call(self.yAxisFocus);
	// Creating the xAxis for the context part of the timeline
	self.context.append("g")
		.attr("class","axis axis--x")
		.attr("transform", "translate(0," + self.heightContext + ")")
		.call(self.xAxisContext);
	// Creating the brushing rectangle on the context timeline
	self.context.append("g")
		.attr("class", "brush")
		.call(self.brush)
		.call(self.brush.move, self.xFocus.range());
	// Creating the zoomable rectangle on the focus part of the timeline
	self.svg.append("rect")
		.attr("class", "zoom")
		.attr("width", self.width)
		.attr("height", self.heightFocus)
		.attr("transform", "translate(" + self.marginFocus.left + "," + self.marginFocus.top + ")")
		.call(self.zoom);
	
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
		
		self.xFocus = d3.scaleTime()
			.domain([timeFormat(startString),timeFormat(endString)])
			.range([0,self.width]);
		self.xContext = d3.scaleTime()
			.domain([timeFormat(startString),timeFormat(endString)])
			.range([0,self.width]);
		
		self.xAxisFocus = d3.axisBottom(self.xFocus);
		self.xAxisContext = d3.axisBottom(self.xContext);

		self.focus.select(".axis--x").call(self.xAxisFocus);
		self.context.select(".axis--x").call(self.xAxisContext);
	};
	
	self.changeData = function(data) {
		var csvData = data.map(self.prepareEvent);

		console.log(csvData);
		
		self.xFocus.domain(d3.extent(csvData, function(d) { return d.time; }));
		self.yFocus.domain([0.0, 3.0]);
	  //this.xContext.domain(this.xFocus.domain());
	  
		var currentHeight = {};
		
		self.focus.selectAll(".dot").remove()
			.data(csvData)
			.enter().append("circle")
		      .attr("class", "dot")
		      .attr("r", 5)
		      .attr("cx", function(d) { return self.xFocus(d.time); })
		      .attr("cy", function(d) {
		    	  if(currentHeight.hasOwnProperty(d.time.toString())) {
		    		  currentHeight[d.time.toString()] = currentHeight[d.time.toString()]++;
		    	  } else currentHeight[d.time.toString()] = 1;
		    		  return self.yFocus(currentHeight[d.time.toString()]); })
		    .style("fill", function(d) {return d3.hsl(d.color,100,50);});
		
		/*self.focus.append("path")
	      .datum(csvData)
	      .attr("class", "area")
	      .attr("d", self.areaFocus);*/

		self.focus.select(".axis--x")/*
	      .attr("transform", "translate(0," + height + ")")*/
	      .call(this.xAxisFocus);

		self.focus.select(".axis--y")
	      .call(self.yAxisFocus);

		self.context.append("path")
	      .datum(csvData)
	      .attr("class", "area")
	      .attr("d", self.areaContext);

		self.context.select(".axis--x");
	}
	
	self.addData = function(data) {
		var csvData = data.map(self.prepareEvent);

		//console.log(csvData);
		
		self.xFocus.domain(d3.extent(csvData, function(d) { return d.time; }));
		self.yFocus.domain([0.0, 20.0]);
	  //this.xContext.domain(this.xFocus.domain());

		
		self.focus.selectAll(".dot").remove()
			.data(csvData)
			.enter().append("path")
			.attr("d",d3.symbol().type(function(d) {return itemShapes[d.type];d3.symbol().type(d.shape);d3.symbolStar;d3.symbol().type(d.shape);d3.symbolStar;d.shape;})
								.size(function(d) {return 50;}))
			.attr("transform",function(d) {return "translate("+self.xFocus(d.time)+","+self.yFocus(d.height)+")"})
			.attr("stroke", function(d) {return d3.hsl(d.color,100,50)})
			.attr("fill","none")
			.attr("class","dot");
			
			
			/*.append("circle")
		      .attr("class", "dot")
		      .attr("r", 5)
		      .attr("cx", function(d) { return self.xFocus(d.time); })
		      .attr("cy", function(d) {
		    	  if(currentHeight.hasOwnProperty(d.time.toString())) {
		    		  currentHeight[d.time.toString()] = currentHeight[d.time.toString()]++;
		    	  } else currentHeight[d.time.toString()] = 1;
		    		  return self.yFocus(currentHeight[d.time.toString()]); })
		    .style("fill", function(d) {return d3.hsl(d.color,100,50);});*/
		
		/*self.focus.append("path")
	      .datum(csvData)
	      .attr("class", "area")
	      .attr("d", self.areaFocus);*/

		self.focus.select(".axis--x")/*
	      .attr("transform", "translate(0," + height + ")")*/
	      .call(this.xAxisFocus);

		self.focus.select(".axis--y")
	      .call(self.yAxisFocus);

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
		if(!self.typeHeight.hasOwnProperty(splitted[0].toString()))
  			self.typeHeight[splitted[0]] = 0.5+Object.keys(self.typeHeight).length*0.5;
  		var timeFormat = d3.timeParse('%Y-%m-%d %H:%M:%S');
		return {"type":splitted[0],
				"time":timeFormat(splitted[1]),
				"height": self.typeHeight[splitted[0]],
				"color":parseFloat(splitted[2]),
				"shape":e.shape};
	}
	
	self.drawCanvas = function() {
		console.log("Drawing canvas");
		self.canvasContext.fillStyle = "#fff";
		self.canvasContext.rect(0,0,self.canvas.attr("width"),self.canvas.attr("height"));
		self.canvasContext.fill();
		
		var elts = self.focus.selectAll(".dot");
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
		});
	}
	
	self.moveFocus = function(start, end) { 		// UNFINISHED
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
		
		self.xFocus = d3.scaleTime()
			.domain([timeFormat(startString),timeFormat(endString)])
			.range([0,self.width]);
	};
	
};