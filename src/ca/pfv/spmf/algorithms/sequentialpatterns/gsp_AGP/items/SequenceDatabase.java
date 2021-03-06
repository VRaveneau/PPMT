package ca.pfv.spmf.algorithms.sequentialpatterns.gsp_AGP.items;


import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.raveneau.ppmt.datasets.Dataset;

import ca.pfv.spmf.algorithms.sequentialpatterns.gsp_AGP.items.creators.AbstractionCreator;
import ca.pfv.spmf.algorithms.sequentialpatterns.gsp_AGP.items.creators.ItemAbstractionPairCreator;
import ca.pfv.spmf.algorithms.sequentialpatterns.gsp_AGP.items.patterns.Pattern;
import ca.pfv.spmf.algorithms.sequentialpatterns.gsp_AGP.items.patterns.PatternCreator;

/**
 * Inspired in SPMF
 * Implementation of a sequence database, where each sequence is implemented
 * as an array of integers and should have a unique id.
 * See examples in /test/ directory for the format of input files.
 *
 * Copyright (c) 2013 Antonio Gomariz Peñalver
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
public class SequenceDatabase {
    
    private AbstractionCreator abstractionCreator;
    
    /**
     * Map to associate the frequent items with the 1-patterns composed by themselves
     */
    private Map<Item, Pattern> frequentItems = new HashMap<Item, Pattern>();
    
    /**
     * List of sequences that compose the database
     */
    private List<Sequence> sequences = new ArrayList<Sequence>();
    
    /**
     * Instance of ItemFactory
     */
    private ItemFactory<Integer> itemFactory = new ItemFactory<Integer>();
    
    /**
     * Instance of PatternCreator
     */
    private PatternCreator patternCreator = PatternCreator.getInstance();
    
    public SequenceDatabase(AbstractionCreator abstractionCreator) {
        this.abstractionCreator = abstractionCreator;
    }

    /**
     * It loads the database contained in the file path given as parameter.
     * Besides, all the frequent 1-patterns are identified and the original database
     * is updated by removing the non-frequent items
     * @param path File path of the original database
     * @param minSupportAbsolute Minimum absolute support
     * @throws IOException 
     */
    public void loadFile(String path, double minSupportAbsolute) throws IOException {
    	//System.out.println("SequenceDatabase.loadFile():");
    	//System.out.println("----------------------------");
        String thisLine;
        BufferedReader myInput = null;
        try {
            FileInputStream fis = new FileInputStream(new File(path));
            myInput = new BufferedReader(new InputStreamReader(fis));
            int count = 0;
            while ((thisLine = myInput.readLine()) != null) {
                // si la linea no es un comentario
                if (thisLine.charAt(0) != '#') {
                    // añade una secuencia
                    addSequence(thisLine.split(" "));
                    count++;
                }
            }
           // System.out.println("File processed, "+count+" lines sent to 'addSequence'.");
            double minSupRelative = (int) Math.ceil(minSupportAbsolute * sequences.size());
           // double support = (int) (minSupport * sequences.size());
            Set<Item> items = frequentItems.keySet();
            Set<Item> itemsToRemove = new HashSet<Item>();
            for (Item item : items) {
                Pattern pattern = frequentItems.get(item);
                if (pattern.getSupport() < minSupportAbsolute) {
                    itemsToRemove.add(item);
                }
            }
            for (Item nonFrequent : itemsToRemove) {
                frequentItems.remove(nonFrequent);
            }

            // Commented out to keep the unfrequent items in the database
            //shrinkDatabase(frequentItems.keySet());
        } catch (Exception e) {
        	e.printStackTrace();
        } finally {
            if (myInput != null) {
                myInput.close();
            }
        }
    }
    
    /**
     * It loads the database contained in the dataset given as parameter.
     * Besides, all the frequent 1-patterns are identified and the original database
     * is updated by removing the non-frequent items
     * @param dataset The dataset
     * @param minSupportAbsolute Minimum absolute support
     */
    public void loadDataset(Dataset dataset, int minSupportAbsolute, int windowSize) {
    	// List of events in the form : type(coded as integer);start(in milliseconds);user;id
    	System.out.println("Requesting the mineable dataset with windowSize = "+windowSize);
    	List<List<String>> windows = dataset.getDatasetForMining(windowSize);
    	System.out.println("Mineable dataset received");
    	// Add all the sequences
    	//int count = 0;
    	for (List<String> sequence : windows) {
    		/*if (count == 10)
    			break;
    		count++;*/
    		addSequence(sequence);
    	}
    	
    	//double minSupRelative = (int) Math.ceil(minSupportAbsolute * sequences.size());
        // double support = (int) (minSupport * sequences.size());
         Set<Item> items = frequentItems.keySet();
         Set<Item> itemsToRemove = new HashSet<Item>();
         for (Item item : items) {
             Pattern pattern = frequentItems.get(item);
             if (pattern.getSupport() < minSupportAbsolute) {
                 itemsToRemove.add(item);
             }
         }
         for (Item nonFrequent : itemsToRemove) {
             frequentItems.remove(nonFrequent);
         }

         // Commented out to keep the unfrequent items in the database
         //shrinkDatabase(frequentItems.keySet());
    	
    }
    
    /**
     * It creates and addes the sequence found in the array of Strings
     * @param integers 
     */
    public void addSequence(String[] integers) {
        ItemAbstractionPairCreator creadorPares = ItemAbstractionPairCreator.getInstance();
        long timestamp;
        Sequence sequence = new Sequence(sequences.size());
        Itemset itemset = new Itemset();
        int start = 0;

        for (int i = start; i < integers.length; i++) {
        	if (integers[i].length() > 0) {
	            if (integers[i].codePointAt(0) == '<') {  // Timestamp
	                String value = integers[i].substring(1, integers[i].length()/* - 1*/);// vr: -1 unnecessary
	                timestamp = Long.parseLong(value);
	                itemset.setTimestamp(timestamp);
	            } else if (integers[i].equals("-1")) { // indica el final de un itemset
	                long time = itemset.getTimestamp() + 1;
	                sequence.addItemset(itemset);
	                itemset = new Itemset();
	                itemset.setTimestamp(time);
	            } else if (integers[i].equals("-2")) { // indica el final de la secuencia
	                sequences.add(sequence);
	            } else {
	                // extract the value for an item
	                Item item = itemFactory.getItem(Integer.parseInt(integers[i]));
	                Pattern pattern = frequentItems.get(item);
	                if (pattern == null) {
	                    pattern = patternCreator.createPattern(creadorPares.getItemAbstractionPair(item, abstractionCreator.CreateDefaultAbstraction()));
	                    frequentItems.put(item, pattern);
	                }
	                pattern.addAppearance(sequence.getId());
	                itemset.addItem(item);
	
	            }
        	}
        }
    }

    public void addSequence(Sequence sequence) {
        sequences.add(sequence);
    }

    public void addSequence(List<String> sequenceToAdd) {
    	ItemAbstractionPairCreator creadorPares = ItemAbstractionPairCreator.getInstance();
        long timestamp;
        int id;
        Sequence sequence = new Sequence(sequences.size());
        Itemset itemset = new Itemset();
        int start = 0;

        for (String event : sequenceToAdd) {
        	String[] splitEvent =event.split(";");
        	//System.out.println("=_=_=_=_=_=");
        	//System.out.println(event);
        	// Getting the timestamp
        	timestamp = Long.parseLong(splitEvent[1]);
        	id = Integer.parseInt(splitEvent[3]);
        	itemset.setTimestamp(timestamp);
        	itemset.setId(id);
        	//itemset.setUser(splitEvent[2]);
        	sequence.setUser(splitEvent[2]);
        	// Getting the value for the item
        	Item item = itemFactory.getItem(Integer.parseInt(splitEvent[0]));
            Pattern pattern = frequentItems.get(item);
            if (pattern == null) {
                pattern = patternCreator.createPattern(creadorPares.getItemAbstractionPair(item, abstractionCreator.CreateDefaultAbstraction()));
                frequentItems.put(item, pattern);
            }
            pattern.addAppearance(sequence.getId());
            itemset.addItem(item);
            // Adding the item as an itemset
            sequence.addItemset(itemset);
            itemset = new Itemset();
        }
        // Adding the sequence to the sequence pool
        //System.out.println("=-=-=-=-=-=");
        //System.out.println(sequence);
        sequences.add(sequence);
    }
    
    @Override
    public String toString() {
        StringBuilder r = new StringBuilder();
        for (Sequence sequence : sequences) {
            r.append(sequence.getId());
            r.append(":  ");
            r.append(sequence.toString());
            r.append('\n');
        }
        return r.toString();
    }

    public String toStringSampled(int nbSeq) {
        StringBuilder r = new StringBuilder();
        
        r.append("First "+nbSeq+" sequences:\n");
        int count = 0;
        
        for (Sequence sequence : sequences) {
        	if (count == nbSeq)
        		break;
            r.append(sequence.getId());
            r.append(":  ");
            r.append(sequence.toString());
            r.append('\n');
            count++;
        }
        return r.toString();
    }

    public int size() {
        return sequences.size();
    }

    public List<Sequence> getSequences() {
        return sequences;
    }
    
    public Sequence getUserSequence(String userId) {
    	for (Sequence s : sequences) {
    		if (s.getUser().equals(userId))
    			return s;
    	}
    	return null;
    }

    /**
     * It returns the frequent 1-patterns
     * @return the list of frequent items.
     */
    public List<Pattern> frequentItems() {
        List<Pattern> celdasDeItemsFrecuentes = new ArrayList<Pattern>(frequentItems.values());
        Collections.sort(celdasDeItemsFrecuentes);
        return celdasDeItemsFrecuentes;
    }

    /**
     * It return a map where are associated each frequent item with the 
     * 1-pattern composed by itself
     * @return the map
     */
    public Map<Item, Pattern> getFrequentItems() {
        return frequentItems;
    }

    public void clear() {
        if (sequences != null) {
            sequences.clear();
        }
        sequences = null;
        if (frequentItems != null) {
            frequentItems.clear();
        }
        frequentItems = null;
        itemFactory = null;
    }

    /**
     * Reduce the original database, removing the items not given in the 
     * parameter set
     * @param keySet 
     */
    private void shrinkDatabase(Set<Item> keySet) {
        for (Sequence sequence : sequences) {
            for (int i = 0; i < sequence.size(); i++) {
                Itemset itemset = sequence.get(i);
                for (int j = 0; j < itemset.size(); j++) {
                    Item item = itemset.get(j);
                    if (!keySet.contains(item)) {
                        sequence.remove(i, j);
                        j--;
                    }
                }
                if (itemset.size() == 0) {
                    sequence.remove(i);
                    i--;
                }
            }
        }
    }
}
