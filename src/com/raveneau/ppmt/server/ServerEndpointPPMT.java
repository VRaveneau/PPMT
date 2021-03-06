package com.raveneau.ppmt.server;

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

import java.io.StringReader;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import javax.json.Json;
import javax.json.JsonObject;
import javax.json.JsonReader;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;

@ApplicationScoped
@ServerEndpoint("/wsppmt")
public class ServerEndpointPPMT {
	
	@Inject
	private SessionHandler sessionHandler;

	@OnOpen
	public void handleOpen(Session session) {
		System.out.println("====================================================================");
		System.out.println("		Client"+session.getId()+" connected					");
		System.out.println("====================================================================");
		sessionHandler.addSession(session);
		//sessionHandler.provideDatasetList(session);
	}
	
	@OnMessage
	public void handleMessage(String message, Session session) {
		JsonReader reader = Json.createReader(new StringReader(message));
		JsonObject jsonMessage = reader.readObject();
		
		switch(jsonMessage.getString("action")) {
			case "run":
				if ("algorithm".equals(jsonMessage.getString("object"))) {
					int minSup = Integer.parseInt(jsonMessage.getString("minSup"));
					int windowSize = Integer.parseInt(jsonMessage.getString("windowSize"));
					int maxSize = Integer.parseInt(jsonMessage.getString("maxSize"));
					int minGap = Integer.parseInt(jsonMessage.getString("minGap"));
					int maxGap = Integer.parseInt(jsonMessage.getString("maxGap"));
					int maxDuration = Integer.parseInt(jsonMessage.getString("maxDuration"));
					String datasetName = jsonMessage.getString("datasetName");
					if (jsonMessage.containsKey("delay")) {
						long delay = jsonMessage.getJsonNumber("delay").longValue();
						sessionHandler.runAlgorithm(minSup, windowSize, maxSize, minGap, maxGap, maxDuration, delay, datasetName, session);
					} else {
						sessionHandler.runAlgorithm(minSup, windowSize, maxSize, minGap, maxGap, maxDuration, datasetName, session);
					}
				}
				break;
			
			case "stop":
				if ("algorithm".equals(jsonMessage.getString("object"))) {
					sessionHandler.stopAlgorithm(session);
				}
				break;
				
			case "load":
				if ("dataset".equals(jsonMessage.getString("object")))
					sessionHandler.loadDataset(session, jsonMessage.getString("dataset"));
				break;
			
			case "validate":
				if ("dataset".equals(jsonMessage.getString("object"))) {
					sessionHandler.validateDataset(jsonMessage.getString("dataset"), session);
				}
				break;
				
			case "request":
				switch(jsonMessage.getString("object")) {
					case "memory":
						sessionHandler.profileDatasetSize(session);
						break;
						
					case "dataset":
						System.out.println("user requests data on the "+jsonMessage.getString("dataset")+" dataset");
			  			sessionHandler.provideData(jsonMessage.getString("dataset"),session);
						break;
						
					case "datasetInfo":
						System.out.println("user requests information on the "+jsonMessage.getString("dataset")+" dataset");
			  			sessionHandler.provideDatasetInfo(jsonMessage.getString("dataset"),session);
						break;
						
					case "datasetReset":
						System.out.println("user requests a reset of its dataset");
			  			sessionHandler.resetDataset(session);
						break;
						
					case "eventTypes":
						System.out.println("user requests event types on the "+jsonMessage.getString("dataset")+" dataset");
			  			sessionHandler.provideEventTypes(jsonMessage.getString("dataset"),session);
						break;
						
					case "userList":
						System.out.println("user requests user list on the "+jsonMessage.getString("dataset")+" dataset");
			  			sessionHandler.provideUserList(jsonMessage.getString("dataset"),session);
						break;
						
					case "patternOccs":
						System.out.println("user requests the occurrences of pattern "+jsonMessage.getInt("patternId")+" in dataset "+jsonMessage.getString("dataset"));
			  			sessionHandler.providePatternOccurrences(Integer.toString(jsonMessage.getInt("patternId")), jsonMessage.getString("dataset"),session);
						break;
						
					default:
						System.out.println("User requests an incorrect object: " + jsonMessage.getString("object"));
				}
				break;
				
			case "steerOnPattern":
				switch(jsonMessage.getString("object")) {
				case "start":
					System.out.println("ServerEndpoint : receive steering request on pattern id "+jsonMessage.getInt("patternId"));
					sessionHandler.requestSteeringOnPatternStart(jsonMessage.getInt("patternId"),session);					
					break;
				default:
					System.out.println("Unknown object for a steering on pattern: "+ jsonMessage.getString("object"));
				}
				break;
				
			case "steerOnUser":
				sessionHandler.requestSteeringOnUser(jsonMessage.getString("userId"),session);
				break;
			case "steerOnTime":
				long longStart = Long.parseLong(jsonMessage.getString("start"));
				long longEnd = Long.parseLong(jsonMessage.getString("end"));
				sessionHandler.requestSteeringOnTime(longStart, longEnd, session);
				break;
			case "alterDataset":
				sessionHandler.sessionAltersDataset(session);
				switch(jsonMessage.getString("alteration")) {
					case "createEventTypeFromPattern" :
						int patternId = jsonMessage.getInt("patternId");
						String newName = jsonMessage.getString("typeName");
						JsonObject options = jsonMessage.getJsonObject("options");
						sessionHandler.createEventTypeFromPattern(patternId, newName, options, session);
						break;
					case "removeEventTypes" :
						sessionHandler.removeEventTypes(jsonMessage.getJsonArray("eventNames"), session);
						break;
					case "removeUsers" :
						sessionHandler.removeUsers(jsonMessage.getJsonArray("userNames"), session);
						break;
					default:
						System.out.println("Unknwon dataset alteration : " + jsonMessage.getString("alteration"));
				}
				break;
				
			case "ping":
				// Just used to keep the connection alive
				break;
				
			default:
				System.out.println("User requests an incorrect action: " + jsonMessage.getString("action"));
		}
	}
	
	@OnClose
	public void handleClose(Session session) {
		System.out.println("====================================================================");
		System.out.println("		Client"+session.getId()+" disconnected					");
		System.out.println("====================================================================");
		sessionHandler.removeSession(session);
	}
	
	@OnError
	public void handleError(Throwable error) {
		error.printStackTrace();
	}
}
