package com.vaultpace.app;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private ProgressBar progressBar;
    private SharedPreferences prefs;

    private static final String PREFS_NAME = "VaultPacePrefs";
    private static final String KEY_SERVER_URL = "server_url";
    private static final String DEFAULT_URL = "http://192.168.1.5:3000/home";

    public class AndroidBridge {
        @JavascriptInterface
        public void setServerUrl(String url) {
            runOnUiThread(() -> {
                if (url == null || url.trim().isEmpty()) return;
                String cleanUrl = url.trim();
                if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
                    cleanUrl = "http://" + cleanUrl;
                }
                prefs.edit().putString(KEY_SERVER_URL, cleanUrl).apply();
                webView.loadUrl(cleanUrl);
            });
        }

        @JavascriptInterface
        public void resetServerUrl() {
            runOnUiThread(() -> {
                prefs.edit().remove(KEY_SERVER_URL).apply();
                loadCurrentUrl();
            });
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        FrameLayout rootLayout = new FrameLayout(this);
        rootLayout.setBackgroundColor(Color.parseColor("#0B1110"));

        webView = new WebView(this);
        webView.setLayoutParams(new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        ));
        webView.setBackgroundColor(Color.parseColor("#0B1110"));

        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setLayoutParams(new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, 8
        ));
        progressBar.setMax(100);
        progressBar.setVisibility(View.GONE);

        rootLayout.addView(webView);
        rootLayout.addView(progressBar);
        setContentView(rootLayout);

        configureWebView();

        if (savedInstanceState == null) {
            loadCurrentUrl();
        } else {
            webView.restoreState(savedInstanceState);
        }
    }

    private void loadCurrentUrl() {
        String targetUrl = prefs.getString(KEY_SERVER_URL, DEFAULT_URL);
        webView.loadUrl(targetUrl);
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setUserAgentString(settings.getUserAgentString() + " VaultPaceApp/1.0");

        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                progressBar.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                progressBar.setVisibility(View.GONE);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    showSetupErrorPage(view, request.getUrl().toString(), error.getDescription() != null ? error.getDescription().toString() : "Connection failed");
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (uri != null && uri.getHost() != null) {
                    String host = uri.getHost();
                    if (host.contains("vaultpace.app") ||
                        host.contains("localhost") ||
                        host.contains("10.0.2.2") ||
                        host.contains("192.168.") ||
                        host.contains("vercel.app")) {
                        return false;
                    }
                }
                Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                startActivity(intent);
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(newProgress);
                } else {
                    progressBar.setVisibility(View.GONE);
                }
            }
        });
    }

    private void showSetupErrorPage(WebView view, String failedUrl, String errorMsg) {
        String currentUrl = prefs.getString(KEY_SERVER_URL, DEFAULT_URL);
        String html = "<!DOCTYPE html>"
            + "<html>"
            + "<head>"
            + "<meta name='viewport' content='width=device-width, initial-scale=1.0'>"
            + "<style>"
            + "  body { background: #0B1110; color: #F0FDF4; font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; text-align: center; }"
            + "  .card { background: #141E1B; border: 1px solid #1F2E2A; border-radius: 16px; padding: 28px 20px; width: 100%; max-width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }"
            + "  .badge { display: inline-block; background: rgba(16,185,129,0.15); color: #10B981; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }"
            + "  h1 { font-size: 22px; margin: 14px 0 8px; color: #FFFFFF; font-weight: 700; }"
            + "  p { font-size: 13px; color: #94A3B8; margin-bottom: 20px; line-height: 1.5; }"
            + "  .err-pill { background: rgba(239,68,68,0.1); color: #FCA5A5; padding: 6px 10px; border-radius: 8px; font-size: 12px; margin-bottom: 16px; word-break: break-all; }"
            + "  input { width: 100%; box-sizing: border-box; background: #0B1110; border: 1px solid #1F2E2A; border-radius: 10px; padding: 12px 14px; color: #FFFFFF; font-size: 14px; margin-bottom: 12px; outline: none; transition: border-color 0.2s; }"
            + "  input:focus { border-color: #10B981; }"
            + "  .btn-primary { width: 100%; background: #047857; color: #FFFFFF; border: none; border-radius: 10px; padding: 13px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 4px; box-shadow: 0 4px 12px rgba(4,120,87,0.3); }"
            + "  .presets { margin-top: 20px; text-align: left; }"
            + "  .presets-title { font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 600; margin-bottom: 8px; display: block; }"
            + "  .preset-btn { width: 100%; background: #0B1110; border: 1px solid #1F2E2A; color: #34D399; border-radius: 8px; padding: 10px 12px; font-size: 13px; font-weight: 500; cursor: pointer; margin-bottom: 8px; text-align: left; display: flex; align-items: center; justify-content: space-between; }"
            + "</style>"
            + "</head>"
            + "<body>"
            + "  <div class='card'>"
            + "    <span class='badge'>VaultPace Setup</span>"
            + "    <h1>Server Connection</h1>"
            + "    <div class='err-pill'>Could not reach: " + failedUrl + " (" + errorMsg + ")</div>"
            + "    <p>Enter your live Vercel URL or local development server address to connect:</p>"
            + "    <form onsubmit='handleSubmit(event)'>"
            + "      <input type='text' id='targetUrl' value='" + currentUrl + "' placeholder='http://192.168.1.5:3000/home' />"
            + "      <button type='submit' class='btn-primary'>Connect & Save</button>"
            + "    </form>"
            + "    <div class='presets'>"
            + "      <span class='presets-title'>Quick Connect Options:</span>"
            + "      <button class='preset-btn' onclick=\"applyUrl('http://192.168.1.5:3000/home')\">🏠 Local PC Wi-Fi <span>192.168.1.5:3000 &rarr;</span></button>"
            + "      <button class='preset-btn' onclick=\"applyUrl('https://vaultpace.vercel.app/home')\">🌐 Vercel Live <span>vaultpace.vercel.app &rarr;</span></button>"
            + "    </div>"
            + "  </div>"
            + "  <script>"
            + "    function handleSubmit(e) {"
            + "      e.preventDefault();"
            + "      var url = document.getElementById('targetUrl').value.trim();"
            + "      if (!url) return;"
            + "      if (window.AndroidBridge) { window.AndroidBridge.setServerUrl(url); }"
            + "    }"
            + "    function applyUrl(url) {"
            + "      document.getElementById('targetUrl').value = url;"
            + "      if (window.AndroidBridge) { window.AndroidBridge.setServerUrl(url); }"
            + "    }"
            + "  </script>"
            + "</body>"
            + "</html>";

        view.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) {
            webView.saveState(outState);
        }
    }
}
