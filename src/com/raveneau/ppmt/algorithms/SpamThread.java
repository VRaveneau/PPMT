package com.raveneau.ppmt.algorithms;

/* This file is copyright (c) 20015-2020 Vincent Raveneau
* 
* This file is part of the PPMT software.
* 
* PPMT is free software: you can redistribute it and/or modify it under the
* terms of the GNU General Public License as published by the Free Software
* Foundation, either version 3 of the License, or (at your option) any later
* version.
* PPMT is distributed in the hope that it will be useful, but WITHOUT ANY
* WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
* A PARTICULAR PURPOSE. See the GNU General Public License for more details.
* You should have received a copy of the GNU General Public License along with
* PPMT. If not, see <http://www.gnu.org/licenses/>.
*/

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
		// commented out while the algorithmHandler is tailored for GSP
		//algorithmHandler.threadTerminated(mainThread);
	}
	
	
}
