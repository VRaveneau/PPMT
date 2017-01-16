package com.raveneau.ppmt.datasets;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.json.JsonObject;
import javax.json.spi.JsonProvider;

import com.raveneau.ppmt.server.Messages;

public class Dataset {
	private String name;
	private ArrayList<String> events = null;
	private Map<String,String> eventsReadable = null;
	private Map<String,Integer> eventOccs = null;
	//private Map<String, List<Map<String,String>>> userSequences = null;	// < User : [ < Attribute : value > ] >
	private Map<String, List<Integer>> userSequences = null;
	private Map<String, Map<String,String>> tracesBounds = null;
	private int nbEvents = 0;
	private Date firstEvent = null;
	private Date lastEvent = null;
	private String inputPath = null;
	private boolean loading = false;
	private boolean loaded = false;
	
	/**
	 * Constructor method, defaults the value of StartLoading to true
	 * @param name Name of the dataset
	 * @param inputPath Path to the file containing the dataset
	 */
	public Dataset(String name, String inputPath) {
		this(name, inputPath, true);
	}

	/**
	 * Constructor method
	 * @param name Name of the dataset
	 * @param inputPath Path to the file containing the dataset
	 * @param startLoading If the dataset should start loading at the creation or later
	 */
	public Dataset(String name, String inputPath, boolean startLoading) {
		super();
		this.name = name;
		this.inputPath = inputPath;
		this.events = new ArrayList<>();
		this.eventsReadable = new HashMap<>();
		this.eventOccs = new HashMap<>();
		this.userSequences = new HashMap<>();
		this.tracesBounds = new HashMap<>();
		if (startLoading) {
			loadData();
		}
	}
	
	/**
	 * Load the data in the file targeted by inputPath
	 * Assumes that the events are ordered for each user
	 */
	public void loadData() {
		System.out.println("Starting to load the dataset");
		this.loading = true;
		Date loadStart = new Date();
		// read the file
		FileInputStream in = null;
		BufferedReader reader = null;
		try {
			in = new FileInputStream(new File(inputPath));
			reader = new BufferedReader(new InputStreamReader(in));
			String line;
			int lineCount = 0;
			// for each line (event)
			while ((line = reader.readLine()) != null) {
				// split the sequence according to ";" into tokens
				// type;start;end;user;chart;version;options...
				String[] properties = line.split(";");
				
				// Checks if the user is known
				if (!userSequences.containsKey(properties[3])) {
					ArrayList<Integer> a = new ArrayList<>();
					/****************************************
					HashMap<String,String> m = new HashMap<>();
					m.put("size", "0");
					m.put("first", "");
					m.put("last", "");
					ArrayList<Map<String,String>> a = new ArrayList<>();
					a.add(m);
					userSequences.put(properties[3], a);
					/****************************************/
					// good version
					HashMap<String, String> bounds = new HashMap<>();
					bounds.put("first", "");
					bounds.put("last", "");
					tracesBounds.put(properties[3], bounds);
					userSequences.put(properties[3], a);
				}
				// Checks if the event is known
				if (!events.contains(properties[0])) {
					events.add(properties[0]);
					eventOccs.put(properties[0], new Integer(1));
				} else {
					eventOccs.put(properties[0], new Integer(eventOccs.get(properties[0]).intValue()+1));
				}
				// Adds the data to the sequence
				Map<String,String> attributes = new HashMap<>();
				attributes.put("type",properties[0]);
				attributes.put("start",properties[1]);
				attributes.put("end",properties[2]);
				attributes.put("chart",properties[4]);
				attributes.put("version",properties[5]);
				for (int i=6;i<properties.length;i++) {
					String[] split = properties[i].split("=",2);
					if (split.length == 2)
						attributes.put(split[0], split[1]);
					/*else		Seems to always be when the sole parameter is 'none"'
						System.out.println("error in parameter split: "+properties[0] + " -> "+properties[i]);*/
				}
				//userSequences.get(properties[3]).add(attributes);
				// For the good version
				userSequences.get(properties[3]).add(new Integer(lineCount));
				lineCount++;
				
				// Updates if necessary the firstEvent and lastEvent fields
				SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
				/**********************************
				List<Map<String,String>> user = userSequences.get(properties[3]);
				user.get(0).put("size", Integer.toString(Integer.parseInt(user.get(0).get("size"))+1));
				try {
					Date eventDate = df.parse(properties[1]);
					String currentValueString = user.get(0).get("first");
					if (!currentValueString.equals("")) {
						Date currentValue = df.parse(currentValueString);
						if (currentValue == null || currentValue.after(eventDate)) {
							user.get(0).put("first", properties[1]);
						}
						currentValueString = user.get(0).get("last");
						currentValue = df.parse(currentValueString);
						if (currentValue == null || currentValue.before(eventDate)) {
							user.get(0).put("last", properties[1]);
						}
					} else {
						user.get(0).put("first", properties[1]);
						user.get(0).put("last", properties[1]);
					}
				} catch (ParseException e) {
					e.printStackTrace();
				}
				/**********************************/
				// Good version
				Map<String,String> userBounds = tracesBounds.get(properties[3]);
				try {
					Date eventDate = df.parse(properties[1]);
					String currentValueString = userBounds.get("first");
					if (!currentValueString.equals("")) {
						Date currentValue = df.parse(currentValueString);
						if (currentValue == null || currentValue.after(eventDate)) {
							userBounds.put("first", properties[1]);
						}
						currentValueString = userBounds.get("last");
						currentValue = df.parse(currentValueString);
						if (currentValue == null || currentValue.before(eventDate)) {
							userBounds.put("last", properties[1]);
						}
					} else {
						userBounds.put("first", properties[1]);
						userBounds.put("last", properties[1]);
					}
				} catch (ParseException e) {
					e.printStackTrace();
				}
				
				try {
					Date eventDate = df.parse(properties[1]);
					//System.out.println("Event start : "+properties[1]+" // Date : "+eventDate);
					if (firstEvent == null || firstEvent.after(eventDate)) {
						firstEvent = eventDate;
					}
					if (lastEvent == null || lastEvent.before(eventDate)) {
						lastEvent = eventDate;
					}
				} catch (ParseException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
				// Add an event to the count
				nbEvents++;
			}
			
			reader.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
		Date loadEnd = new Date();
		long loadTime = loadEnd.getTime() - loadStart.getTime();
		
		loadTrueEventNames("C:/Users/vincent/workspaceNeon/ProgressivePatternMiningTool/Data/Agavue/mapping.map");
		
		System.out.println("dataset loaded in "+loadTime+"ms.");
		this.loaded = true;
		this.loading = false;
	}
	
	public void loadTrueEventNames(String path) { // TODO Make sure the mapping file is the tight one
		// read the file
		FileInputStream in = null;
		BufferedReader reader = null;
		try {
			in = new FileInputStream(new File(path));
			reader = new BufferedReader(new InputStreamReader(in));
			String line;
			
			// for each line (event)
			while ((line = reader.readLine()) != null) {
				line = line.trim();
				String[] cutLine = line.split("\t");
				if (cutLine.length == 2) {
					eventsReadable.put(cutLine[1], cutLine[0]);
				}
			}
		}catch (IOException e) {
			e.printStackTrace();
		}
	}
	
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public int getNbEventType() {
		return events.size();
	}
	
	public int getNbEvent() {
		return nbEvents;
	}
	
	public int getNbSequences() {
		return userSequences.keySet().size();
	}
	public String getInputPath() {
		return inputPath;
	}
	public void setInputPath(String inputPath) {
		this.inputPath = inputPath;
	}
	
	public boolean isLoaded() {
		return loaded;
	}
	
	public boolean isLoading() {
		return loading;
	}
	
	public String getFirstEvent() {
		return firstEvent.toString();
	}
	
	public String getFirstEvent(String user) {
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		Date eventDate = null;
		try {
			eventDate = df.parse(tracesBounds.get(user).get("first"));
		} catch (ParseException e) {
			e.printStackTrace();
		}
		return eventDate.toString();
	}
	
	public String getLastEvent() {
		return lastEvent.toString();
	}
	
	public String getLastEvent(String user) {
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		Date eventDate = null;
		try {
			eventDate = df.parse(tracesBounds.get(user).get("last"));
		} catch (ParseException e) {
			e.printStackTrace();
		}
		return eventDate.toString();
	}
	
	public List<String> getUsers() {
		return new ArrayList<>(userSequences.keySet());
	}
	
	public List<String> getEventList() {
		return events;
	}
	
	public Map<String,Map<String,String>> getEventTypeInfo() {
		HashMap<String,Map<String,String>> res = new HashMap<>();
		
		for (String i : eventsReadable.keySet()) {
			Map<String,String> infos = new HashMap<>();
			infos.put("code", i);
			infos.put("nbOccs", eventOccs.get(eventsReadable.get(i)).toString());
			res.put(eventsReadable.get(i), infos);
		}
		
		return res;
	}
	
	/**
	 * Returns a String with information on a given user
	 * The syntax is of the form:
	 * 			username;eventNumber;firstEventDate;lastEventDate
	 * @param username The user
	 * @return
	 */
	public String getInfoOnUserToString(String username) {
		if (userSequences.containsKey(username)) {
			Map<String,String> trace = tracesBounds.get(username);
			return username+";"
					+userSequences.get(username).size()+";"
					+trace.get("first")+";"
					+trace.get("last");
			/*return username+";"			Good Version
					+trace.size()+";"
					+trace.get(0).get("start")+";"
					+trace.get(trace.size()-1).get("start");*/
		}
		return null;
	}
	
	private List<Map<String,String>> loadTrace(String user) {
		List<Integer> lines = userSequences.get(user);
		
		List<Map<String,String>> result = new ArrayList<>();
		
		FileInputStream in = null;
		BufferedReader reader = null;
		
		try {
			in = new FileInputStream(new File(inputPath));
			reader = new BufferedReader(new InputStreamReader(in));
			String line;
			int lineCount = 0;
			// for each line (event)
			while ((line = reader.readLine()) != null) {
				if (lines.contains(new Integer(lineCount))) {
					// split the sequence according to ";" into tokens
					// type;start;end;user;chart;version;options...
					String[] properties = line.split(";");
					
					// Adds the data to the sequence
					Map<String,String> attributes = new HashMap<>();
					attributes.put("type",properties[0]);
					attributes.put("start",properties[1]);
					attributes.put("end",properties[2]);
					attributes.put("chart",properties[4]);
					attributes.put("version",properties[5]);
					for (int i=6;i<properties.length;i++) {
						String[] split = properties[i].split("=",2);
						if (split.length == 2)
							attributes.put(split[0], split[1]);
						/*else		Seems to always be when the sole parameter is 'none"'
							System.out.println("error in parameter split: "+properties[0] + " -> "+properties[i]);*/
					}
					result.add(attributes);
				}
				lineCount++;
			}
			
			reader.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
		return result;
	}
	
	public List<Map<String,String>> getTrace(String user) {
		return loadTrace(user);
	}

	public List<String> getPatterns(String user) {
		FileInputStream in = null;
		BufferedReader reader = null;
		ArrayList<String> result = new ArrayList<>();
		try {
			in = new FileInputStream(new File("C:/Users/vincent/workspaceNeon/ProgressivePatternMiningTool/Data/Agavue/ReadablePatterns/readable-patterns_trace_"+user));
			reader = new BufferedReader(new InputStreamReader(in));
			String line;
			int lineCount = 0;
			// for each line (pattern)
			while ((line = reader.readLine()) != null) {
				line = line.split(" #SUP:")[0];
				result.add(line);
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
		return result;
	}
}
