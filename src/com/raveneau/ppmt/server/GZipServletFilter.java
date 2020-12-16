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

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class GZipServletFilter implements Filter {

  @Override
  public void init(FilterConfig filterConfig) throws ServletException {
  }

  @Override
  public void destroy() {
  }

  public void doFilter(ServletRequest request, 
                       ServletResponse response,
                       FilterChain chain) 
  throws IOException, ServletException {

    HttpServletRequest  httpRequest  = (HttpServletRequest)  request;
    HttpServletResponse httpResponse = (HttpServletResponse) response;

    if ( acceptsGZipEncoding(httpRequest) ) {
      httpResponse.addHeader("Content-Encoding", "gzip");
      GZipServletResponseWrapper gzipResponse =
        new GZipServletResponseWrapper(httpResponse);
      chain.doFilter(request, gzipResponse);
      gzipResponse.close();
    } else {
      chain.doFilter(request, response);
    }
  }

  private boolean acceptsGZipEncoding(HttpServletRequest httpRequest) {
      String acceptEncoding = 
        httpRequest.getHeader("Accept-Encoding");

  return acceptEncoding != null && 
         acceptEncoding.indexOf("gzip") != -1;
  }
}