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

public class GspParameters {
	
	private float minSupRelative = (float)0.01;
	
	private int minSupAbsolute = 500;
    private int maxSize = Integer.MAX_VALUE;
    private int minGap = 0;
    private int maxGap = 1;
    private int windowSize = 0;
    private long maxDuration = 30000;
    
    private long delay = 0;
    
    private boolean verbose = false;
    private boolean outputSequenceIdentifiers = false;
    
	private boolean hasChanged = false;
	private boolean steeringRequested = false;
	private boolean steeringOccurring = false;
	private SteeringTypes steeringTypeRequested = null;
	private SteeringTypes steeringTypeOccurring = null;

	private int steeringPatternIdRequested = -1;
	private int steeringPatternIdOccurring = -1;
	private long steeringStartOccurring = -1;
	private long steeringEndOccurring = -1;
	
	private String steeringUserIdRequested = "";
	private String steeringUserIdOccurring = "";
	private long steeringStartRequested = -1;
	private long steeringEndRequested = -1;
	
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
	
	public void updateParameters(int minSupAbsolute, int windowSize, int maxSize, int minGap, int maxGap, int maxDuration, long delay) {
		this.minSupAbsolute = minSupAbsolute;
		this.maxSize = maxSize;
		this.minGap = minGap;
		this.maxGap = maxGap;
		this.windowSize = windowSize;
		this.maxDuration = maxDuration;
		this.delay = delay;
		
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
	
	public long getDelay() {
		return delay;
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
	
	public void setDelay(long delay) {
		this.delay = delay;
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
	
	public void requestSteeringOnPatternStart(int patternId) {
		this.steeringRequested = true;
		this.steeringTypeRequested = SteeringTypes.PATTERN_START;
		this.steeringPatternIdRequested = patternId;
	}
	
	public void requestSteeringOnUser(String userId) {
		this.steeringRequested = true;
		this.steeringTypeRequested = SteeringTypes.USER;
		this.steeringUserIdRequested = userId;
	}
	
	public void requestSteeringOnTime(long start, long end) {
		this.steeringRequested = true;
		this.steeringTypeRequested = SteeringTypes.TIME;
		this.steeringStartRequested = start;
		this.steeringEndRequested = end;
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
		case PATTERN_START:
			this.steeringPatternIdOccurring = this.steeringPatternIdRequested;
			break;
		case USER:
			this.steeringUserIdOccurring = this.steeringUserIdRequested;
			break;
		case TIME:
			this.steeringStartOccurring = this.steeringStartRequested;
			this.steeringEndOccurring = this.steeringEndRequested;
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

	public long getSteeringStartRequested() {
		return steeringStartRequested;
	}

	public void setSteeringStartRequested(long steeringStartRequested) {
		this.steeringStartRequested = steeringStartRequested;
	}

	public long getSteeringStartOccurring() {
		return steeringStartOccurring;
	}

	public void setSteeringStartOccurring(long steeringStartOccurring) {
		this.steeringStartOccurring = steeringStartOccurring;
	}

	public long getSteeringEndRequested() {
		return steeringEndRequested;
	}

	public void setSteeringEndRequested(long steeringEndRequested) {
		this.steeringEndRequested = steeringEndRequested;
	}

	public long getSteeringEndOccurring() {
		return steeringEndOccurring;
	}

	public void setSteeringEndOccurring(long steeringEndOccurring) {
		this.steeringEndOccurring = steeringEndOccurring;
	}
	
	public boolean isTerminationRequested() {
		return terminationRequested;
	}

	public void setTerminationRequested(boolean terminationRequested) {
		this.terminationRequested = terminationRequested;
	}
		
}
