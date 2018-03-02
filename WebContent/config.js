 /**
 * Configuration for the js part of the project.
 * Made branch-specific in the way described at 
 * https://git-scm.com/book/en/v2/Customizing-Git-Git-Attributes#_merge_strategies.
 * 
 * Even though this file is version-controled, it is ignored during merges.
 * If content is added to it, a separate commit must be made in all branches of the project 
 */
var config = {
	// Type of server to use
	serverType : "websocket",
	// Adress of the websocket that we want to connect to
	websocketAdress : "ppmt.univ-nantes.fr/ppmt/wsppmt",
	// Adress of the servlet that provides the dataset list
	servletAdress : "http://ppmt.univ-nantes.fr/ppmt/datasetProvider"
};