package com.raveneau.ppmt.datasets;

import java.io.File;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.List;
import java.util.Map;

import javax.websocket.Session;

public class DatasetManager {
	
	// Singleton
	private static DatasetManager instance = new DatasetManager();
	private List<Dataset> datasets = null;
	private List<String> datasetNames = null;
	// Local version
	private String datasetFolderPath = "/Users/vincent/Documents/datasets/";
	// Live version
	//private String datasetFolderPath = "/home/raveneau/data/";
	private File datasetFolder = null;

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
		System.out.println("Loading dataset '"+name.trim()+"' if known");
		for (Dataset d : datasets) {
			if (d.getName().trim().equals(name.trim()) && !d.isLoaded() && !d.isLoading()) {
				System.out.println("datasetManager requesting to load '"+d.getName().trim()+"' : "+this.hashCode());
				d.loadData();
			} else {
				System.out.println("datasetManager not loading '"+d.getName().trim()+"' (isLoaded="+d.isLoaded()+" isLoading="+d.isLoading()+" : "+this.hashCode());
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
	
	public List<String> getDatasetList() {
		updateDatasetList();
		return datasetNames;
	}
	
	public void updateDatasetList() {
		if(datasetFolder == null)
			datasetFolder = new File(datasetFolderPath);
		updateDatasetList(datasetFolder);
	}
	
	private void updateDatasetList(File folder) {
		System.out.println("searchign for datasets in "+folder.getAbsolutePath());
		for (File fileEntry : folder.listFiles()) {
	        if (fileEntry.isDirectory()) {
	        	updateDatasetList(fileEntry);
	        } else
	        if (fileEntry.isFile() && fileEntry.getName().endsWith(".csv")) {
	        	System.out.println(fileEntry.getName()+" is a valid dataset");
	        	String name = fileEntry.getName();
	        	name = name.substring(0, name.length()-4);
	        	
	        	this.addDataset(name, fileEntry.getParent(), false);
	        }
	    }
	}
	
	public List<String> getTrace(String user, String dataset) {
		return getDataset(dataset).getTrace(user);
	}

	public List<String> getPatterns(String user, String dataset, Session session) {
		return getDataset(dataset).getPatterns(user, session);
	}
	
	public List<List<String>> getYearBins(String datasetName) {
		Calendar startCal = GregorianCalendar.getInstance();
		Calendar endCal = GregorianCalendar.getInstance();
		Date start = getDataset(datasetName).getFirstEventDate();
		Date end = getDataset(datasetName).getLastEventDate();
		
		startCal.setTime(start);
		endCal.setTime(end);
		
		List<List<String>> result = new ArrayList<>();
		Calendar tmpCal = GregorianCalendar.getInstance();
		
		for (int i = startCal.get(Calendar.YEAR) ; i <= endCal.get(Calendar.YEAR); i++) {
			List<List<String>> thisYear = getDataset(datasetName).getYearBin(Integer.toString(i));
			if (!thisYear.isEmpty() && thisYear.size() == 5) {
				ArrayList<String> res = new ArrayList<>();
				res.add(Integer.toString(i));	// the year
				res.add(thisYear.get(0).get(0));	// lower bin limit
				res.add(thisYear.get(0).get(1));	// upper bin limit
				res.add(thisYear.get(1).get(0).split(";")[2]);		// the first event
				res.add(thisYear.get(1).get(thisYear.get(1).size()-1).split(";")[2]);		// the last event
				res.add(Integer.toString(thisYear.get(1).size()));		// the size of the bin
				// Compute a String with the userNames in the bin
				String users = "";
				for (String u : thisYear.get(2)) {
					if (users.length() > 0)
						users += ";";
					users += u;
				}
				res.add(users);
				// Compute a String with the eventTypes in the bin
				String types = "";
				for (String t : thisYear.get(3)) {
					if (types.length() > 0)
						types += ";";
					types += t;
				}
				res.add(types);
				// Compute a String with the occurrences of eventTypes in the bin
				String occs = "";
				for (String o : thisYear.get(4)) {
					if (occs.length() > 0)
						occs += ";";
					occs += o;
				}
				res.add(occs);
				
				result.add(res);
			}
		}
		
		return result;
	}
	
	public List<List<String>> getMonthBins(String datasetName) {
		Calendar startCal = GregorianCalendar.getInstance();
		Calendar endCal = GregorianCalendar.getInstance();
		Date start = getDataset(datasetName).getFirstEventDate();
		Date end = getDataset(datasetName).getLastEventDate();
		
		startCal.setTime(start);
		endCal.setTime(end);
		
		List<List<String>> result = new ArrayList<>();
		
		for (int i = startCal.get(Calendar.YEAR) ; i <= endCal.get(Calendar.YEAR); i++) {
			int s = 0;
			int e = 11;
			if (i == startCal.get(Calendar.YEAR))
				s = startCal.get(Calendar.MONTH);
			else if (i == endCal.get(Calendar.YEAR))
				e = endCal.get(Calendar.MONTH);
			for (int j = s; j <= e; j++) {
				List<List<String>> thisMonth = getDataset(datasetName).getMonthBin(Integer.toString(i),Integer.toString(j));
				if (!thisMonth.isEmpty() && thisMonth.size() == 5) {
					ArrayList<String> res = new ArrayList<>();
					res.add(Integer.toString(i));
					res.add(thisMonth.get(0).get(0));	// lower bin limit
					res.add(thisMonth.get(0).get(1));	// upper bin limit
					//System.out.println("y: "+i+"; m: "+j);
					//System.out.println(thisMonth.get(1).get(0));
					res.add(thisMonth.get(1).get(0).split(";")[2]);
					res.add(thisMonth.get(1).get(thisMonth.get(1).size()-1).split(";")[2]);
					res.add(Integer.toString(thisMonth.get(1).size()));
					// Compute a String with the userNames in the bin
					String users = "";
					for (String u : thisMonth.get(2)) {
						if (users.length() > 0)
							users += ";";
						users += u;
					}
					res.add(users);
					// Compute a String with the eventTypes in the bin
					String types = "";
					for (String t : thisMonth.get(3)) {
						if (types.length() > 0)
							types += ";";
						types += t;
					}
					res.add(types);
					// Compute a String with the occurrences of eventTypes in the bin
					String occs = "";
					for (String o : thisMonth.get(4)) {
						if (occs.length() > 0)
							occs += ";";
						occs += o;
					}
					res.add(occs);
					
					result.add(res);
				}
			}
		}
		
		return result;
	}
	
	public List<List<String>> getHalfMonthBins(String datasetName) {
		Calendar startCal = GregorianCalendar.getInstance();
		Calendar endCal = GregorianCalendar.getInstance();
		Date start = getDataset(datasetName).getFirstEventDate();
		Date end = getDataset(datasetName).getLastEventDate();
		
		startCal.setTime(start);
		endCal.setTime(end);
		
		List<List<String>> result = new ArrayList<>();
		
		for (int i = startCal.get(Calendar.YEAR) ; i <= endCal.get(Calendar.YEAR); i++) {
			int s = 0;
			int e = 11;
			if (i == startCal.get(Calendar.YEAR))
				s = startCal.get(Calendar.MONTH);
			else if (i == endCal.get(Calendar.YEAR))
				e = endCal.get(Calendar.MONTH);
			for (int j = s; j <= e; j++) {
				for (int k = 0; k <= 1; k++) {
					List<List<String>> thisHalfMonth = getDataset(datasetName).getHalfMonthBin(Integer.toString(i),Integer.toString(j),k);
					if (!thisHalfMonth.isEmpty() && thisHalfMonth.size() == 5 && !thisHalfMonth.get(1).isEmpty()) {
						ArrayList<String> res = new ArrayList<>();
						res.add(Integer.toString(i));
						System.out.println("y: "+i+"; m: "+j);
						System.out.println(thisHalfMonth.get(1).get(0));
						res.add(thisHalfMonth.get(0).get(0));	// lower bin limit
						res.add(thisHalfMonth.get(0).get(1));	// upper bin limit
						res.add(thisHalfMonth.get(1).get(0).split(";")[2]);
						res.add(thisHalfMonth.get(1).get(thisHalfMonth.get(1).size()-1).split(";")[2]);
						res.add(Integer.toString(thisHalfMonth.get(1).size()));
						// Compute a String with the userNames in the bin
						String users = "";
						for (String u : thisHalfMonth.get(2)) {
							if (users.length() > 0)
								users += ";";
							users += u;
						}
						res.add(users);
						// Compute a String with the eventTypes in the bin
						String types = "";
						for (String t : thisHalfMonth.get(3)) {
							if (types.length() > 0)
								types += ";";
							types += t;
						}
						res.add(types);
						// Compute a String with the occurrences of eventTypes in the bin
						String occs = "";
						for (String o : thisHalfMonth.get(4)) {
							if (occs.length() > 0)
								occs += ";";
							occs += o;
						}
						res.add(occs);
						result.add(res);
					}
				}
			}
		}
		
		return result;
	}
	
	public List<List<String>> getDayBins(String datasetName) {
		Calendar startCal = GregorianCalendar.getInstance();
		Calendar endCal = GregorianCalendar.getInstance();
		Date start = getDataset(datasetName).getFirstEventDate();
		Date end = getDataset(datasetName).getLastEventDate();
		
		startCal.setTime(start);
		endCal.setTime(end);
		
		List<List<String>> result = new ArrayList<>();
		
		for (int i = startCal.get(Calendar.YEAR) ; i <= endCal.get(Calendar.YEAR); i++) {
			for (int j = 0; j < 12; j++) {
				for (int k = 1; k <= 31; k++) {
					List<List<String>> thisDay = getDataset(datasetName).getDayBin(Integer.toString(i),Integer.toString(j),Integer.toString(k));
					if (!thisDay.isEmpty() && thisDay.size() == 5) {
						ArrayList<String> res = new ArrayList<>();
						res.add(Integer.toString(i));
						res.add(thisDay.get(0).get(0));	// lower bin limit
						res.add(thisDay.get(0).get(1));	// upper bin limit
						res.add(thisDay.get(1).get(0).split(";")[2]);
						res.add(thisDay.get(1).get(thisDay.get(1).size()-1).split(";")[2]);
						res.add(Integer.toString(thisDay.get(1).size()));
						// Compute a String with the userNames in the bin
						String users = "";
						for (String u : thisDay.get(2)) {
							if (users.length() > 0)
								users += ";";
							users += u;
						}
						res.add(users);
						// Compute a String with the eventTypes in the bin
						String types = "";
						for (String t : thisDay.get(3)) {
							if (types.length() > 0)
								types += ";";
							types += t;
						}
						res.add(types);
						// Compute a String with the occurrences of eventTypes in the bin
						String occs = "";
						for (String o : thisDay.get(4)) {
							if (occs.length() > 0)
								occs += ";";
							occs += o;
						}
						res.add(occs);
						result.add(res);
					}
				}
			}
		}
		
		return result;
	}
	
	public List<List<String>> getHalfDayBins(String datasetName) {
		Calendar startCal = GregorianCalendar.getInstance();
		Calendar endCal = GregorianCalendar.getInstance();
		Date start = getDataset(datasetName).getFirstEventDate();
		Date end = getDataset(datasetName).getLastEventDate();
		
		startCal.setTime(start);
		endCal.setTime(end);
		
		List<List<String>> result = new ArrayList<>();
		
		for (int i = startCal.get(Calendar.YEAR) ; i <= endCal.get(Calendar.YEAR); i++) {
			for (int j = 0; j < 12; j++) {
				for (int k = 1; k <= 31; k++) {
					for (int l = 0; l <=12; l+=12) {
						List<List<String>> thisHalfDay = getDataset(datasetName).getHalfDayBin(Integer.toString(i),Integer.toString(j),Integer.toString(k),Integer.toString(l));
						if (!thisHalfDay.isEmpty() && thisHalfDay.size() == 5) {
							ArrayList<String> res = new ArrayList<>();
							res.add(Integer.toString(i));
							res.add(thisHalfDay.get(0).get(0));	// lower bin limit
							res.add(thisHalfDay.get(0).get(1));	// upper bin limit
							res.add(thisHalfDay.get(1).get(0).split(";")[2]);
							res.add(thisHalfDay.get(1).get(thisHalfDay.get(1).size()-1).split(";")[2]);
							res.add(Integer.toString(thisHalfDay.get(1).size()));
							// Compute a String with the userNames in the bin
							String users = "";
							for (String u : thisHalfDay.get(2)) {
								if (users.length() > 0)
									users += ";";
								users += u;
							}
							res.add(users);
							// Compute a String with the eventTypes in the bin
							String types = "";
							for (String t : thisHalfDay.get(3)) {
								if (types.length() > 0)
									types += ";";
								types += t;
							}
							res.add(types);
							// Compute a String with the occurrences of eventTypes in the bin
							String occs = "";
							for (String o : thisHalfDay.get(4)) {
								if (occs.length() > 0)
									occs += ";";
								occs += o;
							}
							res.add(occs);
							result.add(res);
						}
					}
				}
			}
		}
		
		return result;
	}
	
	public List<String> getAllPatterns(String datasetName, Session session) {
		return getDataset(datasetName).getAllPatterns(session);
	}
	
	public List<String> getPatternDistribution(String pattern, String datasetName, Session session) {
		return getDataset(datasetName).getPatternDistribution(pattern, session);
	}
		
	public List<String> getAllEvents(String datasetName) {
		Dataset d = getDataset(datasetName);
		return getEvents(0,d.getNbEvent(),datasetName);
	}
	
	public List<String> getAllEventsCompressed(String datasetName) {
		return getDataset(datasetName).getCompressedEvents();
	}
	
	public List<String> getEvents(int startIndex, int count, String datasetName) {
		return getDataset(datasetName).getEvents(startIndex, count);
	}
}
