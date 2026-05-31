import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Beer, ChevronRight, Heart, Save, SlidersHorizontal, Sparkles, Star } from 'lucide-react';
import ProductCard, { type ProductDto } from '../components/ProductCard';
import Notification from '../components/Notification';
import SelectField from '../components/alcohol/SelectField';
import RangeField from '../components/alcohol/RangeField';
import {
  type AlcoholProfile,
  type AlcoholCategory,
  STORAGE_KEY,
  alcoholCategories,
  defaultAlcoholProfile,
  describeProfile,
  getCategoryDefinition,
  matchesCategory,
  matchesPrice,
  matchesTaste,
  priceBands,
  scoreProduct,
  type ProductLike,
} from '../utils/alcoholProfiles';

export default function AlcoholFinder() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AlcoholProfile>(defaultAlcoholProfile);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    const rawProfile = window.localStorage.getItem(STORAGE_KEY);

    if (rawProfile) {
      try {
        setProfile((current) => ({ ...current, ...(JSON.parse(rawProfile) as Partial<AlcoholProfile>) }));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    const loadProducts = async () => {
      try {
        const response = await fetch('/api/products');
        const payload = await response.json();
        setProducts(Array.isArray(payload) ? payload : payload.value ?? []);
      } catch (error) {
        console.error('Failed to load products', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const updateProfile = (patch: Partial<AlcoholProfile>) => {
    setProfile((current) => ({ ...current, ...patch }));
    setSavedNotice(null);
  };

  const saveProfile = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setSavedNotice('Preferences saved on this device.');
  };

  const createAccount = () => {
    saveProfile();
    navigate('/register');
  };

  const categoryDefinition = getCategoryDefinition(profile.category);
  const visibleControls = profile.category === 'All' ? [] : categoryDefinition.controls;

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => matchesCategory(product, profile.category))
      .filter((product) => matchesPrice(product.basePrice, profile.priceBand))
      .filter((product) => matchesTaste(product, profile))
      .sort((left, right) => scoreProduct(right as ProductLike, profile) - scoreProduct(left as ProductLike, profile));
  }, [products, profile]);

  return (
    <div style={pageStyle}>
      <section style={heroStyle}>
        <div style={heroTextPanelStyle}>
          <div style={heroBadgeStyle}>
            <Beer size={16} /> Alcohol finder
          </div>
          <h1 style={heroTitleStyle}>Find a drink that matches your taste.</h1>
          <p style={heroTextStyle}>
            Choose the alcohol type, then the menu shows only the controls for that category. Results update instantly while you move the filters.
          </p>

          <div style={heroActionsStyle}>
            <button type="button" onClick={createAccount} style={primaryActionStyle}>
              Create account and save profile <ChevronRight size={18} />
            </button>
            <Link to="/catalog" style={secondaryActionStyle}>
              Open full catalog
            </Link>
          </div>

          <div style={heroPromoGridStyle}>
            <div style={heroPromoCardStyle}>
              <Star size={18} color="#5D4037" />
              <div>
                <strong>Live filtering</strong>
                <p>Results refresh the moment you change a control.</p>
              </div>
            </div>
            <div style={heroPromoCardStyle}>
              <Heart size={18} color="#5D4037" />
              <div>
                <strong>Save the profile</strong>
                <p>Keep your choices locally and attach them to an account later.</p>
              </div>
            </div>
          </div>
        </div>

        <div style={finderCardStyle}>
          <div style={finderTopStyle}>
            <div style={selectBlockStyle}>
              <div style={fieldLabelStyle}>Alcohol type</div>
              <SelectField
                value={profile.category}
                onChange={(value) => updateProfile({ category: value as AlcoholCategory })}
                options={alcoholCategories.map((category) => ({ label: category, value: category }))}
                compact={false}
              />
            </div>

            <div style={selectBlockStyle}>
              <div style={fieldLabelStyle}>Price</div>
              <SelectField
                value={profile.priceBand}
                onChange={(value) => updateProfile({ priceBand: value as AlcoholProfile['priceBand'] })}
                options={priceBands.map((band) => ({ label: band.label, value: band.value }))}
                compact={false}
              />
            </div>
          </div>

          <div style={categoryDescriptionStyle}>
            <strong style={{ color: '#2D2424' }}>{categoryDefinition.title}</strong>
            <span style={{ color: '#6B7280' }}>{categoryDefinition.description}</span>
          </div>

          {profile.category !== 'All' ? (
            <div style={controlGridStyle}>
              {visibleControls.map((control) => {
                if (control.kind === 'select') {
                  const controlValue = control.valueKey === 'primaryChoice'
                    ? profile.primaryChoice
                    : control.valueKey === 'secondaryChoice'
                      ? profile.secondaryChoice
                      : profile.priceBand;

                  return (
                    <div key={control.id} style={controlCellStyle}>
                      <div style={fieldLabelStyle}>{control.label}</div>
                      <SelectField
                        value={controlValue}
                        onChange={(value) => updateProfile({ [control.valueKey]: value } as Partial<AlcoholProfile>)}
                        options={control.options}
                        placeholder={`Select ${control.label.toLowerCase()}`}
                        compact={false}
                      />
                      {control.helperText ? <div style={controlHelperStyle}>{control.helperText}</div> : null}
                    </div>
                  );
                }

                return (
                  <div key={control.id} style={controlCellStyle}>
                    <RangeField
                      label={control.label}
                      value={profile[control.valueKey] as number}
                      onChange={(value) => updateProfile({ [control.valueKey]: value } as Partial<AlcoholProfile>)}
                      min={control.min}
                      max={control.max}
                      step={control.step}
                      leftLabel={control.leftLabel}
                      rightLabel={control.rightLabel}
                      marks={control.marks}
                      valueSuffix={control.valueSuffix}
                      helperText={control.helperText}
                    />
                  </div>
                );
              })}
            </div>
          ) : null}

          <div style={finderFooterStyle}>
            <div>
              <p style={finderFooterLabelStyle}>Current selection</p>
              <p style={finderFooterValueStyle}>{describeProfile(profile)}</p>
            </div>
            <button type="button" onClick={saveProfile} style={saveActionStyle}>
              <Save size={16} /> Save profile
            </button>
          </div>

          {savedNotice ? <Notification type="success">{savedNotice}</Notification> : null}
        </div>
      </section>

      <section style={resultsHeaderStyle}>
        <div>
          <p style={resultsEyebrowStyle}><SlidersHorizontal size={16} /> Live results</p>
          <h2 style={resultsTitleStyle}>Suitable drinks</h2>
        </div>
        <div style={resultCountStyle}>{loading ? 'Loading...' : `${filteredProducts.length} matches`}</div>
      </section>

      <section style={resultsGridStyle}>
        {loading ? (
          <div style={emptyStateStyle}>Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div style={emptyStateStyle}>
            <Sparkles size={22} /> No close matches yet. Try a different alcohol type or price band.
          </div>
        ) : (
          filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)
        )}
      </section>

      <section style={promoRowStyle}>
        <div style={promoCardStyle}>
          <Star color="#5D4037" size={28} />
          <div>
            <h3 style={promoTitleStyle}>All alcohol types</h3>
            <p style={promoTextStyle}>The menu can grow to new categories by changing config, not page logic.</p>
          </div>
        </div>
        <div style={promoCardStyle}>
          <Heart color="#5D4037" size={28} />
          <div>
            <h3 style={promoTitleStyle}>Save your preferences</h3>
            <p style={promoTextStyle}>Create an account when you want the selected filters remembered permanently.</p>
          </div>
        </div>
      </section>

      <section style={footerBannerStyle}>
        <h2 style={footerTitleStyle}>Want these filters tied to your account?</h2>
        <p style={footerTextStyle}>Create an account now and the same profile can be reused later for recommendations.</p>
        <div style={footerActionsStyle}>
          <button type="button" onClick={createAccount} style={footerPrimaryActionStyle}>
            Create account
          </button>
          <Link to="/login" style={footerLinkStyle}>Sign in instead</Link>
        </div>
      </section>
    </div>
  );
}

const pageStyle: CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '28px 20px 52px',
};

const heroStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 0.92fr) minmax(0, 1.08fr)',
  gap: '26px',
  alignItems: 'start',
  marginBottom: '28px',
};

const heroTextPanelStyle: CSSProperties = {
  textAlign: 'center',
  padding: '22px 18px 0',
};

const heroBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  padding: '8px 18px',
  borderRadius: '999px',
  background: '#F5F0E8',
  color: '#5D4037',
  fontWeight: 900,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginBottom: '16px',
};

const heroTitleStyle: CSSProperties = {
  margin: '0 auto 14px',
  color: '#2D2424',
  fontSize: 'clamp(2.6rem, 4vw, 4.8rem)',
  fontWeight: 900,
  lineHeight: 1.02,
  maxWidth: '12ch',
};

const heroTextStyle: CSSProperties = {
  margin: '0 auto',
  maxWidth: '62ch',
  fontSize: '1.05rem',
  lineHeight: 1.7,
  color: '#6B7280',
};

const heroActionsStyle: CSSProperties = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'center',
  flexWrap: 'wrap',
  marginTop: '22px',
};

const primaryActionStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  padding: '14px 18px',
  borderRadius: '14px',
  border: '1px solid #5D4037',
  background: '#5D4037',
  color: '#FFFFFF',
  fontWeight: 800,
  cursor: 'pointer',
};

const secondaryActionStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '14px 18px',
  borderRadius: '14px',
  border: '1px solid #E7D8C4',
  background: '#F5F0E8',
  color: '#5D4037',
  fontWeight: 800,
  textDecoration: 'none',
};

const heroPromoGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '14px',
  marginTop: '28px',
};

const heroPromoCardStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  padding: '16px',
  borderRadius: '20px',
  background: '#FAF8F5',
  border: '1px solid #EFE7DB',
  textAlign: 'left',
};

const finderCardStyle: CSSProperties = {
  padding: '28px',
  borderRadius: '34px',
  background: '#FFFFFF',
  border: '1px solid #EFE7DB',
  boxShadow: '0 24px 60px rgba(93, 64, 55, 0.06)',
};

const finderTopStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '14px',
  marginBottom: '16px',
};

const selectBlockStyle: CSSProperties = {
  display: 'grid',
  gap: '8px',
};

const fieldLabelStyle: CSSProperties = {
  color: '#5D4037',
  fontSize: '0.82rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const categoryDescriptionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: '0 2px 16px',
  color: '#6B7280',
};

const controlGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '14px',
};

const controlCellStyle: CSSProperties = {
  display: 'grid',
  gap: '8px',
};

const controlHelperStyle: CSSProperties = {
  color: '#7A736C',
  fontSize: '0.8rem',
  lineHeight: 1.5,
};

const finderFooterStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  marginTop: '18px',
  paddingTop: '18px',
  borderTop: '1px solid #E5D8C9',
};

const finderFooterLabelStyle: CSSProperties = {
  margin: 0,
  color: '#8B7D73',
  fontSize: '0.78rem',
  textTransform: 'uppercase',
  letterSpacing: '0.09em',
};

const finderFooterValueStyle: CSSProperties = {
  margin: '4px 0 0',
  color: '#2D2424',
  fontWeight: 900,
  fontSize: '1.05rem',
};

const saveActionStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  border: '1px solid #E7D8C4',
  background: '#FAF8F5',
  color: '#5D4037',
  padding: '12px 16px',
  borderRadius: '14px',
  fontWeight: 900,
  cursor: 'pointer',
};

const resultsHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'end',
  gap: '12px',
  margin: '28px 0 18px',
};

const resultsEyebrowStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  margin: 0,
  color: '#5D4037',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontSize: '0.8rem',
};

const resultsTitleStyle: CSSProperties = {
  margin: '8px 0 0',
  color: '#2D2424',
  fontSize: '2rem',
  fontWeight: 900,
};

const resultCountStyle: CSSProperties = {
  color: '#6B7280',
  fontWeight: 700,
};

const resultsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  gap: '24px',
};

const emptyStateStyle: CSSProperties = {
  gridColumn: '1 / -1',
  minHeight: '180px',
  borderRadius: '22px',
  border: '1px dashed #D8C4AF',
  background: '#FAF8F5',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  color: '#6B7280',
  fontWeight: 700,
};

const promoRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '16px',
  marginTop: '28px',
};

const promoCardStyle: CSSProperties = {
  display: 'flex',
  gap: '14px',
  alignItems: 'flex-start',
  padding: '18px',
  background: '#FFFFFF',
  border: '1px solid #EFE7DB',
  borderRadius: '20px',
};

const promoTitleStyle: CSSProperties = {
  margin: '0 0 6px',
  color: '#2D2424',
  fontSize: '1.05rem',
  fontWeight: 900,
};

const promoTextStyle: CSSProperties = {
  margin: 0,
  color: '#6B7280',
  lineHeight: 1.6,
};

const footerBannerStyle: CSSProperties = {
  marginTop: '28px',
  textAlign: 'center',
  padding: '30px 22px',
  borderRadius: '24px',
  background: '#F5F0E8',
  border: '1px solid #E7D8C4',
};

const footerTitleStyle: CSSProperties = {
  margin: '0 0 10px',
  color: '#5D4037',
  fontSize: '1.6rem',
  fontWeight: 900,
};

const footerTextStyle: CSSProperties = {
  margin: '0 0 18px',
  color: '#6B7280',
  lineHeight: 1.6,
};

const footerActionsStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '12px',
  flexWrap: 'wrap',
};

const footerPrimaryActionStyle: CSSProperties = {
  ...primaryActionStyle,
  textDecoration: 'none',
};

const footerLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '14px 18px',
  borderRadius: '14px',
  border: '1px solid #E7D8C4',
  background: '#FFFFFF',
  color: '#5D4037',
  fontWeight: 900,
  textDecoration: 'none',
};
