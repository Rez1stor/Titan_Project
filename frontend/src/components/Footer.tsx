import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={shellStyle}>
      <div style={contentStyle}>
        <div>
          <div style={brandStyle}>TITAN</div>
          <p style={textStyle}>
            A structured alcohol catalog built to grow from beer and wine into more categories without redesigning the core flow.
          </p>
        </div>

        <nav style={linksStyle} aria-label="Footer">
          <Link to="/catalog" style={linkStyle}>Catalog</Link>
          <Link to="/favorites" style={linkStyle}>Favorites</Link>
          <Link to="/recommendations" style={linkStyle}>Recommendations</Link>
        </nav>
      </div>
    </footer>
  );
}

const shellStyle: React.CSSProperties = {
  width: '100%',
  marginTop: '24px',
  background: '#2D2424',
  padding: '20px 16px 24px',
};

const contentStyle: React.CSSProperties = {
  width: 'min(1180px, 100%)',
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '20px',
  padding: '30px 32px',
  borderRadius: '0',
  background: 'transparent',
  color: '#FFF7ED',
};

const brandStyle: React.CSSProperties = {
  color: '#F2C9A7',
  fontSize: '1.2rem',
  fontWeight: 900,
  letterSpacing: '0.08em',
};

const textStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#E7D8C4',
  maxWidth: '56ch',
  lineHeight: 1.6,
};

const linksStyle: React.CSSProperties = {
  display: 'flex',
  gap: '18px',
  flexWrap: 'wrap',
};

const linkStyle: React.CSSProperties = {
  color: '#FFF7ED',
  textDecoration: 'none',
  fontWeight: 700,
};