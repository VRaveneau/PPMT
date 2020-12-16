package com.raveneau.ppmt.server;

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
import java.io.PrintWriter;
import java.util.List;

import javax.json.JsonArrayBuilder;
import javax.json.JsonObject;
import javax.json.JsonObjectBuilder;
import javax.json.spi.JsonProvider;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.raveneau.ppmt.datasets.Dataset;
import com.raveneau.ppmt.datasets.DatasetManager;
import com.raveneau.ppmt.events.Event;

public class DatasetProvider extends HttpServlet {

	private DatasetManager datasetManager = DatasetManager.getInstance();
	
	public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		response.setContentType("application/json");
		response.setCharacterEncoding( "UTF-8" );
		
		String queryString = request.getQueryString();
		String[] queryStringParts = queryString.split("&");
		String sessionToken = "";
		
		for(int i = 0; i < queryStringParts.length; i++) {
			if ("session".equals(queryStringParts[i].split("=")[0])) {
				sessionToken = queryStringParts[i].split("=")[1];
			}
		}
		
		if (sessionToken.length() == 0)
			return;
		
		PrintWriter out = response.getWriter();
		
		JsonObjectBuilder dataMessage = null;
		JsonProvider provider = JsonProvider.provider();
		
		// list of dataset names
		System.out.println("Token: "+sessionToken);
		Dataset ds = datasetManager.getDatasetFromToken(sessionToken);
		while(ds.isLoading()) {
			System.out.println("Is loading...");
			try {
				wait(1000);
			} catch (InterruptedException e1) {
				// TODO Auto-generated catch block
				e1.printStackTrace();
			}
		}

    	List<Event> events = ds.getEvents();
    	
		JsonArrayBuilder eventArray = provider.createArrayBuilder();
    	
		dataMessage = provider.createObjectBuilder()
				.add("action", "data")
				.add("type", "events");
    	int nbEventsInMessage = 0;
    	for (Event e : events) {
    		eventArray.add(e.toJsonObject());
    		nbEventsInMessage++;
    	}
    	dataMessage.add("numberOfEvents", nbEventsInMessage);
		dataMessage.add("events", eventArray.build());
		
		datasetManager.removeToken(sessionToken);
		
		out.write(dataMessage.build().toString());	
	}
}
