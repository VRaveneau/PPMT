package com.raveneau.ppmt.server;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import javax.enterprise.context.ApplicationScoped;
import javax.json.Json;
import javax.json.JsonObject;
import javax.json.spi.JsonProvider;
import javax.swing.event.EventListenerList;
import javax.websocket.Session;

import com.raveneau.ppmt.algorithms.AlgorithmHandler;
import com.raveneau.ppmt.events.SteeringListener;
import com.raveneau.ppmt.patterns.Pattern;

@ApplicationScoped
public class SessionHandler {
	
	private int patternId = 0;
	private final Set<Session> sessions = new HashSet<>();
	private final Map<Pattern, List<String>> patterns = new HashMap<>();
	private AlgorithmHandler algorithmHandler = new AlgorithmHandler(this);
	private final EventListenerList listeners = new EventListenerList();
	
	public SessionHandler() {
		super();
		addSteeringListener(algorithmHandler);
	}

	public void addSession(Session session) {
		sessions.add(session);
		for (Pattern pattern : patterns.keySet()) {
			JsonObject addMessage = createAddMessage(pattern, patterns.get(pattern).get(0));
			sendToSession(session, addMessage);
		}
		JsonObject datasetInfos = createDatasetInfosMessage();
		sendToSession(session, datasetInfos);
	}
	
	public void removeSession(Session session) {
		sessions.remove(session);
	}
	
	public Map<Pattern, List<String>> getPatterns() {
        return new HashMap<>(patterns);
    }

	public void addPattern(Pattern pattern, String sIDs) {
    	pattern.setId(patternId);
    	List<String> tab = new ArrayList<>();
    	tab.add(sIDs);
    	patterns.put(pattern, tab);
    	patternId++;
    	JsonObject addMessage = createAddMessage(pattern, sIDs);
    	sendToAllConnectedSessions(addMessage);
    }
	
    /*public void addPattern(Pattern pattern, String sIDs, String occs) {
    	pattern.setId(patternId);
    	List<String> tab = new ArrayList<>();
    	tab.add(sIDs);
    	tab.add(occs);
    	patterns.put(pattern, tab);
    	patternId++;
    	JsonObject addMessage = createAddMessage(pattern, sIDs, occs);
    	sendToAllConnectedSessions(addMessage);
    }*/

    public void removePattern(int id) {
    	Pattern pattern = getPatternById(id);
    	if (pattern != null) {
    		patterns.remove(pattern);
    		JsonProvider provider = JsonProvider.provider();
    		JsonObject removeMessage = provider.createObjectBuilder()
    				.add("action", "remove") //$NON-NLS-1$ //$NON-NLS-2$
    				.add("id", id) //$NON-NLS-1$
    				.build();
    		sendToAllConnectedSessions(removeMessage);
    	}
    }

    private Pattern getPatternById(int id) {
    	for (Pattern pattern : patterns.keySet()) {
    		if (pattern.getId() == id)
    			return pattern;
    	}
        return null;
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
    
    /*private JsonObject createAddMessage(Pattern pattern, String sIDs, String occs) {
    	JsonProvider provider = JsonProvider.provider();
    	String items = pattern.itemsToJson().toString().split(":")[1];
    	items = items.substring(0, items.lastIndexOf('}'));
    	JsonObject addMessage = provider.createObjectBuilder()
    			.add("action", "add")
    			.add("id", pattern.getId())
    			.add("size", pattern.getItems().size())
    			.add("items", items)
    			.add("sequences", sIDs)
    			.add("occurrences", occs)
    			.build();
        return addMessage;
    }*/
	
	private JsonObject createDatasetInfosMessage() {
		JsonProvider provider = JsonProvider.provider();
		Map<String, String> infos = null;
		try {
			infos = algorithmHandler.getInfosAboutDataset(Messages.getString("SessionHandler.1")); //$NON-NLS-1$
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    	JsonObject infoMessage = provider.createObjectBuilder()
    			.add("action", "datasetInfo") //$NON-NLS-1$ //$NON-NLS-2$
    			.add("seqNumber", infos.get("seqNumber")) //$NON-NLS-1$ //$NON-NLS-2$
    			.add("nbDifferentEvents", infos.get("nbDifferentEvents")) //$NON-NLS-1$ //$NON-NLS-2$
    			.add("users", infos.get("users")) //$NON-NLS-1$ //$NON-NLS-2$
    			.build();
		return infoMessage;
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
    
    
    
    
    
    public void startMining() {
    	patternId = 0;
    	algorithmHandler.startMining();
    }

    public void stopMining() {
//    	for (Pattern pattern : patterns) {
//    		removePattern(pattern.getId());
//    	}
    	patternId = 0;
    	patterns.clear();
    }

	public void provideData() throws IOException {
		System.out.println("Handler starts to provide data"); //$NON-NLS-1$
		JsonProvider provider = JsonProvider.provider();
		
		// read the file
		FileInputStream in = new FileInputStream(new File(Messages.getString("SessionHandler.0"))); //$NON-NLS-1$
		BufferedReader reader = new BufferedReader(new InputStreamReader(in));
		String line;
		int lineCount = 0;
		
		Map<String,Map<String,Integer>> data = new HashMap<>();
		
		// for each line (event)
		while ((line = reader.readLine()) != null && lineCount < 1000) {
		//while ((line = reader.readLine()) != null ) {
			lineCount++;
			// split the sequence according to ";" into tokens
			String[] properties = line.split(";"); //$NON-NLS-1$
			
			if (data.containsKey(properties[1])) {
				if (data.get(properties[1]).containsKey(properties[0])) {
					Map<String,Integer> hm = new HashMap<>(data.get(properties[1]));
					hm.put(properties[0], data.get(properties[1]).get(properties[0]) + 1);
					data.put(properties[1], hm);
				} else {
					Map<String,Integer> hm = new HashMap<>(data.get(properties[1]));
					hm.put(properties[0], 1);
					data.put(properties[1], hm);
				}
			} else {
				Map<String,Integer> hm = new HashMap<>();
				hm.put(properties[0], 1);
				data.put(properties[1], hm);
			}
		}
			
		for (String start : data.keySet()) {
			for (String event : data.get(start).keySet()) {
			JsonObject dataMessage = null;
			dataMessage = provider.createObjectBuilder()
    				.add("action", "newEvent") //$NON-NLS-1$ //$NON-NLS-2$
    				.add("type", event) //$NON-NLS-1$
    				.add("start", start) //$NON-NLS-1$
    				.add("quantity", data.get(start).get(event).toString()) //$NON-NLS-1$
    				.add("end", "") //$NON-NLS-1$ //$NON-NLS-2$
    				.build();
			sendToAllConnectedSessions(dataMessage);
			}
		}
			/*switch (properties.length) {
				case 1:
					System.out.println("Warning, event without start;");
					break;
				case 2:
					dataMessage = provider.createObjectBuilder()
	    				.add("action", "newEvent")
	    				.add("type", properties[0])
	    				.add("start", properties[1])
	    				.add("end", "")
	    				.build();
					break;
				default:
					dataMessage = provider.createObjectBuilder()
	    				.add("action", "newEvent")
	    				.add("type", properties[0])
	    				.add("start", properties[1])
	    				.add("end", properties[2])
	    				.build();
			}
			if (dataMessage != null) {
				sendToAllConnectedSessions(dataMessage);
				//System.out.println("Sent : " + line);
			}
				
		}*/
		reader.close();
		System.out.println("data provided"); //$NON-NLS-1$
		
		JsonObject dataMessage = provider.createObjectBuilder()
				.add("action", "refresh") //$NON-NLS-1$ //$NON-NLS-2$
				.build();
		sendToAllConnectedSessions(dataMessage);
		System.out.println("Refresh sent"); //$NON-NLS-1$
	}

	public void provideDatasetInfo() {
		// TODO Auto-generated method stub
		
	}

	public void requestSteeringOnPattern(String pattern) {
		for(SteeringListener listener : getSteeringListeners()) {
			listener.steeringRequestedOnPattern(pattern);
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
}
