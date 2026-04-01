import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { MAIN_CATEGORY_MAP } from '../constants/categories.js';

function CategoryMenu({ selectedFilters, onSelect, isOpen, onToggle }) {
  const [activeMain, setActiveMain] = useState(null);
  const [submenuPos, setSubmenuPos] = useState({ top: 0, left: 0 });
  const itemRefs = useRef({});

  const getVisibleMainCategories = () => {
    if (selectedFilters.gender === "Babies") {
      return { "Babies & Infant Wear": MAIN_CATEGORY_MAP["Babies & Infant Wear"] };
    }
    return MAIN_CATEGORY_MAP;
  };

  const handleMouseEnter = (mainCat) => {
    setActiveMain(mainCat);
    const ref = itemRefs.current[mainCat];
    if (ref) {
      const rect = ref.getBoundingClientRect();
      let left = rect.right; // Remove + 8
      let top = rect.top;
      
      // Basic bounds check (simplified original logic)
      if (left + 260 > window.innerWidth) {
        left = rect.left - 260;
      }
      setSubmenuPos({ top, left });
    }
  };

  const visibleCategories = getVisibleMainCategories();

  return (
    <div className="category-menu-wrapper">
      <div className="category-trigger" onClick={onToggle}>
        {selectedFilters.category ? `${selectedFilters.uiMainCategory} → ${selectedFilters.category}` : 'Select Category ▾'}
      </div>
      {isOpen && (
        <div 
            className="category-menu" 
            style={{ display: 'block' }}
            onMouseLeave={() => setActiveMain(null)}
        >
          {Object.entries(visibleCategories)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([mainCat, subCats]) => (
              <div 
                key={mainCat} 
                className={`category-item ${activeMain === mainCat ? 'active' : ''} ${selectedFilters.uiMainCategory === mainCat ? 'selected' : ''}`}
                ref={el => itemRefs.current[mainCat] = el}
                onMouseEnter={() => handleMouseEnter(mainCat)}
              >
                {mainCat}
                {activeMain === mainCat && ReactDOM.createPortal(
                  <div 
                    className="submenu" 
                    style={{ 
                        display: 'block', 
                        position: 'fixed',
                        top: submenuPos.top, 
                        left: submenuPos.left 
                    }}
                    onMouseEnter={() => setActiveMain(mainCat)}
                    onMouseLeave={() => setActiveMain(null)}
                  >
                    {[...subCats].sort((a, b) => a.localeCompare(b)).map(sub => (
                      <div 
                        key={sub}
                        className={`submenu-item ${selectedFilters.category === sub ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(mainCat, sub);
                        }}
                      >
                        <span className="tick">✔</span>
                        <span className="label">{sub}</span>
                      </div>
                    ))}
                  </div>,
                  document.body
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default CategoryMenu;
