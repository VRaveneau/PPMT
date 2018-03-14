package com.raveneau.ppmt.datasets;

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
	private int nbUsers = 0;
	private int nbEvents = 0;
	private int nbEventTypes = 0;
	private String duration = "";
	
	public DatasetParameters() {
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
