package com.raveneau.ppmt.patterns;

public class Occurrence {

	private Integer seqId;
	private String user;
	private long[] timestamps;
	
	// Store the events, including the ones that create gaps
	//private ArrayList<Event> events;
	// Store the properties tied to the occurrence
	//private HashMap<String, String> properties;
	
	public Occurrence(Integer seqId, String user, long[] timestamps) {
		super();
		this.seqId = seqId;
		this.user = user;
		this.timestamps = timestamps;
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
