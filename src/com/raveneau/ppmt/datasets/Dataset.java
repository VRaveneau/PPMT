package com.raveneau.ppmt.datasets;

public class Dataset {
	private String name;
	private int nbEvents;
	private int nbSequences;
	private String inputPath;
	
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public int getNbEvents() {
		return nbEvents;
	}
	public void setNbEvents(int nbEvents) {
		this.nbEvents = nbEvents;
	}
	public int getNbSequences() {
		return nbSequences;
	}
	public void setNbSequences(int nbSequences) {
		this.nbSequences = nbSequences;
	}
	public String getInputPath() {
		return inputPath;
	}
	public void setInputPath(String inputPath) {
		this.inputPath = inputPath;
	}
	
	
}
