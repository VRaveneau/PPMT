package com.raveneau.ppmt.patterns;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import javax.websocket.Session;

import com.raveneau.ppmt.datasets.Dataset;
import com.raveneau.ppmt.server.SessionHandler;

import java.util.List;

public class PatternManager {
	private int patternId = 0;
	private Map<String,Integer> patternItemsToId = new HashMap<>();
	private Map<Integer,String> patternIdToItems = new HashMap<>();
	private Map<String,List<Pattern>> patterns = new HashMap<>();
	private Map<String, String> userRenaming = new HashMap<>();
	private Map<String, String> eventsCoded = new HashMap<>();
	private Map<String, String> eventsReadable = new HashMap<>();
	private String inputPath = "/home/raveneau/data/Agavue/ReadablePatterns/";
	private Map<Integer, List<String>> patternIdToUser = new HashMap<>();
	
	private Map<Integer, ExtractionState> patternExtractionState = new HashMap<>();
	private Map<Integer, ExtractionState> levelExtractionState = new HashMap<>();
	
	private Map<Integer,Pattern> allPatterns = new HashMap<>();
	
	private Session session = null;
	private SessionHandler sessionHandler = null;
	private Dataset dataset = null;
	
	public PatternManager(Map<String, String> userRenamingInverted, Map<String, String> eventsCoded, Map<String, String> eventsReadable, Session session, SessionHandler sessionHandler, Dataset dataset) {
		super();
		System.out.println("creating the PatternManager");
		for (String k : userRenamingInverted.keySet()) {
			this.userRenaming.put(userRenamingInverted.get(k), k);
			//loadPatternsFromFile(userRenamingInverted.get(k));
		}
		this.session = session;
		this.dataset = dataset;
		this.sessionHandler = sessionHandler;
		this.eventsCoded = eventsCoded;
		this.eventsReadable = eventsReadable;
		
		System.out.println("PatternManager created");
	}
	
	public Map<String, Integer> getAllPatternsPlusSupport() {
		Map<String, Integer> result = new HashMap<>();
		for (String p : patternItemsToId.keySet()) {
			//result.put(p, value) // Finish to return the support + the pattern
		}
		return result;
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
	
	/**
	 * Loads a file of patterns
	 * Syntax no longer matching the pattern output of GSP
	 * @param user
	 */
	public void loadPatternsFromFile(String user) {
		Date loadStart = new Date();
		// read the file
		/*FileInputStream in = null;
		BufferedReader reader = null;
		
		String filePath = inputPath+"readable-patterns_trace_"+userRenaming.get(user);

		int lineCount = 0;
		try {
			in = new FileInputStream(new File(filePath));
			reader = new BufferedReader(new InputStreamReader(in));
			String line;
			// for each line (event)
			while ((line = reader.readLine()) != null) {
				String[] parts = line.split("#SID:");
				String[] sIdsString = parts[1].trim().split(" ");
				List<Integer> sIds = new ArrayList<>();
				for (String s : sIdsString) {
					sIds.add(Integer.parseInt(s));
				}
				parts = parts[0].trim().split("#SUP:");
				Integer support = Integer.parseInt(parts[1].trim());
				List<String> items = new ArrayList<String>(Arrays.asList(parts[0].trim().split(" ")));
				
				addPattern(items,support,sIds,user);
				lineCount++;
			}
			
			reader.close();
		} catch (IOException e) {
			e.printStackTrace();
		}*/
		Date loadEnd = new Date();
		long loadTime = loadEnd.getTime() - loadStart.getTime();
		
		//System.out.println(lineCount+" patterns loaded in "+loadTime+"ms.");
	}
	
	public void addPattern(List<String> items, Integer support, List<Integer> sIds, List<String> users, List<long[]> timestamps, boolean hasAllOccurrences) {
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
			
			/*if (i > sIds.size()-5)
				System.out.println("s, u, t : "+s+" - "+u+" - "+t[0]+","+t[1]);*/
			
			p.addOccurrences(s, u, t);
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
		
		this.sessionHandler.alertOfNewPattern(this.session, p);
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
		sessionHandler.signalStart(session, start);
	}

	/**
	 * Send to the client a message indicating that the algorithm has ended
	 * @param end The time (in ms) at which teh algorithm ended
	 */
	public void signalEnd(long end) {
		sessionHandler.signalEnd(session, end);
	}

	/**
	 * Send to the client a message indicating that a new level is starting to be investigated
	 * @param k The level (size of the candidates)
	 */
	public void signalNewLevel(int k) {
		sessionHandler.signalNewLevel(session, k);
		this.levelExtractionState.put(new Integer(k), ExtractionState.PARTIAL);
	}

	/**
	 * Send to the client a message indicating that the data is being loaded by the algorithm
	 */
	public void signalLoadingData() {
		sessionHandler.signalLoadingData(session);
	}

	/**
	 * Send to the client a message indicating that the data has been loaded by the algorithm
	 */
	public void signalDataLoaded() {
		sessionHandler.signalDataLoaded(session);
	}
	
	public void signalLevelExtracted(int k) {
		this.levelExtractionState.put(new Integer(k), ExtractionState.COMPLETE);
	}
	
	public ExtractionState getPatternExtractionState(Integer patternId) {
		return this.patternExtractionState.get(patternId);
	}
}
