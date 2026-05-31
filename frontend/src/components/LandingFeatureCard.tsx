type LandingFeatureCardProps = {
  kicker: string;
  title: string;
  text: string;
};

export default function LandingFeatureCard({ kicker, title, text }: LandingFeatureCardProps) {
  return (
    <article style={cardStyle}>
      <div style={kickerStyle}>{kicker}</div>
      <h2 style={titleStyle}>{title}</h2>
      <p style={textStyle}>{text}</p>
    </article>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #EFE2D0',
  borderRadius: '24px',
  padding: '22px',
  boxShadow: '0 12px 28px rgba(45, 36, 36, 0.04)',
};

const kickerStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '42px',
  height: '42px',
  borderRadius: '999px',
  background: '#2D2424',
  color: '#FFF7ED',
  fontWeight: 900,
  marginBottom: '12px',
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 8px',
  color: '#2D2424',
  fontSize: '1.15rem',
};

const textStyle: React.CSSProperties = {
  margin: 0,
  color: '#6B7280',
  lineHeight: 1.6,
};