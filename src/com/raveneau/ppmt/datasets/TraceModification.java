package com.raveneau.ppmt.datasets;

import java.util.ArrayList;
import java.util.List;

import com.raveneau.ppmt.events.Event;

public class TraceModification {
	private List<Integer> removedIds = new ArrayList<>();
	private List<Event> newEvents = new ArrayList<>();
	
	public TraceModification() {
		super();
	}

	public List<Integer> getRemovedIds() {
		return removedIds;
	}

	public void setRemovedIds(List<Integer> removedIds) {
		this.removedIds = removedIds;
	}

	public List<Event> getNewEvents() {
		return newEvents;
	}

	public void setNewEvents(List<Event> newEvents) {
		this.newEvents = newEvents;
	}
	
	public void addNewEvent(Event e) {
		this.newEvents.add(e);
	}
}
