package com.raveneau.ppmt.patterns;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;

import com.raveneau.ppmt.algorithms.SteeringTypes;
import com.raveneau.ppmt.server.ClientHandler;
import java.util.List;

public class PatternManager {
	private int patternId = 0;
	private Map<String,Integer> patternItemsToId = new HashMap<>();
	private Map<Integer,String> patternIdToItems = new HashMap<>();
	private Map<String,List<Pattern>> patterns = new HashMap<>();
	private Map<String, String> eventsCoded = new HashMap<>();
	private Map<String, String> eventsReadable = new HashMap<>();
	private Map<Integer, List<String>> patternIdToUser = new HashMap<>();
	
	private Map<Integer, ExtractionState> patternExtractionState = new HashMap<>();
	private Map<Integer, ExtractionState> levelExtractionState = new HashMap<>();
	
	private Map<Integer,Pattern> allPatterns = new HashMap<>();
	
	private ClientHandler clientHandler = null;
	
	public PatternManager(ClientHandler clientHandler) {
		this.clientHandler = clientHandler;
		this.eventsCoded = clientHandler.getDataset().getEventsCoded();
		this.eventsReadable = clientHandler.getDataset().getEventsReadable();
	}
	
	public PatternManager(PatternManager pm) {
		this.patternId = pm.patternId;
		this.patternItemsToId = new HashMap<>();
		for (Entry<String, Integer> kv : pm.patternItemsToId.entrySet()) {
			this.patternItemsToId.put(kv.getKey(), kv.getValue());
		}
		this.patternIdToItems = new HashMap<>();
		for (Entry<Integer, String> kv : pm.patternIdToItems.entrySet()) {
			this.patternIdToItems.put(kv.getKey(), kv.getValue());
		}
		this.patterns = new HashMap<>();
		for (Entry<String, List<Pattern>> kv : pm.patterns.entrySet()) {
			this.patterns.put(kv.getKey(), new ArrayList<>(kv.getValue()));
		}
		this.eventsCoded = new HashMap<>();
		for (Entry<String, String> kv : pm.eventsCoded.entrySet()) {
			this.eventsCoded.put(kv.getKey(), kv.getValue());
		}
		this.eventsReadable = new HashMap<>();
		for (Entry<String, String> kv : pm.eventsReadable.entrySet()) {
			this.eventsReadable.put(kv.getKey(), kv.getValue());
		}
		this.patternIdToUser = new HashMap<>();
		for (Entry<Integer, List<String>> kv : pm.patternIdToUser.entrySet()) {
			this.patternIdToUser.put(kv.getKey(), new ArrayList<>(kv.getValue()));
		}
		this.patternExtractionState = new HashMap<>();
		for (Entry<Integer, ExtractionState> kv : pm.patternExtractionState.entrySet()) {
			this.patternExtractionState.put(kv.getKey(), kv.getValue());
		}
		this.levelExtractionState = new HashMap<>();
		for (Entry<Integer, ExtractionState> kv : pm.levelExtractionState.entrySet()) {
			this.levelExtractionState.put(kv.getKey(), kv.getValue());
		}
		this.allPatterns = new HashMap<>();
		for (Entry<Integer, Pattern> kv : pm.allPatterns.entrySet()) {
			this.allPatterns.put(kv.getKey(), new Pattern(kv.getValue()));
		}
		this.clientHandler = pm.clientHandler;
	}
	
	public List<String> getAllPatterns() {
		List<String> result = new ArrayList<>();
		result.addAll(patternItemsToId.keySet());
		return result;
	}
	
	public List<Map<String,List<Integer>>> getPatternDistribution(String pattern) {
		List<Map<String,List<Integer>>> result = new ArrayList<>();
		for (String p : patternItemsToId.keySet()) {
			if (pattern.equals("["+p.replaceAll(" ", ", ")+"]")) {
				Integer id = patternItemsToId.get(p);
				List<String> users = patternIdToUser.get(id);
				for (String u : users) {
					Map<String, List<Integer>> thisUser = new HashMap<>();
					Pattern patternObject = getPatternById(u,id);
					thisUser.put(u, patternObject.getSequenceId());
					result.add(thisUser);
				}
			}
		}
		return result;
	}
	
	private Pattern getPatternById(String user, Integer id) {
		for (Pattern p : patterns.get(user)) {
			if (p.getId() == id.intValue())
				return p;
		}
		return null;
	}
	
	public void addPattern(List<String> items, Integer support, List<Integer> sIds, List<String> users, List<long[]> timestamps, List<int[]> eventIds,boolean hasAllOccurrences) {
		Pattern p = new Pattern(items);
		p.setSupport(support);
		//p.setSequenceId(sIds);
		
		String itemsString = items.toString();
		int currentPatternId = 0;
		if (!patternItemsToId.containsKey(itemsString)) {
			currentPatternId = patternId;
			p.setId(patternId);
			patternIdToItems.put(new Integer(patternId), itemsString);
			patternItemsToId.put(itemsString, new Integer(patternId));
			patternId++;
		} else {
			currentPatternId = patternItemsToId.get(itemsString).intValue();
			p.setId(patternItemsToId.get(itemsString).intValue());
		}
		
		if (hasAllOccurrences)
			patternExtractionState.put(new Integer(currentPatternId), ExtractionState.COMPLETE);
		else
			patternExtractionState.put(new Integer(currentPatternId), ExtractionState.PARTIAL);
		
		//System.out.println("seqs, users,ts : "+sIds.size()+" - "+users.size()+" - "+timestamps.size());
		// Adding all occurrences of the pattern
		for(int i=0; i < sIds.size(); i++) {
			// Adding the pattern occurrences
			/*if (i > sIds.size()-5) {
				System.out.println("i: "+i);
				System.out.println("sId: "+sIds.subList(i, sIds.size()));
				System.out.println("users: "+users.subList(i,users.size()));
				System.out.println("ts: "+timestamps.subList(i, timestamps.size()));
				
			}*/
			Integer s = sIds.get(i);
			String u = users.get(i);
			long[] t = timestamps.get(i);
			int[] e = eventIds.get(i);
			
			/*if (i > sIds.size()-5)
				System.out.println("s, u, t : "+s+" - "+u+" - "+t[0]+","+t[1]);*/
			
			p.addOccurrences(s, u, t, e);
			// Updating the user reference
			if (!patterns.containsKey(users.get(i)))
				patterns.put(users.get(i), new ArrayList<Pattern>());
			patterns.get(users.get(i)).add(p);
			// Updating the id reference
			if (!patternIdToUser.containsKey(new Integer(p.getId()))) {
				patternIdToUser.put(new Integer(p.getId()), new ArrayList<String>());
			}
			patternIdToUser.get(new Integer(p.getId())).add(users.get(i));
		}
		
		allPatterns.put(new Integer(p.getId()), p);
		
		//System.out.println("Pattern manager stored a new pattern: "+itemsString);
		
		List<String> readableItems = new ArrayList<>();
		for (String codedItem : items) {
			readableItems.add(eventsReadable.get(codedItem));
		}
		p.setReadableItems(readableItems);
		
		//System.out.println("Pattern "+itemsString+" decoded to "+p.getReadableItems());
		
		this.clientHandler.alertOfNewPattern(p);
	}

	public Pattern getPattern(int patternId) {
		return allPatterns.get(new Integer(patternId));
	}

	public Pattern getPattern(List<String> items) {
		return getPattern(getPatternId(items));
	}
	
	public Integer getPatternId(List<String> items) {
		String itemsString = items.toString();
		return patternItemsToId.get(itemsString);
	}
	
	/**
	 * Send to the client a message indicating that the algorithm is starting
	 * @param start The time (in ms) at which teh algorithm started
	 */
	public void signalStart(long start) {
		this.clientHandler.signalStart(start);
	}

	/**
	 * Send to the client a message indicating that the algorithm has ended
	 * @param end The time (in ms) at which teh algorithm ended
	 */
	public void signalEnd(long end) {
		this.clientHandler.signalEnd(end);
	}

	/**
	 * Send to the client a message indicating that a new level is starting to be investigated
	 * @param k The level (size of the candidates)
	 */
	public void signalNewLevel(int k) {
		this.clientHandler.signalNewLevel(k);
		this.levelExtractionState.put(new Integer(k), ExtractionState.PARTIAL);
	}

	public void signalCandidatesGenerated(int candidatesNumber) {
		this.clientHandler.signalCandidatesGenerated(candidatesNumber);
	}

	/**
	 * Send to the client a message indicating that the data is being loaded by the algorithm
	 */
	public void signalLoadingData() {
		this.clientHandler.signalLoadingData();
	}

	/**
	 * Send to the client a message indicating that the data has been loaded by the algorithm
	 */
	public void signalDataLoaded() {
		this.clientHandler.signalDataLoaded();
	}
	
	public void signalLevelExtracted(int k) {
		this.levelExtractionState.put(new Integer(k), ExtractionState.COMPLETE);
		this.clientHandler.signalLevelComplete(k);
	}
	
	public ExtractionState getPatternExtractionState(Integer patternId) {
		return this.patternExtractionState.get(patternId);
	}
	
	public void sendSteeringNotificationToClient(SteeringTypes type, String value) {
		switch (type) {
		case PATTERN:
			this.clientHandler.signalSteeringStarted("pattern", value);
			break;
		case TIME:
			this.clientHandler.signalSteeringStarted("time", value);
			break;
		case USER:
			this.clientHandler.signalSteeringStarted("user", value);
			break;
		default:
			break;
		}
	}

	public void sendSteeringEndNotificationToClient() {
		this.clientHandler.signalSteeringStop();
	}
}
