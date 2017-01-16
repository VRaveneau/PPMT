package com.raveneau.ppmt.datasets;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class DatasetManager {

	private static DatasetManager instance = new DatasetManager();	// Singleton
	private List<Dataset> datasets = null;
	private List<String> datasetNames = null;

	private DatasetManager() {
		this.datasets = new ArrayList<>();
		this.datasetNames = new ArrayList<>();
	}
	
	protected Dataset getDataset(String name) {
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
			System.out.println("Dataset "+name+" already known, not adding it again.");
		} else {
			System.out.println("Adding dataset "+name+" located at: "+path);
			if (startLoading)
				System.out.println("Loading the dataset now");
			else
				System.out.println("Loading the dataset later");
			
			datasetNames.add(name);
			datasets.add(new Dataset(name,path,startLoading));
		}
	}
	
	public void loadDataset(String name) {
		System.out.println("Loading dataset "+name+" if known");
		for (Dataset d : datasets) {
			if (d.getName() == name && !(d.isLoaded() || d.isLoading())) {
				System.out.println("datasetManager requesting to load "+name+" : "+this.hashCode());
				d.loadData();
			} else {
				System.out.println("datasetManager not loading "+name+" (isLoaded="+d.isLoaded()+" isLoading="+d.isLoading()+" : "+this.hashCode());
			}
		}
	}
	
	// TODO Send info about a dataset
	public String getFirstEvent(String datasetName) {
		Dataset ds = getDataset(datasetName);
		return ds.getFirstEvent();
	}

	public String getLastEvent(String datasetName) {
		return getDataset(datasetName).getLastEvent();
	}

	public String getFirstEvent(String user, String datasetName) {
		Dataset ds = getDataset(datasetName);
		return ds.getFirstEvent(user);
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
	
	public List<String> getEventTypes(String datasetName) {
		Map<String, Map<String, String>> infos = getDataset(datasetName).getEventTypeInfo();
		List<String> result = new ArrayList<>();
		for (String e : infos.keySet()) {
			String s = "type:"+e+";";
			for (String info : infos.get(e).keySet()) {
				s+=info+":"+infos.get(e).get(info)+";";
			}
			s = s.substring(0, s.length()-1);
			result.add(s);
		}
		return result;
		
		//return getDataset(datasetName).getEventList();
	}
	
	public int getNbEvents(String datasetName) {
		return getDataset(datasetName).getNbEvent();
	}
	
	public String getDatasetName(String datasetName) {
		return getDataset(datasetName).getName();
	}
	
	public List<Map<String,String>> getTrace(String user, String dataset) {
		return getDataset(dataset).getTrace(user);
	}

	public List<String> getPatterns(String user, String dataset) {
		return getDataset(dataset).getPatterns(user);
	}
}
