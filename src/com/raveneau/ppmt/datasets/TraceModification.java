package com.raveneau.ppmt.datasets;

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
