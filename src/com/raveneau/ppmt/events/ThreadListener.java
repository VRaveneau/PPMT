package com.raveneau.ppmt.events;

import java.util.EventListener;

public interface ThreadListener extends EventListener{
	void threadTerminated(boolean mainThread);
}
