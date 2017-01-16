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
		System.out.println("Client connected");
		sessionHandler.addSession(session);
	}
	
	@OnMessage
	public void handleMessage(String message, Session session) {
		JsonReader reader = Json.createReader(new StringReader(message));
		JsonObject jsonMessage = reader.readObject();
		
		if ("startMining".equals(jsonMessage.getString("action"))) {
	  		sessionHandler.startMining();
	  	}
		if ("stopMining".equals(jsonMessage.getString("action"))) {
	  		sessionHandler.stopMining();
	  	}
		if ("request".equals(jsonMessage.getString("action"))) {
	  		if ("dataset".equals(jsonMessage.getString("object"))) {
	  			System.out.println("user requests data on the "+jsonMessage.getString("dataset")+" dataset");
	  			sessionHandler.provideData(jsonMessage.getString("dataset"));
	  		} else
	  		if ("datasetInfo".equals(jsonMessage.getString("object"))) {
	  			System.out.println("user requests information on the "+jsonMessage.getString("dataset")+" dataset");
	  			sessionHandler.provideDatasetInfo(jsonMessage.getString("dataset"));
	  		} else
	  		if ("eventTypes".equals(jsonMessage.getString("object"))) {
	  			System.out.println("user requests event types on the "+jsonMessage.getString("dataset")+" dataset");
	  			sessionHandler.provideEventTypesInfo(jsonMessage.getString("dataset"));
	  		} else
	  		if ("trace".equals(jsonMessage.getString("object"))) {
	  			System.out.println("user requests the trace of user "+jsonMessage.getString("user")+" in dataset "+jsonMessage.getString("dataset"));
	  			sessionHandler.provideTrace(jsonMessage.getString("user"), jsonMessage.getString("dataset"));
	  		} else
	  		if ("patterns".equals(jsonMessage.getString("object"))) {
	  			System.out.println("user requests the patterns of user "+jsonMessage.getString("user")+" in dataset "+jsonMessage.getString("dataset"));
	  			sessionHandler.providePatterns(jsonMessage.getString("user"), jsonMessage.getString("dataset"));
	  		}
	  	}
		if ("steerOnPattern".equals(jsonMessage.getString("action"))) {
	  		sessionHandler.requestSteeringOnPattern(jsonMessage.getString("pattern"));
	  	}
	}
	
	@OnClose
	public void handleClose(Session session) {
		System.out.println("Client disconnected.");
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
