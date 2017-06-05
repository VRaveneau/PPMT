package com.raveneau.ppmt.patterns;

public enum ExtractionState {
	COMPLETE("COMPLETE"),
	PARTIAL("PARTIAL");
	
	private String value = "";
	
	private ExtractionState(String value) {
		this.value = value;
	}
	
	public boolean isComplete() {
		if (this.value.equalsIgnoreCase("Complete"))
			return true;
		else
			return false;
	}
	
	public String getValue() {
		return this.value;
	}
}
