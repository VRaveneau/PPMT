package com.raveneau.ppmt.patterns;

/* This file is copyright (c) 20015-2020 Vincent Raveneau
* 
* This file is part of the PPMT software.
* 
* PPMT is free software: you can redistribute it and/or modify it under the
* terms of the GNU General Public License as published by the Free Software
* Foundation, either version 3 of the License, or (at your option) any later
* version.
* PPMT is distributed in the hope that it will be useful, but WITHOUT ANY
* WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
* A PARTICULAR PURPOSE. See the GNU General Public License for more details.
* You should have received a copy of the GNU General Public License along with
* PPMT. If not, see <http://www.gnu.org/licenses/>.
*/

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
