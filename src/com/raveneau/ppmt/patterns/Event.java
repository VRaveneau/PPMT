package com.raveneau.ppmt.patterns;

import java.util.HashMap;

public class Event {

	private String start;
	private String end;
	private String type;
	private HashMap<String, String> properties;
	
	public Event(String start, String end, String type, HashMap<String, String> properties) {
		super();
		this.start = start;
		this.end = end;
		this.type = type;
		this.properties = properties;
	}
	
	public String getStart() {
		return start;
	}
	public void setStart(String start) {
		this.start = start;
	}
	public String getEnd() {
		return end;
	}
	public void setEnd(String end) {
		this.end = end;
	}
	public String getType() {
		return type;
	}
	public void setType(String type) {
		this.type = type;
	}
	public HashMap<String, String> getProperties() {
		return properties;
	}
	public void setProperties(HashMap<String, String> properties) {
		this.properties = properties;
	}
	
	
}
