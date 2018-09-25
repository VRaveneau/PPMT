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

/**
 * Extends the ServerInterface class to manage a local javascript server
 * @extends ServerInterface
 */
class LocalServer extends ServerInterface {
	/**
	 * Sets the server up, without openning the connexion yet.
	 * @param {function} handleOpen Function to call when the connexion opens
	 * @param {function} handleClose Function to call when the connexion closes
	 * @param {function} handleError Function to call when the connexion has an
	 *  error
	 * @param {function} handleMessage Function to call when the
	 * server sends a message
	 */
	constructor(handleOpen, handleClose, handleError, handleMessage) {
		super();
		this.handleOpen = handleOpen;
		this.handleClose = handleClose;
		this.handleError = handleError;
		this.handleMessage = handleMessage;
        this._dataset = null;
	};

    connect() {
        console.log("connect");
        this.handleOpen("Hello world");
    }

    sendAnswer(data) {
        console.log("sendMessage", JSON.stringify(data));
        this.handleMessage({ data: data });
    }

    validate_dataset(params) {
        var _this = this;
        console.log("validate dataset", params.dataset);

        // Load dataset
        fetch(params.dataset).then(function (response) {
            response.json().then( function (data) {
                // Parse/store data
                _this._dataset = data;
                // Validate some info: it should be an array, check the
                // keys of the objects...
                _this.sendAnswer({
                    "action": "validation",
                    "object": "dataset",
                    "answer": "valid"
                })
            });
        })
    }

    event_serialize(event) {
        return {
            "id": _.uniqueId("o"),
			"type": event.verb,
			"start": event.timestamp,
			"end": event.timestamp,
			"user": event.actor.replace(/[^a-zA-Z0-9]/g, "_"),
			"properties": [ JSON.stringify(event, null, 4) ]
        }
    }
    request_datasetInfo(params) {
        this.sendAnswer({
            "action": "datasetInfo",
            "numberOfSequences": 0,
	        "numberOfDifferentEvents": _.uniqBy(this._dataset, "verb").length,
	        "nbEvents": this._dataset.length,
	        "users": _.uniq(_.map(this._dataset, "actor")),
	        "firstEvent": this._dataset[0].timestamp,
	        "lastEvent": this._dataset[this._dataset.length - 1].timestamp,
	        "name": "dataset",
        });
    }

    request_dataset(params) {
        var _this = this;
        // params.dataset
        // params.shape ("bin")
        // params.scale ("year" / "month" / "halfMonth" / "day" / "halfDay")
        this.sendAnswer({
            "action": "data",
            "type": "events",
            "numberOfEvents": _this._dataset.length,
            "events": _this._dataset.map(function (val, i) {
                return _this.event_serialize(val);
            })
        })
    }
    request_eventTypes(params) {
        let eventypeInfo = _(this._dataset).countBy("verb");
        this.sendAnswer({
            "action": "eventTypes",
            "size": eventypeInfo.size(),
            "eventTypes": eventypeInfo.map((count, name) => { return {
                "type": name,
                "nbOccs": count,
                "description": "",
                "category": "main"
            } }).value()
        });
    }
    request_userList(params) {
        let _this = this;
        let userInfo = _(this._dataset).countBy("actor");
        this.sendAnswer({
            "action": "data",
            "type": "userList",
            "size": userInfo.size(),
            "users": userInfo.map((count, name) => {
                var range = d3.extent(_.map(_.filter(_this._dataset, function (i) {
                    return i.actor == name;
                }), "timestamp"));
                return {
                    "name": name.replace(/[^a-zA-Z0-9]/g, "_"),
                    "eventNumber": count,
                    "firstEventDate": new Date(range[0]).toISOString(),
                    "lastEventDate": new Date(range[1]).toISOString()
                }
            }).value()
        })
    }
    sendMessage(msg) {
        console.log("sendMessage", msg);
        let name = `${msg.action}_${msg.type || msg.object}`;

        if (this[name] !== undefined) {
            console.log(`Calling method ${name}`);
            this[name](msg);
        } else {
            console.log(`Undefined method ${name}`);
        }
    }
}

