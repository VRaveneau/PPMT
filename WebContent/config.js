
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
