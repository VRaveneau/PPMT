package com.raveneau.ppmt.events;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class Event implements Comparable<Event>{
	private int id;
	private String type;
	private String user;
	private Date start;
	private Date end;
	private List<String> properties;
	
	public Event(int id, String type, String user, Date start, Date end, List<String> properties) {
		super();
		this.id = id;
		this.type = type;
		this.user = user;
		this.start = start;
		this.end = end;
		this.properties = properties;
	}
	
	public Event(Event origin) {
		super();
		this.id = origin.getId();
		this.type = origin.getType();
		this.user = origin.getUser();
		this.start = origin.getStart();
		this.end = origin.getEnd();
		this.properties = new ArrayList<>(origin.getProperties());
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

	public Date getStart() {
		return start;
	}

	public void setStart(Date start) {
		this.start = start;
	}

	public Date getEnd() {
		return end;
	}

	public void setEnd(Date end) {
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
	
	public String toString() {
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		String result = this.type+";"+df.format(start)+";";
		if (this.end != null)
			result += df.format(end)+";";
		else
			result += ";";
		result += user;
		for(String prop : properties)
			result += ";"+prop;
		return result;
	}

	/**
	 * Compares this event to another. Order them by their start, or by their id if both start are the same
	 */
	@Override
	public int compareTo(Event o) {
		int dateComp = this.start.compareTo(o.getStart());
		if (dateComp != 0)
			return dateComp;
		else
			return this.id - o.getId();
	}
}
