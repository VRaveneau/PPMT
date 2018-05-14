package com.raveneau.ppmt.datasets;

import java.util.ArrayList;
import java.util.List;

import com.raveneau.ppmt.events.Event;

public class TraceModification {
	private List<Integer> removedIds = new ArrayList<>();
	private List<Event> newEvents = new ArrayList<>();
	private List<String> removedEvents = new ArrayList<>();
	
	public TraceModification() {
		super();
	}

	public List<Integer> getRemovedIds() {
		return removedIds;
	}

	public void setRemovedIds(List<Integer> removedIds) {
		this.removedIds = removedIds;
	}
	
	public void addRemovedIds(List<Integer> removedIds) {
		this.removedIds.addAll(removedIds);
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
	
	public List<String> getRemovedEvents() {
		return removedEvents;
	}
	
	public void setRemovedEvents(List<String> oldEvents) {
		this.removedEvents = oldEvents;
	}
	
	public void addRemovedEvents(List<String> oldEvents) {
		this.removedEvents.addAll(oldEvents);
	}
	
	public void addRemovedEvent(String oldEvent) {
		this.removedEvents.add(oldEvent);
	}
}
