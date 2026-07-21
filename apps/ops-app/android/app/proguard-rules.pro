# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in D:\Programs\Android\SDK\tools\proguard\proguard-android.txt

# ---- WebView ----
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keepattributes JavascriptInterface
-keepattributes *Annotation*

-keep public class android.webkit.** { *; }

# ---- App classes ----
-keep class com.ev.ops.** { *; }

# ---- AndroidX ----
-keep class androidx.** { *; }
-keep interface androidx.** { *; }
-dontwarn androidx.**

# ---- AppCompat ----
-keep class android.support.v7.** { *; }
-dontwarn android.support.v7.**

# ---- WebKit ----
-keep class android.webkit.** { *; }
-dontwarn android.webkit.**

# ---- General ----
-keepattributes Signature
-keepattributes Exceptions
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
