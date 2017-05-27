package ca.pfv.spmf.test;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.UnsupportedEncodingException;
import java.math.RoundingMode;
import java.net.URL;
import java.text.DecimalFormat;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import com.raveneau.ppmt.datasets.Dataset;
import com.raveneau.ppmt.datasets.DatasetManager;
import com.raveneau.ppmt.patterns.PatternManager;

import ca.pfv.spmf.algorithms.sequentialpatterns.gsp_AGP.AlgoGSP;
import ca.pfv.spmf.algorithms.sequentialpatterns.gsp_AGP.items.Item;
import ca.pfv.spmf.algorithms.sequentialpatterns.gsp_AGP.items.SequenceDatabase;
import ca.pfv.spmf.algorithms.sequentialpatterns.gsp_AGP.items.creators.AbstractionCreator;
import ca.pfv.spmf.algorithms.sequentialpatterns.gsp_AGP.items.creators.AbstractionCreator_Qualitative;
import ca.pfv.spmf.algorithms.sequentialpatterns.gsp_AGP.items.patterns.Pattern;

/**
 * Example of how to use the algorithm GSP, saving the results in the main
 * memory
 * @author agomariz
 */
public class MainTestGSP_saveToMemory {


    public static void main(String[] args) throws IOException {
    	// Generate the GSP-readable data file
    	String pathToAruleseqData = "C:\\Users\\vincent\\Documents\\Work\\jeuTest-1seq.txt";
    	String outputAruleseqLarge = "C:\\Users\\vincent\\Documents\\Work\\jeuTest-1seq-transformed.txt";
    	readDataFromAruleseq(pathToAruleseqData, outputAruleseqLarge);
    	String inputAlgorithm = outputAruleseqLarge;//"C:\\Users\\vincent\\Documents\\Work\\spmf-test-aruleseq-episode.txt";
    	runAlgoToFileFromFile(inputAlgorithm);
    }
    
    public static void runAlgoToFileFromFile(String inputPath) {
        // Load a sequence database
        double windowSize = 0;
        int support = 1, mingap = 0, maxgap = Integer.MAX_VALUE, maxSize = 2;
        long maxDuration = 100;
        
        boolean keepPatterns = true;
        boolean verbose=true;
        
        // if you set the following parameter to true, the sequence ids of the sequences where
        // each pattern appears will be shown in the result
        boolean outputSequenceIdentifiers = false;

        AbstractionCreator abstractionCreator = AbstractionCreator_Qualitative.getInstance();
        SequenceDatabase sequenceDatabase = new SequenceDatabase(abstractionCreator);
        
        // Test with a loading of the dataset from a file
        try {
        	// Large dataset, tested with support 0.015 and 0.05  (maxSize 10)
			//sequenceDatabase.loadFile("C:\\Users\\vincent\\Documents\\Work\\spmf-test-aruleseq-large-transformed.txt", support);
			sequenceDatabase.loadFile(inputPath, support);
			System.out.println("Sequence database has "+sequenceDatabase.getSequences().size()+" sequences.");
			// Small dataset, tested with support 0.2 and 0.3
			//sequenceDatabase.loadFile("C:\\Users\\vincent\\Documents\\Work\\spmf-test-aruleseq.txt", support);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        //System.out.println(sequenceDatabase.toString());
        System.out.println("Creating the algorithm");
        AlgoGSP algorithm = new AlgoGSP(support, maxSize, mingap, maxgap, windowSize, maxDuration, abstractionCreator);
        
        int nbWindows = sequenceDatabase.getSequences().size();
        //String[] dataFile = inputPath.split("");
        String prefix = "jeuTest-1seq";//dataFile[dataFile.length-1];
        String filename = "GSP_minSup-"+support+"("+nbWindows*support+")";
        String output = "C:/Users/vincent/workspaceNeon/ProgressivePatternMiningTool/Data/Agavue/"+prefix+"-"+filename+".txt";
        //String output = "/home/raveneau/data/Agavue/"+filename;
        
        System.out.println("Running the algorithm and saving to "+prefix+"-"+filename);
        
        PatternManager patternManager = new DummyPatternManager();
        System.out.println("Start");
        try {
            // Before uncommenting the next line, update to the new runAlgorithm method
			algorithm.runAlgorithm(sequenceDatabase,keepPatterns,verbose,output, outputSequenceIdentifiers, patternManager);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        System.out.println(algorithm.getNumberOfFrequentPatterns()+ " frequent pattern found.");

        System.out.println(algorithm.printedOutputToSaveInFile());
        
        System.out.println(algorithm.printStatistics());
        
        String fileToDecode = "C:/Users/vincent/workspaceNeon/ProgressivePatternMiningTool/Data/Agavue/"+prefix+"-"+filename+".txt";
        String decodedFile = "C:/Users/vincent/workspaceNeon/ProgressivePatternMiningTool/Data/Agavue/"+prefix+"-"+filename+"_readable.txt";
        decodeTestSetSmall(fileToDecode, decodedFile, sequenceDatabase.getSequences().size());
        System.out.println(sequenceDatabase.getSequences().size());
    }
    
    public static void runAlgoToFileFromFileForServer() {
        // Load a sequence database
        double windowSize = 0;
        int support = 500, mingap = 0, maxgap = 1, maxSize = 10;
        long maxDuration = 30000;
        
        boolean keepPatterns = true;
        boolean verbose=false;
        
        // if you set the following parameter to true, the sequence ids of the sequences where
        // each pattern appears will be shown in the result
        boolean outputSequenceIdentifiers = false;

        AbstractionCreator abstractionCreator = AbstractionCreator_Qualitative.getInstance();
        SequenceDatabase sequenceDatabase = new SequenceDatabase(abstractionCreator);
        
        // Test with a loading of the dataset from a file
        try {
        	// Large dataset, tested with support 0.015 and 0.05  (maxSize 10)
			sequenceDatabase.loadFile("/home/raveneau/test-algo/spmf-test-aruleseq-large-transformed.txt", support);
			// Small dataset, tested with support 0.2 and 0.3
			//sequenceDatabase.loadFile("C:\\Users\\vincent\\Documents\\Work\\spmf-test-aruleseq.txt", support);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        
        //System.out.println(sequenceDatabase.toString());
        System.out.println("Creating the algorithm");
        AlgoGSP algorithm = new AlgoGSP(support, maxSize, mingap, maxgap, windowSize, maxDuration, abstractionCreator);
        
        int nbWindows = sequenceDatabase.getSequences().size();
        String filename = "GSP_minSup-"+support+"("+nbWindows*support+")";
        //String output = "C:/Users/vincent/workspaceNeon/ProgressivePatternMiningTool/Data/Agavue/"+filename+".txt";
        String output = "/home/raveneau/test-algo/"+filename+".txt";
        
        System.out.println("Running the algorithm and saving to "+filename);
        
        PatternManager patternManager = new DummyPatternManager();
        System.out.println("Start");
        try {
            // Before uncommenting the next line, update to the new runAlgorithm method
			algorithm.runAlgorithm(sequenceDatabase,keepPatterns,verbose,output, outputSequenceIdentifiers, patternManager);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        System.out.println(algorithm.getNumberOfFrequentPatterns()+ " frequent pattern found.");

        System.out.println(algorithm.printedOutputToSaveInFile());
        
        System.out.println(algorithm.printStatistics());
        
        String fileToDecode = "/home/raveneau/test-algo/"+filename+".txt";
        String decodedFile = "/home/raveneau/test-algo/"+filename+"_readable.txt";
        decodeTestSetLarge(fileToDecode, decodedFile, sequenceDatabase.getSequences().size());
    }
    
    public void runAlgoToFileFromDatabase() {
        // Load a sequence database
        double windowSize = 0;
        int support = 1000, mingap = 0, maxgap = 1, maxSize = 5;
        long maxDuration = 30000;
        
        boolean keepPatterns = true;
        boolean verbose=false;
        
        // if you set the following parameter to true, the sequence ids of the sequences where
        // each pattern appears will be shown in the result
        boolean outputSequenceIdentifiers = true;

        AbstractionCreator abstractionCreator = AbstractionCreator_Qualitative.getInstance();
        SequenceDatabase sequenceDatabase = new SequenceDatabase(abstractionCreator);
        
        // Test with a loading of the dataset from a file
        // sequenceDatabase.loadFile("C:\\Users\\vincent\\Documents\\Work\\spmf\\ca\\pfv\\spmf\\test\\contextPrefixSpan.txt", support);

        // Test with a loading of the dataset from a Dataset instance
        DatasetManager dsMngr = DatasetManager.getInstance();
        System.out.println("Requesting to load the dataset");
        Dataset dataset = dsMngr.getDataset("Agavue");
        if (dataset == null)
        	dsMngr.addDataset("Agavue", "/home/raveneau/data/Agavue/agavue_full_clean.csv", true);
        dataset = dsMngr.getDataset("Agavue");
        //dsMngr.addDataset("Agavue", "C:/Users/vincent/workspaceNeon/ProgressivePatternMiningTool/Data/Agavue/agavue_full_clean.csv", true);
        System.out.println("Transfering the dataset to the sequenceDatabase");
        int windowInSeconds = 60;
        sequenceDatabase.loadDataset(dataset, support, windowInSeconds);
        
        //System.out.println(sequenceDatabase.toString());
        System.out.println("Creating the algorithm");
        AlgoGSP algorithm = new AlgoGSP(support, maxSize, mingap, maxgap, windowSize, maxDuration, abstractionCreator);
        
        String filename = "Episodes_minSup-"+support+"_maxSize-"+maxSize+"_gap-"+mingap+"to"+maxgap+".txt";
        //String output = "C:/Users/vincent/workspaceNeon/ProgressivePatternMiningTool/Data/Agavue/"+filename;
        String output = "/home/raveneau/data/Agavue/"+filename;
        
        System.out.println("Running the algorithm and saving to "+filename);
        
        try {
            // Before uncommenting the next line, update to the new runAlgorithm method
            PatternManager patternManager = new DummyPatternManager();
			algorithm.runAlgorithm(sequenceDatabase,keepPatterns,verbose,output, outputSequenceIdentifiers, patternManager);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        System.out.println(algorithm.getNumberOfFrequentPatterns()+ " frequent pattern found.");

        //System.out.println(algorithm.printedOutputToSaveInFile());
        
        //System.out.println(algorithm.printStatistics());
    }

    public static String fileToPath(String filename) throws UnsupportedEncodingException {
        URL url = MainTestGSP_saveToMemory.class.getResource(filename);
        return java.net.URLDecoder.decode(url.getPath(), "UTF-8");
    }
    
    public static void readDataFromAruleseq(String filename, String output) {
    	String thisLine = null;
    	BufferedReader myInput = null;
        BufferedWriter myOutput = null;
        int currentSequenceId = -1;
        String currentSequence = "";
        try {
            FileInputStream fis = new FileInputStream(new File(filename));
            FileOutputStream fos = new FileOutputStream(new File(output));
            myInput = new BufferedReader(new InputStreamReader(fis));
            myOutput = new BufferedWriter(new OutputStreamWriter(fos));
            while ((thisLine = myInput.readLine()) != null) {
            	if (thisLine.length() > 0) {
	            	String[] line = thisLine.split(" ");
	
	                // check if the sequence is a new one
	            	if (currentSequenceId > 0) {
	            		if (Integer.parseInt(line[0]) != currentSequenceId) {
	            			// write the line and start a new one
	            			currentSequence += "-2\n";
	            			myOutput.write(currentSequence);
	            			currentSequence = "";
	            			currentSequenceId = Integer.parseInt(line[0]);
	            		}
	            	} else {
	            		currentSequenceId = Integer.parseInt(line[0]);
	            	}
	            	
	            	currentSequence += "<"+line[1];
	            	for (int i = 3; i < line.length; i++) {
	            		currentSequence += " "+line[i];
	            	}
	            	currentSequence += " -1 ";
            	}
            }
            // write the last sequence
            if (currentSequence.length() > 0) {
            	currentSequence += "-2\n";
    			myOutput.write(currentSequence);
            }
     
        } catch (Exception e) {
        	e.printStackTrace();
        } finally {
            if (myInput != null) {
                try {
					myInput.close();
					myOutput.close();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
            }
        }
    }
    
    public static void decodeTestSetSmall(String filename, String output, int seqNumber) {
    	Map<String,String> decodingMap = new HashMap<>();
    	decodingMap.put("1", "A");
    	decodingMap.put("2", "B");
    	decodingMap.put("3", "C");
    	decodingMap.put("4", "D");
    	decodingMap.put("5", "E");
    	decodingMap.put("6", "F");
    	decodingMap.put("7", "G");
    	decodingMap.put("8", "H");
    	String thisLine;
        BufferedReader myInput = null;
        BufferedWriter myOutput = null;
        try {
            FileInputStream fis = new FileInputStream(new File(filename));
            FileOutputStream fos = new FileOutputStream(new File(output));
            myInput = new BufferedReader(new InputStreamReader(fis));
            myOutput = new BufferedWriter(new OutputStreamWriter(fos));
            while ((thisLine = myInput.readLine()) != null) {
                String[] line = thisLine.split("#SUP:");
                String[] iSet = line[0].split("-1");
            	
                String lineToWrite = "<";
                
                int countInPattern = 0;
                for (String s : iSet) {
                	if (countInPattern > 0)
                		lineToWrite += ",";
                	lineToWrite += "{";
                	int countInItemSet = 0;
                	for (String i : s.split(" ")) {
                		if (i.length() > 0) {
                			if (countInItemSet > 0)
                				lineToWrite += ",";
                			lineToWrite+= decodingMap.get(i.trim());
                			countInItemSet++;
                		}
                	}
                	lineToWrite += "}";
                	countInPattern++;
                }
                
                double relativeSupport = Integer.parseInt(line[1].trim())/(seqNumber*1.0);
                lineToWrite += ">\t"+relativeSupport+"\n";
                
                myOutput.write(lineToWrite);
            }
     
        } catch (Exception e) {
        	e.printStackTrace();
        } finally {
            if (myInput != null) {
                try {
					myInput.close();
					myOutput.close();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
            }
        }
    }
    
    public static void decodeTestSetLarge(String filename, String output, int seqNumber) {
    	String thisLine;
        BufferedReader myInput = null;
        BufferedWriter myOutput = null;
        try {
            FileInputStream fis = new FileInputStream(new File(filename));
            FileOutputStream fos = new FileOutputStream(new File(output));
            myInput = new BufferedReader(new InputStreamReader(fis));
            myOutput = new BufferedWriter(new OutputStreamWriter(fos));
            while ((thisLine = myInput.readLine()) != null) {
                String[] line = thisLine.split("#SUP:");
                String[] iSet = line[0].split("-1");
            	
                String lineToWrite = "<";
                
                int countInPattern = 0;
                for (String s : iSet) {
                	if (countInPattern > 0)
                		lineToWrite += ",";
                	lineToWrite += "{";
                	int countInItemSet = 0;
                	for (String i : s.split(" ")) {
                		if (i.length() > 0) {
                			if (countInItemSet > 0)
                				lineToWrite += ",";
                			lineToWrite+= i.trim();
                			countInItemSet++;
                		}
                	}
                	lineToWrite += "}";
                	countInPattern++;
                }
                
                DecimalFormat df = new DecimalFormat("#.####");
                df.setRoundingMode(RoundingMode.HALF_UP);
                double relativeSupport = Integer.parseInt(line[1].trim())/(seqNumber*1.0);
                lineToWrite += ">\t"+df.format(relativeSupport)+"\n";
                
                myOutput.write(lineToWrite);
            }
     
        } catch (Exception e) {
        	e.printStackTrace();
        } finally {
            if (myInput != null) {
                try {
					myInput.close();
					myOutput.close();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
            }
        }
    }
}
