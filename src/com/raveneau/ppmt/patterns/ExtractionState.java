package com.raveneau.ppmt.patterns;

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
