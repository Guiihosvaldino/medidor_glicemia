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
        <Text style={styles.subtitle}>
          {Platform.OS === 'web' ? 'Acesso via Navegador Web' : 'Aplicativo mobile via WebView'}
        </Text>
      </View>

      {/* Renderiza iframe na Web e WebView nativa no Android/iOS */}
      {Platform.OS === 'web' ? (
        <iframe 
          src={WEB_URL} 
          style={{ width: '100%', height: '100%', border: 'none', flex: 1 }} 
          title="Medidor de Glicemia Web"
        />
      ) : (
        <WebView
          source={{ uri: WEB_URL }}
          startInLoadingState
          renderLoading={() => <ActivityIndicator size="large" color="#10B981" style={styles.loading} />}
          style={styles.webview}
        />
      )}

      {Platform.OS === 'web' && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>Se preferir abrir diretamente no navegador:</Text>
          <Pressable onPress={() => Linking.openURL(WEB_URL)} style={styles.linkButton}>
            <Text style={styles.linkText}>Abrir em nova aba</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    padding: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  webview: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  footer: {
    padding: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  linkButton: {
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#0284C7',
    borderRadius: 6,
  },
  linkText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
});