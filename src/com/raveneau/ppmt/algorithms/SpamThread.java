package com.raveneau.ppmt.algorithms;

import java.io.IOException;

import com.raveneau.ppmt.events.ThreadListener;

import ca.pfv.spmf.algorithms.sequentialpatterns.spam.AlgoSPAM;

public class SpamThread extends Thread {
	
	private String inputPath = null;
	private String outputPath = null;
	private double minSupRel = 0;
	private boolean showSequenceIdentifiersInOutput = true;
	private AlgorithmHandler algorithmHandler = null;
	private AlgoSPAM spam = new AlgoSPAM();
	private boolean mainThread = false;
	private int requestedPrefix = -3;
	
	public SpamThread(String inputPath, String outputPath, double minSupRel, boolean showSequenceIdentifiersInOutput, Integer prefix, boolean mainThread, AlgorithmHandler algorithmHandler) {
		super();
		this.inputPath = inputPath;
		//System.out.println(inputPath);
		this.outputPath = outputPath;
		//System.out.println(outputPath);
		this.minSupRel = minSupRel;
		//System.out.println(minSupRel);
		this.showSequenceIdentifiersInOutput = showSequenceIdentifiersInOutput;
		this.mainThread = mainThread;
		//System.out.println(showSequenceIdentifiersInOutput);
		this.algorithmHandler = algorithmHandler;
		this.requestedPrefix = prefix;
	}

	@Override
	public void run() {
		System.out.println("Start of SPAM - requested prefix : " + requestedPrefix);
		try {
			spam.runAlgorithm(inputPath, outputPath, minSupRel, requestedPrefix, algorithmHandler);
		} catch (IOException e) {
			e.printStackTrace();
		}
		System.out.println("SPAM done;");
		algorithmHandler.threadTerminated(mainThread);
	}
	
	
}
