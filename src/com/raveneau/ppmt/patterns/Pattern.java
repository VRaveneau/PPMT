package com.raveneau.ppmt.patterns;

import java.util.List;

import javax.json.Json;
import javax.json.JsonArray;
import javax.json.JsonArrayBuilder;
import javax.json.JsonObject;
import javax.json.JsonObjectBuilder;
import javax.json.JsonString;
import javax.json.JsonValue;
import javax.json.spi.JsonProvider;

public class Pattern {

	private int id;
	private List<String> items;

	public Pattern(List<String> items) {
		super();
		this.setItems(items);
	}

	public int getId() {
		return id;
	}

	public void setId(int id) {
		this.id = id;
	}

	public List<String> getItems() {
		return items;
	}

	public void setItems(List<String> items) {
		this.items = items;
	}

	public String itemsToString() {
		String str = "";
		for (String i : items) {
			str += i + " ";
		}
		return str.trim();
	}

	public JsonObject itemsToJson() {
		
		JsonObjectBuilder job = Json.createObjectBuilder();
		JsonArrayBuilder jab = Json.createArrayBuilder();
    	for (String i : items) {
    		jab.add(i);
    	}
    	job.add("items", jab.build());
    	return job.build();
	}
}
