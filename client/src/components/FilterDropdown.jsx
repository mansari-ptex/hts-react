import React, { useState } from 'react';

function FilterDropdown({ type, items, value, isOpen, onToggle, onSelect, searchable, disabled }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = searchable 
    ? items.filter(item => item.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : items;

  return (
    <div className={`filter-menu-wrapper ${disabled ? 'disabled' : ''}`}>
      <div 
        className={`filter-trigger ${disabled ? 'disabled' : ''}`} 
        id={`${type}Trigger`} 
        onClick={disabled ? null : onToggle}
        style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
      >
        {value || 'All'} ▾
      </div>
      {isOpen && !disabled && (
        <div className="filter-menu show" id={`${type}Menu`} style={{display: 'block'}}>
            {searchable && (
                <input 
                    type="text" 
                    className="country-search" 
                    placeholder="Search..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                />
            )}
            {filteredItems.map(item => (
                <div 
                    key={item.value}
                    className={`filter-menu-item ${item.value === value ? 'selected' : ''}`}
                    onClick={() => onSelect(item.value)}
                >
                    {item.label}
                </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default FilterDropdown;
