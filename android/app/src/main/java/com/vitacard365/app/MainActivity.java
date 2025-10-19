package com.vitacard365.app;

import android.graphics.Color;
import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Establece el color de fondo antes de que el WebView pinte
        getWindow().getDecorView().setBackgroundColor(Color.parseColor("#0D2041"));

        // Si el bridge ya existe, aplica también al WebView
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setBackgroundColor(Color.parseColor("#0D2041"));
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        // Limpia caché del WebView para evitar servir assets viejos
        if (this.bridge != null) {
            WebView webView = this.bridge.getWebView();
            if (webView != null) {
                try {
                    webView.clearCache(true);
                } catch (Throwable ignored) {}
            }
        }
    }
}
