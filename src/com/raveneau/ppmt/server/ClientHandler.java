package com.raveneau.ppmt.server;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.json.JsonArrayBuilder;
import javax.json.JsonObject;
import javax.json.JsonObjectBuilder;
import javax.json.spi.JsonProvider;
import javax.swing.event.EventListenerList;
import javax.websocket.Session;

import com.diogoduailibe.lzstring4j.LZString;
import com.raveneau.ppmt.algorithms.AlgorithmHandler;
import com.raveneau.ppmt.datasets.Dataset;
import com.raveneau.ppmt.datasets.DatasetManager;
import com.raveneau.ppmt.datasets.TraceModification;
import com.raveneau.ppmt.events.Event;
import com.raveneau.ppmt.events.SteeringListener;
import com.raveneau.ppmt.patterns.Occurrence;
import com.raveneau.ppmt.patterns.Pattern;
import com.raveneau.ppmt.patterns.PatternManager;
import com.vladium.utils.IObjectProfileNode;
import com.vladium.utils.ObjectProfiler;

public class ClientHandler {
	private SessionHandler sessionHandler = null;
	private Session session = null;
	private AlgorithmHandler algorithmHandler = new AlgorithmHandler(this);
	private PatternManager patternManager = null;
	private Dataset dataset = null;
	private EventListenerList listeners = new EventListenerList();
	
	public ClientHandler(SessionHandler sessionHandler, Session session) {
		super();
		this.sessionHandler = sessionHandler;
		this.session = session;
		addSteeringListener(algorithmHandler);
	}
	
	public ClientHandler(SessionHandler sessionHandler, Session session, Dataset dataset) {
		super();
		this.sessionHandler = sessionHandler;
		this.session = session;
		this.dataset = dataset;
		addSteeringListener(algorithmHandler);
	}

	public SessionHandler getSessionHandler() {
		return sessionHandler;
	}

	public void setSessionHandler(SessionHandler sessionHandler) {
		this.sessionHandler = sessionHandler;
	}

	public Session getSession() {
		return session;
	}

	public void setSession(Session session) {
		this.session = session;
	}

	public AlgorithmHandler getAlgorithmHandler() {
		return algorithmHandler;
	}

	public void setAlgorithmHandler(AlgorithmHandler algorithmHandler) {
		this.algorithmHandler = algorithmHandler;
	}

	public PatternManager getPatternManager() {
		return patternManager;
	}

	public void setPatternManager(PatternManager patternManager) {
		this.patternManager = patternManager;
	}

	public Dataset getDataset() {
		return dataset;
	}

	public void setDataset(Dataset dataset) {
		this.dataset = dataset;
		setPatternManager(new PatternManager(this));
		dataset.addPatternManagerToSession(session, patternManager);
	}
	
	public void sendMessage(JsonObject message) {
    	sendToSession(session, message);
    }
	
	private void sendToSession(Session session, JsonObject message) {
    	try {
    		session.getBasicRemote().sendText(message.toString());
    	} catch (IOException ex) {
    		// TODO Maybe ask the session handler to kill this client ?
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
    private void sendToSessionCompressed(JsonObject message) {
    	try {
    		String compressed = LZString.compressToUTF16(message.toString());
    		session.getBasicRemote().sendText(compressed);
    	} catch (IOException ex) {
    		// TODO Maybe ask the session handler to kill this client ?
    		System.out.println("Error, sending to session failed."); //$NON-NLS-1$
    	}
    }
	
	public void provideYearBins() {
    	// TODO Implement the behavior from SessionHandler or defer to the client (or do everything in the Dataset)
    }
	
	public void provideMonthBins() {
    	// TODO Implement the behavior from SessionHandler or defer to the client (or do everything in the Dataset)
    }
	
	public void provideHalfMonthBins() {
    	// TODO Implement the behavior from SessionHandler or defer to the client (or do everything in the Dataset)
    }
	
	public void provideDayBins() {
    	// TODO Implement the behavior from SessionHandler or defer to the client (or do everything in the Dataset)
    }
	
	public void provideHalfDayBins() {
    	// TODO Implement the behavior from SessionHandler or defer to the client (or do everything in the Dataset)
    }
	
	public void provideData() {
    	System.out.println("Client starts to provide data");
    	JsonProvider provider = JsonProvider.provider();
    	// Provide all the traces at once, events ordered by time, 1000 events at a time
    	
    	List<Event> events = dataset.getEvents();
    	
    	JsonObjectBuilder dataMessage = null;
		
		dataMessage = provider.createObjectBuilder()
				.add("action", "data")
				.add("type", "events");
    	int nbEventsInMessage = 0;
    	for (Event e : events) {
    		if (nbEventsInMessage == 1000) {
    			dataMessage.add("numberOfEvents", nbEventsInMessage);
    			sendToSession(session, dataMessage.build());
    			dataMessage = provider.createObjectBuilder()
    					.add("action", "data")
    					.add("type", "events");
    			nbEventsInMessage = 0;
    		}

			dataMessage.add(Integer.toString(nbEventsInMessage), e.toString());
    		nbEventsInMessage++;
    	}
    	dataMessage.add("numberOfEvents", nbEventsInMessage);
		sendToSession(session, dataMessage.build());
    	System.out.println("|-Client provided the data");
    }
	
	public void provideDatasetInfo() {
		JsonObjectBuilder dataMessage = null;
		JsonProvider provider = JsonProvider.provider();
		
		System.out.println("requesting infos");
		
		// date of first and last events
		String firstEvent = dataset.getFirstEvent();
		String lastEvent = dataset.getLastEvent();
		// list of events
		// TODO Get this directly from the dataset, not from the DSManager
		List<String> events = DatasetManager.getInstance().getEventTypes(dataset.getName());
		// Number of events
		String nbEvents = Integer.toString(dataset.getNbEvent());
		// list of users
		List<String> users = dataset.getUsers();
		// Name of the dataset
		String name = dataset.getName();
		
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

	public void provideEventTypesInfo() {
		JsonObjectBuilder dataMessage = null;
		JsonProvider provider = JsonProvider.provider();
		
		System.out.println("requesting event types");
		
		// list of event types
		// TODO Get this directly from the dataset, not from the DSManager
		List<String> et = DatasetManager.getInstance().getEventTypes(dataset.getName());
		
		dataMessage = provider.createObjectBuilder()
				.add("action", "eventTypes")
				.add("dataset", dataset.getName())
				.add("size", et.size());
		int count = 0;
		for (String t : et) {
			dataMessage.add(Integer.toString(count), t);
			count++;
		}
		sendToSession(session, dataMessage.build());
	}
	
	public void requestSteeringOnPattern(int patternId) {
		for(SteeringListener listener : getSteeringListeners()) {
			listener.steeringRequestedOnPattern(new Integer(patternId));
			System.out.println("ClientHandler: transmitting steering request on pattern id "+patternId);
		}
	}

	public void requestSteeringOnUser(String userId) {
		for(SteeringListener listener : getSteeringListeners()) {
			listener.steeringRequestedOnUser(userId);
		}
	}

	public void addSteeringListener(SteeringListener listener) {
		listeners.add(SteeringListener.class, listener);
	}

	public void removeSteeringListener(SteeringListener listener) {
		listeners.remove(SteeringListener.class, listener);
	}
	
	private SteeringListener[] getSteeringListeners() {
		return listeners.getListeners(SteeringListener.class);
	}
	
	public void provideUserList() {
    	JsonProvider provider = JsonProvider.provider();
    	
    	// provide the user list
    	List<String> userList = new ArrayList<>();
    	for (String u : dataset.getUsers())
    		userList.add(dataset.getInfoOnUserToString(u));
    	
    	JsonObjectBuilder dataMessageBuilder = null;
		dataMessageBuilder = provider.createObjectBuilder()
			.add("action", "data")
			.add("type", "userList")
			.add("size", userList.size());
		for (int i=0; i < userList.size(); i++) 
			dataMessageBuilder.add(Integer.toString(i), userList.get(i));
		sendToSession(session, dataMessageBuilder.build());
		
    	System.out.println("|-ClientHandler provided the user list");
	}
	
	public void runAlgorithm(int minSup, int windowSize, int maxSize, int minGap, int maxGap, int maxDuration) {
		algorithmHandler.startMining(minSup, windowSize, maxSize, minGap, maxGap, maxDuration);
	}
	
	public void alertOfNewPattern(Pattern p) {
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
		List<String> users = dataset.getUsers();
		
		JsonObjectBuilder distributionMessage = provider.createObjectBuilder();
    	
    	String relevantUsers = "";
    	
    	for (String u: users) {
    		List<long[]> occs = p.buildOccurrencesBinForUser(u);
    		if (!occs.isEmpty()) {
    			relevantUsers += u+";";
    			String theseOccs = "";
    			for (long[] ts: occs) {
    				// TODO send the timestamp between the occ's first and second events, might as well be the start
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
	
	/**
	 * Provides the occurrences of a given pattern. Only timestamps of involved events are sent, not their ids
	 * @param patternId
	 * @param datasetName
	 * @param session
	 * 
	 * TODO Also send the involved events' ids
	 * TODO Go through the dataset to get the pattern manager ?
	 */
	public void providePatternOccurrences(String patternId) {
		System.out.println("ClientHandler starts to provide pattern occurrences for "+patternId);
    	JsonProvider provider = JsonProvider.provider();
    	
    	Pattern p = dataset.getPatternManager(session).getPattern(Integer.parseInt(patternId));
    	
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

	public void signalStart(long start) {
		JsonProvider provider = JsonProvider.provider();
		JsonObjectBuilder dataMessage = provider.createObjectBuilder()
				.add("action", "signal")
				.add("type", "start")
				.add("time", start);
		sendToSession(session, dataMessage.build());
	}

	public void signalEnd(long end) {
		JsonProvider provider = JsonProvider.provider();
		JsonObjectBuilder dataMessage = provider.createObjectBuilder()
				.add("action", "signal")
				.add("type", "end")
				.add("time", end);
		sendToSession(session, dataMessage.build());
	}

	public void signalNewLevel(int k) {
		JsonProvider provider = JsonProvider.provider();
		JsonObjectBuilder dataMessage = provider.createObjectBuilder()
				.add("action", "signal")
				.add("type", "newLevel")
				.add("level", k);
		sendToSession(session, dataMessage.build());
	}

	public void signalLoadingData() {
		JsonProvider provider = JsonProvider.provider();
		JsonObjectBuilder dataMessage = provider.createObjectBuilder()
				.add("action", "signal")
				.add("type", "loading");
		sendToSession(session, dataMessage.build());
	}

	public void signalDataLoaded() {
		JsonProvider provider = JsonProvider.provider();
		JsonObjectBuilder dataMessage = provider.createObjectBuilder()
				.add("action", "signal")
				.add("type", "loaded");
		sendToSession(session, dataMessage.build());
	}

	public void signalSteeringStarted(String type, String value) {
		JsonProvider provider = JsonProvider.provider();
		JsonObjectBuilder dataMessage = provider.createObjectBuilder()
				.add("action", "signal")
				.add("type", "steeringStart")
				.add("steeringType",type)
				.add("value", value);
		sendToSession(session, dataMessage.build());
	}

	public void signalSteeringStop() {
		JsonProvider provider = JsonProvider.provider();
		JsonObjectBuilder dataMessage = provider.createObjectBuilder()
				.add("action", "signal")
				.add("type", "steeringStop");
		sendToSession(session, dataMessage.build());
	}
	
	public void profileDatasetSize() {
		System.out.println("Profiling ds"); 
		
		IObjectProfileNode profile = ObjectProfiler.profile (dataset);
		IObjectProfileNode profileEvents = ObjectProfiler.profile (dataset.getEvents());
		
		System.out.println("Profile done");
		
		JsonProvider provider = JsonProvider.provider();
		JsonObjectBuilder dataMessage = provider.createObjectBuilder()
				.add("action", "debug")
				.add("object", "memory")
				.add("dataset", dataset.getName())
				.add("size", profile.size())
				.add("sizeEvents", profileEvents.size());
				//.add("dump", profile.dump());
		System.out.println("Sending profile");
		sendToSession(session, dataMessage.build());
		System.out.println("Profile sent");
	}
	
	public void createEventTypeFromPattern(int patternId) {
		TraceModification modifs = dataset.createEventTypeFromPattern(patternId, session);
		
		// Send the new event types info
		provideEventTypesInfo();
		
		// Create the message to communicate the changes to the client
		JsonProvider provider = JsonProvider.provider();
		JsonObjectBuilder dataMessage = provider.createObjectBuilder()
				.add("action", "dataAlteration")
				.add("type", "eventTypeCreated");
		
		JsonArrayBuilder removedIds = provider.createArrayBuilder();
		for (Integer id : modifs.getRemovedIds())
			removedIds.add(id.intValue());
		dataMessage.add("removedIds", removedIds.build());
		
		JsonArrayBuilder newEvents = provider.createArrayBuilder();
		for (Event e : modifs.getNewEvents()) {
			newEvents.add(e.toString());
		}
		dataMessage.add("newEvents", newEvents.build());
				
		// Send this message
		sendToSession(session, dataMessage.build());
	}
}
