// cf http://bl.ocks.org/stepheneb/1182434
//		for things like rescaleable axis

registerKeyboardHandler = function(callback) {
  var callback = callback;
  d3.select(window).on("keydown", callback);  
};

/**
 * Creates a timeline as a child of the elemid node, with the given options
 */
Timeline = function(elemId, options) {
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
	self.svg = d3.select(self.parentNode).append("svg")
		.attr("width",self.parentNode.clientWidth)
		.attr("height",self.parentNode.clientHeight);
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
	self.width = +self.svg.attr("width")
			- Math.max(self.marginFocus.left, self.marginContext.left)
			- Math.max(self.marginFocus.right, self.marginContext.right);
	self.heightFocus = +self.svg.attr("height")
			- self.marginFocus.top - self.marginFocus.bottom;
	self.heightContext = +self.svg.attr("height")
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
		.on("zoom", self.zoomed);/*
	self.areaFocus = d3.area()
	    .curve(d3.curveMonotoneX)
	    .x(function(d) { return self.xFocus(d.time); })
	    .y0(self.heightFocus)
	    .y1(function(d) { return self.yFocus(0.5); });*/
	/*self.areaContext = d3.area()
	    .curve(d3.curveMonotoneX)
	    .x(function(d) { return self.xContext(d.time); })
	    .y0(self.heightContext)
	    .y1(function(d) { return self.yContext(0.5); });*/
	// Here goes the clip path
	self.svg.append("defs").append("clipPath")
	    .attr("id", "clip")
	    .append("rect")
	    .attr("width", self.width)
	    .attr("height", self.heightFocus);
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