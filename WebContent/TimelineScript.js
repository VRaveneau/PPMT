/**
 * 
 */

var tl;
function onLoad() {
	init(); // initialize the rest of the page
	
	var eventSource = new Timeline.DefaultEventSource();
  var bandInfos = [
    Timeline.createBandInfo({
        eventSource:    eventSource,
        date:           "Jun 28 2006 00:00:00 GMT",
        width:          "70%", 
        intervalUnit:   Timeline.DateTime.MONTH, 
        intervalPixels: 100
    }),
    Timeline.createBandInfo({
        overview:       true,
        eventSource:    eventSource,
        date:           "Jun 28 2006 00:00:00 GMT",
        width:          "30%", 
        intervalUnit:   Timeline.DateTime.YEAR, 
        intervalPixels: 200
    })
  ];
  
  bandInfos[1].syncWith = 0;
  bandInfos[1].highlight = true;
  
  tl = Timeline.create(document.getElementById("my-timeline"), bandInfos);
  Timeline.loadXML("data_test.xml", function(xml, url) { eventSource.loadXML(xml, url); });
}

var resizeTimerID = null;
function onResize() {
    if (resizeTimerID == null) {
        resizeTimerID = window.setTimeout(function() {
            resizeTimerID = null;
            tl.layout();
        }, 500);
    }
}