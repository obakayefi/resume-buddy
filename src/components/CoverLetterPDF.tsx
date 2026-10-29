import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Font registration is handled at runtime by registerInterFont() in src/lib/registerFonts.ts
// DO NOT add Font.register here — it runs server-side in Next.js and causes "Unknown font format"

const styles = StyleSheet.create({
  page: {
    paddingTop: 62,
    paddingBottom: 62,
    paddingHorizontal: 68,
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#1a1a1a',
    lineHeight: 1.65,
    backgroundColor: '#ffffff',
  },
});

interface CoverLetterPDFProps {
  text: string;
}

export default function CoverLetterPDF({ text }: CoverLetterPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {text.split(/\n\n+/).map((para, i) => (
          <View key={i} style={{ marginBottom: 10 }}>
            <Text>{para.trim()}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
