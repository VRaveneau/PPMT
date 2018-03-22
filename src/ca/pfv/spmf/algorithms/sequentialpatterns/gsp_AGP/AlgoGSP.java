package ca.pfv.spmf.algorithms.sequentialpatterns.gsp_AGP;
/*
 * Copyright Antonio Gomariz Peñalver 2013
 *
 * This file is part of the SPMF DATA MINING SOFTWARE
 * (http://www.philippe-fournier-viger.com/spmf).
 *
 * SPMF is free software: you can redistribute it and/or modify it under the
 * terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later
 * version.
 *
 * SPMF is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * SPMF. If not, see <http://www.gnu.org/licenses/>.
 */
import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.raveneau.ppmt.algorithms.GspParameters;
import com.raveneau.ppmt.patterns.PatternManager;

import ca.pfv.spmf.algorithms.sequentialpatterns.gsp_AGP.items.Item;
import ca.pfv.spmf.algorithms.sequentialpatterns.gsp_AGP.items.SequenceDatabase;
import ca.pfv.spmf.algorithms.sequentialpatterns.gsp_AGP.items.Sequences;
import ca.pfv.spmf.algorithms.sequentialpatterns.gsp_AGP.items.creators.AbstractionCreator;
import ca.pfv.spmf.algorithms.sequentialpatterns.gsp_AGP.items.patterns.Pattern;
import ca.pfv.spmf.tools.MemoryLogger;

/**
 * This is an implementation of the GSP algorithm. GSP was proposed by Srikant
 * and Agrawal 1996.
 *<br/><br/>
 *
 * NOTE: This implementation saves the patterns to a file as soon as a level of
 * patterns is found or can keep the patterns into memory if no output path is provided by the user.
 * 
 * @author Antonio Gomariz Peñalver 
 */
public class AlgoGSP {
	protected GspParameters parameters;
	protected int lastLevelCompleted = 0;
	protected Map<Item, Set<Pattern>> lastIndexationMapCompleted = null;
	protected Set<Pattern> lastFrequentSetCompleted = null;
	
    /**
     * minimum support threshold. Range: from 0 up to 1
     */
    /*protected double minSupRelative;
    protected int minGap;
    protected int maxGap;
    protected double windowSize;
    protected long maxDuration;
    protected int maxPatternSize;*/
    /**
     * Absolute minimum support threshold. It indicates the minimum number of
     * sequences that we need to find.
     */
    //protected double minSupAbsolute;
    /**
     * Set of frequent patterns. Whether the user chooses a to save in a file or
     * in the memory we use it to keep the different k-levels of frequent
     * sequences
     */
    protected Sequences patterns;
    //Two variables to measure how long the algorithm takes
    protected long start, end;
    //List with the frequent 1-sequences, i.e. the frequent items.
    protected List<Pattern> frequentItems;
    private AbstractionCreator abstractionCreator;
    //Flag indicanting if the output is sorted or not
    private boolean isSorted;
    //counter for the frequent patterns already found
    private int numberOfFrequentPatterns;
    // writer to write output file
    BufferedWriter writer = null;
    
    // save sequence identifiers to file
    boolean outputSequenceIdentifiers = false;

    /**
     * Constructor for GSP algorithm. It initializes most of the class'
     * attributes.
     */
    public AlgoGSP(GspParameters parameters,/*int minSupAbsolute, int maxPatternSize, int mingap, int maxgap, double windowSize, long maxDuration,*/ AbstractionCreator abstractionCreator) {
        /*this.minSupAbsolute = minSupAbsolute;
        this.maxPatternSize = maxPatternSize;
        this.minGap = mingap;
        this.maxGap = maxgap;
        this.windowSize = windowSize;
        this.maxDuration = maxDuration;*/
    	this.parameters = parameters;
        this.abstractionCreator = abstractionCreator;
        this.isSorted = false;
    }

    /**
     * Method that runs the GSP algorithm in the database given as parameter.
     *
     * @param database a sequence database
     * @param keepPatterns flag activated if we want to keep the resulting
     * patterns or not
     * @param verbose flat activated for debugging purposes
     * @param outputFilePath an output file path
     * @param outputSequenceIdentifiers if true output sequence identifiers with each pattern
     * @return the frequent sequences found in the original database
     * @throws IOException
     */
    public Sequences runAlgorithm(SequenceDatabase database, boolean keepPatterns, boolean verbose, String outputFilePath, boolean outputSequenceIdentifiers, PatternManager patternManager) throws IOException {
        this.outputSequenceIdentifiers = outputSequenceIdentifiers;
        
    	patterns = new Sequences("FREQUENT SEQUENTIAL PATTERNS");
        // if the user want to keep the result into memory
        if (outputFilePath == null) {
            writer = null;
        } else { // if the user want to save the result to a file
            writer = new BufferedWriter(new FileWriter(outputFilePath));
        }

        /*we calculate in how many sequences a pattern have to appear to be
         correctly considered as frequent*/
        /*this.minSupAbsolute = (int) Math.ceil(minSupRelative * database.size());
        if (this.minSupAbsolute == 0) { // protection
            this.minSupAbsolute = 1;
        }*/
        /*we calculate in in which percentage of the sequences a pattern have to appear to be
        correctly considered as frequent*/
        /* Version without the GspParameters
       this.minSupRelative = (double) ((this.minSupAbsolute*100) / database.size());
       if (this.minSupAbsolute == 0) { // protection
           this.minSupAbsolute = 1;
       }*/
        /* version with the GspParameters */
        if (this.parameters.getMinSupAbsolute() == 0) { // protection
            this.parameters.setMinSupAbsolute(1);
        }
        this.parameters.setMinSupRelative((float) ((this.parameters.getMinSupAbsolute()*100) / database.size()));

        CandidateGeneration candidateGenerator = new CandidateGeneration();
        SupportCounting supportCounter = new SupportCounting(database, abstractionCreator);

        // reset the stats about memory usage
        MemoryLogger.getInstance().reset();
        
        start = System.currentTimeMillis();
        // Sends the start signal to the pattern manager
        // TODO move the call to another object than the pattern manager
        patternManager.signalStart(start);
        runGsp(database, candidateGenerator, supportCounter, keepPatterns, verbose, patternManager);
        end = System.currentTimeMillis();
        // Sends the end signal to the pattern manager
        // TODO move the call to another object than the pattern manager
        patternManager.signalEnd(end);
        
        // close the output file if the result was saved to a file
        if (writer != null) {
            writer.close();
        }

        return patterns;
    }

    /**
     * The actual method that executes GSP. It start from the frequent
     * 1-sequences level
     *
     * @param database a sequence database
     * @param candidateGenerator a CandidateGenerator
     * @param supportCounter a supportCounting element
     * @param keepPatterns flag activated if we want to keep the resulting
     * patterns or not
     * @param verbose flat activated for debugging purposes
     * @throws IOException
     */
    protected void runGsp(SequenceDatabase database, CandidateGeneration candidateGenerator, SupportCounting supportCounter, boolean keepPatterns, boolean verbose, PatternManager patternManager) throws IOException {
        //we get the frequent items found in the original database
        frequentItems = database.frequentItems();
        /* And we add the sequences as the 1-level of patterns. NOTE: we need them
         * for generating the candidates
         */
        patterns.addSequences(frequentItems, 1);
        /*We define a set where we temporaly keep the current frequent k-level.
         * It was called Lk in the original algorithm.
         */
        Set<Pattern> frequentSet = new LinkedHashSet<Pattern>(frequentItems.size());
        //And we add it the frequent 1-sequences
        frequentSet.addAll(frequentItems);
        //We define a candidate set
        List<Pattern> candidateSet;
        /*And we put all those frequent 1-sequences indexed by their first item,
        * the pattern itself, for this case
        */
        Map<Item, Set<Pattern>> indexationMap = new HashMap<Item, Set<Pattern>>();

        //Updating the number of frequent candidates adding the number of frequent items
        numberOfFrequentPatterns += frequentItems.size();
        //From k=1
        int k = 1;
        this.lastLevelCompleted = 1;
        this.lastIndexationMapCompleted = new HashMap<Item, Set<Pattern>>(indexationMap);
        this.lastFrequentSetCompleted = new LinkedHashSet<>(frequentSet);
        
        boolean levelEndedWithNoCandidate = false;
        
        // Loop until everything has been extracted with the default algorithm
        while (this.lastLevelCompleted < this.parameters.getMaxSize()) {
        	
        	if (parameters.isTerminationRequested())
        		break;
        	
            boolean noCandidateFound = false;
            boolean noFrequentCandidate = false;
            boolean steeringHasOccurred = false;
        	
	        //We repeat the same loop. MAIN LOOP
	        while (frequentSet != null && 
	        		!frequentSet.isEmpty() &&
	        		k < this.parameters.getMaxSize()) {
	            //We start with the k+1 level
	            k++;
	            System.out.println("AlgoGSP: entering main loop at level "+k);
	            if (verbose) {
	                System.out.println("k=" + k);
	                System.out.println("generating candidates...");
	            }
	            // Send a signal to the pattern manager indicating that we start the level
	            // TODO move the call to another object than the pattern manager
	            patternManager.signalNewLevel(k);
	            
	            //We get the candidate set
	            if (this.parameters.steeringIsOccurring()) {
	            	candidateSet = candidateGenerator.generateCandidatesCombinatory(frequentSet, frequentItems, abstractionCreator, indexationMap, k, this.parameters.getMinSupAbsolute());
	            	steeringHasOccurred = true;
	            } else
	            	candidateSet = candidateGenerator.generateCandidates(frequentSet, abstractionCreator, indexationMap, k, this.parameters.getMinSupAbsolute());
	            frequentSet = null;
	            //And we break the loop if the set of candidates is empty
	            if (candidateSet == null) {
	            	levelEndedWithNoCandidate = true;
	            	noCandidateFound = true;
	                break;
	            }
	            patternManager.signalCandidatesGenerated(candidateSet.size());
	            //Otherwise we continue counting the support of each candidate of the set
	            if (verbose) {
	                System.out.println(candidateSet.size() + "  Candidates have been created!");
	                System.out.println("checking frequency...");
	            }
	            
	            // check the memory usage for statistics
	            MemoryLogger.getInstance().checkMemory();
	            
	            frequentSet = supportCounter.countSupport(candidateSet, k, this.parameters, /*minSupAbsolute,*/ patternManager/*, maxDuration, minGap, maxGap*/);
	            
	            if (supportCounter.steeringHasOccurred())
	            	steeringHasOccurred = true;
	            
	            if (parameters.isTerminationRequested())
	            	break;
	            
	            if (verbose) {
	                System.out.println(frequentSet.size() + " frequent patterns\n");
	            }
	            
	            // We break the loop if the set of frequent candidates is empty
	            if (frequentSet.isEmpty()) {
	            	noFrequentCandidate = true;
	                break;
	            }
	            
	            // check the memory usage for statistics
	            MemoryLogger.getInstance().checkMemory();
	
	           //We update the number of frequent patterns, adding the number (k+1)-frequent patterns found
	            numberOfFrequentPatterns += frequentSet.size();
	            /*And we prepare the next iteration, updating the indexation map and
	             * the frequent level capable of generating the new candidates
	             */
	
	            indexationMap = supportCounter.getIndexationMap();
	            patterns.addSequences(new ArrayList<Pattern>(frequentSet), k);
	            /*Finally, we remove the previous level if we are not interested in
	             * keeping the frequent patterns in memory
	             */
	            int level = k - 1;  
	            if (!keepPatterns) {
	                if (!frequentSet.isEmpty()) {
	                    patterns.delete(level);
	                }
	                /*Or even if we are interested in, but we want to keep them in
	                 * a file 
	                 */
	            }else if (writer != null) {
	                if (!frequentSet.isEmpty()) {
	                    for (Pattern seq : patterns.getLevel(level)) {
	                        writer.write(seq.toStringToFile(outputSequenceIdentifiers));
	                        writer.newLine();
	                    }
	                    patterns.delete(level);
	                }
	            }
	            // if no steering has occurred during the support count, mark the level as completed
	            if (!supportCounter.steeringHasOccurred()) {
	            	this.lastLevelCompleted = k;
	            	this.lastIndexationMapCompleted = new HashMap<Item, Set<Pattern>>(indexationMap);
	            	this.lastFrequentSetCompleted = new LinkedHashSet<>(frequentSet);
	            	patternManager.signalLevelExtracted(k);
	            	System.out.println("AlgoGSP : go to level "+(k+1)+", no steering");
	            } else {
	            	// if a steering is still occurring
	            	// ... do nothing ? 
	            	System.out.println("AlgoGSP : go to level "+(k+1)+", steering at level "+(this.lastLevelCompleted+1));
	            }
	            
	        }
	        if (noCandidateFound || noFrequentCandidate) {
	        	if (steeringHasOccurred) {
	        		// Go back to the next completed level
			        k = this.lastLevelCompleted;
			        indexationMap = new HashMap<Item, Set<Pattern>>(this.lastIndexationMapCompleted);
			        frequentSet = new LinkedHashSet<>(this.lastFrequentSetCompleted);
			        // stop the occurring steering
			        this.parameters.stopSteering();
			        patternManager.sendSteeringEndNotificationToClient();
			        // reset the fact that steering occured for the support counter
			        supportCounter.resetSteeringHasOccured();
			        System.out.println("AlgoGSP: steering ended, going back to level "+(k+1));
	        	} else {
	        		patternManager.signalLevelExtracted(k);
	        		break;
	        	}
	        } else {
	        	System.out.println("!!!!! This shouldn't happen !!!!!");
	        	System.out.println("Exiting main loop while frequent candidates have been found");
	        }
	        /*
	        if (!levelEndedWithNoCandidate) { // TODO check this test and its consequences
	        	if (frequentSet == null || frequentSet.isEmpty()) {
	        		patternManager.signalLevelExtracted(k);
	        		break;
	        	}
	        	
		        // Go back to the next completed level
		        k = this.lastLevelCompleted;
		        indexationMap = new HashMap<Item, Set<Pattern>>(this.lastIndexationMapCompleted);
		        frequentSet = new LinkedHashSet<>(this.lastFrequentSetCompleted);
		        // stop the occurring steering
		        this.parameters.stopSteering();
		        patternManager.sendSteeringEndNotificationToClient();
		        // reset the fact that steering occured for the support counter
		        supportCounter.resetSteeringHasOccured();
		        System.out.println("AlgoGSP: steering ended, going back to level "+(k+1));
	        } else {
	        	if (this.parameters.steeringIsOccurring()) {
	        		// stop the occurring steering
			        this.parameters.stopSteering();
			        patternManager.sendSteeringEndNotificationToClient();
			        // reset the fact that steering occured for the support counter
			        supportCounter.resetSteeringHasOccured();
			        System.out.println("AlgoGSP: steering ended, going back to level "+(k+1));
	        	} else {
	        		patternManager.signalLevelExtracted(k);
	        		break;
	        	}
	        }*/
        }
        /*When the loop is over, if we were interested in keeping the output in
         * a file, we store the last level found.
         */
        
        if (keepPatterns) {
            if (writer != null) {
                int level = patterns.getLevelCount();
                for (Pattern seq : patterns.getLevel(level)) {
                    writer.write(seq.toStringToFile(outputSequenceIdentifiers));
                    writer.newLine();
                }
                patterns.delete(level);
            }
        }
        // check the memory usage for statistics
	MemoryLogger.getInstance().checkMemory();
    }

    /**
     * Method to print some statistics about the execution. It uses the standard
     * format.
     *
     * @return a String with the information in it.
     */
    public String printStatistics() {
        if (!isSorted) {
            patterns.sort();
            isSorted = true;
        }
        StringBuilder sb = new StringBuilder(200);
        sb.append("=============  Algorithm - STATISTICS =============\n Total time ~ ");
        sb.append(runningTime());
        sb.append(" ms\n");
        sb.append(" Frequent sequences count : ");
        sb.append(numberOfFrequentPatterns);
        sb.append('\n');
        sb.append(" Max memory (mb):");
	sb.append(MemoryLogger.getInstance().getMaxMemory());
        sb.append('\n');
        if (writer == null) {
            sb.append(patterns.toString());
        }
        sb.append("===================================================\n");
        return sb.toString();
    }

    /**
     * Method to print some statistics about the execution. It uses the optional
     * format.
     *
     * @return a String with the information in it
     */
    public String printedOutputToSaveInFile() {
        if (!isSorted) {
            patterns.sort();
            isSorted = true;
        }
        StringBuilder output = new StringBuilder();
        output.append(patterns.toStringToFile(outputSequenceIdentifiers));
        return output.toString();
    }

    /**
     * 
     * @return The number of frequent sequences found by GSP in the last
     * execution
     */
    public int getNumberOfFrequentPatterns() {
        return numberOfFrequentPatterns;
    }

    /**
     * 
     * @return the frequent patterns found by the last execution of GSP. It only
     * works under a Save_To_Memory option.
     */
    public String getPatterns() {
        String output = null;
        if (writer == null) {
            output = patterns.toString();
        }
        return output;
    }

    /**
     * Time that GSP takes completing the execution
     * @return the runtime as a long
     */
    public long runningTime() {
        return (end - start);
    }

    /**
     * Return the absolute minimum support, i.e. the minimum number of sequences
     * where a patter must appear
     * @return the minsup value
     */
    public double getMinSupAbsolut() {
        return this.parameters.getMinSupAbsolute();
    }

    /**
     * It cleans the most important attributes.
     */
    public void clear() {
        patterns.clear();
        frequentItems.clear();
        abstractionCreator = null;
    }
}
