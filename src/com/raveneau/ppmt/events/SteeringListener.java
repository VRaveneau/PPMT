package com.raveneau.ppmt.events;

import java.util.EventListener;

public interface SteeringListener extends EventListener {
	void steeringRequestedOnPattern(String pattern);
}
