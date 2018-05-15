package com.raveneau.ppmt.server;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

import javax.json.JsonObject;
import javax.json.JsonObjectBuilder;
import javax.json.spi.JsonProvider;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.raveneau.ppmt.datasets.Dataset;
import com.raveneau.ppmt.datasets.DatasetManager;

public class DatasetListProvider extends HttpServlet {

	private DatasetManager datasetManager = DatasetManager.getInstance();
	
	public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		response.setContentType("application/json");
		response.setCharacterEncoding( "UTF-8" );
		
		PrintWriter out = response.getWriter();
		
		JsonObjectBuilder dataMessage = null;
		JsonProvider provider = JsonProvider.provider();
		
		// list of dataset names
		List<Dataset> list = datasetManager.getDatasetList();
		
		dataMessage = provider.createObjectBuilder()
				.add("action", "datasetList")
				.add("size", list.size());
		int count = 0;
		for (Dataset d : list) {
			dataMessage.add(Integer.toString(count), d.getName());
			dataMessage.add("param"+Integer.toString(count), d.getParameters().toJsonObject());
			count++;
		}
		
		out.write(dataMessage.build().toString());	
	}
}
