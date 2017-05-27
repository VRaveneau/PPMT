/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package ca.pfv.spmf.algorithms.sequentialpatterns.gsp_AGP.items.patterns;

import java.util.ArrayList;
import java.util.BitSet;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import ca.pfv.spmf.algorithms.sequentialpatterns.gsp_AGP.items.abstractions.ItemAbstractionPair;

/**
 * Implementation of pattern structure. We define it as a list of pairs <abstraction, item>.
 * Besides, a bitSet appearingIn denotes the sequences where the pattern appears.
 * 
 * Copyright Antonio Gomariz Peñalver 2013
 * 
 * This file is part of the SPMF DATA MINING SOFTWARE
 * (http://www.philippe-fournier-viger.com/spmf).
 *
 * SPMF is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * SPMF is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with SPMF.  If not, see <http://www.gnu.org/licenses/>.
 * 
 * @author agomariz
 */
public class Pattern implements Comparable<Pattern> {

    /**
     * List of elements of a patterns. Concretely it is a list of pairs <abstraction, item>
     */
    private List<ItemAbstractionPair> elements;
    /**
     * Bitset when we keep the sequence IDs where the pattern it appears
     */
    private BitSet appearingIn;
    
    private Map<Integer, List<Integer>> appearencesBySequence = new HashMap<>();
    
    private Map<Integer,long[]> appearenceTimestamps = new HashMap<>();
    private Map<Integer,String> appearenceUsers = new HashMap<>();
    //private Boolean frequent = null;
    private int support = 0;

    private int nextAppearenceId = 0;
    
    /**
     * Standard constructor that sets all the attributes to empty values
     */
    public Pattern() {
        this.elements = new ArrayList<ItemAbstractionPair>();
        this.appearingIn = new BitSet();
    }

    /**
     * Constructor that creates a pattern with the given element list
     * @param elements element list
     */
    public Pattern(List<ItemAbstractionPair> elements) {
        this.elements = elements;
        this.appearingIn = new BitSet();
    }

    /**
     * Constructor that creates a pattern with the only element passed as a parameter
     * @param pair 
     */
    public Pattern(ItemAbstractionPair pair) {
        this.elements = new ArrayList<ItemAbstractionPair>();
        this.elements.add(pair);
        this.appearingIn = new BitSet();
    }

    /**
     * Get the string representation of this itemset
     * @return the string representation
     */
    @Override
    public String toString() {
        StringBuilder result = new StringBuilder();
        BitSet sequenceIdsList = appearingIn;
        for (int i = 0; i < elements.size(); i++) {
            result.append(elements.get(i).toString());
        }
        result.append("\t[");
        //for (int i = 0; i < listaEntradasPresentes.size(); i++) {
        for(int i = sequenceIdsList.nextSetBit(0); i >= 0; i = sequenceIdsList.nextSetBit(i+1)){
            result.append(i).append(", ");
        }
        result.deleteCharAt(result.length() - 1);
        result.deleteCharAt(result.length() - 1);
        result.append("]");
        return result.toString();
    }
    
    /**
     * Function working with itemsets of only one element
     * 
     * Get a string representation of this itemset. Adjusted to SPMF format.
     * @param outputSequenceIdentifiers if true, sequence identifiers will be output
     * @return the string representation
     */
    public String toStringToFile(boolean outputSequenceIdentifiers) {
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < elements.size(); i++) {
            if(i==elements.size()-1){
                if(i!=0)
                    result.append(elements.get(i).toStringToFile());
                else
                    result.append(elements.get(i).getItem());
            }
            else if(i==0){
                result.append(elements.get(i).getItem());
            }else{
                result.append(elements.get(i).toStringToFile());
            }
            
        }
        result.append(" #SUP: ");
        result.append(getSupport());
        // if the user wants the sequence IDs, we will show them
        if(outputSequenceIdentifiers) {
        	// Mean duration
        	List<Long> durations = new ArrayList<>();
        	String durationString = "";
        	long minDuration = -1;
        	long maxDuration = -1;
        	double standardDeviation = 0;
        	long totalDuration = 0;
        	if (elements.size() > 1) {
	        	for (int i = appearingIn.nextSetBit(0); i >= 0; i = appearingIn.nextSetBit(i+1)) {
	        		for (Integer idToLook : appearencesBySequence.get(i)) {
		        		long[] ts = appearenceTimestamps.get(idToLook);
		        		long duration = (ts[1]-ts[0])/1000;
		        		if (minDuration < 0 || minDuration > duration)
		        			minDuration = duration;
		        		if (maxDuration < 0 || maxDuration < duration)
		        			maxDuration = duration;
		        		
		        		durationString += Long.toString(duration)+" ";
		        		durations.add(new Long(duration));
		        		standardDeviation += duration*duration;
		        		totalDuration += duration;
	        		}
	        	}
	        	standardDeviation /= getSupport();
	        	double meanDuration = (totalDuration*1.0)/durations.size();
	        	standardDeviation -= meanDuration*meanDuration;
	        	standardDeviation = Math.sqrt(standardDeviation);
	        	result.append(" #SD: "+standardDeviation);
	        	result.append(" #MINDUR: "+minDuration);
	        	result.append(" #MAXDUR: "+maxDuration);
	        	Collections.sort(durations);
	        	if (durations.size() > 0) {
		        	result.append(" #MEANDUR: "+meanDuration);
		        	result.append(" #MEDIANDUR: "+durations.get(durations.size()/2));
	        	}
	        	result.append(" #DUR: ");
	        	result.append(durationString);
        	}
        }
        return result.toString();
    }
    
    /**
     * Function working as coded by AGP
     * 
     * Get a string representation of this itemset. Adjusted to SPMF format.
     * @param outputSequenceIdentifiers if true, sequence identifiers will be output
     * @return the string representation
     */
    public String toStringToFileInital(boolean outputSequenceIdentifiers) {
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < elements.size(); i++) {
            if(i==elements.size()-1){
                if(i!=0)
                    result.append(elements.get(i).toStringToFile());
                else
                    result.append(elements.get(i).getItem());
                result.append(" -1");
            }
            else if(i==0){
                result.append(elements.get(i).getItem());
            }else{
                result.append(elements.get(i).toStringToFile());
            }
            
        }
        result.append(" #SUP: ");
        result.append(appearingIn.cardinality());
        // if the user wants the sequence IDs, we will show them
        if(outputSequenceIdentifiers) {
        	result.append(" #SID: ");
        	for (int i = appearingIn.nextSetBit(0); i >= 0; i = appearingIn.nextSetBit(i+1)) {
        		result.append(i);
        		if (elements.size() > 1) {
	        		long[] ts = appearenceTimestamps.get(new Integer(i));
	        		result.append("("+ts[0]+"-"+ts[1]+")");
        		}
        		result.append(" ");
        	}
        }
        return result.toString();
    }

    /**
     * Method that clones a pattern
     * @return the clone of the pattern
     */
    public Pattern clonePattern() {
        List<ItemAbstractionPair> elementsCopy = new ArrayList<ItemAbstractionPair>(elements);
        Pattern clone = new Pattern(elementsCopy);
        return clone;
    }

    /**
     * It gets the components of the patterns in a list of pairs
     * @return the list of pairs
     */
    public List<ItemAbstractionPair> getElements() {
        return elements;
    }

    /**
     * It gets the ith component from the pattern
     * @param i ith index of the element to return
     * @return the element (ItemAbstractionPair)
     */
    public ItemAbstractionPair getIthElement(int i) {
        return elements.get(i);
    }

    /**
     * It returns the last but one element of the pattern
     * @return the last but one element
     */
    public ItemAbstractionPair getLastButOneElement() {
        if (size() > 1) {
            return getIthElement(size() - 2);
        }
        return null;
    }

    /**
     * It returns the last element of the pattern
     * @return the last element
     */
    public ItemAbstractionPair getLastElement() {
        if (size() > 0) {
            return getIthElement(size() - 1);
        }
        return null;
    }

    /**
     * It returns the first n elements of the pattern
     * @param n an integer n 
     * @return the first n elements
     */
    public List<ItemAbstractionPair> getNElements(int n) {
        if (n <= elements.size()) {
            return elements.subList(0, n - 1);
        }
        return null;
    }

    /**
     * Setter for the pattern components
     * @param elements a list of elements
     */
    public void setElements(List<ItemAbstractionPair> elements) {
        this.elements = elements;
    }

    /**
     * Add a pair in the last position of the pattern
     * @param pair the pair
     */
    public void add(ItemAbstractionPair pair) {
        this.elements.add(pair);
    }

    /**
     * return the pattern size
     * @return the size of the pattern
     */
    public int size() {
        return elements.size();
    }

    /**
     * Compare this pattern to another pattern
     * @param arg the other pattern
     * @return 0 if equal, -1 if smaller, otherwise 1
     */
    public int compareTo(Pattern arg) {
        List<ItemAbstractionPair> elementsOfBiggerPattern, elementsOfSmallerPattern;
        if (getElements().size() >= arg.getElements().size()) {
            elementsOfBiggerPattern = getElements();
            elementsOfSmallerPattern = arg.getElements();
        } else {
            elementsOfSmallerPattern = getElements();
            elementsOfBiggerPattern = arg.getElements();
        }
        for (int i = 0; i < elementsOfSmallerPattern.size(); i++) {
            int comparison = elementsOfSmallerPattern.get(i).compareTo(elementsOfBiggerPattern.get(i));
            if (comparison != 0) {
                return comparison;
            }
        }
        if (elementsOfBiggerPattern.size() == elementsOfSmallerPattern.size()) {
            return 0;
        }
        if (getElements().size() < arg.getElements().size()) {
            return -1;
        }
        return 1;
    }

    /**
     * Check if this pattern is equal to another.
     * @param arg another pattern
     * @return true if equal, otherwise false.
     */
    public boolean equals(Object arg) {
        if (arg instanceof Pattern) {
            Pattern p = (Pattern) arg;
            if (this.compareTo(p) == 0) {
                return true;
            }
            return false;
        }
        return false;
    }

    @Override
    public int hashCode() {
        int hash = 5;
        hash = 67 * hash + (this.elements != null ? this.elements.hashCode() : 0);
        return hash;
    }

    /**
     * It answer to the question of if the current pattern is a prefix of the 
     * given pattern
     * @param p pattern where we want to check if our current pattern is a prefix
     * @return true if is a positive answer, false otherwise
     */
    public boolean isPrefix(Pattern p) {
        boolean output = false;
        List<ItemAbstractionPair> pElements = new ArrayList<ItemAbstractionPair>(p.getElements());
        pElements.remove(pElements.size() - 1);
        Pattern pTemp = new Pattern(pElements);
        if (this.equals(pTemp)) {
            output = true;
        }
        return output;
    }

    /**
     * Return the set of sequence IDs where the pattern appears
     * @return the set as a bitset
     */
    public BitSet getAppearingIn() {
        return appearingIn;
    }

    public void setAppearingIn(BitSet appearingIn) {
        this.appearingIn = appearingIn;
    }

    public void clear() {
        elements.clear();
        appearingIn.clear();
    }

    /**
     * Add a sequence ID in the sequence Id set
     * @param sequenceId  the sequence id
     */
    public void addAppearance(Integer sequenceId) {
        appearingIn.set(sequenceId);
        if (!appearencesBySequence.containsKey(sequenceId)) {
        	appearencesBySequence.put(sequenceId, new ArrayList<Integer>());
        }
    	appearencesBySequence.get(sequenceId).add(new Integer(nextAppearenceId));
    	nextAppearenceId++;
    	
    	support++;
    }

    /**
     * Add a sequence ID in the sequence Id set
     * @param sequenceId  the sequence id
     */
    public void addAppearance(Integer sequenceId, long[] timestamps, String user) {
        appearingIn.set(sequenceId);
        if (!appearencesBySequence.containsKey(sequenceId)) {
        	appearencesBySequence.put(sequenceId, new ArrayList<Integer>());
        }
    	appearencesBySequence.get(sequenceId).add(new Integer(nextAppearenceId));
        appearenceTimestamps.put(new Integer(nextAppearenceId), timestamps);
        appearenceUsers.put(new Integer(nextAppearenceId), user);
    	nextAppearenceId++;
    	
    	support++;
    }
    
    public List<String> getAppearenceUserInSequence(Integer seqId) {
    	List<String> result = new ArrayList<>();
    	for (Integer occId : appearencesBySequence.get(seqId))
    		result.add(appearenceUsers.get(occId));
    	
    	return result;
    }
    
    public String getAppearenceUser(Integer occId) {
    	return appearenceUsers.get(occId);
    }
    
    public List<long[]> getAppearanceTimestampInSequence(Integer seqId) {
    	List<long[]> result = new ArrayList<>();
    	for (Integer occId : appearencesBySequence.get(seqId))
    		result.add(appearenceTimestamps.get(occId));
    	
    	return result;
    }
    
    public long[] getAppearanceTimestamp(Integer occId) {
    	return appearenceTimestamps.get(occId);
    }

    /**
     * It returns the support of a pattern
     * @return the support
     */
    public int getSupport() {
        return support;
    	//return appearingIn.cardinality();
    }
    
    public List<Integer> getSequenceIds() {
    	List<Integer> result = new ArrayList<>();
    	for (int i = appearingIn.nextSetBit(0); i >= 0; i = appearingIn.nextSetBit(i+1)) {
    		result.add(new Integer(i));
    	}
    	return result;
    }
}
