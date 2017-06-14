package com.raveneau.ppmt.algorithms;

import java.io.IOException;

import javax.websocket.Session;

import com.raveneau.ppmt.datasets.Dataset;
import com.raveneau.ppmt.patterns.PatternManager;

import ca.pfv.spmf.algorithms.sequentialpatterns.gsp_AGP.AlgoGSP;
import ca.pfv.spmf.algorithms.sequentialpatterns.gsp_AGP.items.SequenceDatabase;
import ca.pfv.spmf.algorithms.sequentialpatterns.gsp_AGP.items.creators.AbstractionCreator;
import ca.pfv.spmf.algorithms.sequentialpatterns.gsp_AGP.items.creators.AbstractionCreator_Qualitative;

public class GspThread implements Runnable {

	private Dataset dataset = null;
	private Session session = null;
	private PatternManager patternManager = null;
	
	/*private float minSupRelative = (float)0.01;
	private int minSupAbsolute = 500;
    private int maxSize = Integer.MAX_VALUE;
    private int minGap = 0;
    private int maxGap = 1;
    private int windowSize = 0;
    private long maxDuration = 30000;
    private boolean verbose = false;
    private boolean outputSequenceIdentifiers = false;*/
	
	private GspParameters parameters = null;
	
    private AbstractionCreator abstractionCreator = null;
    private SequenceDatabase sequenceDatabase = null;
    
    private AlgoGSP algorithm = null;
    
	public GspThread(Dataset dataset, Session session, GspParameters parameters) {
		this.dataset = dataset;
		this.session = session;
		this.patternManager = dataset.getPatternManager(session);
		this.parameters = parameters;
	}

	public void setParameters(GspParameters parameters) {
		this.parameters = parameters;
	}
	
	public GspParameters getParameters() {
		return this.parameters;
	}
	
	public void setupForStart() {
		// this.minGap = 0;
		
		// Sends a signal to the pattern manager indicating that the data is loading
        // TODO move the call to another object than the pattern manager
		patternManager.signalLoadingData();
		
		abstractionCreator = AbstractionCreator_Qualitative.getInstance();
        sequenceDatabase = new SequenceDatabase(abstractionCreator);
        
        sequenceDatabase.loadDataset(dataset, parameters.getMinSupAbsolute(), parameters.getWindowSize());

		// Sends a signal to the pattern manager indicating that the data is loaded
        // TODO move the call to another object than the pattern manager
		patternManager.signalDataLoaded();
		
		// use the parameters object instead, and maybe also in start(), for runAlgorithm() ?
        algorithm = new AlgoGSP(this.parameters,/*minSupAbsolute, maxSize, minGap, maxGap, windowSize, maxDuration,*/ abstractionCreator);
	}

	@Override
	public void run() {		
		setupForStart();
		start();
	}
	
	public void start() {
		// TODO Auto-generated method stub
		boolean keepPatterns = true;
		String output = null;
		
		try {
			algorithm.runAlgorithm(sequenceDatabase,keepPatterns,parameters.isVerbose(),output, parameters.isOutputSequenceIdentifiers(), patternManager);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		System.out.println("GSP done");
	}

	/**
	 * Not to be used for episodes
	 * @param minSupRelative
	 * @param windowSize
	 * @param maxSize
	 * @param maxGap
	 */
	/*public void updateParameters(float minSupRelative, int windowSize, int maxSize, int maxGap) {
		this.minSupRelative = minSupRelative;
		this.maxSize = maxSize;
		this.maxGap = maxGap;
		this.windowSize = windowSize;
	}*/

	/* Not to be used if we have a GspParameters object
	public void updateParameters(int minSupAbsolute, int windowSize, int maxSize, int minGap, int maxGap, int maxDuration) {
		this.minSupAbsolute = minSupAbsolute;
		this.maxSize = maxSize;
		this.minGap = minGap;
		this.maxGap = maxGap;
		this.windowSize = windowSize;
		this.maxDuration = maxDuration;
	}*/

}
