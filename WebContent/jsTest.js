/**
 * Testing things
 */

var Old = function() {
	let coucou = "coucou";
	let init = function() {
		"toto";
	}
	
	function plop(a) {
		"plop";
	}
}

var Obj = {
	coucou : "coucou",
	init : function() {
		"toto";
	}
}

var plop = function() {
	this.coucou = "coucou";
	init(() => {
		"toto";
	})
}

var a = Old();
var b = new Old();

class Test {
	constructor() {
		this.x = "coucou";
	}
	
	foo() {
		
	}
}