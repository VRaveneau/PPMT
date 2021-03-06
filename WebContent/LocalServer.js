
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
 * Extends the ServerInterface class to manage a local javascript server
 * @extends ServerInterface
 */
class LocalServer extends ServerInterface {
	/**
	 * Sets the server up, without opening the connexion yet.
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
                // FIXME: Validate some info: it should be an array,
                // check the keys of the objects...
                _this.sendAnswer({
                    "action": "validation",
                    "object": "dataset",
                    "answer": "valid"
                });
            }).catch((error) => {
                console.log("Error while parsing data", error);
                _this.sendAnswer({
                    "action": "message",
                    "message": error,
                    "title": "Error while parsing data"
                });
            });
        }).catch((error) => {
            console.log("Error while loading data", error);
            _this.sendAnswer({
                "action": "message",
                "message": error,
                "title": "Error while loading data"
            });
        });
    }

    /* Serialize the event.

       We assume here that data has some xAPI-inspired fields: actor,
       verb, timestamp
    */
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
    // Return the event type category
    categorize(name) {
        return name.match(/^[a-zA-Z]$/) ? "letter" : (name.match(/^[0-9.]$/) ? "digit" : "main");
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
                "category": this.categorize(name)
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

    /* Generic message dispatch method

       Upon reception of a message, it will check wether the
       ${action}_${type} or ${action}_${object} method is defined, and
       call it.
     */
    sendMessage(msg) {
        console.log("sendMessage", msg);

        // debug to see if 'type' is still used (should not)
        if (msg.type)
            console.log(`!!! msg.type : ${msg.type} !!!`)

        let name = `${msg.action}_${msg.type || msg.object}`;

        if (this[name] !== undefined) {
            console.log(`Calling method ${name}`);
            this[name](msg);
        } else {
            console.log(`Undefined method ${name}`);
        }
    }
}

