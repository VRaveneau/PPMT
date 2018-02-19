package com.raveneau.ppmt.server;

import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.enterprise.context.ApplicationScoped;
import javax.json.JsonObject;
import javax.json.JsonObjectBuilder;
import javax.json.spi.JsonProvider;
import javax.swing.event.EventListenerList;
import javax.websocket.Session;

import com.diogoduailibe.lzstring4j.LZString;
import com.raveneau.ppmt.algorithms.AlgorithmHandler;
import com.raveneau.ppmt.datasets.Dataset;
import com.raveneau.ppmt.datasets.DatasetManager;
import com.raveneau.ppmt.events.SteeringListener;
import com.raveneau.ppmt.patterns.Occurrence;
import com.raveneau.ppmt.patterns.Pattern;

import ca.pfv.spmf.test.MainTestGSP_saveToMemory;

@ApplicationScoped
public class SessionHandler {
	
	private int patternId = 0;
	private final Set<Session> sessions = new HashSet<>();
	private DatasetManager datasetManager = DatasetManager.getInstance();
	private final Map<Session, EventListenerList> listeners = new HashMap<>();
	private final Map<Session, String> currentlyUsedDatasets = new HashMap<>();
	//private Map<Session, GspThread> gspHandlers = new HashMap<>();
	private Map<Session, AlgorithmHandler> algorithmHandlers = new HashMap<>();
	
	public SessionHandler() {
		super();
		System.out.println("Call to the session handler constructor : "+this.hashCode()); // TODO Find out why the constructor is called twice -> or make it singleton ?
	}

	public void addSession(Session session) {
		System.out.println("Adding session to the session handler : "+this.hashCode());
    	
		sessions.add(session);
		
		algorithmHandlers.put(session, new AlgorithmHandler(this, datasetManager, session));
		listeners.put(session, new EventListenerList());
		
		addSteeringListener(algorithmHandlers.get(session), session);
	}
	
	/**
	 * Load the dataset requested by a session
	 * @param session
	 * @param datasetName
	 */
	public void loadDataset(Session session, String datasetName) {
		JsonProvider provider = JsonProvider.provider();
    	JsonObject startLoading = provider.createObjectBuilder()
    			.add("action", "startLoading")
    			.build();	// Add informations on the dataset (size ...)
    	sendToSession(session, startLoading);
    	
    	// Stores that the session is using this dataset
    	currentlyUsedDatasets.put(session, datasetName);
    	
		datasetManager.loadDataset(datasetName);
	}
	
	public void removeSession(Session session) {
		sessions.remove(session);
	}

    private JsonObject createAddMessage(Pattern pattern, String sIDs) {
    	JsonProvider provider = JsonProvider.provider();
    	String items = pattern.itemsToJson().toString().split(":")[1]; //$NON-NLS-1$
    	items = items.substring(0, items.lastIndexOf('}'));
    	JsonObject addMessage = provider.createObjectBuilder()
    			.add("action", "add") //$NON-NLS-1$ //$NON-NLS-2$
    			.add("id", pattern.getId()) //$NON-NLS-1$
    			.add("size", pattern.getItems().size()) //$NON-NLS-1$
    			.add("items", items) //$NON-NLS-1$
    			.add("sequences", sIDs) //$NON-NLS-1$
    			.build();
        return addMessage;
    }

    private void sendToAllConnectedSessions(JsonObject message) {
    	for (Session session : sessions) {
    		sendToSession(session, message);
    	}
    }

    private void sendToSession(Session session, JsonObject message) {
    	try {
    		session.getBasicRemote().sendText(message.toString());
    	} catch (IOException ex) {
    		sessions.remove(session);
    		System.out.println("Error, sending to session failed."); //$NON-NLS-1$
    	}
    }
    
    /**
     * Compresses a message and sends it to a session.
     * @param session The session the message will be sent to
     * @param message The message to be sent
     * @deprecated The compression is currently too costly to be interesting
     * 
     * TODO Use a more efficient compression or remove the method
     */
    private void sendToSessionCompressed(Session session, JsonObject message) {
    	try {
    		String compressed = LZString.compressToUTF16(message.toString());
    		session.getBasicRemote().sendText(compressed);
    	} catch (IOException ex) {
    		sessions.remove(session);
    		System.out.println("Error, sending to session failed."); //$NON-NLS-1$
    	}
    }

    public void provideYearBins(String datasetName, Session session) {
    	System.out.println("Handler starts to provide data");
    	JsonProvider provider = JsonProvider.provider();
    	
    	List<List<String>> bins = datasetManager.getYearBins(datasetName);
    	
    	JsonObjectBuilder dataMessage = provider.createObjectBuilder()
				.add("action", "data")
				.add("type", "bin")
				.add("scale","year")
				.add("number", bins.size());
    	int yearCount = 0;
    	for (List<String> y : bins) {
			dataMessage.add("year"+yearCount, y.get(0))
    			.add("start"+yearCount, y.get(1))
    			.add("end"+yearCount, y.get(2))
    			.add("value"+yearCount, y.get(5))
    			.add("users"+yearCount, y.get(6))
    			.add("events"+yearCount, y.get(7))
    			.add("occs"+yearCount, y.get(8));
			yearCount++;
    	}
    	sendToSession(session, dataMessage.build());
    	System.out.println("|-Handler provided the data");
    }

    public void provideMonthBins(String datasetName, Session session) {
    	System.out.println("Handler starts to provide data");
    	JsonProvider provider = JsonProvider.provider();
    	
    	List<List<String>> bins = datasetManager.getMonthBins(datasetName);
    	
    	JsonObjectBuilder dataMessage = provider.createObjectBuilder()
				.add("action", "data")
				.add("type", "bin")
				.add("scale","month")
				.add("number", bins.size());
    	int monthCount = 0;
    	for (List<String> m : bins) {
			dataMessage.add("year"+monthCount, m.get(0))
    			.add("start"+monthCount, m.get(1))
    			.add("end"+monthCount, m.get(2))
    			.add("value"+monthCount, m.get(5))
    			.add("users"+monthCount, m.get(6))
    			.add("events"+monthCount, m.get(7))
    			.add("occs"+monthCount, m.get(8));
			monthCount++;
    	}
    	sendToSession(session, dataMessage.build());
    	System.out.println("|-Handler provided the data");
    }

    public void provideHalfMonthBins(String datasetName, Session session) {
    	System.out.println("Handler starts to provide data");
    	JsonProvider provider = JsonProvider.provider();
    	
    	List<List<String>> bins = datasetManager.getHalfMonthBins(datasetName);
    	
    	JsonObjectBuilder dataMessage = provider.createObjectBuilder()
				.add("action", "data")
				.add("type", "bin")
				.add("scale","halfMonth")
				.add("number", bins.size());
    	int halfMonthCount = 0;
    	for (List<String> m : bins) {
			dataMessage.add("year"+halfMonthCount, m.get(0))
    			.add("start"+halfMonthCount, m.get(1))
    			.add("end"+halfMonthCount, m.get(2))
    			.add("value"+halfMonthCount, m.get(5))
    			.add("users"+halfMonthCount, m.get(6))
    			.add("events"+halfMonthCount, m.get(7))
    			.add("occs"+halfMonthCount, m.get(8));
			halfMonthCount++;
    	}
    	sendToSession(session, dataMessage.build());
    	System.out.println("|-Handler provided the data");
    }

    public void provideDayBins(String datasetName, Session session) {
    	System.out.println("Handler starts to provide data");
    	JsonProvider provider = JsonProvider.provider();
    	
    	List<List<String>> bins = datasetManager.getDayBins(datasetName);
    	
    	JsonObjectBuilder dataMessage = provider.createObjectBuilder()
				.add("action", "data")
				.add("type", "bin")
				.add("scale","day")
				.add("number", bins.size());
    	int dayCount = 0;
    	for (List<String> d : bins) {
			dataMessage.add("year"+dayCount, d.get(0))
    			.add("start"+dayCount, d.get(1))
    			.add("end"+dayCount, d.get(2))
    			.add("value"+dayCount, d.get(5))
    			.add("users"+dayCount, d.get(6))
    			.add("events"+dayCount, d.get(7))
    			.add("occs"+dayCount, d.get(8));
			dayCount++;
    	}
    	sendToSession(session, dataMessage.build());
    	System.out.println("|-Handler provided the data");
    }

    public void provideHalfDayBins(String datasetName, Session session) {
    	System.out.println("Handler starts to provide data");
    	JsonProvider provider = JsonProvider.provider();
    	
    	List<List<String>> bins = datasetManager.getHalfDayBins(datasetName);
    	
    	JsonObjectBuilder dataMessage = provider.createObjectBuilder()
				.add("action", "data")
				.add("type", "bin")
				.add("scale","halfDay")
				.add("number", bins.size());
    	int halfDayCount = 0;
    	for (List<String> d : bins) {
			dataMessage.add("year"+halfDayCount, d.get(0))
    			.add("start"+halfDayCount, d.get(1))
    			.add("end"+halfDayCount, d.get(2))
    			.add("value"+halfDayCount, d.get(5))
    			.add("users"+halfDayCount, d.get(6))
    			.add("events"+halfDayCount, d.get(7))
    			.add("occs"+halfDayCount, d.get(8));
			halfDayCount++;
    	}
    	sendToSession(session, dataMessage.build());
    	System.out.println("|-Handler provided the data");
    }
    
    public void provideData(String datasetName, Session session) {
    	System.out.println("Handler starts to provide data");
    	JsonProvider provider = JsonProvider.provider();
    	// Provide all the traces at once, events ordered by time, 1000 events at a time
    	
    	List<String> events = datasetManager.getAllEvents(datasetName);
    	
    	JsonObjectBuilder dataMessage = null;
		
		dataMessage = provider.createObjectBuilder()
				.add("action", "data")
				.add("type", "events");
    	int nbEventsInMessage = 0;
    	for (String e : events) {
    		if (nbEventsInMessage == 1000) {
    			dataMessage.add("numberOfEvents", nbEventsInMessage);
    			sendToSession(session, dataMessage.build());
    			dataMessage = provider.createObjectBuilder()
    					.add("action", "data")
    					.add("type", "events");
    			nbEventsInMessage = 0;
    		}

			dataMessage.add(Integer.toString(nbEventsInMessage), e);
    		nbEventsInMessage++;
    	}
    	dataMessage.add("numberOfEvents", nbEventsInMessage);
		sendToSession(session, dataMessage.build());
    	System.out.println("|-Handler provided the data");
    	
    	// Provide all the traces at once, events ordered by time and compressed
    	
    	/*List<String> events = datasetManager.getAllEventsCompressed(datasetName);
    	
    	JsonObjectBuilder dataMessage = null;
		
    	for (String e : events) {
    		dataMessage = provider.createObjectBuilder()
				.add("action", "data")
				.add("type", "events")
				.add("data", e);
    		sendToSession(session, dataMessage.build());
		}
    	System.out.println("|-Handler provided the data");*/
    	
    }

	public void provideDatasetInfo(String datasetName, Session session) {
		JsonObjectBuilder dataMessage = null;
		JsonProvider provider = JsonProvider.provider();
		
		System.out.println("requesting infos");
		
		// date of first and last events
		String firstEvent = datasetManager.getFirstEvent(datasetName);
		String lastEvent = datasetManager.getLastEvent(datasetName);
		// list of events
		List<String> events = datasetManager.getEventTypes(datasetName);
		// Number of events
		String nbEvents = Integer.toString(datasetManager.getNbEvents(datasetName));
		// list of users
		List<String> users = datasetManager.getUsersName(datasetName);
		// Name of the dataset
		String name = datasetManager.getDatasetName(datasetName);
		
		dataMessage = provider.createObjectBuilder()
				.add("action", "datasetInfo")
				.add("numberOfSequences", users.size())
				.add("numberOfDifferentEvents", events.size())
				.add("nbEvents", nbEvents)
				.add("firstEvent", firstEvent)
				.add("lastEvent", lastEvent)
				.add("name", name);

		int count = 0;
		for (String u : users) {
			dataMessage.add("user"+Integer.toString(count), u);
			count++;
		}
		
		sendToSession(session, dataMessage.build());
	}

	public void provideEventTypesInfo(String datasetName, Session session) {
		JsonObjectBuilder dataMessage = null;
		JsonProvider provider = JsonProvider.provider();
		
		System.out.println("requesting event types");
		
		// list of event types
		List<String> et = datasetManager.getEventTypes(datasetName);
		
		dataMessage = provider.createObjectBuilder()
				.add("action", "eventTypes")
				.add("dataset", datasetName)
				.add("size", et.size());
		int count = 0;
		for (String t : et) {
			dataMessage.add(Integer.toString(count), t);
			count++;
		}
		sendToSession(session, dataMessage.build());
	}
	
	public void provideDatasetList(Session session) {
		JsonObjectBuilder dataMessage = null;
		JsonProvider provider = JsonProvider.provider();
		
		System.out.println("requesting dataset list");
		
		// list of dataset names
		List<Dataset> list = datasetManager.getDatasetList();
		
		dataMessage = provider.createObjectBuilder()
				.add("action", "datasetList")
				.add("size", list.size());
		int count = 0;
		for (Dataset d : list) {
			dataMessage.add(Integer.toString(count), d.getName());
			dataMessage.add("param"+Integer.toString(count), d.getParameters().toString());
			count++;
		}
		sendToSession(session, dataMessage.build());
	}

	public void requestSteeringOnPattern(int patternId, Session session) {
		for(SteeringListener listener : getSteeringListeners(session)) {
			listener.steeringRequestedOnPattern(new Integer(patternId));
			System.out.println("SessionHandler: transmitting steering request on pattern id "+patternId);
		}
	}

	public void requestSteeringOnUser(String userId, Session session) {
		for(SteeringListener listener : getSteeringListeners(session)) {
			listener.steeringRequestedOnUser(userId);
		}
	}

	public void addSteeringListener(SteeringListener listener, Session session) {
		listeners.get(session).add(SteeringListener.class, listener);
	}

	public void removeSteeringListener(SteeringListener listener, Session session) {
		listeners.get(session).remove(SteeringListener.class, listener);
	}
	
	private SteeringListener[] getSteeringListeners(Session session) {
		return listeners.get(session).getListeners(SteeringListener.class);
	}

	public void provideUserList(String datasetName, Session session) {
    	JsonProvider provider = JsonProvider.provider();
    	
    	// provide the user list
    	List<String> userList = datasetManager.getUsers(datasetName);
    	JsonObjectBuilder dataMessageBuilder = null;
		dataMessageBuilder = provider.createObjectBuilder()
			.add("action", "data")
			.add("type", "userList")
			.add("size", userList.size());
		for (int i=0; i < userList.size(); i++) 
			dataMessageBuilder.add(Integer.toString(i), userList.get(i));
		sendToSession(session, dataMessageBuilder.build());
		
    	System.out.println("|-Handler provided the user list");
	}
	
	public void runAlgoToFile() {
		MainTestGSP_saveToMemory mainTest = new MainTestGSP_saveToMemory();
		mainTest.runAlgoToFileFromDatabase();
	}
	
	public void runAlgorithm(int minSup, int windowSize, int maxSize, int minGap, int maxGap, int maxDuration, String datasetName, Session session) {
		AlgorithmHandler algoHandler = algorithmHandlers.get(session);
		algoHandler.startMining(minSup, windowSize, maxSize, minGap, maxGap, maxDuration, datasetName);
	}

	public void alertOfNewPattern(Session session, Pattern p) {
		JsonObjectBuilder dataMessage = null;
		JsonProvider provider = JsonProvider.provider();
		
		dataMessage = provider.createObjectBuilder()
				.add("action", "info")
				.add("object", "newPattern")
				.add("size", p.getItems().size())
				.add("support", p.getSupport())
				.add("id", p.getId());

		int count = 0;
		for (String i : p.getReadableItems()) {
			dataMessage.add(Integer.toString(count), i);
			count++;
		}
		
		// Add the distribution per user, the same way that it's done in providePatternDistributionPerUser(...)
		List<String> users = datasetManager.getDataset(currentlyUsedDatasets.get(session)).getUsers();
		
		JsonObjectBuilder distributionMessage = provider.createObjectBuilder();
    	
    	String relevantUsers = "";
    	
    	for (String u: users) {
    		List<long[]> occs = p.buildOccurrencesBinForUser(u);
    		if (!occs.isEmpty()) {
    			relevantUsers += u+";";
    			String theseOccs = "";
    			for (long[] ts: occs) {
    				theseOccs += String.valueOf(ts[0]+(ts[1]-ts[0])/2)+";";
    			}
    			distributionMessage.add(u, theseOccs.substring(0, theseOccs.length()-1));
    		}
    	}
    	distributionMessage.add("users", relevantUsers.substring(0, relevantUsers.length()-1))
			.add("patternId", p.getId());
	
    	// Add the distribution to the final message and send it
    	dataMessage.add("userDistribution", distributionMessage.build());    	
		sendToSession(session, dataMessage.build());
	}

	public void providePatternOccurrences(String patternId, String datasetName, Session session) {
		System.out.println("Handler starts to provide pattern occurrences for "+patternId);
    	JsonProvider provider = JsonProvider.provider();
    	
    	Pattern p = datasetManager.getDataset(datasetName).getPatternManager(session).getPattern(Integer.parseInt(patternId));
    	
    	JsonObjectBuilder dataMessage = provider.createObjectBuilder()
				.add("action", "data")
				.add("type", "patternOccs")
				.add("patternId", patternId)
				.add("count", p.getSupport());
    	int patternCount = 0;
    	for (Occurrence o : p.getOccurrences()) {
    		String occ = o.getUser();
    		long[] ts = o.getTimestamps();

    		for (int idx =0; idx < ts.length; idx++) {
    			occ += ";"+ts[idx];
    		}
    		
			dataMessage.add(Integer.toString(patternCount), occ);
			patternCount++;
    	}
    	sendToSession(session, dataMessage.build());
    	System.out.println("|-Handler provided the pattern occurrences");
	}

	public void signalStart(Session session, long start) {
		JsonProvider provider = JsonProvider.provider();
		JsonObjectBuilder dataMessage = provider.createObjectBuilder()
				.add("action", "signal")
				.add("type", "start")
				.add("time", start);
		sendToSession(session, dataMessage.build());
	}

	public void signalEnd(Session session, long end) {
		JsonProvider provider = JsonProvider.provider();
		JsonObjectBuilder dataMessage = provider.createObjectBuilder()
				.add("action", "signal")
				.add("type", "end")
				.add("time", end);
		sendToSession(session, dataMessage.build());
	}

	public void signalNewLevel(Session session, int k) {
		JsonProvider provider = JsonProvider.provider();
		JsonObjectBuilder dataMessage = provider.createObjectBuilder()
				.add("action", "signal")
				.add("type", "newLevel")
				.add("level", k);
		sendToSession(session, dataMessage.build());
	}

	public void signalLoadingData(Session session) {
		JsonProvider provider = JsonProvider.provider();
		JsonObjectBuilder dataMessage = provider.createObjectBuilder()
				.add("action", "signal")
				.add("type", "loading");
		sendToSession(session, dataMessage.build());
	}

	public void signalDataLoaded(Session session) {
		JsonProvider provider = JsonProvider.provider();
		JsonObjectBuilder dataMessage = provider.createObjectBuilder()
				.add("action", "signal")
				.add("type", "loaded");
		sendToSession(session, dataMessage.build());
	}

	public void signalSteeringStarted(String type, String value, Session session) {
		JsonProvider provider = JsonProvider.provider();
		JsonObjectBuilder dataMessage = provider.createObjectBuilder()
				.add("action", "signal")
				.add("type", "steeringStart")
				.add("steeringType",type)
				.add("value", value);
		sendToSession(session, dataMessage.build());
	}

	public void signalSteeringStop(Session session) {
		JsonProvider provider = JsonProvider.provider();
		JsonObjectBuilder dataMessage = provider.createObjectBuilder()
				.add("action", "signal")
				.add("type", "steeringStop");
		sendToSession(session, dataMessage.build());
	}

	// Probably not used, since it was merged into alertOfNewPattern(...)
	public void providePatternDistributionPerUser(Integer patternId, String datasetName, Session session) {
		JsonProvider provider = JsonProvider.provider();
    	
    	Pattern p = datasetManager.getDataset(datasetName).getPatternManager(session).getPattern(patternId);
    	List<String> users = datasetManager.getDataset(datasetName).getUsers();
    	
    	JsonObjectBuilder dataMessage = provider.createObjectBuilder()
				.add("action", "data")
				.add("type", "patternDistribPerUser")
				.add("patternId", patternId);
    	
    	String relevantUsers = "";
    	int relevantUserCount = 0;
    	
    	for (String u: users) {
    		List<long[]> occs = p.buildOccurrencesBinForUser(u);
    		if (!occs.isEmpty()) {
    			relevantUserCount++;
    			relevantUsers += u+";";
    			String theseOccs = "";
    			for (long[] ts: occs) {
    				theseOccs += String.valueOf(ts[0]+(ts[1]-ts[0])/2)+";";
    			}
    			dataMessage.add(u, theseOccs.substring(0, theseOccs.length()-1));
    		}
    	}

		dataMessage.add("users", relevantUsers.substring(0, relevantUsers.length()-1));
    	sendToSession(session, dataMessage.build());
	}
}
