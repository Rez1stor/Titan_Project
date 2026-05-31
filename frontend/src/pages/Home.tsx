import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import LandingFeatureCard from '../components/LandingFeatureCard';
import SelectField from '../components/alcohol/SelectField';
import {
  alcoholTypeOptions,
  buildCatalogQuery,
  priceBandOptions,
  type CatalogCategory,
  type PriceBand,
} from '../utils/catalogFilters';

export default function Home() {
  const navigate = useNavigate();
  // Default to 'All' so the homepage selector is inclusive and primary
  const [category, setCategory] = useState<CatalogCategory>('All');
  const [priceBand, setPriceBand] = useState<PriceBand>('Any');

  const openCatalog = () => {
    const query = buildCatalogQuery(category, priceBand);
    navigate(query ? `/catalog?${query}` : '/catalog');
  };

  return (
    <div style={pageStyle}>
      <section style={heroStyle}>
        <div style={eyebrowStyle}>
          <Sparkles size={16} /> Start with type and value
        </div>
        <h1 style={titleStyle}>Choose an alcohol type and price band, then jump into the catalog.</h1>
        <p style={descriptionStyle}>
          The next screen opens with your selected parameters and lets you refine the results with category-specific controls like IBU, SRM, and wine sweetness.
        </p>

        <div style={selectorGridStyle}>
          <div style={selectorCardStyle}>
            <div style={labelStyle}>Alcohol type</div>
            <SelectField
              value={category}
              onChange={(value) => setCategory(value as CatalogCategory)}
              options={[{ label: 'All', value: 'All' }, ...alcoholTypeOptions]}
            />
          </div>

          <div style={selectorCardStyle}>
            <div style={labelStyle}>Price band</div>
            <SelectField
              value={priceBand}
              onChange={(value) => setPriceBand(value as PriceBand)}
              options={priceBandOptions.map((band) => ({ label: band.label, value: band.value }))}
            />
          </div>
        </div>

        <button type="button" onClick={openCatalog} style={actionStyle}>
          Open catalog <ChevronRight size={18} />
        </button>
      </section>

      <section style={infoGridStyle}>
        <LandingFeatureCard
          kicker="01"
          title="Pick a direction"
          text="Choose beer, wine, or another supported category, then start from a clean, focused catalog view."
        />
        <LandingFeatureCard
          kicker="02"
          title="Filter by value"
          text="Price bands are based on the average price of the selected alcohol type, so the split stays relative and practical."
        />
        <LandingFeatureCard
          kicker="03"
          title="Refine in catalog"
          text="Use advanced filters like IBU, SRM, sweetness, style, and color only when they apply to the selected category."
        />
      </section>

      <section style={quoteStyle}>
        <p style={quoteTextStyle}>
          “A good selector should feel calm, centered, and specific enough to help without overwhelming the user.”
        </p>
      </section>

    </div>
  );
}

const pageStyle: React.CSSProperties = {
  maxWidth: '1180px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const heroStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  padding: '16px 0 8px',
};

const eyebrowStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 14px',
  borderRadius: '999px',
  background: '#2D2424',
  color: '#FFF7ED',
  fontSize: '0.85rem',
  fontWeight: 800,
  marginBottom: '18px',
};

const titleStyle: React.CSSProperties = {
  fontSize: 'clamp(1.95rem, 4.4vw, 4rem)',
  lineHeight: 1.02,
  margin: 0,
  color: '#2D2424',
  maxWidth: '16ch',
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '0.98rem',
  lineHeight: 1.65,
  color: '#6B7280',
  maxWidth: '64ch',
  marginTop: '18px',
};

const selectorGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '16px',
  marginTop: '28px',
  width: '100%',
  maxWidth: '780px',
};

const selectorCardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #EFE2D0',
  borderRadius: '24px',
  padding: '18px',
};

const labelStyle: React.CSSProperties = {
  color: '#5D4037',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontSize: '0.74rem',
  fontWeight: 900,
  marginBottom: '10px',
};

const actionStyle: React.CSSProperties = {
  marginTop: '22px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  border: 'none',
  borderRadius: '18px',
  background: '#5D4037',
  color: '#FFFFFF',
  padding: '14px 20px',
  fontWeight: 900,
  cursor: 'pointer',
};

const infoGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '16px',
};

const quoteStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #3A2A26 0%, #231816 100%)',
  borderRadius: '28px',
  padding: '30px 36px',
  textAlign: 'center',
};

const quoteTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#FFF7ED',
  fontSize: '1.15rem',
  lineHeight: 1.7,
  fontWeight: 600,
};

