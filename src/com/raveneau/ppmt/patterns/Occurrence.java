package com.raveneau.ppmt.patterns;

import java.util.ArrayList;
import java.util.HashMap;

public class Occurrence {

	private Pattern pattern;
	private ArrayList<Event> events;
	private HashMap<String, String> properties;
	
	public Occurrence(Pattern pattern, ArrayList<Event> events, HashMap<String, String> properties) {
		super();
		this.pattern = pattern;
		this.events = events;
		this.properties = properties;
	}
	public Pattern getPattern() {
		return pattern;
	}
	public void setPattern(Pattern pattern) {
		this.pattern = pattern;
	}
	public ArrayList<Event> getEvents() {
		return events;
	}
	public void setEvents(ArrayList<Event> events) {
		this.events = events;
	}
	public HashMap<String, String> getProperties() {
		return properties;
	}
	public void setProperties(HashMap<String, String> properties) {
		this.properties = properties;
	}
}
