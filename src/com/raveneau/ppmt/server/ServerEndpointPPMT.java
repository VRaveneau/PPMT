package com.raveneau.ppmt.server;

import java.io.IOException;
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
	}
	
	@OnMessage
	public void handleMessage(String message, Session session) {
		JsonReader reader = Json.createReader(new StringReader(message));
		JsonObject jsonMessage = reader.readObject();
		
		if ("run".equals(jsonMessage.getString("action"))) {
			if ("algoToFile".equals(jsonMessage.getString("object")))
				sessionHandler.runAlgoToFile();
			if ("algorithm".equals(jsonMessage.getString("object"))) {
				int minSup = Integer.parseInt(jsonMessage.getString("minSup"));
				int windowSize = Integer.parseInt(jsonMessage.getString("windowSize"));
				int maxSize = Integer.parseInt(jsonMessage.getString("maxSize"));
				int minGap = Integer.parseInt(jsonMessage.getString("minGap"));
				int maxGap = Integer.parseInt(jsonMessage.getString("maxGap"));
				int maxDuration = Integer.parseInt(jsonMessage.getString("maxDuration"));
				sessionHandler.runAlgorithm(minSup, windowSize, maxSize, minGap, maxGap, maxDuration, "Agavue", session);
			}
		}
		if ("startMining".equals(jsonMessage.getString("action"))) {   // Now unused
	  		sessionHandler.startMining(session);
	  	}
		if ("stopMining".equals(jsonMessage.getString("action"))) { // Now unused
	  		sessionHandler.stopMining(session);
	  	}
		if ("request".equals(jsonMessage.getString("action"))) {
	  		if ("dataset".equals(jsonMessage.getString("object"))) {
	  			System.out.println("user requests data on the "+jsonMessage.getString("dataset")+" dataset");
	  			sessionHandler.provideData(jsonMessage.getString("dataset"),session);
	  		} else
	  		if ("datasetInfo".equals(jsonMessage.getString("object"))) {
	  			System.out.println("user requests information on the "+jsonMessage.getString("dataset")+" dataset");
	  			sessionHandler.provideDatasetInfo(jsonMessage.getString("dataset"),session);
	  		} else
	  		if ("eventTypes".equals(jsonMessage.getString("object"))) {
	  			System.out.println("user requests event types on the "+jsonMessage.getString("dataset")+" dataset");
	  			sessionHandler.provideEventTypesInfo(jsonMessage.getString("dataset"),session);
	  		} else
	  		if ("userList".equals(jsonMessage.getString("object"))) {
	  			System.out.println("user requests user list on the "+jsonMessage.getString("dataset")+" dataset");
	  			sessionHandler.provideUserList(jsonMessage.getString("dataset"),session);
	  		} else
	  		if ("trace".equals(jsonMessage.getString("object"))) {
	  			System.out.println("user requests the trace of user "+jsonMessage.getString("user")+" in dataset "+jsonMessage.getString("dataset"));
	  			sessionHandler.provideTrace(jsonMessage.getString("user"), jsonMessage.getString("dataset"),session);
	  		} else
	  		if ("patterns".equals(jsonMessage.getString("object"))) {
	  			System.out.println("user requests the patterns of user "+jsonMessage.getString("user")+" in dataset "+jsonMessage.getString("dataset"));
	  			sessionHandler.providePatterns(jsonMessage.getString("user"), jsonMessage.getString("dataset"),session);
	  		} else
	  		if ("allPatterns".equals(jsonMessage.getString("object"))) {
	  			System.out.println("user requests all the patterns in dataset "+jsonMessage.getString("dataset"));
	  			sessionHandler.provideAllPatterns(jsonMessage.getString("dataset"),session);
	  		} else
	  		if ("patternDistribution".equals(jsonMessage.getString("object"))) {
	  			System.out.println("user requests the distribution of pattern "+jsonMessage.getString("pattern")+" in dataset "+jsonMessage.getString("dataset"));
	  			sessionHandler.providePatternDistribution(jsonMessage.getString("pattern"), jsonMessage.getString("dataset"),session);
	  		} else
	  		if ("patternOccs".equals(jsonMessage.getString("object"))) {
	  			System.out.println("user requests the occurrences of pattern "+jsonMessage.getInt("patternId")+" in dataset "+jsonMessage.getString("dataset"));
	  			sessionHandler.providePatternOccurrences(Integer.toString(jsonMessage.getInt("patternId")), jsonMessage.getString("dataset"),session);
	  		} else
	  		if ("data".equals(jsonMessage.getString("object"))) {
	  			if ("bin".equals(jsonMessage.getString("shape"))) {
	  				if ("year".equals(jsonMessage.getString("scale"))) {
	  					sessionHandler.provideYearBins(jsonMessage.getString("dataset"),session);
	  				} else
	  				if ("month".equals(jsonMessage.getString("scale"))) {
	  					sessionHandler.provideMonthBins(jsonMessage.getString("dataset"),session);
	  				} else
	  				if ("halfMonth".equals(jsonMessage.getString("scale"))) {
	  					sessionHandler.provideHalfMonthBins(jsonMessage.getString("dataset"),session);
	  				} else
	  				if ("day".equals(jsonMessage.getString("scale"))) {
	  					sessionHandler.provideDayBins(jsonMessage.getString("dataset"),session);
	  				} else
	  				if ("halfDay".equals(jsonMessage.getString("scale"))) {
	  					sessionHandler.provideHalfDayBins(jsonMessage.getString("dataset"),session);
	  				}
	  			} else {
	  			System.out.println("user requests the patterns of user "+jsonMessage.getString("user")+" in dataset "+jsonMessage.getString("dataset"));
	  			sessionHandler.providePatterns(jsonMessage.getString("user"), jsonMessage.getString("dataset"),session);
	  			}
	  		}
	  	}
		if ("steerOnPattern".equals(jsonMessage.getString("action"))) {
			System.out.println("ServerEndpoint : receive steering request on pattern id "+jsonMessage.getInt("patternId"));
	  		sessionHandler.requestSteeringOnPattern(jsonMessage.getInt("patternId"),session);
	  	}
		if ("steerOnUser".equals(jsonMessage.getString("action"))) {
	  		sessionHandler.requestSteeringOnUser(jsonMessage.getString("userId"),session);
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
	
	
	public String listDatasets() {
		return "Agavue";
	}
}
