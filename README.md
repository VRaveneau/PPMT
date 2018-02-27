# PPMT, a Progressive Pattern Mining Tool

This tool is designed to explore user activity data.
The code in this repository is configured to connect to the live server available at [http://ppmt.univ-nantes.fr/ppmt](http://ppmt.univ-nantes.fr/ppmt). If you want to setup your own server, see the **[Configuration](#configuration)** section fo this README. 

## Data format

**PPMT** looks for two kind of files when searching for available datasets : a mandatory `.csv` file containing the data, and an optional `.json` file containing parameters specific to this dataset. These two files must have the same name (ex : `data.csv` and `data.json`).

### Dataset file (`.csv`)

The following constraints apply to these files :

- One event per line
- Use a `;` as separator
- Remove every `;` from the events data
- Events from the same trace (i.e with the same `userId`) must be in the correct temporal order 
- Several traces can be overlapping, as long as the previous point is satisfied for each of them

For every event (every line), the following constraints apply:

- Every line has the same number of attributes (empty if there is no value)
- The first 4 attributes are always the following :
-- Type of the event
-- Start date of the event
-- End date of the event (can be empty if the event is instantaneous)
-- Id of the user 
- Every other attribute can be dataset-specific

### Dataset parameters (`.json`)

This file is optional. When it is provided, no attribute is mandatory, and attributes not described here can be provided (but won't be read). The following attributes are currently accepted :

- `eventDescription`, used to provide a description of what the event types present in the dataset represent. It is an object that takes event types as keys and strings as values. 
- `eventCategory`, grouping event types into categories. It is an object that takes categories names as keys and arrays of event types as values.
- **Not yet implemented** `timeFormat`, describing the format used for dates in the dataset. It is a string describing a valid [Java date format](http://docs.oracle.com/javase/7/docs/api/java/text/SimpleDateFormat.html).

Information about the data can also be added, that will be presented in the dataset selection part of the tool. However, once the dataset has been selected, the values for these are recalculated from the actual data:

- `nbUsers`, the number of different users in the data. It is an integer.
- `nbEvents`, the number of events in the data. It is an integer.
- `nbEventTypes`, the number of event types in the data. It is an integer.
- `duration`, the time span covered by the dataset. It is a string (supposed to express a time-period in a human-readable format).

## Configuration

### Configuration and git branches

Every file mentioned in the **[Configuration files & options](#configuration-files--options)** section has the `merge=ours` git attribute, essentially making every `git merge` ignore them (regardless of merge conflicts). When commiting changes to these files that should be propagated to several branches, you need to make a different commit for each branch.

### Configuration files & options

The main configuration file is `WebContent/config.js`. Two parameters are present:

- The adress of the websocket, which should be `<serverHost>:<serverPort>/<applicationRoot>/wsppmt`

- The adress of the servlet providing the list of known datasets, which should be `http://<serverHost>:<serverPort>/<applicationRoot>/datasetProvider`

Another configuration file is `src/com/raveneau/ppmt/datasets/messages.properties`. One parameter is present:

- The address of the folder where the server can find its datasets. Subfolders are scanned too. Every `.csv` file is considered a potential dataset, even though its content may not match the expected format of **PPMT**.
