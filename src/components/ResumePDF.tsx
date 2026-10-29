import { Document, Page, Text, View, StyleSheet, Link, Svg, Circle } from '@react-pdf/renderer';
import type { MasterResumeData, OptimizedBullet } from '@/lib/types';

// Font registration is handled at runtime by registerInterFont() in src/lib/registerFonts.ts
// DO NOT add Font.register here — it runs server-side in Next.js and causes "Unknown font format"

const styles = StyleSheet.create({
  page: {
    paddingTop: 38,
    paddingBottom: 38,
    paddingHorizontal: 42,
    fontFamily: 'Inter',
    fontSize: 9.8,
    color: '#000000',
    lineHeight: 1.38,
  },
  header: {
    marginBottom: 12,
  },
  name: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
    lineHeight: 1.15,
    letterSpacing: -0.2,
  },
  title: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 6,
    lineHeight: 1.25,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  contactRow: {
    fontSize: 9.8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 3,
  },
  contactBold: {
    fontWeight: 'bold',
    color: '#000000',
  },
  emailLink: {
    color: '#0056B3',
    textDecoration: 'underline',
    fontWeight: 'bold',
  },
  linkRow: {
    fontSize: 9.8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 1,
  },
  link: {
    color: '#0056B3',
    textDecoration: 'underline',
    fontWeight: 'normal',
  },
  pipe: {
    color: '#000000',
    fontWeight: 'bold',
    marginHorizontal: 5,
  },
  section: {
    marginBottom: 11,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  sectionRule: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#000000',
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 9.8,
    lineHeight: 1.4,
    color: '#111111',
    textAlign: 'left',
  },
  experienceBlock: {
    marginBottom: 9,
  },
  jobTitle: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 3,
  },
  companyLocation: {
    fontSize: 9.8,
    color: '#333333',
    flex: 1,
  },
  dates: {
    fontSize: 9.8,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 3,
    alignItems: 'flex-start',
    paddingLeft: 6,
  },
  bulletSvg: {
    width: 8,
    height: 8,
    marginTop: 2.3,
    marginRight: 4,
    flexShrink: 0,
  },
  bulletContent: {
    flex: 1,
    fontSize: 9.8,
    lineHeight: 1.38,
    color: '#111111',
    textAlign: 'left',
  },
  skillCategory: {
    fontWeight: 'bold',
  },
  eduBlock: {
    marginBottom: 6,
  },
  eduDegreeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 1,
  },
  eduDegree: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#000000',
  },
  eduSchool: {
    fontSize: 9.5,
    color: '#333333',
  },
});

const BulletPoint = ({ size = 2.0, color = '#000000' }: { size?: number; color?: string }) => (
  <View style={styles.bulletSvg}>
    <Svg width="8" height="8" viewBox="0 0 8 8">
      <Circle cx="4" cy="4" r={size} fill={color} />
    </Svg>
  </View>
);

interface ResumePDFProps {
  resume: MasterResumeData;
  optimizedBullets?: OptimizedBullet[];
  optimizedSummary?: string;
}

function normalizeForMatching(str: string): string {
  return str
    .toLowerCase()
    .replace(/[\r\n]+/g, ' ')
    .replace(/[“”"']/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchOptimizedBullet(bullet: string, optimizedList: OptimizedBullet[]): string {
  if (!optimizedList || optimizedList.length === 0) return bullet.trim();
  const trimmed = bullet.trim();

  // 1. Direct trimmed match
  const direct = optimizedList.find(ob => ob.original.trim() === trimmed);
  if (direct) return direct.optimized.trim();

  // 2. Full normalized text match
  const normTarget = normalizeForMatching(bullet);
  if (!normTarget) return trimmed;

  const fullNorm = optimizedList.find(ob => normalizeForMatching(ob.original) === normTarget);
  if (fullNorm) return fullNorm.optimized.trim();

  // 3. Substring/prefix match for tolerance
  const prefix = normTarget.slice(0, 35);
  if (prefix.length >= 18) {
    const partial = optimizedList.find(ob => {
      const obNorm = normalizeForMatching(ob.original);
      return obNorm.includes(prefix) || normTarget.includes(obNorm.slice(0, 35));
    });
    if (partial) return partial.optimized.trim();
  }

  return trimmed;
}

export function ResumePDF({ resume, optimizedBullets = [], optimizedSummary }: ResumePDFProps) {
  // Apply optimized bullets with resilient matching
  const processedExperience = (resume.experience || []).map(exp => {
    const finalBullets = (exp.bullets || []).map(b => matchOptimizedBullet(b, optimizedBullets));
    return { ...exp, bullets: finalBullets };
  });

  const displaySummary = (optimizedSummary || resume.summary || '').trim();

  const formatUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
  };

  const getLinkLabel = (url: string, defaultLabel: string) => {
    if (!url) return defaultLabel.toUpperCase();
    const clean = url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    if (clean.includes('linkedin.com')) return 'LINKEDIN';
    if (clean.includes('twitter.com') || clean.includes('x.com')) return 'X';
    if (clean.includes('github.com')) return 'GITHUB';
    return defaultLabel.toUpperCase();
  };

  // Build contact line items
  const contactParts: { text: string; isEmail?: boolean }[] = [];
  if (resume.location) contactParts.push({ text: resume.location });
  if (resume.phone) contactParts.push({ text: resume.phone });
  if (resume.email) contactParts.push({ text: resume.email, isEmail: true });

  // Build link line items
  const linkParts: { url: string; label: string }[] = [];
  if (resume.linkedin) linkParts.push({ url: resume.linkedin, label: getLinkLabel(resume.linkedin, 'LinkedIn') });
  if (resume.twitter) linkParts.push({ url: resume.twitter, label: getLinkLabel(resume.twitter, 'X') });
  if (resume.website) linkParts.push({ url: resume.website, label: getLinkLabel(resume.website, 'Portfolio Website') });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{resume.name}</Text>
          {resume.title && <Text style={styles.title}>{resume.title}</Text>}

          {contactParts.length > 0 && (
            <View style={styles.contactRow}>
              {contactParts.map((item, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {idx > 0 && <Text style={styles.pipe}>|</Text>}
                  {item.isEmail ? (
                    <Link src={`mailto:${item.text}`} style={styles.emailLink}>
                      {item.text}
                    </Link>
                  ) : (
                    <Text style={styles.contactBold}>{item.text}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {linkParts.length > 0 && (
            <View style={styles.linkRow}>
              {linkParts.map((item, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {idx > 0 && <Text style={styles.pipe}>|</Text>}
                  <Link src={formatUrl(item.url)} style={styles.link}>
                    {item.label}
                  </Link>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Professional Summary */}
        {displaySummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <View style={styles.sectionRule} />
            <Text style={styles.summaryText}>{displaySummary}</Text>
          </View>
        )}

        {/* Skills */}
        {((resume.skillGroups ?? []).length > 0 || (resume.skills ?? []).length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.sectionRule} />
            {(resume.skillGroups ?? []).length > 0 ? (
              (resume.skillGroups ?? []).map((group, i) => (
                <View key={i} style={styles.bulletRow} wrap={false}>
                  <BulletPoint />
                  <Text style={styles.bulletContent}>
                    <Text style={styles.skillCategory}>{group.category}: </Text>
                    {group.skills.join(', ')}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.bulletRow} wrap={false}>
                <BulletPoint />
                <Text style={styles.bulletContent}>{resume.skills.join(', ')}</Text>
              </View>
            )}
          </View>
        )}

        {/* Professional Experience */}
        {processedExperience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Experience</Text>
            <View style={styles.sectionRule} />
            {processedExperience.map((exp, i) => (
              <View key={i} style={styles.experienceBlock} wrap={false}>
                <Text style={styles.jobTitle}>{exp.title}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.companyLocation}>
                    {exp.company}{exp.company && exp.location ? ` - ${exp.location}` : ''}
                  </Text>
                  <Text style={styles.dates}>
                    {exp.startDate.trim()}{exp.endDate ? ` – ${exp.endDate.trim()}` : ''}
                  </Text>
                </View>
                {exp.bullets.map((bullet, j) => (
                  <View key={j} style={styles.bulletRow} wrap={false}>
                    <BulletPoint />
                    <Text style={styles.bulletContent}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {(resume.projects ?? []).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            <View style={styles.sectionRule} />
            {(resume.projects ?? []).map((proj, i) => {
              const cleanUrl = proj.url ? proj.url.replace(/^https?:\/\//, '').replace(/\/$/, '') : '';
              const nameHasUrl = cleanUrl && proj.name.toLowerCase().includes(cleanUrl.toLowerCase());
              return (
                <View key={i} style={styles.bulletRow} wrap={false}>
                  <BulletPoint />
                  <Text style={styles.bulletContent}>
                    <Text style={{ fontWeight: 'bold' }}>{proj.name}</Text>
                    {proj.url && !nameHasUrl && (
                      <Text>
                        {' '}
                        (
                        <Link src={formatUrl(proj.url)} style={styles.link}>
                          {cleanUrl}
                        </Link>
                        )
                      </Text>
                    )}
                    <Text>: {proj.description.trim()}</Text>
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Education */}
        {(resume.education ?? []).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            <View style={styles.sectionRule} />
            {resume.education.map((edu, i) => (
              <View key={i} style={styles.eduBlock} wrap={false}>
                <View style={styles.eduDegreeRow}>
                  <Text style={styles.eduDegree}>
                    {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                  </Text>
                  <Text style={styles.dates}>
                    {edu.endDate || edu.startDate || ''}
                  </Text>
                </View>
                <Text style={styles.eduSchool}>{edu.school}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {(resume.certifications ?? []).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            <View style={styles.sectionRule} />
            {(resume.certifications ?? []).map((cert, i) => (
              <View key={i} style={styles.bulletRow} wrap={false}>
                <BulletPoint />
                <Text style={styles.bulletContent}>
                  <Text style={{ fontWeight: 'normal' }}>{cert.name}</Text>
                  {cert.issuer && <Text> - {cert.issuer.trim()}</Text>}
                  {cert.date && <Text> ({cert.date.trim()})</Text>}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
