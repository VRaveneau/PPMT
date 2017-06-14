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

public class AlgorithmHandler implements SteeringListener/*, ThreadListener*/ {

	private SessionHandler sessionHandler;
	private Session session;
	private DatasetManager datasetManager;
	private Dataset dataset;
	
	private GspParameters algorithmParameters;
	
	private GspThread algorithm = null;
	private Thread thread = null;
	
	public AlgorithmHandler(SessionHandler sessionHandler, DatasetManager datasetManager, Session session) {
		this.sessionHandler = sessionHandler;
		this.session = session;
		this.datasetManager = datasetManager;
	}

	public Session getSession() {
		return this.session;
	}
	
	public void startMining(int minSup, int windowSize, int maxSize, int minGap, int maxGap, int maxDuration, String datasetName) {
		
		if (algorithm == null) {
			this.algorithmParameters = new GspParameters();
			this.algorithmParameters.updateParameters(minSup, windowSize, maxSize, minGap, maxGap, maxDuration);
			
			this.dataset = datasetManager.getDataset(datasetName);
			this.dataset.addPatternManagerToSession(session, sessionHandler); // deletes all the previously known patterns
			algorithm = new GspThread(this.dataset, session, algorithmParameters);
			// Useless if the parameters are passed in the constructor //algorithm.updateParameters(minSup, windowSize, maxSize, minGap, maxGap, maxDuration);
			
			this.thread = new Thread(algorithm);
			thread.start();
		} else {
			System.out.println("Error : Trying to start mining while already running");
			System.out.println("  Tip : Steering should be used instead, or a restart");
		}
	}

	@Override
	public void steeringRequestedOnPattern(int patternId) {
		System.out.println("AlgoHandler: Steering on pattern id " + Integer.toString(patternId) + " (" + dataset.getPatternManager(session).getPattern(patternId).itemsToString() + ")");
		
		this.algorithmParameters.requestSteeringOnPattern(patternId);
		/*
		 * Version if two threads are used
		 * 
		 * System.out.println("Steering on pattern id " + Integer.toString(patternId) + " (" + dataset.getPatternManager(session).getPattern(patternId) + ")");
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
		}*/
	}

	@Override
	public void steeringRequestedOnUser(String user) {
		// TODO Auto-generated method stub
		System.out.println("Steering requested on user "+user);
	}

	@Override
	public void steeringRequestedOnTime(String start, String end) {
		// TODO Auto-generated method stub
		System.out.println("Steering requested on time between "+start+" and "+end);
	}

	/* Belongs to ThreadListener, used for SPAM
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
	}*/
}
