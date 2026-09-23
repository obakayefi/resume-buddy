import { Document, Page, Text, View, StyleSheet, Font, Link } from '@react-pdf/renderer';
import type { MasterResumeData, OptimizedBullet } from '@/lib/types';

// Standard fonts for ATS readability
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 'bold' },
    { src: 'Helvetica-Oblique', fontStyle: 'italic' }
  ]
});

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: '#000000',
    lineHeight: 1.35,
  },
  header: {
    marginBottom: 14,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 3,
    letterSpacing: -0.3,
  },
  title: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#222222',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  contactRow: {
    fontSize: 9.5,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 2,
  },
  linkRow: {
    fontSize: 9.5,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 2,
  },
  contactText: {
    fontWeight: 'bold',
    color: '#000000',
  },
  link: {
    color: '#0056B3',
    textDecoration: 'underline',
    fontWeight: 'bold',
  },
  pipe: {
    color: '#000000',
    fontWeight: 'bold',
    marginHorizontal: 4,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  sectionRule: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#000000',
    marginBottom: 7,
  },
  summaryText: {
    fontSize: 9.5,
    lineHeight: 1.4,
    color: '#111111',
    textAlign: 'left',
  },
  experienceBlock: {
    marginBottom: 10,
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
    marginBottom: 4,
  },
  companyLocation: {
    fontSize: 9.5,
    fontStyle: 'italic',
    color: '#444444',
    flex: 1,
  },
  dates: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 3,
    alignItems: 'flex-start',
  },
  bulletSymbol: {
    width: 12,
    fontSize: 7,
    paddingTop: 1,
    color: '#000000',
  },
  bulletContent: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 1.35,
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
    fontStyle: 'italic',
    color: '#444444',
  }
});

interface ResumePDFProps {
  resume: MasterResumeData;
  optimizedBullets?: OptimizedBullet[];
  optimizedSummary?: string;
}

export function ResumePDF({ resume, optimizedBullets = [], optimizedSummary }: ResumePDFProps) {
  // Apply optimized bullets if available
  const processedExperience = resume.experience.map(exp => {
    const finalBullets = exp.bullets.map(b => {
      const match = optimizedBullets.find(ob => ob.original.trim() === b.trim());
      return match ? match.optimized : b;
    });
    return { ...exp, bullets: finalBullets };
  });

  const displaySummary = optimizedSummary || resume.summary;

  // Format link helper
  const formatUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
  };

  const getLinkLabel = (url: string, defaultLabel: string) => {
    if (!url) return defaultLabel;
    const clean = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (clean.includes('linkedin.com')) return 'LINKEDIN';
    if (clean.includes('twitter.com') || clean.includes('x.com')) return 'X';
    if (clean.includes('github.com')) return 'GITHUB';
    return defaultLabel.toUpperCase();
  };

  // Build contact items array
  const contactItems = [];
  if (resume.location) contactItems.push({ type: 'text', val: resume.location });
  if (resume.phone) contactItems.push({ type: 'text', val: resume.phone });
  if (resume.email) contactItems.push({ type: 'email', val: resume.email });

  // Build social link items array
  const linkItems = [];
  if (resume.linkedin) linkItems.push({ url: resume.linkedin, label: getLinkLabel(resume.linkedin, 'LinkedIn') });
  if (resume.twitter) linkItems.push({ url: resume.twitter, label: getLinkLabel(resume.twitter, 'X') });
  if (resume.website) linkItems.push({ url: resume.website, label: getLinkLabel(resume.website, 'Portfolio Website') });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{resume.name}</Text>
          {resume.title && <Text style={styles.title}>{resume.title}</Text>}
          
          {contactItems.length > 0 && (
            <View style={styles.contactRow}>
              {contactItems.map((item, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {idx > 0 && <Text style={styles.pipe}>|</Text>}
                  {item.type === 'email' ? (
                    <Link src={`mailto:${item.val}`} style={styles.link}>
                      {item.val}
                    </Link>
                  ) : (
                    <Text style={styles.contactText}>{item.val}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {linkItems.length > 0 && (
            <View style={styles.linkRow}>
              {linkItems.map((item, idx) => (
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
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bulletSymbol}>●</Text>
                  <Text style={styles.bulletContent}>
                    <Text style={styles.skillCategory}>{group.category}: </Text>
                    {group.skills.join(', ')}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.bulletRow}>
                <Text style={styles.bulletSymbol}>●</Text>
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
                    {exp.company}{exp.company && (exp as any).location ? ` - ${(exp as any).location}` : ''}
                  </Text>
                  <Text style={styles.dates}>
                    {exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}
                  </Text>
                </View>
                {exp.bullets.map((bullet, j) => (
                  <View key={j} style={styles.bulletRow}>
                    <Text style={styles.bulletSymbol}>●</Text>
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
            {(resume.projects ?? []).map((proj, i) => (
              <View key={i} style={styles.bulletRow} wrap={false}>
                <Text style={styles.bulletSymbol}>●</Text>
                <Text style={styles.bulletContent}>
                  <Text style={{ fontWeight: 'bold' }}>{proj.name}</Text>
                  {proj.url && (
                    <Text> (
                      <Link src={formatUrl(proj.url)} style={styles.link}>
                        {proj.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </Link>
                    )</Text>
                  )}
                  <Text>: {proj.description}</Text>
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {resume.education.length > 0 && (
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
                <Text style={styles.bulletSymbol}>●</Text>
                <Text style={styles.bulletContent}>
                  <Text style={{ fontWeight: 'bold' }}>{cert.name}</Text>
                  {cert.issuer && <Text> - {cert.issuer}</Text>}
                  {cert.date && <Text> ({cert.date})</Text>}
                </Text>
              </View>
            ))}
          </View>
        )}

      </Page>
    </Document>
  );
}

