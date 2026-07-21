package com.ev.ops;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Bitmap;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * WebView configuration helper class.
 * Provides methods to configure WebView with optimal settings for the UniApp runtime.
 */
public class WebViewHelper {

    private WebViewHelper() {
        // Utility class, no instantiation
    }

    /**
     * Apply standard WebView settings for UniApp compatibility.
     *
     * @param context the context
     * @param webView the WebView to configure
     */
    @SuppressLint("SetJavaScriptEnabled")
    public static void configure(Context context, WebView webView) {
        WebSettings settings = webView.getSettings();

        // JavaScript
        settings.setJavaScriptEnabled(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);

        // DOM Storage
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);

        // File access
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);

        // Cache
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Viewport
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);

        // Zoom
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);

        // Layout algorithm
        settings.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.TEXT_AUTOSIZING);

        // Mixed content
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);

        // Disable pull-to-refresh (handled by UniApp)
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
    }

    /**
     * Create a simple WebViewClient that handles page loading feedback.
     *
     * @param onComplete callback when page finishes loading
     * @return a configured WebViewClient
     */
    public static WebViewClient createSimpleWebViewClient(final OnPageLoadListener onComplete) {
        return new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (onComplete != null) {
                    onComplete.onPageLoaded(url);
                }
            }
        };
    }

    /**
     * Clear all WebView cache and data.
     *
     * @param webView the WebView to clear
     */
    public static void clearCache(WebView webView) {
        webView.clearCache(true);
        webView.clearHistory();
        webView.clearFormData();
    }

    /**
     * Callback interface for page load events.
     */
    public interface OnPageLoadListener {
        void onPageLoaded(String url);
    }
}
