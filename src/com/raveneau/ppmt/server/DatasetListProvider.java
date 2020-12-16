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
