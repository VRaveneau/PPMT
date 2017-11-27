package com.raveneau.ppmt.patterns;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
	private List<String> itemsReadable;
	private Integer support;

	private List<Occurrence> occurrences = new ArrayList<>();
	private List<Integer> sequenceId = new ArrayList<>();
	
	private Map<Integer,String> seqIdToUser = new HashMap<>();

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
	
	public Integer getSupport() {
		return support;
	}

	public void setSupport(Integer support) {
		this.support = support;
	}

	public List<Occurrence> getOccurrences() {
		return occurrences;
	}

	public List<Integer> getSequenceId() {
		return sequenceId;
	}

	public void setSequenceId(List<Integer> sequenceId) {
		this.sequenceId = sequenceId;
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
	
	public void addOccurrences(Integer seqId, String user, long[] ts) {
		this.occurrences.add(new Occurrence(seqId, user, ts));
		this.sequenceId.add(seqId);
		this.seqIdToUser.put(seqId, user);
	}
	
	public void setReadableItems(List<String> readableItems) {
		this.itemsReadable = readableItems;
	}
	
	public List<String> getReadableItems() {
		return itemsReadable;
	}
	
	public String getUserFromSeqId(Integer sId) {
		return seqIdToUser.get(sId);
	}
	
	public List<long[]> buildOccurrencesBinForUser(String userId) {
		List<long[]> ts = new ArrayList<>();
		for (Occurrence occ : occurrences) {
			if (occ.getUser().equals(userId))
				ts.add(occ.getTimestamps());
		}
		
		return ts;
	}
}
