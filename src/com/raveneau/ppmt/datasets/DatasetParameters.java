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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import javax.json.JsonArrayBuilder;
import javax.json.JsonObject;
import javax.json.JsonObjectBuilder;
import javax.json.spi.JsonProvider;

public class DatasetParameters {
	private Map<String, String> eventDescriptions = new HashMap<>();
	private Map<String, List<String>> eventByCategories = new HashMap<>();
	private Map<String, String> eventCategories = new HashMap<>();
	private int nbUsers = 0;
	private int nbEvents = 0;
	private int nbEventTypes = 0;
	private String duration = "";
	
	public DatasetParameters() {
	}
	
	public DatasetParameters(DatasetParameters dsp) {
		nbUsers = dsp.nbUsers;
		nbEvents = dsp.nbEvents;
		nbEventTypes = dsp.nbEventTypes;
		duration = dsp.duration;
		eventDescriptions = new HashMap<>(dsp.eventDescriptions);
		eventCategories = new HashMap<>(dsp.getEventCategories());
		eventByCategories = new HashMap<>(dsp.eventByCategories);
	}

	public Map<String, String> getEventDescriptions() {
		return eventDescriptions;
	}

	public void setEventDescriptions(Map<String, String> eventDescriptions) {
		this.eventDescriptions = eventDescriptions;
	}

	public Map<String, List<String>> getEventByCategories() {
		return eventByCategories;
	}

	public void setEventByCategories(Map<String, List<String>> eventByCategories) {
		this.eventByCategories = eventByCategories;
	}

	public Map<String, String> getEventCategories() {
		return eventCategories;
	}

	public void setEventCategories(Map<String, String> eventCategories) {
		this.eventCategories = eventCategories;
	}
	
	public int getNbUsers() {
		return nbUsers;
	}

	public void setNbUsers(int nbUsers) {
		this.nbUsers = nbUsers;
	}

	public int getNbEvents() {
		return nbEvents;
	}

	public void setNbEvents(int nbEvents) {
		this.nbEvents = nbEvents;
	}

	public int getNbEventTypes() {
		return nbEventTypes;
	}

	public void setNbEventTypes(int nbEventTypes) {
		this.nbEventTypes = nbEventTypes;
	}

	public String getDuration() {
		return duration;
	}

	public void setDuration(String duration) {
		this.duration = duration;
	}

	public void addEventDescription(String eventType, String description) {
		eventDescriptions.put(eventType, description);
	}
	
	public void addEventToCategory(String event, String category) {
		if (!eventByCategories.containsKey(category))
			eventByCategories.put(category, new ArrayList<String>());
		eventByCategories.get(category).add(event);
		eventCategories.put(event, category);
	}
	
	public void removeEventType(String eventType) {
		eventDescriptions.remove(eventType);
		String cat = eventCategories.get(eventType);
		eventByCategories.get(cat).remove(eventType);
		eventCategories.remove(eventType);
		nbEventTypes--;
	}
	
	public void removeUser(String userName) {
		nbUsers--;
	}
	
	public JsonObject toJsonObject() {
		JsonProvider provider = JsonProvider.provider();
		
		JsonObjectBuilder dataMessage = provider.createObjectBuilder()
				.add("nbUsers", nbUsers)
				.add("nbEvents", nbEvents)
				.add("nbEventTypes", nbEventTypes)
				.add("duration", duration);
		JsonObjectBuilder descriptions = provider.createObjectBuilder();
		for (Entry<String, String> desc: eventDescriptions.entrySet()) {
			descriptions.add(desc.getKey(), desc.getValue().replaceAll("\"", ""));
		}
		JsonObjectBuilder categories = provider.createObjectBuilder();
		for (Entry<String, List<String>> cat: eventByCategories.entrySet()) {
			JsonArrayBuilder thisCategory = provider.createArrayBuilder();
			for (String evt : cat.getValue()) {
				thisCategory.add(evt.replaceAll("\"", ""));
			}
			categories.add(cat.getKey(), thisCategory.build());
		}
		dataMessage.add("eventDescription", descriptions.build());
		dataMessage.add("eventCategory", categories.build());
		
		return dataMessage.build();
	}
}
