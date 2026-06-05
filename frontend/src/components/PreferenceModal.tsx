import { useState } from 'react';
import { X } from 'lucide-react';
import MultiSelectField from './alcohol/MultiSelectField';
import RangeField from './alcohol/RangeField';
import Button from './Button';
import {
  type AlcoholProfile,
  type AlcoholCategory,
  type PriceBand,
  alcoholCategories,
  defaultAlcoholProfile,
  getCategoryDefinition,
  priceBands,
} from '../utils/alcoholProfiles';

interface PreferenceModalProps {
  onSave: (profile: AlcoholProfile) => void;
  onSkip: () => void;
}

export default function PreferenceModal({ onSave, onSkip }: PreferenceModalProps) {
  const [profile, setProfile] = useState<AlcoholProfile>(defaultAlcoholProfile);

  const updateProfile = (patch: Partial<AlcoholProfile>) => {
    setProfile((current) => ({ ...current, ...patch }));
  };

  const handleCategoriesChange = (values: string[]) => {
    // If 'All' is selected while other things are selected, or vice versa, handle it.
    // For simplicity, just store the array.
    let newCats = values as AlcoholCategory[];
    if (newCats.length === 0) newCats = ['All'];
    updateProfile({ categories: newCats });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-[600px] w-full max-h-[90vh] overflow-y-auto border border-[#EFE2D0]">
        <div className="sticky top-0 bg-white/95 backdrop-blur z-10 px-6 py-5 border-b border-[#EFE2D0] flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-text-main m-0">Your Preferences</h2>
            <p className="text-sm text-text-muted m-0 mt-1">Tell us what you like, or skip for now.</p>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="p-2 -mr-2 text-text-muted hover:text-text-main rounded-full hover:bg-stone-100 transition-colors border-none bg-transparent cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="grid gap-2">
              <div className="text-brand-color text-[0.82rem] font-extrabold uppercase tracking-widest">Alcohol type</div>
              <MultiSelectField
                value={profile.categories}
                onChange={handleCategoriesChange}
                options={alcoholCategories.filter((c) => c !== 'All').map((category) => ({ label: category, value: category }))}
                placeholder="Select types"
              />
            </div>

            <div className="grid gap-2">
              <div className="text-brand-color text-[0.82rem] font-extrabold uppercase tracking-widest">Price</div>
              <MultiSelectField
                value={profile.priceBands}
                onChange={(values) => {
                  const bands = values as PriceBand[];
                  updateProfile({ priceBands: bands.length ? bands : ['Any'] });
                }}
                options={priceBands.filter((b) => b.value !== 'Any').map((band) => ({ label: band.label, value: band.value }))}
                placeholder="Select price bands"
              />
            </div>
          </div>

          {profile.categories.filter((c) => c !== 'All').map((cat) => {
            const categoryDefinition = getCategoryDefinition(cat);
            if (!categoryDefinition) return null;

            return (
              <div key={cat} className="mb-6">
                <div className="flex flex-col gap-1 mb-4 text-text-muted">
                  <strong className="text-text-main">{categoryDefinition.title}</strong>
                  <span className="text-sm">{categoryDefinition.description}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categoryDefinition.controls.map((control) => {
                    if (control.kind === 'select') {
                      const controlValue = profile[control.valueKey] as string[];

                      return (
                        <div key={control.id} className="grid gap-2">
                          <div className="text-brand-color text-[0.82rem] font-extrabold uppercase tracking-widest">{control.label}</div>
                          <MultiSelectField
                            value={controlValue}
                            onChange={(value) => updateProfile({ [control.valueKey]: value } as Partial<AlcoholProfile>)}
                            options={control.options}
                            placeholder={`Select ${control.label.toLowerCase()}`}
                          />
                          {control.helperText && <div className="text-[#7A736C] text-[0.8rem] leading-[1.5]">{control.helperText}</div>}
                        </div>
                      );
                    }

                    return (
                      <div key={control.id} className="grid gap-2 col-span-1 sm:col-span-2">
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
              </div>
            );
          })}

          <div className="flex gap-3 mt-8 pt-6 border-t border-[#EFE2D0]">
            <Button type="button" variant="ghost" onClick={onSkip} className="flex-1 border-[#EFE2D0] bg-white hover:bg-stone-50 border">
              Skip
            </Button>
            <Button type="button" onClick={() => onSave(profile)} className="flex-1">
              Save & Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
