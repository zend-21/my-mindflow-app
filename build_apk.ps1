$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.0.9.10-hotspot'
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
Set-Location 'f:\React test\share-note\android'
.\gradlew.bat assembleDebug
