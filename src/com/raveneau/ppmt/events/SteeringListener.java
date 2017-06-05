package com.raveneau.ppmt.events;

import java.util.EventListener;

import javax.websocket.Session;

public interface SteeringListener extends EventListener { 
	void steeringRequestedOnPattern(String pattern);
	void steeringRequestedOnUser(String user);
	void steeringRequestedOnTime(String start, String end);
}
