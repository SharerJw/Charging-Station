package com.ev.ops;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends AppCompatActivity {

    private static final int REQUEST_CODE_PERMISSIONS = 100;
    private static final int REQUEST_CODE_FILE_CHOOSER = 101;

    private WebView webView;
    private ProgressBar progressBar;
    private ValueCallback<Uri[]> fileChooserCallback;
    private long lastBackPressTime = 0;

    private static final String[] REQUIRED_PERMISSIONS = {
        Manifest.permission.CAMERA,
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Immersive status bar
        setupStatusBar();

        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);
        progressBar = findViewById(R.id.progressBar);

        setupWebView();
        requestPermissions();

        // Load the UniApp web resources
        loadApp();
    }

    private void setupStatusBar() {
        Window window = getWindow();
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(android.graphics.Color.TRANSPARENT);
        window.getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        );
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings settings = webView.getSettings();

        // Enable JavaScript
        settings.setJavaScriptEnabled(true);

        // Enable DOM Storage
        settings.setDomStorageEnabled(true);

        // Enable file access
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        // Enable cache
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Viewport settings
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);

        // Support zoom
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);

        // Mixed content (allow http resources in https pages)
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);

        // Set database path
        settings.setDatabaseEnabled(true);

        // User agent - append app identifier
        String defaultUA = settings.getUserAgentString();
        settings.setUserAgentString(defaultUA + " EVOpsApp/0.1.0");

        // Custom WebViewClient
        webView.setWebViewClient(new AppWebViewClient());

        // Custom WebChromeClient
        webView.setWebChromeClient(new AppWebChromeClient());

        // Enable scrollbar
        webView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);
    }

    private void loadApp() {
        // Try to load index.html from assets/www/ (copied structure)
        // The UniApp build output is directly mapped as assets via sourceSets config
        webView.loadUrl("file:///android_asset/index.html");
    }

    private void requestPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            boolean allGranted = true;
            for (String permission : REQUIRED_PERMISSIONS) {
                if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }
            if (!allGranted) {
                ActivityCompat.requestPermissions(this, REQUIRED_PERMISSIONS, REQUEST_CODE_PERMISSIONS);
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        // Permissions are handled via WebChromeClient's onPermissionRequest
        // This callback handles system-level permission grants
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            if (webView.canGoBack()) {
                webView.goBack();
                return true;
            }
            // Double-tap to exit
            long currentTime = System.currentTimeMillis();
            if (currentTime - lastBackPressTime < 2000) {
                finish();
            } else {
                lastBackPressTime = currentTime;
                android.widget.Toast.makeText(this, "再按一次退出应用", android.widget.Toast.LENGTH_SHORT).show();
            }
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_CODE_FILE_CHOOSER) {
            if (fileChooserCallback != null) {
                Uri[] results = null;
                if (resultCode == Activity.RESULT_OK && data != null) {
                    String dataString = data.getDataString();
                    if (dataString != null) {
                        results = new Uri[]{Uri.parse(dataString)};
                    }
                }
                fileChooserCallback.onReceiveValue(results);
                fileChooserCallback = null;
            }
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
    }

    @Override
    protected void onPause() {
        webView.onPause();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }

    // ==================== Inner Classes ====================

    /**
     * Custom WebViewClient to handle page navigation and resource loading.
     */
    private class AppWebViewClient extends WebViewClient {

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            String scheme = uri.getScheme();

            // Handle external URLs (http/https) - open in external browser
            if ("http".equals(scheme) || "https".equals(scheme)) {
                // Keep internal navigation within WebView
                // Only open truly external links
                String host = uri.getHost();
                if (host != null && (host.contains("ev-ops") || host.contains("localhost"))) {
                    return false; // Load in WebView
                }
                // For external links, open in browser
                Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                startActivity(intent);
                return true;
            }

            // Handle tel: scheme
            if ("tel".equals(scheme)) {
                Intent intent = new Intent(Intent.ACTION_DIAL, uri);
                startActivity(intent);
                return true;
            }

            // Handle mailto: scheme
            if ("mailto".equals(scheme)) {
                Intent intent = new Intent(Intent.ACTION_SENDTO, uri);
                startActivity(intent);
                return true;
            }

            // Handle geo: scheme
            if ("geo".equals(scheme)) {
                Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                startActivity(intent);
                return true;
            }

            // Let WebView handle file:// and other local schemes
            return false;
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            if (progressBar != null) {
                progressBar.setVisibility(View.GONE);
            }
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            super.onReceivedError(view, request, error);
            // Only handle main frame errors
            if (request.isForMainFrame()) {
                // Could show an error page here
            }
        }
    }

    /**
     * Custom WebChromeClient to handle JavaScript dialogs, progress, and permission requests.
     */
    private class AppWebChromeClient extends WebChromeClient {

        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            super.onProgressChanged(view, newProgress);
            if (progressBar != null) {
                progressBar.setProgress(newProgress);
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                } else {
                    progressBar.setVisibility(View.GONE);
                }
            }
        }

        @Override
        public void onPermissionRequest(final PermissionRequest request) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    // Grant all requested permissions (camera, microphone, etc.)
                    request.grant(request.getResources());
                }
            });
        }

        // For Android 5.0+ file chooser
        @Override
        public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
            if (fileChooserCallback != null) {
                fileChooserCallback.onReceiveValue(null);
            }
            fileChooserCallback = filePathCallback;

            Intent intent = fileChooserParams.createIntent();
            try {
                startActivityForResult(intent, REQUEST_CODE_FILE_CHOOSER);
            } catch (Exception e) {
                fileChooserCallback = null;
                return false;
            }
            return true;
        }
    }
}
