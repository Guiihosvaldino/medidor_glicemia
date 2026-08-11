import React from 'react';
import { SafeAreaView, StyleSheet, View, Text, ActivityIndicator, Pressable, Linking, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';

const WEB_URL = 'https://medidorglicemia-production.up.railway.app';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Medidor de Glicemia</Text>
        <Text style={styles.subtitle}>Aplicativo mobile via WebView</Text>
      </View>

      <WebView
        source={{ uri: WEB_URL }}
        startInLoadingState
        renderLoading={() => <ActivityIndicator size="large" color="#10B981" style={styles.loading} />}
        style={styles.webview}
      />

      {Platform.OS !== 'web' && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>Se o app não carregar, abra no navegador:</Text>
          <Pressable onPress={() => Linking.openURL(WEB_URL)} style={styles.linkButton}>
            <Text style={styles.linkText}>Abrir site</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 20,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: '#c7d2fe',
    marginTop: 6,
  },
  webview: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    padding: 14,
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  footerText: {
    color: '#94a3b8',
    marginBottom: 8,
  },
  linkButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#10b981',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  linkText: {
    color: '#0f172a',
    fontWeight: '700',
  },
});
