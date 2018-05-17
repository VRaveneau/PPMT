package com.raveneau.ppmt.datasets;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collection;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;
import java.util.Map.Entry;
import java.util.TreeSet;

import javax.json.Json;
import javax.json.JsonArray;
import javax.json.JsonObject;
import javax.json.JsonReader;
import javax.json.JsonValue;
import javax.json.spi.JsonProvider;
import javax.websocket.Session;

import com.raveneau.ppmt.events.Event;
import com.raveneau.ppmt.patterns.Occurrence;
import com.raveneau.ppmt.patterns.Pattern;
import com.raveneau.ppmt.patterns.PatternManager;

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
	private TreeSet<Event> timeSortedEvents = new TreeSet<>();
	private Map<String, TreeSet<Event>> userSequences = new HashMap<>();	// < User : [event] >
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
	
	private boolean global = true;
	
	private DatasetParameters parameters = new DatasetParameters();;
	
	private Map<Session,PatternManager> patternManagers = new HashMap<>();

	private DateFormat utcDateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
	
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
		
		utcDateFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
		
		loadParameters();
		
		if (startLoading) {
			loadData();
		}
	}
	
	public Dataset(Dataset ds, Session session) {
		this.name = ds.getName();
		this.events = new ArrayList<>(ds.getEventList());
		this.eventsReadable = new HashMap<>();
		for (Entry<String, String> kv : ds.getEventsReadable().entrySet()) {
			eventsReadable.put(kv.getKey(), kv.getValue());
		}
		this.eventsCoded = new HashMap<>();
		for (Entry<String, String> kv : ds.getEventsCoded().entrySet()) {
			eventsCoded.put(kv.getKey(), kv.getValue());
		}
		this.eventOccs = new HashMap<>();
		for (Entry<String, Integer> kv : ds.getEventOccs().entrySet()) {
			eventOccs.put(kv.getKey(), kv.getValue());
		}
		this.timeSortedEvents = new TreeSet<>(ds.getEvents());
		this.userSequences = new HashMap<>();
		for (Entry<String, TreeSet<Event>> kv : ds.getUserSequences().entrySet()) {
			this.userSequences.put(kv.getKey(), new TreeSet<>(kv.getValue()));
		}
		this.nbEvents = ds.getNbEvent();
		this.firstEvent = (Date) ds.getFirstEventDate().clone();
		this.lastEvent = (Date) ds.getLastEventDate().clone();
		this.inputPath = ds.getInputPath();
		this.inputPathParameters = ds.getInputPathParameters();
		this.loading = false;
		this.loaded = ds.isLoaded();
		this.eventCompressionSize = ds.getEventCompressionSize();
		this.compressedEvents = new ArrayList<>(ds.getCompressedEvents());
		this.nextEventId = ds.getNextEventId();
		this.nextEventTypeCode = ds.getNextEventTypeCode();
		this.global = false;
		this.parameters = new DatasetParameters(ds.getParameters());
		this.patternManagers = new HashMap<>();
		this.patternManagers.put(session, new PatternManager(ds.getPatternManager(session)));

		utcDateFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
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
			JsonObject params = jsonReader.readObject();
			jsonReader.close();
			System.out.println("Parameters for dataset "+name+":");
			System.out.println(params);
			
			// Store the read parameters
			if(params.containsKey("eventDescription")) {
				for( Entry<String, JsonValue> e : params.getJsonObject("eventDescription").entrySet()) {
					parameters.addEventDescription(e.getKey(), e.getValue().toString());
				}
			}
			if(params.containsKey("eventCategory")) {
				for( Entry<String, JsonValue> e : params.getJsonObject("eventCategory").entrySet()) {
					JsonArray arr = (JsonArray) e.getValue();
					for (JsonValue evt : arr) {
						parameters.addEventToCategory(evt.toString(), e.getKey());
					}
				}
			}
			if(params.containsKey("nbUsers")) {
				parameters.setNbUsers(params.getInt("nbUsers"));
			}
			if(params.containsKey("nbEvents")) {
				parameters.setNbEvents(params.getInt("nbEvents"));
			}
			if(params.containsKey("nbEventTypes")) {
				parameters.setNbEventTypes(params.getInt("nbEventTypes"));
			}
			if(params.containsKey("duration")) {
				parameters.setDuration(params.getString("duration"));
			}
			
		} catch (FileNotFoundException e) {
			//e.printStackTrace();
			System.out.println("No parameter file for dataset "+name+":");
		} catch (Exception e) {
			e.printStackTrace();
		}
		
		JsonProvider provider = JsonProvider.provider();
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
			String line;
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
					userSequences.put(evtUser, new TreeSet<Event>());
				String userName = evtUser;
				// Checks if the event type is known
				if (!events.contains(evtType)) {
					addEventType(evtType);
				}
				
				// Adds the data to the sequence
				String evt = "";
				for(int i =0; i < eventParts.length; i++) {
					evt += eventParts[i]+";";
				}
				evt = evt.substring(0, evt.length()-1);
				
				addEvent(evtType, evtUser, evtStart, evtEnd, evtProp);
					
				if (nbEvents%500000 == 0) {
					System.out.println(nbEvents+" events stored");
				}
			}
			firstEvent = timeSortedEvents.first().getStart();
			lastEvent = timeSortedEvents.last().getStart();
			
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
	
	private void addEventType(String eventType, String description) {
		addEventType(eventType);
		
		if (description.trim().length() == 0) {
			description = "???";
		} else {
			description = description.trim();
		}
		
		parameters.addEventDescription(eventType, description);
	}
	
	/**
	 * Creates a new event and returns it
	 * @param evtType
	 * @param evtUser
	 * @param evtStart
	 * @param evtEnd
	 * @param evtProp
	 * @return
	 */
	private Event addEvent(String evtType, String evtUser, Date evtStart, Date evtEnd, List<String> evtProp) {
		int evtId = this.nextEventId++;
		Event newEvent = new Event(evtId, evtType, evtUser, evtStart, evtEnd, evtProp);
		
		eventOccs.put(evtType, new Integer(eventOccs.get(evtType).intValue()+1));
		
		timeSortedEvents.add(newEvent);
		userSequences.get(evtUser).add(newEvent);
		// Add an event to the count
		nbEvents++;
		
		return newEvent;
	}
	
	private void removeEvent(Event e) {
		timeSortedEvents.remove(e);
		userSequences.get(e.getUser()).remove(e);
		nbEvents--;
	}
	
	private void removeEvents(Collection<Event> c) {
		timeSortedEvents.removeAll(c);
		HashMap<String, List<Event>> toBeRemoved = new HashMap<>();
		for(Event e : c) {
			if (!toBeRemoved.containsKey(e.getUser()))
				toBeRemoved.put(e.getUser(), new ArrayList<Event>());
			toBeRemoved.get(e.getUser()).add(e);
		}
		for(String u : toBeRemoved.keySet()) {
			userSequences.get(u).removeAll(toBeRemoved.get(u));
		}
		nbEvents-= c.size();
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
	public Map<String, String> getEventsReadable() {
		return eventsReadable;
	}

	public void setEventsReadable(Map<String, String> eventsReadable) {
		this.eventsReadable = eventsReadable;
	}

	public Map<String, String> getEventsCoded() {
		return eventsCoded;
	}

	public void setEventsCoded(Map<String, String> eventsCoded) {
		this.eventsCoded = eventsCoded;
	}

	public Map<String, Integer> getEventOccs() {
		return eventOccs;
	}

	public void setEventOccs(Map<String, Integer> eventOccs) {
		this.eventOccs = eventOccs;
	}
	
	public Map<String, TreeSet<Event>> getUserSequences() {
		return userSequences;
	}
	
	public TreeSet<Event> getUserSequence(String user) {
		return userSequences.get(user);
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
	public String getInputPathParameters() {
		return inputPathParameters;
	}
	
	public boolean isLoading() {
		return loading;
	}
	
	public boolean isLoaded() {
		return loaded;
	}
	
	public int getEventCompressionSize() {
		return eventCompressionSize;
	}
	
	public int getNextEventId() {
		return nextEventId;
	}
	
	public int getNextEventTypeCode() {
		return nextEventTypeCode;
	}
	
	public boolean isGlobal() {
		return global;
	}

	public void setGlobal(boolean global) {
		this.global = global;
	}

	public DatasetParameters getParameters() {
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
		Date eventDate = userSequences.get(user).first().getStart();
		return df.format(eventDate);// eventDate.toString();
	}
	
	public String getLastEvent(String user) {
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		Date eventDate = userSequences.get(user).last().getStart();
		return df.format(eventDate);//eventDate.toString();
	}
	
	/**
	 * Returns the first event in the trace of a given user
	 * @param user The user
	 * @return
	 */
	public Date getFirstEventDate(String user) {
		return userSequences.get(user).first().getStart();
	}
	
	public Date getLastEventDate(String user) {
		return userSequences.get(user).last().getStart();
	}
	
	public List<String> getUsers() {
		return new ArrayList<>(userSequences.keySet());
	}
	
	public List<String> getEventList() {
		return events;
	}
	
	// TODO Optimize it better, it is probably redundant
	public HashMap<String,Map<String,String>> getEventTypeInfo() {
		HashMap<String,Map<String,String>> res = new HashMap<>();
		
		for (String i : eventsReadable.keySet()) {
			Map<String,String> infos = new HashMap<>();
			infos.put("code", i);
			infos.put("nbOccs", eventOccs.get(eventsReadable.get(i)).toString());
			// Add the informations from the parameters if present
			//	The event type description
			Map<String, String> desc = parameters.getEventDescriptions();
			if (desc.containsKey(eventsReadable.get(i))) {
				infos.put("description", desc.get(eventsReadable.get(i)).replaceAll("\"", ""));
			} else {
				infos.put("description", "???");
			}
			//	The event type category
			Map<String, List<String>> categories = parameters.getEventByCategories();
			boolean found = false;
			for (String category: categories.keySet()) {
				List<String> eTypes = categories.get(category);
				for (int idx = 0; idx < eTypes.size(); idx++) {
					if (eTypes.get(idx).replaceAll("\"", "").equals(eventsReadable.get(i))) {
						infos.put("category", category);
						found = true;
						break;
					}
				}
				if (found == true)
					break;
			}
			if (!found) {
				infos.put("category", "userCreated");
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
			TreeSet<Event> trace = userSequences.get(username);
			return username+";"
					+trace.size()+";"
					+getFirstEvent(username)+";"
					+getLastEvent(username);
		}
		return null;
	}
	
	/**
	 * Returns a JsonObject with information on a given user
	 * The following fields are present:
	 * 	name
	 * 	eventNumber
	 * 	firstEventDate
	 * 	lastEventDate
	 * @param username The user
	 * @return
	 */
	public JsonObject getInfoOnUserToJson(String username) {
		if (userSequences.containsKey(username)) {
			TreeSet<Event> trace = userSequences.get(username);
			return JsonProvider.provider().createObjectBuilder()
					.add("name", username)
					.add("eventNumber", trace.size())
					.add("firstEventDate", utcDateFormat.format(getFirstEventDate(username)))
					.add("lastEventDate", utcDateFormat.format(getLastEventDate(username)))
					.build();
		}
		return null;
	}
	
	public List<Event> getTrace(String user) {
		if (this.userSequences.containsKey(user)) {
			return new ArrayList<>(this.userSequences.get(user));
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
	
	public Event getEventOfUserById(int eventId, String user) {
		for(Event e : userSequences.get(user)) {
			if (e.getId() == eventId)
				return e;
		}
		return null;
	}
	
	public List<Event> getEventsOfUserById(int[] eventIds, String user) {
		List<Event> result = new ArrayList<>();
		List<Integer> ids = new ArrayList<>();
		
		for(int i : eventIds) {
			ids.add(i);
		}
		
		for(Event e : userSequences.get(user)) {
			if (ids.contains(e.getId()))
				result.add(e);
		}
		return null;
	}
	
	public List<Event> getEventsOfUserById(List<Integer> eventIds, String user) {
		List<Event> result = new ArrayList<>();
		
		for(Event e : userSequences.get(user)) {
			if (eventIds.contains(e.getId()))
				result.add(e);
		}
		return result;
	}
	
	public List<Event> getEvents() {
		return getEvents(0,nbEvents);
	}
	
	public List<Event> getEvents(int firstIndex, int count) {
		if (firstIndex < nbEvents && firstIndex+count <= nbEvents) {
			Iterator<Event> it = timeSortedEvents.iterator();
			for(int i=0; i<firstIndex;i++)
				it.next();
			Event firstEvt = it.next();
			for(int i=0; i<count-2;i++)
				it.next();
			Event lastEvt = it.next();
			return new ArrayList<>(timeSortedEvents.subSet(firstEvt, true, lastEvt, true));
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
	
	public void addPatternManagerToSession(Session session, PatternManager pm) {
		patternManagers.put(session, pm);
	}
	
	public void removePatternManagerFromSession(Session session) {
		patternManagers.remove(session);
	}
	
	public TraceModification createEventTypeFromPattern(int patternId, String newName, JsonObject options, Session session) {
		System.out.println("Event type creation started");
		List<Integer> eventIdToDelete = new ArrayList<>();
		List<Event> eventsToDelete = new ArrayList<>();
		TraceModification modifs = new TraceModification();
		PatternManager pm = patternManagers.get(session);
		Pattern p = pm.getPattern(patternId);
		List<Occurrence> occs = p.getOccurrences();
		
		String newEventType = newName.trim();
		// Construct a name from the events if the given one is empty
		if (newEventType.length() == 0) {
			for(String item : p.getReadableItems()) {
				if (newEventType.length() > 0)
					newEventType += "-";
				newEventType+=item;
			}
		}
		String description = options.getString("description");
		addEventType(newEventType, description);
		
		for (Occurrence occ : occs) {
			int[] evtIds = occ.getEventIds();
			List<Integer> evtIdsList = new ArrayList<>();
			
			for(int i : evtIds) {
				evtIdsList.add(Integer.valueOf(i));
			}
			eventIdToDelete.addAll(evtIdsList);
			
			String user = occ.getUser();
			List<Event> occEvents = getEventsOfUserById(evtIdsList, user);
			eventsToDelete.addAll(occEvents);
			Date start = occEvents.get(0).getStart();
			Date end = null;
			List<String> props = new ArrayList<>();
			
			modifs.addNewEvent(addEvent(newEventType, user, start, end, props));
			removeEvents(occEvents);
		}

		System.out.println("Removing events");
		
		removeEvents(eventsToDelete);
		modifs.setRemovedIds(eventIdToDelete);
		
		// Remove occurrences if requested in the options
		JsonArray typesToRemove = options.getJsonArray("removeOccurrences"); 
		if (typesToRemove.size() > 0) {
			TraceModification mods = removeEventTypes(typesToRemove, session);
			modifs.addRemovedIds(mods.getRemovedIds());
			modifs.addRemovedEvents(mods.getRemovedEvents());
		}
		
		System.out.println("Options applied");

		System.out.println("Event type creation done");
		
		return modifs;
	}
	
	public TraceModification removeEventTypes(JsonArray eventNames, Session session) {
		
		TraceModification modifs = new TraceModification();
		
		for (int i = 0; i < eventNames.size(); i++) {
			String eventName = eventNames.getString(i);
			List<Integer> eventIdToDelete = new ArrayList<>();
			List<Event> eventsToDelete = new ArrayList<>();
			
			System.out.println("Event type "+eventName+" removal started");
			
			for (Event evt : timeSortedEvents) {
				if (evt.getType().equals(eventName)) {
					eventIdToDelete.add(evt.getId());
					eventsToDelete.add(evt);
				}
			}
			
			System.out.println("Removing events");
			
			System.out.println("Nb evt to delete: "+eventsToDelete.size());
			System.out.println("Size before : "+timeSortedEvents.size());
			
			removeEvents(eventsToDelete);
			modifs.addRemovedIds(eventIdToDelete);
			modifs.addRemovedEvent(eventName);
			
			System.out.println("Size after : "+timeSortedEvents.size());

			String code = eventsCoded.remove(eventName);
			
			System.out.println("Removed the code "+code);
			
			parameters.removeEventType('"'+eventName+'"');
			eventsReadable.remove(code);
			eventOccs.remove(eventName);
			events.remove(eventName);
		}
		
		System.out.println("Event type removal done");
		
		return modifs;
	}
	
	public TraceModification removeUsers(JsonArray userNames, Session session) {
		TraceModification modifs = new TraceModification();
		
		for (int i = 0; i < userNames.size(); i++) {
			String userName = userNames.getString(i);
			
			System.out.println("Usere "+userName+" removal started");
			List<Integer> eventIdToDelete = new ArrayList<>();
			List<Event> eventsToDelete = new ArrayList<>();
			
			for (Event evt : timeSortedEvents) {
				if (evt.getUser().equals(userName)) {
					eventIdToDelete.add(evt.getId());
					eventsToDelete.add(evt);
				}
			}

			System.out.println("Removing events");
			
			System.out.println("Nb evt to delete: "+eventsToDelete.size());
			System.out.println("Size before : "+timeSortedEvents.size());
			
			removeEvents(eventsToDelete);
			modifs.addRemovedIds(eventIdToDelete);
			
			System.out.println("Size after : "+timeSortedEvents.size());
			
			parameters.removeUser(userName);
		}
		
		
		System.out.println("User removal done");
		
		return modifs;
	}
}
