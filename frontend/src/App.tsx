import React from 'react';
import { StyleSheet, SafeAreaView, ActivityIndicator, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';

const WEB_URL = 'https://medidorglicemia-production.up.railway.app';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Barra de status clara para fundo escuro */}
      <StatusBar style="light" />

      <WebView
        source={{ uri: WEB_URL }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
          </View>
        )}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
        injectedJavaScript={`
          document.body.style.margin = '0';
          document.body.style.padding = '0';
          true;
        `}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});