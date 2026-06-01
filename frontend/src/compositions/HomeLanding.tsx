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

export default function HomeLanding() {
  const navigate = useNavigate();
  // Default to 'All' so the homepage selector is inclusive and primary
  const [category, setCategory] = useState<CatalogCategory>('All');
  const [priceBand, setPriceBand] = useState<PriceBand>('Any');

  const openCatalog = () => {
    const query = buildCatalogQuery(category, priceBand);
    navigate(query ? `/catalog?${query}` : '/catalog');
  };

  return (
    <div className="max-w-[1180px] mx-auto flex flex-col gap-5">
      <section className="flex flex-col items-center text-center pt-4 pb-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-text-main text-orange-50 text-[0.85rem] font-extrabold mb-4.5">
          <Sparkles size={16} /> Start with type and value
        </div>
        <h1 className="text-[clamp(1.95rem,4.4vw,4rem)] leading-[1.02] m-0 text-text-main max-w-[16ch] font-black tracking-tight">Choose an alcohol type and price band, then jump into the catalog.</h1>
        <p className="text-[0.98rem] leading-[1.65] text-text-muted max-w-[64ch] mt-4.5">
          The next screen opens with your selected parameters and lets you refine the results with category-specific controls like IBU, SRM, and wine sweetness.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-7 w-full max-w-[780px]">
          <div className="bg-white border border-[#EFE2D0] rounded-3xl p-4.5 text-left">
            <div className="text-brand-color uppercase tracking-widest text-[0.74rem] font-black mb-2.5">Alcohol type</div>
            <SelectField
              value={category}
              onChange={(value) => setCategory(value as CatalogCategory)}
              options={[{ label: 'All', value: 'All' }, ...alcoholTypeOptions]}
            />
          </div>

          <div className="bg-white border border-[#EFE2D0] rounded-3xl p-4.5 text-left">
            <div className="text-brand-color uppercase tracking-widest text-[0.74rem] font-black mb-2.5">Price band</div>
            <SelectField
              value={priceBand}
              onChange={(value) => setPriceBand(value as PriceBand)}
              options={priceBandOptions.map((band) => ({ label: band.label, value: band.value }))}
            />
          </div>
        </div>

        <button type="button" onClick={openCatalog} className="mt-5.5 inline-flex items-center gap-2.5 border-none rounded-2xl bg-brand-color text-white px-5 py-3.5 font-black cursor-pointer hover:bg-opacity-90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          Open catalog <ChevronRight size={18} />
        </button>
        <button type="button" onClick={() => navigate('/finder')} className="mt-3 inline-flex items-center border border-stone-300 rounded-2xl bg-white text-brand-color px-4.5 py-3 font-extrabold cursor-pointer hover:bg-stone-50 transition-colors">
          Open alcohol finder
        </button>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <section className="bg-gradient-to-br from-[#3A2A26] to-[#231816] rounded-3xl py-7.5 px-9 text-center">
        <p className="m-0 text-orange-50 text-[1.15rem] leading-[1.7] font-semibold">
          “A good selector should feel calm, centered, and specific enough to help without overwhelming the user.”
        </p>
      </section>

    </div>
  );
}

