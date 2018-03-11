package com.raveneau.ppmt.datasets;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.json.Json;
import javax.json.JsonArray;
import javax.json.JsonObject;
import javax.json.JsonObjectBuilder;
import javax.json.JsonReader;
import javax.json.spi.JsonProvider;
import javax.websocket.Session;

import com.diogoduailibe.lzstring4j.LZString;
import com.raveneau.ppmt.events.Event;
import com.raveneau.ppmt.patterns.PatternManager;
import com.raveneau.ppmt.server.SessionHandler;

public class Dataset {
	/**
	 * Name of the dataset
	 */
	private String name = null;
	/**
	 * All the event types in the dataset
	 */
	private ArrayList<String> events = new ArrayList<>();
	/**
	 * Map from an integer representation to an event type
	 */
	private Map<String,String> eventsReadable = new HashMap<>();	// coded : readable
	/**
	 * Map from an event type to an integer representation  
	 */
	private Map<String,String> eventsCoded = new HashMap<>();	// readable : coded
	/**
	 * Number of occurrences for each event type
	 */
	private Map<String,Integer> eventOccs = new HashMap<>();
	private List<Event> timeSortedEvents = new ArrayList<>();
	private Map<String, List<Event>> userSequences = new HashMap<>();	// < User : [event] >
	private int nbEvents = 0;
	private Date firstEvent = null;
	private Date lastEvent = null;
	/**
	 * Path to the csv file containing the dataset
	 */
	private String inputPath = null;
	/**
	 * Path to the json file containing the dataset's parameters
	 */
	private String inputPathParameters = null;
	private boolean loading = false;
	private boolean loaded = false;
	private int eventCompressionSize = 10000;
	private List<String> compressedEvents = new ArrayList<>();
	
	private int nextEventId = 0;
	private int nextEventTypeCode = 0;
	
	private JsonObject parameters = null;
	
	private Map<Session,PatternManager> patternManagers = new HashMap<>();
	
	private Map<Calendar,List<String>> dayBins = new HashMap<>();
	/* Properties attached to the bins defined in the "dayBins" attribute
	 * The indexing Calendar instances match each other, and the available String indexing the properties are the following:
	 * - eventTypes: the types of events encountered in the bin, as a List<String>
	 * - userNames: the user names encountered in the bin, as a List<String>
	 * - every event type listed by eventTypes: the number of time it appears, as an Integer
	 */
	private Map<Calendar,Map<String, Object>> binsProperties = new HashMap<>();
	
	//private Map<String,List<Map<String,String>>> registeredSequences = null;
	
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
		this.inputPath = inputPath+"/"+name+".csv";
		this.inputPathParameters = inputPath+"/"+name+".json";
		
		loadParameters();
		
		if (startLoading) {
			loadData();
		}
	}
	
	private Date getEventDate(int index) {
		if (index > timeSortedEvents.size())
			return null;
		return timeSortedEvents.get(index).getStart();
	}
	
	private Date getDateInEvent(String event) {
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		String date = event.split(";")[1];
		Date eventDate = null;
		try {
			eventDate = df.parse(date);
		} catch (ParseException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return eventDate;
	}
	/*
	private void compressEvents() {
		Date compressStart = new Date();
		System.out.println("Starting to compress the events, bins of "+eventCompressionSize);
		
		JsonProvider provider = JsonProvider.provider();
		JsonObjectBuilder eventPack = null;
		
		for (int i=0; i < timeSortedEvents.size(); i+= eventCompressionSize) {
			System.out.println(i+" events compressed");
			eventPack = provider.createObjectBuilder();
			int eventCount = 0;
			for (int j=i; j< Math.min(i+eventCompressionSize, timeSortedEvents.size()) ; j++) {
				String event = timeSortedEvents.get(j);
				eventPack.add(Integer.toString(eventCount), event);
				eventCount++;
			}
			if (eventCount > 0) {
				eventPack.add("numberOfEvents", eventCount);
				String compressed = LZString.compressToUTF16(eventPack.build().toString());
				compressedEvents.add(compressed);
			}
		}
		
		Date compressEnd = new Date();
		long compressTime = compressEnd.getTime() - compressStart.getTime();
		System.out.println("dataset loaded in "+compressTime+"ms.");
	}*/
	
	/**
	 * Load the parameters in the file targeted by inputPathParameters
	 */
	public void loadParameters() {
		try {
			JsonReader jsonReader = Json.createReader(new FileInputStream(new File(inputPathParameters)));
			parameters = jsonReader.readObject();
			jsonReader.close();
			System.out.println("Parameters for dataset "+name+":");
			System.out.println(parameters);
		} catch (FileNotFoundException e) {
			//e.printStackTrace();
			System.out.println("No parameter file for dataset "+name+":");
			parameters = Json.createObjectBuilder().build();
		} catch (Exception e) {
			e.printStackTrace();
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
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		try {
			in = new FileInputStream(new File(inputPath));
			reader = new BufferedReader(new InputStreamReader(in));
			Date previousEvent = null;
			String line;
			int lineCount = 0;
			// for each line (event)
			while ((line = reader.readLine()) != null) {
				// split the sequence according to ";" into tokens
				// type;start;end;user;options...
				String[] eventParts = line.split(";");
				
				int evtId = this.nextEventId++;
				String evtUser = eventParts[3];
				Date evtStart = null;
				Date evtEnd = null;
				String evtType = eventParts[0];
				List<String> evtProp = new ArrayList<>();
				
				for(int propIdx=4;propIdx<eventParts.length;propIdx++) {
					evtProp.add(eventParts[propIdx]);
				}
				try {
					evtStart = df.parse(eventParts[1]);
					if (eventParts[2].length() > 0)
						evtEnd = df.parse(eventParts[2]);
				} catch (ParseException e1) {
					e1.printStackTrace();
				}
				if (userSequences.get(evtUser) == null)
					userSequences.put(evtUser, new ArrayList<Event>());
				String userName = evtUser;
				// Checks if the event is known
				if (!events.contains(evtType)) {
					addEventType(evtType);
				}
				eventOccs.put(evtType, new Integer(eventOccs.get(evtType).intValue()+1));
				
				// Adds the data to the sequence
				String evt = "";
				for(int i =0; i < eventParts.length; i++) {
					evt += eventParts[i]+";";
				}
				evt = evt.substring(0, evt.length()-1);
				
				Event newEvent = new Event(evtId, evtType, evtUser, evtStart, evtEnd, evtProp);
				
				// Adds the event at its rightful place in the list
				if (previousEvent != null && previousEvent.after(evtStart)) {
					System.out.println("(line "+lineCount+") An event is not in order !!");
					System.out.println(previousEvent+" encountered before "+evtStart);
					
					int i = timeSortedEvents.size()-1;
					while(getEventDate(i).after(evtStart)) {
						i--;
						if (i == -1)
							break;
					}
					timeSortedEvents.add(i+1, newEvent);
					if (i == -1)
						System.out.println("Event inserted at position 0, before "+getEventDate(1));
					else
						System.out.println("Event inserted between "+getEventDate(i)+" and "+getEventDate(i+2));
					// Insert the event in the relevant user trace, keeping it sorted
					int traceLength = userSequences.get(userName).size();
					int candidatePos = traceLength - 1;
					while(candidatePos >= 0 &&
							userSequences.get(userName).get(i).getStart().after(evtStart)) {
						candidatePos--;
					}
					userSequences.get(userName).add(i+1,newEvent);
				} else {
					timeSortedEvents.add(newEvent);
					userSequences.get(userName).add(newEvent);
					previousEvent = evtStart;
				}
				
				// Updates if necessary the firstEvent and lastEvent fields
				//System.out.println("Event start : "+properties[1]+" // Date : "+eventDate);
				if (firstEvent == null || firstEvent.after(evtStart)) {
					firstEvent = evtStart;
				}
				if (lastEvent == null || lastEvent.before(evtStart)) {
					lastEvent = evtStart;
				}
				
				// Add to the relevant dayBin (a bin is half a day)
				Calendar day = GregorianCalendar.getInstance();
				day.setTime(evtStart);
				if (day.get(Calendar.HOUR_OF_DAY) < 12)
					day.set(Calendar.HOUR_OF_DAY,0);
				else
					day.set(Calendar.HOUR_OF_DAY,12);
				day.set(Calendar.MINUTE,0);
				day.set(Calendar.SECOND, 0);
				day.set(Calendar.MILLISECOND, 0);
				if (!dayBins.containsKey(day)) {
					dayBins.put(day, new ArrayList<String>());
					HashMap<String, Object> hm = new HashMap<>();
					hm.put("userNames", new ArrayList<String>());
					hm.put("eventTypes", new ArrayList<String>());
					binsProperties.put(day, hm);
				}
				dayBins.get(day).add(userName+";"+evt);
				lineCount++;
				
				// Update the properties of the bin
					// user name
				if (!((ArrayList<String>)binsProperties.get(day).get("userNames")).contains(userName))
					((ArrayList<String>)binsProperties.get(day).get("userNames")).add(userName);
					// event type and its number of occurrences
				if (!((ArrayList<String>)binsProperties.get(day).get("eventTypes")).contains(evtType)) {
					((ArrayList<String>)binsProperties.get(day).get("eventTypes")).add(evtType);
					binsProperties.get(day).put(evtType, new Integer(1));
				} else {
					binsProperties.get(day).put(
							evtType, 
							new Integer((Integer)binsProperties.get(day).get(evtType) + 1)
							);
				}
					
				// Add an event to the count
				nbEvents++;
				if (nbEvents%500000 == 0) {
					System.out.println(nbEvents+" events stored");
				}
			}
			
			reader.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
		Date loadEnd = new Date();
		long loadTime = loadEnd.getTime() - loadStart.getTime();
		
		
		// not used anymore
		// Server version
		//loadTrueEventNames("/home/raveneau/data/Agavue/mapping.map");
		//compressEvents();
		// Localhost version
		//loadTrueEventNames("C:/Users/vincent/workspaceNeon/ProgressivePatternMiningTool/Data/Agavue/mapping.map");
		
		System.out.println("dataset loaded in "+loadTime+"ms.");
		System.out.println(nbEvents+" events loaded among "+userSequences.size()+" users");
		this.loaded = true;
		this.loading = false;
		
		//this.patternManager = new PatternManager(userRenaming);
	}
	
	private void addEventType(String eventType) {
		events.add(eventType);
		eventOccs.put(eventType, new Integer(0));
		eventsReadable.put(String.valueOf(nextEventTypeCode), eventType);
		eventsCoded.put(eventType, String.valueOf(nextEventTypeCode));
		nextEventTypeCode++;
	}
	
	private void addEvent(String evtType, String evtUser, Date evtStart, Date evtEnd, List<String> evtProp) {
		/*int evtId = this.nextEventId++;
		
		eventOccs.put(evtType, new Integer(eventOccs.get(evtType).intValue()+1));
		Event newEvent = new Event(evtId, evtType, evtUser, evtStart, evtEnd, evtProp);
	*/}
	
	private void removeEvent() {
		
	}
	
	public void loadTrueEventNames(String path) { // TODO Make sure the mapping file is the right one
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
					eventsCoded.put(cutLine[0], cutLine[1]);
				}
			}
		}catch (IOException e) {
			e.printStackTrace();
		}
	}
	
	public void loadUserSequencesWindowLength(String path) {
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
	
	public JsonObject getParameters() {
		return parameters;
	}
	
	public String getFirstEvent() {
		return firstEvent.toString();
	}
	
	public Date getFirstEventDate() {
		return firstEvent;
	}

	public String getLastEvent() {
		return lastEvent.toString();
	}
	
	public Date getLastEventDate() {
		return lastEvent;
	}
	
	/**
	 * Returns the first event in the trace of a given user
	 * @param user The user
	 * @return
	 */
	public String getFirstEvent(String user) {
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		Date eventDate = userSequences.get(user).get(0).getStart();
		return df.format(eventDate);// eventDate.toString();
	}
	
	public String getLastEvent(String user) {
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		Date eventDate = userSequences.get(user).get(userSequences.get(user).size()-1).getStart();
		return df.format(eventDate);//eventDate.toString();
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
			// Add the informations from the parameters if present
			//	The event type description
			if (parameters.containsKey("eventDescription")) {
				JsonObject desc = parameters.getJsonObject("eventDescription");
				if (desc.containsKey(eventsReadable.get(i))) {
					infos.put("description", desc.getJsonString(eventsReadable.get(i)).getString());
				}
			}
			//	The event type category
			if (parameters.containsKey("eventCategory")) {
				JsonObject categories = parameters.getJsonObject("eventCategory");
				for (String category: categories.keySet()) {
					JsonArray eTypes = categories.getJsonArray(category);
					boolean found = false;
					for (int idx = 0; idx < eTypes.size(); idx++) {
						String type = eTypes.getString(idx);
						if (type.equals(eventsReadable.get(i))) {
							infos.put("category", category);
							found = true;
							break;
						}
					}
					if (found == true)
						break;
				}
			}
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
			List<Event> trace = userSequences.get(username);
			return username+";"
					+trace.size()+";"
					+getFirstEvent(username)+";"
					+getLastEvent(username);
		}
		return null;
	}
	
	public List<Event> getTrace(String user) {
		if (this.userSequences.containsKey(user)) {
			return this.userSequences.get(user);
		} else {
			return new ArrayList<>();
		}
	}

	public List<String> getPatterns(String user, Session session) {
		FileInputStream in = null;
		BufferedReader reader = null;
		ArrayList<String> result = new ArrayList<>();
		try {
			// Server version
			in = new FileInputStream(new File("/home/raveneau/data/Agavue/ReadablePatterns/readable-patterns_trace_"+user));
			// Localhost version
			//in = new FileInputStream(new File("C:/Users/vincent/workspaceNeon/ProgressivePatternMiningTool/Data/Agavue/ReadablePatterns/readable-patterns_trace_"+user));
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
	
	public List<List<String>> getHalfDayBin(String year, String month, String day, String hour) {
		Calendar givenDay = GregorianCalendar.getInstance();
		givenDay.set(Calendar.YEAR, Integer.parseInt(year));
		givenDay.set(Calendar.MONTH, Integer.parseInt(month));
		givenDay.set(Calendar.DAY_OF_MONTH, Integer.parseInt(day));
		if (Integer.parseInt(hour) < 12)
			givenDay.set(Calendar.HOUR_OF_DAY, 0);
		else
			givenDay.set(Calendar.HOUR_OF_DAY, 12);
		givenDay.set(Calendar.MINUTE, 0);
		givenDay.set(Calendar.SECOND, 0);
		givenDay.set(Calendar.MILLISECOND, 0);
		givenDay.getTime();

		Calendar givenMonth = GregorianCalendar.getInstance();
		givenMonth.set(Calendar.YEAR, Integer.parseInt(year));
		givenMonth.set(Calendar.MONTH, Integer.parseInt(month));
		givenMonth.set(Calendar.DAY_OF_MONTH, 1);
		givenMonth.getTime();
		
		if(givenDay.get(Calendar.MONTH) == givenMonth.get(Calendar.MONTH)) {
			String dayStart = ""+year+"-"+Integer.toString(givenDay.get(Calendar.MONTH)+1)+"-"+day;
			String dayEnd = ""+year+"-"+Integer.toString(givenDay.get(Calendar.MONTH)+1)+"-"+day;
			if (Integer.parseInt(hour) < 12) {
				dayStart += " 00:00:00";
				dayEnd += " 11:59:59";
			} else {
				dayStart += " 12:00:00";
				dayEnd += " 23:59:59";
			}
			ArrayList<List<String>> result = new ArrayList<>();
			ArrayList<String> limits = new ArrayList<>();
			ArrayList<String> eventSupports = new ArrayList<>();
			limits.add(dayStart);
			limits.add(dayEnd);
			result.add(limits);
			if (dayBins.containsKey(givenDay)) {
				result.add(dayBins.get(givenDay));
				result.add((List<String>)binsProperties.get(givenDay).get("userNames"));
				result.add((List<String>)binsProperties.get(givenDay).get("eventTypes"));
				for (String eType : (List<String>)binsProperties.get(givenDay).get("eventTypes")) {
					eventSupports.add(eType+":"+(Integer)(binsProperties.get(givenDay).get(eType)));
				}
				result.add(eventSupports);
			}
			return result;
		}
		return new ArrayList<List<String>>();
	}
	
	public List<List<String>> getDayBin(String year, String month, String day) {
		/*Calendar givenDay = GregorianCalendar.getInstance();
		givenDay.set(Calendar.YEAR, Integer.parseInt(year));
		givenDay.set(Calendar.MONTH, Integer.parseInt(month));
		givenDay.set(Calendar.DAY_OF_MONTH, Integer.parseInt(day));
		givenDay.set(Calendar.HOUR_OF_DAY, 0);
		givenDay.set(Calendar.MINUTE, 0);
		givenDay.set(Calendar.SECOND, 0);
		givenDay.set(Calendar.MILLISECOND, 0);
		givenDay.getTime();
		// REWORK THE FUNCTION TO CALL getHalfDayBin
		Calendar givenMonth = GregorianCalendar.getInstance();
		givenMonth.set(Calendar.YEAR, Integer.parseInt(year));
		givenMonth.set(Calendar.MONTH, Integer.parseInt(month));
		givenMonth.set(Calendar.DAY_OF_MONTH, 1);
		givenMonth.getTime();
		
		if(givenDay.get(Calendar.MONTH) == givenMonth.get(Calendar.MONTH)) {
			String dayStart = ""+year+"-"+Integer.toString(givenDay.get(Calendar.MONTH)+1)+"-"+day+" 00:00:00";
			String dayEnd = ""+year+"-"+Integer.toString(givenDay.get(Calendar.MONTH)+1)+"-"+day+" 23:59:59";
			ArrayList<List<String>> result = new ArrayList<>();
			ArrayList<String> limits = new ArrayList<>();
			limits.add(dayStart);
			limits.add(dayEnd);
			result.add(limits);
			if (dayBins.containsKey(givenDay))
				result.add(dayBins.get(givenDay));
			return result;
		}
		return new ArrayList<List<String>>();*/
		
		ArrayList<List<String>> result = new ArrayList<>();
		List<String> limits = new ArrayList<>();
		List<String> bin = new ArrayList<>();
		List<String> eventTypes = new ArrayList<>();
		List<String> userNames = new ArrayList<>();
		List<Integer> supports = new ArrayList<>();
		List<String> supportEvents = new ArrayList<>();
		
		List<List<String>> halfDayBin = getHalfDayBin(year, month, day, "0");
		if (!halfDayBin.isEmpty()) {
			limits.add(halfDayBin.get(0).get(0));
			if (halfDayBin.size() == 5) {
				bin.addAll(halfDayBin.get(1));
				userNames.addAll(halfDayBin.get(2));
				eventTypes.addAll(halfDayBin.get(3));
				for (String s : halfDayBin.get(4)) {
					String[] parts = s.split(":");
					supports.add(new Integer(parts[1]));
					supportEvents.add(parts[0]);
				}
			}
		}
		halfDayBin = getHalfDayBin(year, month, day, "12");
		if (!halfDayBin.isEmpty()) {
			limits.add(halfDayBin.get(0).get(1));
			if (halfDayBin.size() == 5) {
				bin.addAll(halfDayBin.get(1));
				for (String uN : halfDayBin.get(2)) {	// User names
					if (!userNames.contains(uN))
						userNames.add(uN);
				}
				for (String eT : halfDayBin.get(3)) {	// Event types
					if (!eventTypes.contains(eT)) {
						eventTypes.add(eT);
						supports.add(new Integer(0));
						supportEvents.add(eT);
					}
				}
				for (String s : halfDayBin.get(4)) {
					String[] parts = s.split(":");
					int index = supportEvents.indexOf(parts[0]);
					Integer currentSupport = supports.get(index);
					currentSupport += Integer.parseInt(parts[1]);
					supports.remove(index);
					supports.add(index, currentSupport);
				}
			}
		}
		
		List<String> finalSupport = new ArrayList<>();
		for (int i=0; i < supports.size(); i++)
			finalSupport.add(supportEvents.get(i)+":"+supports.get(i));
		
		if (!limits.isEmpty())
			result.add(limits);
		if (!bin.isEmpty())
			result.add(bin);
		if (!userNames.isEmpty())
			result.add(userNames);
		if (!eventTypes.isEmpty())
			result.add(eventTypes);
		if (!finalSupport.isEmpty())
			result.add(finalSupport);
		return result;
	}
	
	public List<List<String>> getHalfMonthBin(String year, String month, int monthHalf) {
		Calendar givenMonth = GregorianCalendar.getInstance();
		givenMonth.set(Calendar.YEAR, Integer.parseInt(year));
		givenMonth.set(Calendar.MONTH, Integer.parseInt(month));
		givenMonth.getTime();
		
		int daysInGivenMonth = givenMonth.getActualMaximum(Calendar.DAY_OF_MONTH);
		int firstDay = 1;
		int lastDay = 31;
		switch(daysInGivenMonth) {
		case 28:
			firstDay = 1+14*monthHalf;
			lastDay = 14+14*monthHalf;
			break;
		case 29:
			firstDay = 1+14*monthHalf;
			lastDay = 14+15*monthHalf;
			break;
		case 30:
			firstDay = 1+15*monthHalf;
			lastDay = 15+15*monthHalf;
			break;
		case 31:
			firstDay = 1+15*monthHalf;
			lastDay = 15+16*monthHalf;
			break;
		default:
			System.out.println("Error, trying to cut in half a month of "+daysInGivenMonth+" days ("+givenMonth.getTime()+")");
		}
		
		ArrayList<List<String>> result = new ArrayList<>();
		List<String> limits = new ArrayList<>();
		List<String> bin = new ArrayList<>();
		List<String> eventTypes = new ArrayList<>();
		List<String> userNames = new ArrayList<>();
		List<Integer> supports = new ArrayList<>();
		List<String> supportEvents = new ArrayList<>();
		String lastEnd = null;
		
		for (int i=firstDay; i <= lastDay; i++) {
			List<List<String>> dayBin = getDayBin(year, month, Integer.toString(i));
			if (i == firstDay) {
				limits.add(dayBin.get(0).get(0));
			}
			if (!dayBin.isEmpty()) {
				lastEnd = dayBin.get(0).get(1);
				if (dayBin.size() == 5) {
					bin.addAll(dayBin.get(1));
					for (String uN : dayBin.get(2)) {	// User names
						if (!userNames.contains(uN))
							userNames.add(uN);
					}
					for (String eT : dayBin.get(3)) {	// Event types
						if (!eventTypes.contains(eT)) {
							eventTypes.add(eT);
							supports.add(new Integer(0));
							supportEvents.add(eT);
						}
					}
					for (String s : dayBin.get(4)) {
						String[] parts = s.split(":");
						int index = supportEvents.indexOf(parts[0]);
						Integer currentSupport = supports.get(index);
						currentSupport += Integer.parseInt(parts[1]);
						supports.remove(index);
						supports.add(index, currentSupport);
					}
				}
			}
		}
		limits.add(lastEnd);
		result.add(limits);
		result.add(bin);
		
		List<String> finalSupport = new ArrayList<>();
		for (int i=0; i < supports.size(); i++)
			finalSupport.add(supportEvents.get(i)+":"+supports.get(i));
		
		result.add(userNames);
		result.add(eventTypes);
		result.add(finalSupport);
		
		return result;
	}
	
	public List<List<String>> getMonthBin(String year, String month) {
		ArrayList<List<String>> result = new ArrayList<>();
		List<String> limits = new ArrayList<>();
		List<String> bin = new ArrayList<>();
		List<String> eventTypes = new ArrayList<>();
		List<String> userNames = new ArrayList<>();
		List<Integer> supports = new ArrayList<>();
		List<String> supportEvents = new ArrayList<>();
		String lastEnd = null;
		
		for (int i=1; i <= 31; i++) {
			List<List<String>> dayBin = getDayBin(year, month, Integer.toString(i));
			if (i == 1) {
				limits.add(dayBin.get(0).get(0));
			}
			if (!dayBin.isEmpty()) {
				lastEnd = dayBin.get(0).get(1);
				if (dayBin.size() == 5) {
					bin.addAll(dayBin.get(1));
					for (String uN : dayBin.get(2)) {	// User names
						if (!userNames.contains(uN))
							userNames.add(uN);
					}
					for (String eT : dayBin.get(3)) {	// Event types
						if (!eventTypes.contains(eT)) {
							eventTypes.add(eT);
							supports.add(new Integer(0));
							supportEvents.add(eT);
						}
					}
					for (String s : dayBin.get(4)) {
						String[] parts = s.split(":");
						int index = supportEvents.indexOf(parts[0]);
						Integer currentSupport = supports.get(index);
						currentSupport += Integer.parseInt(parts[1]);
						supports.remove(index);
						supports.add(index, currentSupport);
					}
				}
			}
		}
		limits.add(lastEnd);
		result.add(limits);
		result.add(bin);
		
		List<String> finalSupport = new ArrayList<>();
		for (int i=0; i < supports.size(); i++)
			finalSupport.add(supportEvents.get(i)+":"+supports.get(i));
		
		result.add(userNames);
		result.add(eventTypes);
		result.add(finalSupport);
		
		return result;
	}
	
	public List<List<String>> getYearBin(String year) {
		ArrayList<List<String>> result = new ArrayList<>();
		List<String> limits = new ArrayList<>();
		List<String> bin = new ArrayList<>();
		List<String> eventTypes = new ArrayList<>();
		List<String> userNames = new ArrayList<>();
		List<Integer> supports = new ArrayList<>();
		List<String> supportEvents = new ArrayList<>();
		String lastEnd = null;
		
		for (int i=0; i < 12; i++) {
			List<List<String>> monthBin = getMonthBin(year, Integer.toString(i));
			if (i == 0) {
				limits.add(monthBin.get(0).get(0));
			}
			if (!monthBin.isEmpty()) {
				lastEnd = monthBin.get(0).get(1);
				if (monthBin.size() == 5) {
					bin.addAll(monthBin.get(1));
					for (String uN : monthBin.get(2)) {	// User names
						if (!userNames.contains(uN))
							userNames.add(uN);
					}
					for (String eT : monthBin.get(3)) {	// Event types
						if (!eventTypes.contains(eT)) {
							eventTypes.add(eT);
							supports.add(new Integer(0));
							supportEvents.add(eT);
						}
					}
					for (String s : monthBin.get(4)) {
						String[] parts = s.split(":");
						int index = supportEvents.indexOf(parts[0]);
						Integer currentSupport = supports.get(index);
						currentSupport += Integer.parseInt(parts[1]);
						supports.remove(index);
						supports.add(index, currentSupport);
					}
				}
			}
		}
		limits.add(lastEnd);
		result.add(limits);
		result.add(bin);
		
		List<String> finalSupport = new ArrayList<>();
		for (int i=0; i < supports.size(); i++)
			finalSupport.add(supportEvents.get(i)+":"+supports.get(i));
		
		result.add(userNames);
		result.add(eventTypes);
		result.add(finalSupport);
		
		return result;
	}
	
	public List<String> getAllPatterns(Session session) {
		return patternManagers.get(session).getAllPatterns();
	}
	
	public List<String> getPatternDistribution(String pattern, Session session) {
		List<Map<String,List<Integer>>> sequencesPerUser = patternManagers.get(session).getPatternDistribution(pattern);
		List<Map<List<String>,List<Integer>>> result = new ArrayList<>();
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		
		for (Map<String,List<Integer>> userSeq : sequencesPerUser) {
			for (String u : userSeq.keySet()) {
				String firstEvent = getFirstEvent(u);
				String lastEvent = getLastEvent(u);
				try {
					Date firstEventDate = df.parse(firstEvent);
					Date lastEventDate = df.parse(lastEvent);
					Calendar firstDay = GregorianCalendar.getInstance();
					Calendar lastDay = GregorianCalendar.getInstance();
					firstDay.setTime(firstEventDate);
					firstDay.set(Calendar.MILLISECOND, 0);
					lastDay.setTime(lastEventDate);
					lastDay.set(Calendar.MILLISECOND, 0);
					
					long timeSpan = lastDay.getTimeInMillis() - firstDay.getTimeInMillis();
					
				} catch (ParseException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
				
			}
		}
		
		
		return null;//result;
	}
	
	public List<Event> getEvents() {
		return getEvents(0,nbEvents);
	}
	
	public List<Event> getEvents(int firstIndex, int count) {
		if (firstIndex < nbEvents) {
			return timeSortedEvents.subList(firstIndex, firstIndex+count);
		}
		return null;
	}
	
	public List<String> getCompressedEvents() {
		return compressedEvents;
	}
	
	public List<List<String>> getDatasetForMining(int windowSize) {
		Date loadStart = new Date();
		int userCount = 0;
		
		List<List<String>> result = new ArrayList<>();
		
		System.out.println("UserSequences is of size "+userSequences.size());
		System.out.println("UserSequences.keySet() is of size "+userSequences.keySet().size());
		
		for (String user : userSequences.keySet()) {	// For each user in the dataset
			List<String> currentUserSequence = new ArrayList<>();
			Calendar eventCal = null;
			
			int userDisplayStep = userSequences.size() / 10;
			
			if (userCount%userDisplayStep == 0) {
				System.out.println(userCount+"/"+userSequences.size()+" users done");
				System.out.println("Mineable dataset is of size "+result.size());
			}
			userCount++;

			System.out.println("Doing user "+userCount);
			
			for (Event event : userSequences.get(user)) {	// For each event of the user
				Date eventDate = event.getStart();
				eventCal = GregorianCalendar.getInstance();
				eventCal.setTime(eventDate);
				eventCal.set(Calendar.MILLISECOND,0);

				// type(coded as integer);start(in milliseconds);user;id
				String eventData = eventsCoded.get(event.getType())+";"+eventCal.getTimeInMillis()+";"+event.getUser()+";"+event.getId();
				
				currentUserSequence.add(eventData);
				
			}
			result.add(currentUserSequence);
		}
		Date loadEnd = new Date();
		long loadTime = loadEnd.getTime() - loadStart.getTime();
		System.out.println("Mineable dataset created in "+loadTime+"ms.");
		
		System.out.println("Returning "+result.size()+" windows.");
		return result;
	}
	
	/**
	 * Old version of the method, cuts the traces in overlapping windows
	 * @param windowSize
	 * @return
	 */
	public List<List<String>> getDatasetForMining_forSequentialPatterns(int windowSize) {
		Date loadStart = new Date();
		int userCount = 0;
		
		List<List<String>> result = new ArrayList<>();
		for (String user : userSequences.keySet()) {	// For each user in the dataset
			List<String> window = new ArrayList<>();
			List<String> overlappingWindow = new ArrayList<>();
			Calendar windowStart = null;
			Calendar windowEnd = null;
			Calendar overlappingWindowStart = null;
			Calendar overlappingWindowEnd = null;
			Calendar eventCal = null;
			
			if (userCount%10000 == 0)
				System.out.println(userCount+" user done");
			userCount++;
			
			for (Event event : userSequences.get(user)) {	// For each event of the user
				Date eventDate = event.getStart();
				eventCal = GregorianCalendar.getInstance();
				eventCal.setTime(eventDate);
				eventCal.set(Calendar.MILLISECOND,0);

				// type(coded as integer);start(in milliseconds);user
				String eventData = eventsCoded.get(event.getType())+";"+eventCal.getTimeInMillis()+";"+event.getUser();
				
				if (windowStart == null) {		// First event for this user, initialize the first 2 windows
					windowStart = (Calendar) eventCal.clone();
					
					windowEnd = (Calendar) windowStart.clone();
					windowEnd.add(Calendar.SECOND, windowSize/2);
					
					overlappingWindowStart = (Calendar) eventCal.clone();
					
					overlappingWindowEnd = (Calendar) overlappingWindowStart.clone();
					overlappingWindowEnd.add(Calendar.SECOND, windowSize);
					
					window.add(eventData);
					overlappingWindow.add(eventData);
				} else {		// All events of the user but the first
					if (eventCal.before(windowEnd)) {		// Event in the current window
						window.add(eventData);
						if (!eventCal.before(overlappingWindowStart)) {	// Event also in the overlapping window
							overlappingWindow.add(eventData);
						}
					} else {		// Event not in the current window
						if (!eventCal.before(overlappingWindowStart)) {	// Event in the overlapping window
							overlappingWindow.add(eventData);
							// Swapping the windows
							result.add(window);
							window = overlappingWindow;
							windowStart = (Calendar) overlappingWindowStart.clone();
							windowEnd = (Calendar) overlappingWindowEnd.clone();
							overlappingWindow = new ArrayList<>();
							overlappingWindowStart.add(Calendar.SECOND, windowSize);
							overlappingWindowEnd.add(Calendar.SECOND, windowSize);
						} else {	// Event not in the window nor in the overlapping window
							result.add(window);
							result.add(overlappingWindow);
							long timeInterval = (eventCal.getTimeInMillis() - windowStart.getTimeInMillis())/1000;
							long steps = timeInterval / windowSize;
							timeInterval = (steps -1) * windowSize;
							window = new ArrayList<>();
							overlappingWindow = new ArrayList<>();
							while (timeInterval > Integer.MAX_VALUE) {	// Make sure we're not losing information
								windowStart.add(Calendar.SECOND, Integer.MAX_VALUE);
								timeInterval -= Integer.MAX_VALUE;
							}
							windowStart.add(Calendar.SECOND, (int) timeInterval);
							windowEnd = (Calendar) windowStart.clone();
							windowEnd.add(Calendar.SECOND, windowSize);
							overlappingWindowStart = (Calendar) windowStart.clone();
							overlappingWindowStart.add(Calendar.SECOND, windowSize/2);
							overlappingWindowEnd = (Calendar) overlappingWindowStart.clone();
							overlappingWindowEnd.add(Calendar.SECOND, windowSize);
							// Aligning the windows with the event so that it is in both
							while (!(windowEnd.after(eventCal) && (!overlappingWindowStart.after(eventCal)))) {
								windowStart.add(Calendar.SECOND, windowSize);
								windowEnd.add(Calendar.SECOND, windowSize);
								overlappingWindowStart.add(Calendar.SECOND, windowSize);
								overlappingWindowEnd.add(Calendar.SECOND, windowSize);
							}
							// Now that the windows are in the right position
							window.add(eventData);
							overlappingWindow.add(eventData);
						}
					}
				}
			}
			// Add the final 2 windows if they are not empty
			if (window.size() > 0)
				result.add(window);
			if (overlappingWindow.size() > 0)
				result.add(overlappingWindow);
		}
		Date loadEnd = new Date();
		long loadTime = loadEnd.getTime() - loadStart.getTime();
		System.out.println("Mineable dataset created in "+loadTime+"ms.");
		
		System.out.println("Returning "+result.size()+" windows (overlapping).");
		return result;
	}
	
	public PatternManager getPatternManager(Session session) {
		if (patternManagers.containsKey(session))
			return patternManagers.get(session);
		else
			return null;
	}
	
	public Map<Session, PatternManager> getPatternManagers() {
		return this.patternManagers;
	}
	
	public void addPatternManagerToSession(Session session, SessionHandler sessionHandler) {
		patternManagers.put(session, new PatternManager(eventsCoded, eventsReadable, session, sessionHandler, this));
	}
	
	public void createEventTypeFromPattern(int patternId) {
		/*List<Integer> eventIdToDelete = new ArrayList<>();
		String newEventName = "event"+nextEventTypeCode;
		addEventType(newEventName);
		
		Event newEvent = new Event(evtId, evtType, evtUser, evtStart, evtEnd, evtProp);
		eventOccs.put(evtType, new Integer(eventOccs.get(evtType).intValue()+1));
	*/}
}
