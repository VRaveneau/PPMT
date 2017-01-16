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
import javax.inject.Inject;
import javax.inject.Singleton;
import javax.json.Json;
import javax.json.JsonObject;
import javax.json.JsonObjectBuilder;
import javax.json.spi.JsonProvider;
import javax.swing.event.EventListenerList;
import javax.websocket.Session;

import com.raveneau.ppmt.algorithms.AlgorithmHandler;
import com.raveneau.ppmt.datasets.DatasetManager;
import com.raveneau.ppmt.events.SteeringListener;
import com.raveneau.ppmt.patterns.Pattern;

@ApplicationScoped
public class SessionHandler {
	
	private int patternId = 0;
	private final Set<Session> sessions = new HashSet<>();
	private final Map<Pattern, List<String>> patterns = new HashMap<>();
	private AlgorithmHandler algorithmHandler = new AlgorithmHandler(this);
	private final EventListenerList listeners = new EventListenerList();
	private DatasetManager datasetManager = DatasetManager.getInstance();
	
	public SessionHandler() {
		super();
		System.out.println("Call to the session handler constructor : "+this.hashCode()); // TODO Find out why the constructor is called twice -> or make it singleton ?
		addSteeringListener(algorithmHandler);
		// Provide a dataset to the datasetManager
		datasetManager.addDataset("Agavue", "C:/Users/vincent/workspaceNeon/ProgressivePatternMiningTool/Data/Agavue/agavue_full_clean.csv", false);	
	}

	public void addSession(Session session) {
		System.out.println("Adding session to the session handler : "+this.hashCode());
		datasetManager.loadDataset("Agavue");
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

    public void provideData(String datasetName) {
    	System.out.println("Handler starts to provide data");
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
		sendToAllConnectedSessions(dataMessageBuilder.build());
		
    	System.out.println("|-Handler provided the data");
    }
    
    // Old version of the above method
	public void provideDataOld(String datasetName) throws IOException {
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

	public void provideDatasetInfo(String datasetName) {
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
		
		sendToAllConnectedSessions(dataMessage.build());
	}

	public void provideTrace(String user, String dataset) {
		JsonObjectBuilder dataMessage = null;
		JsonProvider provider = JsonProvider.provider();
		
		System.out.println("requesting trace");
		
		List<Map<String,String>> trace = datasetManager.getTrace(user, dataset);
		
		dataMessage = provider.createObjectBuilder()
				.add("action", "trace")
				.add("numberOfEvents", trace.size())
				.add("first", datasetManager.getFirstEvent(user, dataset))
				.add("last", datasetManager.getLastEvent(user, dataset));

		int count = 0;
		for (Map<String,String> attr : trace) {
			String attrList = attr.get("type")+";"+attr.get("start");
			dataMessage.add(Integer.toString(count), attrList);
			count++;
		}
		
		sendToAllConnectedSessions(dataMessage.build());
	}

	public void providePatterns(String user, String dataset) {
		JsonObjectBuilder dataMessage = null;
		JsonProvider provider = JsonProvider.provider();
		
		System.out.println("requesting patterns");
		
		List<String> userPatterns = datasetManager.getPatterns(user, dataset);
		
		dataMessage = provider.createObjectBuilder()
				.add("action", "patterns")
				.add("numberOfPatterns", userPatterns.size());

		int count = 0;
		for (String p : userPatterns) {
			dataMessage.add(Integer.toString(count), p);
			count++;
		}
		
		sendToAllConnectedSessions(dataMessage.build());
	}

	public void provideEventTypesInfo(String datasetName) {
		JsonObjectBuilder dataMessage = null;
		JsonProvider provider = JsonProvider.provider();
		
		System.out.println("requesting event types");
		
		// list of event types
		List<String> et = datasetManager.getEventTypes(datasetName);
		
		dataMessage = provider.createObjectBuilder()
				.add("action", "eventTypes")
				.add("size", et.size());
		int count = 0;
		for (String t : et) {
			dataMessage.add(Integer.toString(count), t);
			count++;
		}
		sendToAllConnectedSessions(dataMessage.build());
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
