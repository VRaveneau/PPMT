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
		.on("zoom", self.zoomed);
	self.areaFocus = d3.area()
	    .curve(d3.curveMonotoneX)
	    .x(function(d) { return self.xFocus(d.time); })
	    .y0(self.heightFocus)
	    .y1(function(d) { return self.yFocus(0.5);/*return y(d.price);*/ });
	self.areaContext = d3.area()
	    .curve(d3.curveMonotoneX)
	    .x(function(d) { return self.xContext(d.time); })
	    .y0(self.heightContext)
	    .y1(function(d) { return self.yContext(0.5);/*y2(d.price);*/ });
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
	
	self.brushed = function() {
		console.log("brushing");
		if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
		var s = d3.event.selection || self.xContext.range();
		self.xFocus.domain(s.map(self.xContext.invert, self.xContext));
		self.focus.select(".area")
			.attr("d", self.areaFocus);
		self.focus.select(".axis--x")
			.call(self.xAxisFocus);
		self.svg.select(".zoom")
			.call(self.zoom.transform, d3.zoomIdentity.scale(self.width / (s[1] - s[0]))
			.translate(-s[0], 0));
	};
	
	self.zoomed = function() {
		console.log("zooming");
		if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
		var t = d3.event.transform;
		self.xFocus.domain(t.rescaleX(self.xContext).domain());
		self.focus.select(".area")
			.attr("d", self.areaFocus);
		self.focus.select(".axis--x")
			.call(self.xAxisFocus);
		self.context.select(".brush")
			.call(self.brush.move, self.xFocus.range().map(t.invertX, t));
	};
	
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
	
	self.addData = function(data) {
		var csvData = data.map(self.prepareEvent);

		//self.xFocus.domain(d3.extent(csvData, function(d) { return d.time; }));
		self.yFocus.domain([0.0, 2.0]);
	  //this.xContext.domain(this.xFocus.domain());
	  
		self.focus.append("path")
	      .datum(csvData)
	      .attr("class", "area")
	      .attr("d", self.areaFocus);

		self.focus.select(".axis--x");/*
	      .attr("transform", "translate(0," + height + ")")
	      .call(this.xAxisFocus);*/

		self.focus.select(".axis--y")
	      .call(self.yAxisFocus);

		self.context.append("path")
	      .datum(csvData)
	      .attr("class", "area")
	      .attr("d", self.areaContext);

		self.context.select(".axis--x");/*
	      .attr("transform", "translate(0," + this.heightContext + ")")
	      .call(this.xAxisContext);*/

		// Moving the brush on the data
		var dataExtent = d3.extent(csvData, function(d) { return d.time; });
		self.context.select(".brush")
	      .call(self.brush)
	      .call(self.brush.move, [self.xFocus(dataExtent[0]), self.xFocus(dataExtent[1])]);
	      //.call(self.brush.move, self.xFocus.range());

		// Focusing on the data
		self.svg.select(".zoom")/*
	      .attr("width", this.width)
	      .attr("height", this.heightFocus)*/
	      .attr("transform", "translate(" + self.marginFocus.left + "," + self.marginFocus.top + ")")
	      .call(self.zoom);
	};

	// Prepare data that arrives as a list of pairs [eventType,time]
	// to be displayed
	self.prepareEvent = function(e) {
		var splitted = e.split(";");
		var timeFormat = d3.timeParse('%Y-%m-%d %H:%M:%S');
		return {"type":splitted[0],"time":timeFormat(splitted[1])};
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

//
// SimpleGraph methods
//
/*
SimpleGraph.prototype.plot_drag = function() {
  var self = this;
  return function() {
    registerKeyboardHandler(self.keydown());
    d3.select('body').style("cursor", "move");
    if (d3.event.altKey) {
      var p = d3.svg.mouse(self.vis.node());
      var newpoint = {};
      newpoint.x = self.x.invert(Math.max(0, Math.min(self.size.width,  p[0])));
      newpoint.y = self.y.invert(Math.max(0, Math.min(self.size.height, p[1])));
      self.points.push(newpoint);
      self.points.sort(function(a, b) {
        if (a.x < b.x) { return -1 };
        if (a.x > b.x) { return  1 };
        return 0
      });
      self.selected = newpoint;
      self.update();
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }    
  }
};

SimpleGraph.prototype.update = function() {
  var self = this;
  var lines = this.vis.select("path").attr("d", this.line(this.points));
        
  var circle = this.vis.select("svg").selectAll("circle")
      .data(this.points, function(d) { return d; });

  circle.enter().append("circle")
      .attr("class", function(d) { return d === self.selected ? "selected" : null; })
      .attr("cx",    function(d) { return self.x(d.x); })
      .attr("cy",    function(d) { return self.y(d.y); })
      .attr("r", 10.0)
      .style("cursor", "ns-resize")
      .on("mousedown.drag",  self.datapoint_drag())
      .on("touchstart.drag", self.datapoint_drag());

  circle
      .attr("class", function(d) { return d === self.selected ? "selected" : null; })
      .attr("cx",    function(d) { 
        return self.x(d.x); })
      .attr("cy",    function(d) { return self.y(d.y); });

  circle.exit().remove();

  if (d3.event && d3.event.keyCode) {
    d3.event.preventDefault();
    d3.event.stopPropagation();
  }
}

SimpleGraph.prototype.datapoint_drag = function() {
  var self = this;
  return function(d) {
    registerKeyboardHandler(self.keydown());
    document.onselectstart = function() { return false; };
    self.selected = self.dragged = d;
    self.update();
    
  }
};

SimpleGraph.prototype.mousemove = function() {
  var self = this;
  return function() {
    var p = d3.svg.mouse(self.vis[0][0]),
        t = d3.event.changedTouches;
    
    if (self.dragged) {
      self.dragged.y = self.y.invert(Math.max(0, Math.min(self.size.height, p[1])));
      self.update();
    };
    if (!isNaN(self.downx)) {
      d3.select('body').style("cursor", "ew-resize");
      var rupx = self.x.invert(p[0]),
          xaxis1 = self.x.domain()[0],
          xaxis2 = self.x.domain()[1],
          xextent = xaxis2 - xaxis1;
      if (rupx != 0) {
        var changex, new_domain;
        changex = self.downx / rupx;
        new_domain = [xaxis1, xaxis1 + (xextent * changex)];
        self.x.domain(new_domain);
        self.redraw()();
      }
      d3.event.preventDefault();
      d3.event.stopPropagation();
    };
    if (!isNaN(self.downy)) {
      d3.select('body').style("cursor", "ns-resize");
      var rupy = self.y.invert(p[1]),
          yaxis1 = self.y.domain()[1],
          yaxis2 = self.y.domain()[0],
          yextent = yaxis2 - yaxis1;
      if (rupy != 0) {
        var changey, new_domain;
        changey = self.downy / rupy;
        new_domain = [yaxis1 + (yextent * changey), yaxis1];
        self.y.domain(new_domain);
        self.redraw()();
      }
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
  }
};

SimpleGraph.prototype.mouseup = function() {
  var self = this;
  return function() {
    document.onselectstart = function() { return true; };
    d3.select('body').style("cursor", "auto");
    d3.select('body').style("cursor", "auto");
    if (!isNaN(self.downx)) {
      self.redraw()();
      self.downx = Math.NaN;
      d3.event.preventDefault();
      d3.event.stopPropagation();
    };
    if (!isNaN(self.downy)) {
      self.redraw()();
      self.downy = Math.NaN;
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
    if (self.dragged) { 
      self.dragged = null 
    }
  }
}

SimpleGraph.prototype.keydown = function() {
  var self = this;
  return function() {
    if (!self.selected) return;
    switch (d3.event.keyCode) {
      case 8: // backspace
      case 46: { // delete
        var i = self.points.indexOf(self.selected);
        self.points.splice(i, 1);
        self.selected = self.points.length ? self.points[i > 0 ? i - 1 : 0] : null;
        self.update();
        break;
      }
    }
  }
};

SimpleGraph.prototype.redraw = function() {
  var self = this;
  return function() {
    var tx = function(d) { 
      return "translate(" + self.x(d) + ",0)"; 
    },
    ty = function(d) { 
      return "translate(0," + self.y(d) + ")";
    },
    stroke = function(d) { 
      return d ? "#ccc" : "#666"; 
    },
    fx = self.x.tickFormat(10),
    fy = self.y.tickFormat(10);

    // Regenerate x-ticks…
    var gx = self.vis.selectAll("g.x")
        .data(self.x.ticks(10), String)
        .attr("transform", tx);

    gx.select("text")
        .text(fx);

    var gxe = gx.enter().insert("g", "a")
        .attr("class", "x")
        .attr("transform", tx);

    gxe.append("line")
        .attr("stroke", stroke)
        .attr("y1", 0)
        .attr("y2", self.size.height);

    gxe.append("text")
        .attr("class", "axis")
        .attr("y", self.size.height)
        .attr("dy", "1em")
        .attr("text-anchor", "middle")
        .text(fx)
        .style("cursor", "ew-resize")
        .on("mouseover", function(d) { d3.select(this).style("font-weight", "bold");})
        .on("mouseout",  function(d) { d3.select(this).style("font-weight", "normal");})
        .on("mousedown.drag",  self.xaxis_drag())
        .on("touchstart.drag", self.xaxis_drag());

    gx.exit().remove();

    // Regenerate y-ticks…
    var gy = self.vis.selectAll("g.y")
        .data(self.y.ticks(10), String)
        .attr("transform", ty);

    gy.select("text")
        .text(fy);

    var gye = gy.enter().insert("g", "a")
        .attr("class", "y")
        .attr("transform", ty)
        .attr("background-fill", "#FFEEB6");

    gye.append("line")
        .attr("stroke", stroke)
        .attr("x1", 0)
        .attr("x2", self.size.width);

    gye.append("text")
        .attr("class", "axis")
        .attr("x", -3)
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .text(fy)
        .style("cursor", "ns-resize")
        .on("mouseover", function(d) { d3.select(this).style("font-weight", "bold");})
        .on("mouseout",  function(d) { d3.select(this).style("font-weight", "normal");})
        .on("mousedown.drag",  self.yaxis_drag())
        .on("touchstart.drag", self.yaxis_drag());

    gy.exit().remove();
    self.plot.call(d3.behavior.zoom().x(self.x).y(self.y).on("zoom", self.redraw()));
    self.update();    
  }  
}

SimpleGraph.prototype.xaxis_drag = function() {
  var self = this;
  return function(d) {
    document.onselectstart = function() { return false; };
    var p = d3.svg.mouse(self.vis[0][0]);
    self.downx = self.x.invert(p[0]);
  }
};

SimpleGraph.prototype.yaxis_drag = function(d) {
  var self = this;
  return function(d) {
    document.onselectstart = function() { return false; };
    var p = d3.svg.mouse(self.vis[0][0]);
    self.downy = self.y.invert(p[1]);
  }
};*/