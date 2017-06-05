package com.raveneau.ppmt.algorithms;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.lang.Thread.State;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import javax.inject.Inject;
import javax.swing.event.EventListenerList;
import javax.websocket.Session;

import com.raveneau.ppmt.datasets.Dataset;
import com.raveneau.ppmt.datasets.DatasetManager;
import com.raveneau.ppmt.events.SteeringListener;
import com.raveneau.ppmt.events.ThreadListener;
import com.raveneau.ppmt.patterns.Pattern;
import com.raveneau.ppmt.server.SessionHandler;

import ca.pfv.spmf.algorithms.sequentialpatterns.spam.AlgoSPAM;
import javafx.util.Pair;

public class AlgorithmHandler implements SteeringListener, ThreadListener {

	private SessionHandler sessionHandler;
	private Session session;
	private DatasetManager datasetManager;
	private Dataset dataset;
	
//	private HashMap<String, Integer> typeToInt = new HashMap<>();
//	private HashMap<Integer, String> intToType = new HashMap<>();
//	private HashMap<String, String> userToIP = new HashMap<>();
//	private HashMap<String, String> IPToUser = new HashMap<>();
	
//	private HashMap<Integer,List<Pair<Integer,String>>> sequences = new HashMap<>();
	
	private GspThread mainAlgorithm = null;
	private Thread mainThread = null;
	private GspThread secondaryAlgorithm = null;
	private Thread secondaryThread = null;
//	private String inputPath = null;
//	private String outputPath = "SPAMoutput"; //$NON-NLS-1$
//	private double minSupRel = 0.32;
//	private boolean showSequenceIdentifiersInOutput = true;
	
	public AlgorithmHandler(SessionHandler sessionHandler, DatasetManager datasetManager, Session session) {
		this.sessionHandler = sessionHandler;
		this.session = session;
		this.datasetManager = datasetManager;
	}

	public Session getSession() {
		return this.session;
	}
	
	public void startMining(int minSup, int windowSize, int maxSize, int minGap, int maxGap, int maxDuration, String datasetName) {
//		String input;
//		try {
//			input = setupDataForSPAM("C:/Users/vincent/workspaceNeon/ProgressivePatternMiningTool/Data/Agavue/FormatedEvents.txt");
//			String outputFilePath = "C:/Users/vincent/workspaceNeon/ProgressivePatternMiningTool/SPAMoutput";
//			double minSupRel = 0.6;
//			// Write sequence Id in the file or not
//			spam.showSequenceIdentifiersInOutput(true);
//			try {
//				spam.runAlgorithm(input, outputFilePath, minSupRel,this);
//			} catch (IOException e) {
//				e.printStackTrace();
//			}
//			System.out.println("SPAM done;");
//		} catch (IOException e1) {
//			e1.printStackTrace();
//		}
		
		if (mainAlgorithm == null) {
			this.dataset = datasetManager.getDataset(datasetName);
			this.dataset.addPatternManagerToSession(session, sessionHandler); // deletes all the previously known patterns
			mainAlgorithm = new GspThread(this.dataset, session);
			mainAlgorithm.updateParameters(minSup, windowSize, maxSize, minGap, maxGap, maxDuration);
			
			this.mainThread = new Thread(mainAlgorithm);
			mainThread.start();
//			try {
//				mainSpamThread.join();
//			} catch (InterruptedException e) {
//				e.printStackTrace();
//			}
		} else {
			System.out.println("Error : Trying to start mining while already running");
			System.out.println("  Tip : Steering should be used instead, or a restart");
		}
		
//		try {
//			spam.runAlgorithm(outputPath, outputPath, minSupRel, this);
//		} catch (IOException e) {
//			e.printStackTrace();
//		}
	}

	/*public Map<String, String> getInfosAboutDataset(String input) throws IOException {

		int lastKey = 0;
		int lastUser = 0;
		Date previousEnd = null;
		int sequencesNumber = 0;
		
		// read the file
		FileInputStream in = new FileInputStream(new File(input));
		BufferedReader reader = new BufferedReader(new InputStreamReader(in));
		String line;
		// for each line (event)
		while ((line = reader.readLine()) != null) {
			// split the sequence according to ";" into tokens
			//System.out.println(line);
			String[] properties = line.split(";"); //$NON-NLS-1$
			
			if (typeToInt.containsKey(properties[0]) == false) {
				typeToInt.put(properties[0], lastKey);
				intToType.put(lastKey, properties[0]);
				lastKey++;
			}
			//System.out.println(properties);
			if (IPToUser.containsKey(properties[3]) == false) {
				IPToUser.put(properties[3], String.valueOf(lastUser));
				userToIP.put(String.valueOf(lastUser), properties[3]);
				lastUser++;
			}
			
			// see if the gap between previous end and current start is > 30min
			//		if so, start another sequence
			String oldDate = properties[1];
			String newDate = oldDate.split(" ")[0]; //$NON-NLS-1$
			//newDate = newDate.split("-")[1] + "/" + newDate.split("-")[2] + "/" + newDate.split("-")[0] + " " + oldDate.split(" ")[1];
			//System.out.println(newDate);
			Date currentStart = new Date(newDate);
			if (previousEnd != null) {
				if (TimeUnit.MILLISECONDS.toMinutes(currentStart.getTime() - previousEnd.getTime()) > 30) {
					sequencesNumber++;
				}
			}
			if (properties.length > 2 && properties[2].length() > 0) 
				System.out.println("problem");//previousEnd = new Date(properties[2]); //$NON-NLS-1$
			else
				previousEnd = new Date(newDate);
			
		}
		sequencesNumber++;
		reader.close();
		
		Map<String, String> result = new HashMap<>();
		result.put("seqNumber", String.valueOf(sequencesNumber)); //$NON-NLS-1$
		result.put("nbDifferentEvents", String.valueOf(typeToInt.keySet().size())); //$NON-NLS-1$
		String userList = ""; //$NON-NLS-1$
		for (String u : userToIP.keySet()) {
			userList+=u+';';
		}
		result.put("users", userList.substring(0, userList.length()-1)); //$NON-NLS-1$
		return result;
	}*/
	
	/**
	 * Expects one event per line, all properties separated by ";"
	 * First 4 properties must be, in this order : EventType - start - end - user
	 * 			If one of them is missing, insert a empty field instead (ex: "event;start;;...")
	 * @param input Path to the input file
	 * @return
	 * @throws IOException 
	 */
	/*private String newSetupDataForSPAM(String input,String user) throws IOException {
		
		int lastKey = 0;
		String outFile = ""; //$NON-NLS-1$
		if (user == null) {
			// Localhost version
			//outFile = Messages.getString("AlgorithmHandler.1");
			// Server version
			outFile = Messages.getString("AlgorithmHandler.6"); //$NON-NLS-1$
		} else {
			// Localhost version
			//outFile = Messages.getString("AlgorithmHandler.2")+user;
			// Server version
			outFile = Messages.getString("AlgorithmHandler.7")+user; //$NON-NLS-1$
		}
		BufferedWriter writer = new BufferedWriter(new FileWriter(outFile));
		Date currentStart = null;
		
		// read the file
		FileInputStream in = new FileInputStream(new File(input));
		BufferedReader reader = new BufferedReader(new InputStreamReader(in));
		String line;
		// for each line (event)
		int currentSequence = 0;
		List<Pair<Integer, String>> firstItem = new ArrayList<>();
		sequences.put(Integer.valueOf(currentSequence), firstItem);
		while ((line = reader.readLine()) != null) {
			// split the sequence according to ";" into tokens
			String[] properties = line.split(";"); //$NON-NLS-1$
			
			if (typeToInt.containsKey(properties[0]) == false) {
				typeToInt.put(properties[0], lastKey);
				intToType.put(lastKey, properties[0]);
				lastKey++;
			}
			
			//Process the line only if the user is the one we want
			if (user == null || properties[3] == user) {
				// see if the gap between current start and this event is > 3min
				//		if so, start another sequence
				Date eventStart = new Date(properties[1]);
				if (currentStart != null) {
					if (TimeUnit.MILLISECONDS.toMinutes(eventStart.getTime() - currentStart.getTime()) > (3)) {
						writer.write("-2\n"); //$NON-NLS-1$
						currentStart = new Date(properties[1]);
						currentSequence += 1;
						Pair<Integer,String> items = new Pair<Integer,String>(typeToInt.get(properties[0]), properties[1]);
						List<Pair<Integer,String>> lst = new ArrayList<>();
						lst.add(items);
						sequences.put(currentSequence, lst);
					} else {
						List<Pair<Integer,String>> lst = sequences.get(currentSequence);
						Pair<Integer,String> items = new Pair<Integer, String>(typeToInt.get(properties[0]),properties[1]);
						lst.add(items);
						sequences.put(currentSequence, lst);
					}
				} else {
					currentStart = new Date(properties[1]);
					Pair<Integer,String> items = new Pair<Integer,String>(typeToInt.get(properties[0]), properties[1]);
					List<Pair<Integer,String>> lst = new ArrayList<>();
					lst.add(items);
					sequences.put(currentSequence, lst);
				}
	
				writer.write(typeToInt.get(properties[0]) + " -1 "); //$NON-NLS-1$
			}
		}
		writer.close();
		reader.close();
		
		return outFile;
	}*/
	
	/**
	 * Expects one event per line, all properties separated by ";"
	 * First 3 properties must be, in this order : EventType - start - end
	 * 			If one of them is missing, insert a empty field instead (ex: "event;start;;...")
	 * @param input Path to the input file
	 * @return
	 * @throws IOException 
	 */
	/*private String setupDataForSPAM(String input, String user) throws IOException {
		
		int lastKey = 0;
		// Localhost version
		//BufferedWriter writer = new BufferedWriter(new FileWriter(Messages.getString("AlgorithmHandler.3")));
		// Server version
		BufferedWriter writer = new BufferedWriter(new FileWriter(Messages.getString("AlgorithmHandler.8"))); //$NON-NLS-1$
		Date previousEnd = null;
		
		// read the file
		FileInputStream in = new FileInputStream(new File(input));
		BufferedReader reader = new BufferedReader(new InputStreamReader(in));
		String line;
		// for each line (event)
		while ((line = reader.readLine()) != null) {
			// split the sequence according to ";" into tokens
			String[] properties = line.split(";"); //$NON-NLS-1$
			
			if (typeToInt.containsKey(properties[0]) == false) {
				typeToInt.put(properties[0], lastKey);
				intToType.put(lastKey, properties[0]);
				lastKey++;
			}
			
			writer.write(typeToInt.get(properties[0]) + " -1 "); //$NON-NLS-1$
			
			// see if the gap between previous end and current start is > 30min
			//		if so, start another sequence
			Date currentStart = new Date(properties[1]);
			if (previousEnd != null) {
				if (TimeUnit.MILLISECONDS.toMinutes(currentStart.getTime() - previousEnd.getTime()) > 20) {
					writer.write("-2\n"); //$NON-NLS-1$
				}
			}
			if (properties.length > 2 && properties[2].length() > 0) 
				previousEnd = new Date(properties[2]);
			else
				previousEnd = new Date(properties[1]);
			
		}
		writer.close();
		reader.close();
		// Localhost version
		//return Messages.getString("AlgorithmHandler.4");
		// Server version
		return Messages.getString("AlgorithmHandler.9"); //$NON-NLS-1$
	}*/

	/*private Map<String, String> retrieveItemsFromSPAM(List<Integer> items, List<String> sIDs) {
		Map<String, String> decodedPattern = new HashMap<>();
		for (int i = 0; i < items.size(); i++) {
			decodedPattern.put(intToType.get(items.get(i)), sIDs.get(i));
		}
		return decodedPattern;
	}*/
	
	/*private List<String> retrievePatternFromSPAM(List<Integer> pattern) {
		List<String> decodedPattern = new ArrayList<>();
		for (Integer i : pattern) {
			decodedPattern.add(intToType.get(i));
		}
		return decodedPattern;
	}*/
	
	/*private String retrieve_pattern_occurrences(List<Integer> pattern, String[] seqs) {
    	String results = ""; //$NON-NLS-1$
    	for (String s: seqs) {
    		String current_seq = ""; //$NON-NLS-1$
    		for (Pair<Integer,String> p : sequences.get(Integer.valueOf(s))) {
    			if (current_seq == "")  { //$NON-NLS-1$
    				if (p.getKey() == pattern.get(0)) {
    					pattern = pattern.subList(1, pattern.size()-1);
    					current_seq = p.getValue()+"-"; //$NON-NLS-1$
    				}
    			} else {
    				if (p.getKey() == pattern.get(0)) {
    					if (pattern.size() == 1) {
    						current_seq += p.getValue();
    					} else {
    						pattern = pattern.subList(1, pattern.size()-1);
    					}
    				}
    			}
    		}
    		results += current_seq+";"; //$NON-NLS-1$
    	}
    	return results.substring(0, results.length()-2);
    }*/
	
	/*private String retrieve_items_occurrences(List<Integer> items, List<String> sIDs) {
		String results = ""; //$NON-NLS-1$
		for (Integer i : items) {
			//System.out.println(sIDs);
			String[] relevantSeqs = sIDs.get(0).trim().split(" "); //$NON-NLS-1$
			//System.out.println(relevantSeqs[0]);
			for (String s : relevantSeqs) {
				//System.out.println(s);
				for (Pair<Integer,String> p : sequences.get(Integer.valueOf(s))) {
					if (p.getKey() == i) {
						results += p.getValue()+";"; //$NON-NLS-1$
						break;
					}
					System.out.println(results);
				}
				System.out.println(results);
			}
			System.out.println(results);
			results = results.substring(0,results.length()-2);
			results += "-"; //$NON-NLS-1$
		}
		return results.substring(0, results.length()-2);
	}*/
	
	/*public void receivePattern(List<Integer> pattern, String sIDs) {
		//System.out.println("Receiving items "+items);
		List<String> decodedPattern = retrievePatternFromSPAM(pattern);
		//String occs = retrieve_pattern_occurrences(pattern, sIDs.split(" "));
		//sessionHandler.addPattern(new Pattern(decodedPattern), sIDs, occs);
		sessionHandler.addPattern(new Pattern(decodedPattern), sIDs);
	}*/

	/*public void receiveItems(List<Integer> items, List<String> sIDs) {
		//System.out.println("Receiving items "+items);
		Map<String, String> decodedItems = retrieveItemsFromSPAM(items, sIDs);
		//String[] occs = retrieve_items_occurrences(items, sIDs).split("-");
		//int count = 0;
		for (String i : decodedItems.keySet()) {
			List<String> p = new ArrayList<>();
			String s = decodedItems.get(i);
			p.add(i);
			//String occ = occs[count];
			//count++;
			//sessionHandler.addPattern(new Pattern(p), s, occ);
			sessionHandler.addPattern(new Pattern(p), s);
		}
	}*/

	@Override
	public void steeringRequestedOnPattern(String pattern) {
		System.out.println("Steering on pattern " + pattern /* + " (" + typeToInt.get(pattern) + ")"*/);
		System.out.println("Pausing the main mining"); //$NON-NLS-1$
		mainThread.suspend();
		if (secondaryAlgorithm == null) {
			System.out.println("secondary thread didn't exist");
			secondaryAlgorithm = new GspThread(dataset, session);
			// TODO Add a call to update parameters for the new algoGsp
			System.out.println("Starting the steering thread");
			this.secondaryThread = new Thread(secondaryAlgorithm);
			secondaryThread.start();
		} else {
			System.out.println("secondary thread exists, interruption and reallocation");
			secondaryThread.interrupt();
			secondaryAlgorithm = new GspThread(dataset, session);
			// TODO Add a call to update parameters for the new algoGsp
			System.out.println("Starting the steering thread");
			this.secondaryThread = new Thread(secondaryAlgorithm);
			secondaryThread.start();
		}
	}

	@Override
	public void steeringRequestedOnUser(String user) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void steeringRequestedOnTime(String start, String end) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void threadTerminated(boolean isMainThread) {
		if (isMainThread) {
			System.out.println("Receiving main thread termination signal.");
		} else {
			System.out.println("Receiving thread termination signal.");
			System.out.println("Going back to the main mining process.");
			
			mainThread.resume();
//			if (mainSpamThread.getState() == State.WAITING) {
//				mainSpamThread.notify();
//			} else {
//				System.out.println("!!! Main mining process wasn't waiting, but : "+ mainSpamThread.getState());
//			}
		}
	}
}
