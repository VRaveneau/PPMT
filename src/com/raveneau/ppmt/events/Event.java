package com.raveneau.ppmt.events;

import java.util.List;

public class Event {
	private int id;
	private String type;
	private String user;
	private String start;
	private String end;
	private List<String> properties;
	
	public Event(int id, String type, String user, String start, String end, List<String> properties) {
		super();
		this.id = id;
		this.type = type;
		this.user = user;
		this.start = start;
		this.end = end;
		this.properties = properties;
	}

	public int getId() {
		return id;
	}

	public void setId(int id) {
		this.id = id;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public String getUser() {
		return user;
	}

	public void setUser(String user) {
		this.user = user;
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

	public List<String> getProperties() {
		return properties;
	}

	public void setProperties(List<String> properties) {
		this.properties = properties;
	}
	
	public void addProperty(String property) {
		this.properties.add(property);
	}
}
