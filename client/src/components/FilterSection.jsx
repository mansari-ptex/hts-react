import React, { useState } from 'react';
import FilterDropdown from './FilterDropdown';
import CategoryMenu from './CategoryMenu';
import { USA_ENGINE } from '../countries/usa/engine.js';
import { FABRIC_CLASSIFICATION_HTML } from '../constants/fabricRules.js';
import { MATERIAL_NEUTRAL_CATEGORIES } from '../constants/genderRules.js';
import { normalizeText } from '../engine/htsEngine.js';
import { categoryDescriptions } from '../constants/categories.js';

function FilterSection({ 
    selectedFilters, 
    onFilterChange, 
    onReset, 
    onToggleHighlight, 
    highlightEnabled,
    countries 
}) {
  const [openMenu, setOpenMenu] = useState(null);

  const isMaterialLocked = selectedFilters.category && MATERIAL_NEUTRAL_CATEGORIES.has(normalizeText(selectedFilters.category));

  const filterData = {
    material: [
      { value: 'All', label: 'All ▾' },
      { value: 'Knitted', label: 'Knitted or crocheted' },
      { value: 'Woven', label: 'Woven or Non-Woven' }
    ],
    gender: [
      { value: 'All', label: 'All ▾' },
      { value: 'Babies', label: 'Babies' },
      { value: 'Boys', label: 'Boys' },
      { value: 'Girls', label: 'Girls' },
      { value: 'Men', label: 'Men' },
      { value: 'Women', label: 'Women' }
    ],
    importingCountry: [
      { value: USA_ENGINE.getImportingCountry(), label: USA_ENGINE.getImportingCountry() }
    ],
    fabric: [
      { value: 'All', label: 'All ▾' },
      { value: 'Artificial fibers', label: 'Artificial fibers' },
      { value: 'Cotton', label: 'Cotton' },
      { value: 'Fine animal hair', label: 'Fine animal hair' },
      { value: 'Flax fibers', label: 'Flax fibers' },
      { value: 'Linen (835)', label: 'Linen (835)' },
      { value: 'Man-made fibers', label: 'Man-made fibers' },
      { value: 'Other textile materials', label: 'Other textile materials' },
      { value: 'Silk or silk waste', label: 'Silk or silk waste' },
      { value: 'Subject to cotton restraints (334)', label: 'Subject to cotton restraints (334)' },
      { value: 'Subject to man-made fiber restraints (634)', label: 'Subject to man-made fiber restraints (634)' },
      { value: 'Subject to wool restraints (434)', label: 'Subject to wool restraints (434)' },
      { value: 'Synthetic fibers', label: 'Synthetic fibers' },
      { value: 'Vegetable fibers', label: 'Vegetable fibers' },
      { value: 'wool', label: 'Wool' }
    ],
    feature: [
      { value: 'All', label: 'All ▾' },
      { value: 'Knit to Shape', label: 'Knit to Shape' },
      { value: 'Recreational Performance Outerwear', label: 'Recreational Performance Outerwear' },
      { value: 'Water resistant', label: 'Water resistant' }
    ]
  };

  const toggleMenu = (menuName) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  return (
    <div className="filters-section">
      {/* MATERIAL FILTER */}
      <FilterGroup label="Material Category">
        <FilterDropdown 
          type="material"
          items={filterData.material}
          value={selectedFilters.material}
          isOpen={openMenu === 'material'}
          onToggle={() => {
              if (isMaterialLocked) return;
              toggleMenu('material');
          }}
          onSelect={(val) => { onFilterChange({ material: val }); setOpenMenu(null); }}
          disabled={isMaterialLocked}
        />
        <div id="materialNote" className="gender-info-note" style={{marginTop: '5px', display: isMaterialLocked ? 'block' : 'none'}}>
          Material filter is locked for this product category.
        </div>
      </FilterGroup>

      {/* GENDER FILTER */}
      <FilterGroup label="Gender" info={true} tooltipContent={
        <div>
          HTS Gender Classification Rules:<br/><br/>
          • For garments with a front opening, <b>Left-over-Right closure = Men/Boys</b> and <b>Right-over-Left closure = Women/Girls</b>, unless the cut clearly indicates otherwise.<br/><br/>
          • If a garment cannot be clearly identified as Men/Boys or Women/Girls, it must be classified under Women/Girls headings.<br/><br/>
          • <b>Babies</b> are defined as garments for children up to <b>86 cm in height</b> (approx. 0–24 months) and must be classified under babies’ headings.
        </div>
      }>
        <FilterDropdown 
          type="gender"
          items={filterData.gender}
          value={selectedFilters.gender}
          isOpen={openMenu === 'gender'}
          onToggle={() => toggleMenu('gender')}
          onSelect={(val) => { 
            onFilterChange({ 
              gender: val, 
              uiMainCategory: '', 
              category: '' 
            }); 
            setOpenMenu(null); 
          }}
        />
        <div id="genderNote" className="gender-info-note" style={{display: 'none', marginTop: '5px'}}></div>
      </FilterGroup>

      {/* IMPORTING COUNTRY */}
      <FilterGroup label="Importing Country">
        <div className="filter-trigger" style={{cursor: 'not-allowed', opacity: 0.6}}>
          {USA_ENGINE.getImportingCountry()} ▾
        </div>
      </FilterGroup>

      {/* EXPORTING COUNTRY */}
      <FilterGroup label="Exporting Country">
        <FilterDropdown 
            type="country"
            items={countries.map(c => ({ value: c.name, label: c.name }))}
            value={selectedFilters.exportingCountry || 'Select Country'}
            isOpen={openMenu === 'country'}
            onToggle={() => toggleMenu('country')}
            onSelect={(val) => { 
                onFilterChange({ 
                    exportingCountry: val, 
                    country: val 
                }); 
                setOpenMenu(null); 
            }}
            searchable={true}
        />
      </FilterGroup>

      {/* CATEGORY FILTER */}
      <FilterGroup 
        label="Category" 
        info={!!selectedFilters.category} 
        tooltipContent={
            selectedFilters.category ? (
                <div>
                   <strong>{selectedFilters.category}</strong><br/>
                   {categoryDescriptions[normalizeText(selectedFilters.category)] || "No description available."}
                </div>
            ) : "Select a category to see definitions."
        }
      >
        <CategoryMenu 
            selectedFilters={selectedFilters}
            onSelect={(main, sub) => {
                onFilterChange({ 
                    uiMainCategory: main, 
                    category: sub 
                });
                setOpenMenu(null);
            }}
            isOpen={openMenu === 'category'}
            onToggle={() => toggleMenu('category')}
        />
      </FilterGroup>

      {/* FABRIC FILTER */}
      <FilterGroup label="Fabric" info={true} tooltipContent={<div dangerouslySetInnerHTML={{__html: FABRIC_CLASSIFICATION_HTML}}></div>}>
        <FilterDropdown 
          type="fabric"
          items={filterData.fabric}
          value={selectedFilters.fabric}
          isOpen={openMenu === 'fabric'}
          onToggle={() => toggleMenu('fabric')}
          onSelect={(val) => { onFilterChange({ fabric: val }); setOpenMenu(null); }}
        />
      </FilterGroup>

      {/* FEATURE FILTER */}
      <FilterGroup label="Feature">
        <FilterDropdown 
          type="feature"
          items={filterData.feature}
          value={selectedFilters.feature}
          isOpen={openMenu === 'feature'}
          onToggle={() => toggleMenu('feature')}
          onSelect={(val) => { onFilterChange({ feature: val }); setOpenMenu(null); }}
        />
      </FilterGroup>

      {/* ACTION BUTTONS */}
      <div className="filter-group">
        <label>&nbsp;</label>
        <div className="button-row">
          <button type="button" className="icon-btn reset-btn" onClick={onReset} data-tooltip="Reset filters">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
              <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
            </svg>
          </button>
          <button 
            type="button" 
            className={`icon-btn highlight-btn reset-btn ${highlightEnabled ? 'active' : ''}`}
            onClick={onToggleHighlight}
            data-tooltip={`Highlight ${highlightEnabled ? 'ON' : 'OFF'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M11.096.644a2 2 0 0 1 2.791.036l1.433 1.433a2 2 0 0 1 .035 2.791l-.413.435-8.07 8.995a.5.5 0 0 1-.372.166h-3a.5.5 0 0 1-.234-.058l-.412.412A.5.5 0 0 1 2.5 15h-2a.5.5 0 0 1-.354-.854l1.412-1.412A.5.5 0 0 1 1.5 12.5v-3a.5.5 0 0 1 .166-.372l8.995-8.07z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children, info, tooltipContent, tooltipId }) {
    const [showTooltip, setShowTooltip] = useState(false);
    
    return (
        <div className="filter-group">
            <label className="label-with-info">
                {label}
                {info && (
                    <span 
                        className="info-icon"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    >
                        i
                        {showTooltip && (
                            <div className="info-tooltip" style={{display: 'block'}}>
                                {tooltipContent}
                            </div>
                        )}
                    </span>
                )}
            </label>
            {children}
        </div>
    );
}

export default FilterSection;
