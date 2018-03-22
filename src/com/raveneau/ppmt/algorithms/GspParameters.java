package com.raveneau.ppmt.algorithms;

public class GspParameters {
	
	private float minSupRelative = (float)0.01;
	
	private int minSupAbsolute = 500;
    private int maxSize = Integer.MAX_VALUE;
    private int minGap = 0;
    private int maxGap = 1;
    private int windowSize = 0;
    private long maxDuration = 30000;
    
    private boolean verbose = true;
    private boolean outputSequenceIdentifiers = false;
    
	private boolean hasChanged = false;
	private boolean steeringRequested = false;
	private boolean steeringOccurring = false;
	private SteeringTypes steeringTypeRequested = null;
	private SteeringTypes steeringTypeOccurring = null;

	private int steeringPatternIdRequested = -1;
	private int steeringPatternIdOccurring = -1;
	
	private String steeringUserIdRequested = "";
	private String steeringUserIdOccurring = "";
	
	private boolean terminationRequested = false;
	
	public GspParameters() {
		super();
		setChanged(false);
	}
	
	public boolean hasChanged() {
		return this.hasChanged;
	}
	
	public void setChanged(boolean value) {
		this.hasChanged = value;
	}
	
	public void updateParameters(int minSupAbsolute, int windowSize, int maxSize, int minGap, int maxGap, int maxDuration) {
		this.minSupAbsolute = minSupAbsolute;
		this.maxSize = maxSize;
		this.minGap = minGap;
		this.maxGap = maxGap;
		this.windowSize = windowSize;
		this.maxDuration = maxDuration;
		
		setChanged(true);
	}

	public float getMinSupRelative() {
		return minSupRelative;
	}

	public int getMinSupAbsolute() {
		return minSupAbsolute;
	}

	public int getMaxSize() {
		return maxSize;
	}

	public int getMinGap() {
		return minGap;
	}

	public int getMaxGap() {
		return maxGap;
	}

	public int getWindowSize() {
		return windowSize;
	}

	public long getMaxDuration() {
		return maxDuration;
	}

	public boolean isVerbose() {
		return verbose;
	}

	public boolean isOutputSequenceIdentifiers() {
		return outputSequenceIdentifiers;
	}

	public void setMinSupRelative(float minSupRelative) {
		this.minSupRelative = minSupRelative;
	}

	public void setMinSupAbsolute(int minSupAbsolute) {
		this.minSupAbsolute = minSupAbsolute;
	}

	public void setMaxSize(int maxSize) {
		this.maxSize = maxSize;
	}

	public void setMinGap(int minGap) {
		this.minGap = minGap;
	}

	public void setMaxGap(int maxGap) {
		this.maxGap = maxGap;
	}

	public void setWindowSize(int windowSize) {
		this.windowSize = windowSize;
	}

	public void setMaxDuration(long maxDuration) {
		this.maxDuration = maxDuration;
	}

	public void setVerbose(boolean verbose) {
		this.verbose = verbose;
	}

	public void setOutputSequenceIdentifiers(boolean outputSequenceIdentifiers) {
		this.outputSequenceIdentifiers = outputSequenceIdentifiers;
	}
	
	public boolean steeringIsRequested() {
		return this.steeringRequested;
	}
	
	public void requestSteeringOnPattern(int patternId) {
		this.steeringRequested = true;
		this.steeringTypeRequested = SteeringTypes.PATTERN;
		this.steeringPatternIdRequested = patternId;
	}
	
	public void requestSteeringOnUser(String userId) {
		this.steeringRequested = true;
		this.steeringTypeRequested = SteeringTypes.USER;
		this.steeringUserIdRequested = userId;
	}
	
	public void cancelSteeringRequest() {
		this.steeringRequested = false;
		this.steeringTypeRequested = null;
	}
	
	public boolean steeringIsOccurring() {
		return this.steeringOccurring;
	}
	
	public void startSteering(SteeringTypes type) {
		this.steeringOccurring = true;
		this.steeringTypeOccurring = type;
	}
	
	public void stopSteering() {
		this.steeringOccurring = false;
		this.steeringTypeOccurring = null;
	}
	
	public SteeringTypes getSteeringTypeRequested() {
		return steeringTypeRequested;
	}
	
	public SteeringTypes getSteeringTypeOccurring() {
		return steeringTypeOccurring;
	}
	
	public synchronized void startRequestedSteering() {
		startSteering(getSteeringTypeRequested());
		cancelSteeringRequest();
		switch (getSteeringTypeOccurring()) {
		case PATTERN:
			this.steeringPatternIdOccurring = this.steeringPatternIdRequested;
			break;
		case USER:
			this.steeringUserIdOccurring = this.steeringUserIdRequested;
			break;
		case TIME:
			
			break;
		default:
			break;
		}
	}

	public int getSteeringPatternIdRequested() {
		return steeringPatternIdRequested;
	}

	public void setSteeringPatternIdRequested(int steeringPatternIdRequested) {
		this.steeringPatternIdRequested = steeringPatternIdRequested;
	}

	public int getSteeringPatternIdOccurring() {
		return steeringPatternIdOccurring;
	}

	public void setSteeringPatternIdOccurring(int steeringPatternIdOccurring) {
		this.steeringPatternIdOccurring = steeringPatternIdOccurring;
	}

	public String getSteeringUserIdRequested() {
		return steeringUserIdRequested;
	}

	public void setSteeringUserIdRequested(String steeringUserIdRequested) {
		this.steeringUserIdRequested = steeringUserIdRequested;
	}

	public String getSteeringUserIdOccurring() {
		return steeringUserIdOccurring;
	}

	public void setSteeringUserIdOccurring(String steeringUserIdOccurring) {
		this.steeringUserIdOccurring = steeringUserIdOccurring;
	}

	public boolean isTerminationRequested() {
		return terminationRequested;
	}

	public void setTerminationRequested(boolean terminationRequested) {
		this.terminationRequested = terminationRequested;
	}
		
}
