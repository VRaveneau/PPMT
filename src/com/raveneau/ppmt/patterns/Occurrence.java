package com.raveneau.ppmt.patterns;

public class Occurrence {

	private Integer seqId;
	private String user;
	private long[] timestamps;
	private int[] eventIds;
	
	// Store the events, including the ones that create gaps
	//private ArrayList<Event> events;
	// Store the properties tied to the occurrence
	//private HashMap<String, String> properties;
	
	public Occurrence(Integer seqId, String user, long[] timestamps, int[] eventIds) {
		super();
		this.seqId = seqId;
		this.user = user;
		this.timestamps = timestamps;
		this.eventIds = eventIds;
	}

	public Integer getSeqId() {
		return seqId;
	}

	public void setSeqId(Integer seqId) {
		this.seqId = seqId;
	}

	public String getUser() {
		return user;
	}

	public void setUser(String user) {
		this.user = user;
	}

	public long[] getTimestamps() {
		return timestamps;
	}

	public void setTimestamps(long[] timestamps) {
		this.timestamps = timestamps;
	}

	public int[] getEventIds() {
		return eventIds;
	}

	public void setEventIds(int[] eventIds) {
		this.eventIds = eventIds;
	}
	/*
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
	}*/
}
