// Start running the mining algorithm
{
	action: "run",
	object: "algorithm",
	minSup: minSupport, // string, minimum (absolute) support threshold 
	windowSize: windowSize, // string, size of the search window (int value)
	maxSize: maxSize, // string, maximum pattern size to extract (int value)
	minGap: minGap, // string, minimum gap for occurrences (int value)
	maxGap: maxGap, // string, maximum gap for occurrences (int value)
	maxDuration: maxDuration, // string, maximum duration of an occurrence (int value, in milliseconds)
	datasetName: datasetName, // string, name of the dataset
	delay: delay // OPTIONNAL, integer, number of milliseconds the algorithm will be paused between each candidate check
}

// Stop the algorithm
{
	action: "stop",
	object: "algorithm"
}

// Request the occurrences of a pattern
{
	action: "request",
	object: "patternOccs",
	dataset: datasetName, // string, name of the dataset
	patternId: patternId // integer, pattern id
}

// Ping to keep a connexion open
{
	action: "ping"
}

// Ask to load a dataset
{
	action: "load",
	object: "dataset",
	dataset: datasetName  // string, name of the dataset
}

// Request the list of available datasets
{
	action: "request",
	object: "datasetList"
}

// Ask the server to send the content of a dataset
{
	action: "request",
	object: "dataset",
	dataset: datasetName // string, name of the dataset
}

// Check if a dataset is valid (i.e. is available on the server)
{
	action: "validate",
	object: "dataset",
	dataset: datasetName // string, name of the dataset
}

// Request information about a dataset (its attributes)
{
	action: "request",
	object: "datasetInfo",
	dataset: datasetName // string, name of the dataset
}

// Revert a dataset to its initial content (if it has been changed)
{
	action: "request",
	object: "datasetReset"
}

// Request the list of event types in a dataset
{
	action: "request",
	object: "eventTypes",
	dataset: datasetName // string, name of the dataset
}

// Request the list of users in a dataset
{
	action: "request",
	object: "userList",
	dataset: datasetName // string, name of the dataset
}

// Start a steering with a pattern as prefix
{
	action: "steerOnPattern",
	object: "start",
	patternId: patternId // integer, id of the pattern to use as prefix
}

// Start a steering on a user
{
	action: "steerOnUser",
	userId: userId // string, user id
}

// Start a steering on a time period
{
	action: "steerOnTime",
	start: start, // string, start of the time interval (milliseconds) 
	end: end // string, end of the time interval (milliseconds)
}

// Create an event type from a pattern
{
	action: "alterDataset",
	alteration: "createEventTypeFromPattern",
	patternId: patternId, // integer, id of the pattern
	typeName: eventTypeName, // string, name of the new event type
	options: {
		removeOccurrences: names // array of string, contains the name of event types for which we want to remove all occurrences (not just the ones involved in the occurrences of the pattern)
	}
}

// Remove event types from the dataset
{
	action: "alterDataset",
	alteration: "removeEventTypes",
	eventNames: eventNames // array of string, name of the event types to remove
}

// Remove users from the dataset
{
	action: "alterDataset",
	alteration: "removeUsers",
	userNames: userNames // array of string, name of the users to remove
}

// Request information about the server memory state
{
	action:"request",
	object:"memory"
}