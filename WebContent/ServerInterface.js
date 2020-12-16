
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
 * Describes a server interface and its methods. It is used to abstract the
 * interaction with the server from the main code, to provide several
 * implementations.
 * 
 * This class is not meant to be instanciated (the methods do nothing). Its
 * only purpose is to define the list of available methods to implement in
 * subclasses that extend this one.
 */
class ServerInterface {
	constructor() {

	}

	/**
	 * Connects to the server
	 */
	connect() {
		console.log("!!! ServerInterface default connect() method, this should be redefined !!!");
	}

	/**
	 * Disconnects from the server
	 */
	disconnect() {
		console.log("!!! ServerInterface default disconnect() method, this should be redefined !!!");
	}

	/**
	 * Sends a message to the server
	 * @param {JSON} jsonMessage The object containing the message
	 */
	sendMessage(jsonMessage) {
		console.log("!!! ServerInterface default sendMessage(jsonMessage) method, this should be redefined !!!");
	}
}

/**
 * Extends the ServerInterface class to manage a server communicating via a
 * WebSocket.
 * @extends ServerInterface
 */
class WebSocketServer extends ServerInterface {
	/**
	 * Sets the server up, without openning the connexion yet.
	 * @param {string} wsAdress The adress where the socket accepts connexions
	 * @param {function} handleOpen Function to call when the connexion opens
	 * @param {function} handleClose Function to call when the connexion closes
	 * @param {function} handleError Function to call when the connexion has an
	 *  error
	 * @param {function} handleMessage Function to call when the server sends a 
	 * message
	 */
	constructor(wsAdress, handleOpen, handleClose, handleError, handleMessage) {
		super();
		this.adress = wsAdress;
		this.handleOpen = handleOpen;
		this.handleClose = handleClose;
		this.handleError = handleError;
		this.handleMessage = handleMessage;
		this.webSocket = null;
	}

	/**
	 * Connects to the websocket and setup the functions handling the open,
	 * close, error and message events.
	 */
	connect() {
		this.webSocket = new WebSocket("ws://" + this.adress);

		this.webSocket.onopen = this.handleOpen;
		this.webSocket.onclose = this.handleClose;
		this.webSocket.onerror = this.handleError;
		this.webSocket.onmessage = this.handleMessage;
	}

	disconnect() {
		console.log("!! WebSocketServer.disconnect() not implemented yet !!");
	}

	sendMessage(jsonMessage) {
		this.webSocket.send(JSON.stringify(jsonMessage));
	}
}
