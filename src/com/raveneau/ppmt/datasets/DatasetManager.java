package com.raveneau.ppmt.datasets;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.websocket.Session;

import com.raveneau.ppmt.events.Event;

public class DatasetManager {
	
	// Singleton
	private static DatasetManager instance = new DatasetManager();
	private List<Dataset> datasets = null;
	private List<String> datasetNames = null;
	private String datasetFolderPath = Messages.getString("DatasetManager.datasetFolderPath"); //$NON-NLS-1$
	private File datasetFolder = null;
	private Map<String, Dataset> sessionTokens = new HashMap<>();

	private DatasetManager() {
		this.datasets = new ArrayList<>();
		this.datasetNames = new ArrayList<>();
	}
	
	public Dataset getDataset(String name) {
		for (Dataset d : datasets)
			if (d.getName().trim().equals(name.trim())) {
				return d;
			}
		return null;
	}
	
	public static DatasetManager getInstance() {
		return instance;
	}
	
	public void addDataset(String name, String path) {
		this.addDataset(name, path, true);
	}
	
	public void addDataset(String name, String path, boolean startLoading) {
		if (datasetNames.contains(name)) {
			System.out.println("Dataset "+name+" already known, not adding it again."); //$NON-NLS-1$ //$NON-NLS-2$
			System.out.println("Reloading parameters for dataset "+name+"."); //$NON-NLS-1$ //$NON-NLS-2$
			getDataset(name).loadParameters();
		} else {
			System.out.println("Adding dataset "+name+" located at: "+path); //$NON-NLS-1$ //$NON-NLS-2$
			if (startLoading)
				System.out.println("Loading the dataset now"); //$NON-NLS-1$
			else
				System.out.println("Loading the dataset later"); //$NON-NLS-1$
			
			datasetNames.add(name);
			datasets.add(new Dataset(name,path,startLoading));
		}
	}
	
	public void loadDataset(String name) {
		System.out.println("Loading dataset '"+name.trim()+"' if known"); //$NON-NLS-1$ //$NON-NLS-2$
		for (Dataset d : datasets) {
			if (d.getName().trim().equals(name.trim()) && !d.isLoaded() && !d.isLoading()) {
				System.out.println("datasetManager requesting to load '"+d.getName().trim()+"' : "+this.hashCode()); //$NON-NLS-1$ //$NON-NLS-2$
				d.loadData();
			} else {
				System.out.println("datasetManager not loading '"+d.getName().trim()+"' (isLoaded="+d.isLoaded()+" isLoading="+d.isLoading()+" : "+this.hashCode()); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$ //$NON-NLS-4$
			}
		}
	}
	
	public String getFirstEvent(String datasetName) {
		return getDataset(datasetName).getFirstEvent();
	}

	public String getLastEvent(String datasetName) {
		return getDataset(datasetName).getLastEvent();
	}

	public String getFirstEvent(String user, String datasetName) {
		return getDataset(datasetName).getFirstEvent(user);
	}

	public String getLastEvent(String user, String datasetName) {
		return getDataset(datasetName).getLastEvent(user);
	}
	
	public List<String> getUsers(String datasetName) {
		List<String> result = new ArrayList<>();
		Dataset d = getDataset(datasetName);
		for (String u : d.getUsers())
			result.add(d.getInfoOnUserToString(u));
		return result;
	}
	
	public List<String> getUsersName(String datasetName) {
		return getDataset(datasetName).getUsers();
	}
	
	/*public List<String> getEventTypes(String datasetName) {
		Map<String, Map<String, String>> infos = getDataset(datasetName).getEventTypeInfo();
		List<String> result = new ArrayList<>();
		for (String e : infos.keySet()) {
			String s = "type:"+e+";"; //$NON-NLS-1$ //$NON-NLS-2$
			for (String info : infos.get(e).keySet()) {
				s+=info+":"+infos.get(e).get(info)+";"; //$NON-NLS-1$ //$NON-NLS-2$
			}
			s = s.substring(0, s.length()-1);
			result.add(s);
		}
		return result;
		
		//return getDataset(datasetName).getEventList();
	}*/
	
	public int getNbEvents(String datasetName) {
		return getDataset(datasetName).getNbEvent();
	}
	
	public String getDatasetName(String datasetName) {
		return getDataset(datasetName).getName();
	}
	
	public Dataset getDatasetFromToken(String token) {
		Dataset result = sessionTokens.get(token);
		System.out.println("Dataset: "+result.getFirstEvent());
		return result;
	}
	
	public void addDatasetToken(Dataset ds, String token) {
		sessionTokens.put(token, ds);
		System.out.println("Token "+token+" for ds "+ds.getFirstEvent());
	}
	
	public void removeToken(String token) {
		sessionTokens.remove(token);
	}
	
	public List<Dataset> getDatasetList() {
		updateDatasetList();
		return datasets;
	}
	
	public void updateDatasetList() {
		if(datasetFolder == null)
			datasetFolder = new File(datasetFolderPath);
		updateDatasetList(datasetFolder);
	}
	
	private void updateDatasetList(File folder) {
		System.out.println("searching for datasets in "+folder.getAbsolutePath()); //$NON-NLS-1$
		for (File fileEntry : folder.listFiles()) {
	        if (fileEntry.isDirectory()) {
	        	updateDatasetList(fileEntry);
	        } else
	        if (fileEntry.isFile() && fileEntry.getName().endsWith(".csv")) { //$NON-NLS-1$
	        	System.out.println(fileEntry.getName()+" is a valid dataset"); //$NON-NLS-1$
	        	String name = fileEntry.getName();
	        	name = name.substring(0, name.length()-4);
	        	
	        	this.addDataset(name, fileEntry.getParent(), false);
	        }
	    }
	}
	
	public List<Event> getTrace(String user, String dataset) {
		return getDataset(dataset).getTrace(user);
	}

	public List<String> getPatterns(String user, String dataset, Session session) {
		return getDataset(dataset).getPatterns(user, session);
	}
	
	public List<String> getAllPatterns(String datasetName, Session session) {
		return getDataset(datasetName).getAllPatterns(session);
	}
	
	public List<String> getPatternDistribution(String pattern, String datasetName, Session session) {
		return getDataset(datasetName).getPatternDistribution(pattern, session);
	}
		
	public List<Event> getAllEvents(String datasetName) {
		Dataset d = getDataset(datasetName);
		return getDataset(datasetName).getEvents();
	}
	
	public List<String> getAllEventsCompressed(String datasetName) {
		return getDataset(datasetName).getCompressedEvents();
	}
	
	public List<Event> getEvents(int startIndex, int count, String datasetName) {
		return getDataset(datasetName).getEvents(startIndex, count);
	}
}
