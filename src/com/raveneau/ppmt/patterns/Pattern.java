package com.raveneau.ppmt.patterns;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

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
	
	public Pattern(Pattern p) {
		this.id = p.id;
		this.items = new ArrayList<>(p.items);
		this.itemsReadable = new ArrayList<>(p.itemsReadable);
		this.support = p.support;
		this.occurrences = new ArrayList<>(p.occurrences);
		this.sequenceId = new ArrayList<>(p.sequenceId);
		this.seqIdToUser = new HashMap<>();
		for (Entry<Integer, String> kv : p.seqIdToUser.entrySet()) {
			this.seqIdToUser.put(kv.getKey(), kv.getValue());
		}
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

	public javax.json.JsonObject itemsToJson() {
		
		JsonObjectBuilder job = Json.createObjectBuilder();
		JsonArrayBuilder jab = Json.createArrayBuilder();
    	for (String i : items) {
    		jab.add(i);
    	}
    	job.add("items", jab.build());
    	return job.build();
	}
	
	public void addOccurrences(Integer seqId, String user, long[] ts, int[] eventIds) {
		this.occurrences.add(new Occurrence(seqId, user, ts, eventIds));
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
	
	/**
	 * Provides the timestamps of every occurrence for a specific user
	 * @param userId The user whose occurrences we want
	 * @return The list of timestamps for all occurrences
	 * 
	 * TODO Make sure that the occs' eventIds are not needed (they are not if it's only for pattern distribution in sessions)
	 */
	public List<long[]> buildOccurrencesBinForUser(String userId) {
		List<long[]> ts = new ArrayList<>();
		for (Occurrence occ : occurrences) {
			if (occ.getUser().equals(userId))
				ts.add(occ.getTimestamps());
		}
		
		return ts;
	}
}
