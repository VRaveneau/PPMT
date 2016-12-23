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
@ServerEndpoint("/serverendpointppmt")
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
		try (JsonReader reader = Json.createReader(new StringReader(message))) {
			JsonObject jsonMessage = reader.readObject();
			
			if ("startMining".equals(jsonMessage.getString("action"))) {
		  		sessionHandler.startMining();
		  	}
			if ("stopMining".equals(jsonMessage.getString("action"))) {
		  		sessionHandler.stopMining();
		  	}
			if ("request".equals(jsonMessage.getString("action"))) {
		  		if ("data".equals(jsonMessage.getString("object"))) {
		  			System.out.println("user requests data");
		  			sessionHandler.provideDatasetInfo();
		  			sessionHandler.provideData();
		  		}
		  	}
			if ("steerOnPattern".equals(jsonMessage.getString("action"))) {
		  		sessionHandler.requestSteeringOnPattern(jsonMessage.getString("pattern"));
		  	}
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
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
