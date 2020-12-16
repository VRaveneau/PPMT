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
import java.io.OutputStream;
import java.util.zip.GZIPOutputStream;

import javax.servlet.ServletOutputStream;
import javax.servlet.WriteListener;

class GZipServletOutputStream extends ServletOutputStream {
	  private GZIPOutputStream    gzipOutputStream = null;

	  public GZipServletOutputStream(OutputStream output)
	        throws IOException {
	    super();
	    this.gzipOutputStream = new GZIPOutputStream(output);
	  }

	  @Override
	  public void close() throws IOException {
	    this.gzipOutputStream.close();
	  }

	  @Override
	  public void flush() throws IOException {
	    this.gzipOutputStream.flush();
	  }

	  @Override
	  public void write(byte b[]) throws IOException {
	    this.gzipOutputStream.write(b);
	  }

	  @Override
	  public void write(byte b[], int off, int len) throws IOException {
	    this.gzipOutputStream.write(b, off, len);
	  }

	  @Override
	  public void write(int b) throws IOException {
	     this.gzipOutputStream.write(b);
	  }

	@Override
	public boolean isReady() {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public void setWriteListener(WriteListener arg0) {
		// TODO Auto-generated method stub
		
	}
	}