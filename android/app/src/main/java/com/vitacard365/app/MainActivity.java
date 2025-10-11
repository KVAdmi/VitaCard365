package com.vitacard365.app;

import com.getcapacitor.BridgeActivity;
import android.graphics.Color;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		// Fondo del window (antes de que WebView pinte)
		getWindow().getDecorView().setBackgroundColor(Color.parseColor("#0C1C3E"));
		// Fondo del WebView (cuando ya existe el bridge)
		if (getBridge() != null && getBridge().getWebView() != null) {
			getBridge().getWebView().setBackgroundColor(Color.parseColor("#0C1C3E"));
		}
	}
}
