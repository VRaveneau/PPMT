package com.raveneau.ppmt.server;

import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.enterprise.context.ApplicationScoped;
import javax.json.JsonArray;
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

import ca.pfv.spmf.test.MainTestGSP_saveToMemory;

import com.vladium.utils.IObjectProfileNode;
import com.vladium.utils.ObjectProfileFilters;
import com.vladium.utils.ObjectProfileVisitors;
import com.vladium.utils.ObjectProfiler;

@ApplicationScoped
public class SessionHandler {
	
	private final Set<Session> sessions = new HashSet<>();
	private final Map<Session, ClientHandler> clientHandlers = new HashMap<>();
	private DatasetManager datasetManager = DatasetManager.getInstance();
	
	public SessionHandler() {
		super();
		System.out.println("Call to the session handler constructor : "+this.hashCode()); // TODO Find out why the constructor is called twice -> or make it singleton ?
	}

	public void addSession(Session session) {
		System.out.println("Adding session to the session handler : "+this.hashCode());
    	
		sessions.add(session);
		clientHandlers.put(session, new ClientHandler(this, session));
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
    	clientHandlers.get(session).sendMessage(startLoading);
    	clientHandlers.get(session).setDataset(datasetManager.getDataset(datasetName));
    	
		datasetManager.loadDataset(datasetName);
	}
	
	public void removeSession(Session session) {
		sessions.remove(session);
		ClientHandler removed = clientHandlers.remove(session);
		// TODO Make sure the removed handler will be GC'ed
	}

    private void sendToAllConnectedSessions(JsonObject message) {
    	for (Session session : sessions) {
    		clientHandlers.get(session).sendMessage(message);
    	}
    }

    // TODO Should be moved to the clientHandler or the client
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
    	clientHandlers.get(session).sendMessage(dataMessage.build());
    	System.out.println("|-Handler provided the data");
    }

    // TODO Should be moved to the clientHandler or the client
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
    	clientHandlers.get(session).sendMessage(dataMessage.build());
    	System.out.println("|-Handler provided the data");
    }

    // TODO Should be moved to the clientHandler or the client
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
    	clientHandlers.get(session).sendMessage(dataMessage.build());
    	System.out.println("|-Handler provided the data");
    }

    // TODO Should be moved to the clientHandler or the client
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
    	clientHandlers.get(session).sendMessage(dataMessage.build());
    	System.out.println("|-Handler provided the data");
    }

    // TODO Should be moved to the clientHandler or the client
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
    	clientHandlers.get(session).sendMessage(dataMessage.build());
    	System.out.println("|-Handler provided the data");
    }
    
    // TODO see if the datasetName is still needed
    public void provideData(String datasetName, Session session) {
    	clientHandlers.get(session).provideData();
    }

    // TODO see if the datasetName is still needed
	public void provideDatasetInfo(String datasetName, Session session) {
		clientHandlers.get(session).provideDatasetInfo();
	}

    // TODO see if the datasetName is still needed
	public void provideEventTypesInfo(String datasetName, Session session) {
		clientHandlers.get(session).provideEventTypesInfo();
	}
	
	/**
	 * Should no longer be called now that the dataset selection is on another page
	 * @param session
	 */
	/*public void provideDatasetList(Session session) {
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
	}*/

	public void requestSteeringOnPattern(int patternId, Session session) {
		clientHandlers.get(session).requestSteeringOnPattern(patternId);
	}

	public void requestSteeringOnUser(String userId, Session session) {
		clientHandlers.get(session).requestSteeringOnUser(userId);
	}

	public void addSteeringListener(SteeringListener listener, Session session) {
		clientHandlers.get(session).addSteeringListener(listener);
	}

	public void removeSteeringListener(SteeringListener listener, Session session) {
		clientHandlers.get(session).removeSteeringListener(listener);
	}

	// TODO See if the datasetName is still needed
	public void provideUserList(String datasetName, Session session) {
    	clientHandlers.get(session).provideUserList();
	}
	
	// TODO See if the datasetName is still needed
	public void runAlgorithm(int minSup, int windowSize, int maxSize, int minGap, int maxGap, int maxDuration, String datasetName, Session session) {
		clientHandlers.get(session).runAlgorithm(minSup, windowSize, maxSize, minGap, maxGap, maxDuration);
	}

	/**
	 * Provides the occurrences of a given pattern. Only timestamps of involved events are sent, not their ids
	 * @param patternId
	 * @param datasetName
	 * @param session
	 * 
	 * TODO Also send the involved events' ids
	 * TODO See if the datasetName is still needed
	 */
	public void providePatternOccurrences(String patternId, String datasetName, Session session) {
		clientHandlers.get(session).providePatternOccurrences(patternId);
	}

	// Probably not used, since it was merged into alertOfNewPattern(...)
	/*public void providePatternDistributionPerUser(Integer patternId, String datasetName, Session session) {
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
	}*/

	/**
	 * TODO This needs to stay here
	 * @param datasetName
	 * @param session
	 */
	public void validateDataset(String datasetName, Session session) {
		String answer = "valid";
		if (datasetManager.getDataset(datasetName) == null) {
			answer = "invalid";
		}
		
		JsonProvider provider = JsonProvider.provider();
		JsonObjectBuilder dataMessage = provider.createObjectBuilder()
				.add("action", "validation")
				.add("object", "dataset")
				.add("dataset", datasetName)
				.add("answer", answer);
		clientHandlers.get(session).sendMessage(dataMessage.build());
	}
	
	public void profileDatasetSize(Session session) {
		clientHandlers.get(session).profileDatasetSize();
	}
	
	public void createEventTypeFromPattern(int patternId, Session session) {
		clientHandlers.get(session).createEventTypeFromPattern(patternId);
	}

	/**
	 * Create a user-specific dataset if needed
	 * @param session The session that wants to alter the dataset
	 */
	public void sessionAltersDataset(Session session) {
		// TODO Auto-generated method stub
		
	}
}
