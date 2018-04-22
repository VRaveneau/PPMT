package com.raveneau.ppmt.server;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.enterprise.context.ApplicationScoped;
import javax.json.JsonArray;
import javax.json.JsonObject;
import javax.json.JsonObjectBuilder;
import javax.json.spi.JsonProvider;
import javax.websocket.Session;

import com.raveneau.ppmt.datasets.Dataset;
import com.raveneau.ppmt.datasets.DatasetManager;
import com.raveneau.ppmt.events.SteeringListener;

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
    
    // TODO see if the datasetName is still needed
    public void provideData(String datasetName, Session session) {
    	clientHandlers.get(session).provideData();
    }

    // TODO see if the datasetName is still needed
	public void provideDatasetInfo(String datasetName, Session session) {
		clientHandlers.get(session).provideDatasetInfo();
	}

    // TODO see if the datasetName is still needed
	public void provideEventTypes(String datasetName, Session session) {
		clientHandlers.get(session).provideEventTypes();
	}

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
	
	public void removeEventTypes(JsonArray eventNames, Session session) {
		clientHandlers.get(session).removeEventTypes(eventNames);
	}
	
	public void removeUsers(JsonArray userNames, Session session) {
		clientHandlers.get(session).removeUsers(userNames);
	}

	/**
	 * Create a user-specific dataset if the user is altering its dataset for the first time
	 * @param session The session that wants to alter its dataset
	 */
	public void sessionAltersDataset(Session session) {
		ClientHandler ch = clientHandlers.get(session);
		Dataset oldDS = ch.getDataset();
		if (oldDS.isGlobal()) {
			ch.setDataset(new Dataset(oldDS, session), false);
			oldDS.removePatternManagerFromSession(session);
			System.out.println("New dataset created");
		} else {
			System.out.println("Dataset was already user-specific");
		}
		
	}
}
