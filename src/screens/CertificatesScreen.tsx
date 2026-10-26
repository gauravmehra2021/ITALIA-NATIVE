import React, { useCallback } from 'react';
import { Alert, Linking, Share, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { studentService } from '../api/services';
import type { Certificate } from '../api/types';
import { useResource } from '../hooks/useResource';
import { colors } from '../theme/colors';
import { Button } from '../components/Button';
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback';
import { PageHeading } from '../components/PageHeading';
import { Screen } from '../components/Screen';

export function CertificatesScreen() {
  const load = useCallback(() => studentService.certificates(), []);
  const { data, error, isLoading, refresh } = useResource(load);
  return (
    <Screen>
      <PageHeading title="Certificates" subtitle="Celebrate how far you’ve come." />
      {isLoading ? <LoadingState label="Loading certificates..." /> : error ? <ErrorState message={error.message} onRetry={() => { refresh(); }} /> : !data?.length ? (
        <EmptyState title="Your first certificate is waiting" description="Complete a course to earn and verify your certificate here." />
      ) : data.map(certificate => <CertificateDetails key={certificate.id} certificate={certificate} />)}
    </Screen>
  );
}

function CertificateDetails({ certificate }: { certificate: Certificate }) {
  const share = async () => {
    try {
      await Share.share({ title: certificate.courseTitle, message: `I completed ${certificate.courseTitle}! Verify my certificate: ${certificate.verificationUrl}` });
    } catch (cause) {
      Alert.alert('Unable to share certificate', cause instanceof Error ? cause.message : 'Please try again.');
    }
  };

  const download = async () => {
    if (!certificate.downloadUrl) {
      Alert.alert('Download unavailable', 'A certificate download link is not available yet.');
      return;
    }
    try {
      await Linking.openURL(certificate.downloadUrl);
    } catch (cause) {
      Alert.alert('Unable to open certificate', cause instanceof Error ? cause.message : 'Please try again.');
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.certificate}>
        <View style={styles.ribbon}><Text style={styles.ribbonText}>★  SSEUROPA  ★</Text></View>
        <Text style={styles.overline}>CERTIFICATE OF ACHIEVEMENT</Text>
        <Text style={styles.certifies}>This certifies the successful completion of</Text>
        <Text style={styles.course}>{certificate.courseTitle}</Text>
        <View style={styles.rule} />
        <Text style={styles.issueDate}>ISSUED {new Date(certificate.issuedAt).toLocaleDateString()}</Text>
        <View style={styles.seal}><Text style={styles.star}>★</Text><Text style={styles.verified}>VERIFIED</Text></View>
      </View>
      <View style={styles.verification}>
        <View style={styles.verifyCopy}><Text style={styles.label}>UNIQUE CERTIFICATE ID</Text><Text style={styles.id}>{certificate.certificateNumber}</Text><Text style={styles.caption}>Scan to verify this achievement.</Text></View>
        <QRCode value={certificate.verificationUrl} size={76} color={colors.deepNavy} backgroundColor={colors.white} />
      </View>
      <View style={styles.actions}><Button title="View / download PDF" onPress={() => { download(); }} /><Button title="Share" variant="secondary" onPress={() => { share(); }} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 18 },
  certificate: { alignItems: 'center', backgroundColor: '#FFFDF7', borderWidth: 2, borderColor: colors.gold, borderRadius: 17, paddingVertical: 23, paddingHorizontal: 16, minHeight: 270 },
  ribbon: { backgroundColor: colors.navy, paddingHorizontal: 15, paddingVertical: 7, borderRadius: 20, marginBottom: 17 },
  ribbonText: { color: colors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  overline: { color: '#93701C', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  certifies: { color: colors.muted, fontSize: 10, marginTop: 25, textAlign: 'center' },
  course: { color: colors.navy, fontSize: 19, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  rule: { height: 1, backgroundColor: '#E7D7A8', width: '75%', marginTop: 13, marginBottom: 13 },
  issueDate: { color: '#93701C', fontSize: 8, fontWeight: '800', letterSpacing: 0.7, marginTop: 5 },
  seal: { position: 'absolute', bottom: 12, right: 12, borderColor: colors.gold, borderWidth: 1, borderRadius: 25, width: 49, height: 49, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF8E6' },
  star: { color: '#C38B15', fontSize: 14 },
  verified: { color: '#93701C', fontSize: 5, fontWeight: '900' },
  verification: { backgroundColor: colors.white, padding: 14, borderRadius: 14, borderColor: colors.line, borderWidth: 1, marginTop: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  verifyCopy: { flex: 1 },
  label: { color: colors.muted, fontSize: 8, fontWeight: '800' },
  id: { color: colors.navy, fontSize: 13, fontWeight: '900', letterSpacing: 0.5, marginTop: 5, marginBottom: 4 },
  caption: { color: colors.muted, fontSize: 9 },
  actions: { flexDirection: 'row', gap: 9, marginTop: 5 },
});
