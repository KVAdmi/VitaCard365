# Mantén nombres de nuestras clases locales (ajusta paquetes propios si aplica)
-keep class com.vitacard365.** { *; }
-keep class com.capacitorjs.** { *; }
-keep class com.getcapacitor.** { *; }

# Genera mapping completo
-renamesourcefileattribute SourceFile
-keepattributes SourceFile,LineNumberTable,InnerClasses,EnclosingMethod
