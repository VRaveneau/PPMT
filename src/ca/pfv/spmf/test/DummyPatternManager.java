package ca.pfv.spmf.test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.websocket.Session;

import com.raveneau.ppmt.datasets.Dataset;
import com.raveneau.ppmt.patterns.Pattern;
import com.raveneau.ppmt.patterns.PatternManager;
import com.raveneau.ppmt.server.SessionHandler;

public class DummyPatternManager extends PatternManager {

	public DummyPatternManager() {
		super(new HashMap<String, String>(),
				new HashMap<String, String>(),null,null,null);
	}
	
	public DummyPatternManager(Map<String, String> eventsCoded,
			Map<String, String> eventsReadable, Session session, SessionHandler sessionHandler, Dataset dataset) {
		super(eventsCoded, eventsReadable, session, sessionHandler, dataset);
		// TODO Auto-generated constructor stub
	}

	@Override
	public List<String> getAllPatterns() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public List<Map<String, List<Integer>>> getPatternDistribution(String pattern) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public void addPattern(List<String> items, Integer support, List<Integer> sIds, List<String> users,
			List<long[]> timestamps, List<int[]> eventIds,boolean hasAllOccurrences) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public Pattern getPattern(int patternId) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public void signalStart(long start) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void signalEnd(long end) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void signalNewLevel(int k) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void signalLoadingData() {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void signalDataLoaded() {
		// TODO Auto-generated method stub
	
	}

}
